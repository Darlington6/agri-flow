"""Business logic for OTP and magic-link auth — kept out of views.py so
the views stay thin request/response adapters (see views/ package).

People sign up with a phone number (a texted code) or an email (a link);
the first successful sign-in creates the account. Signed-in users can add
the other one later, and it only counts once confirmed the same way, so
nobody can attach someone else's number or address.
"""

import hashlib
import secrets
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.utils import timezone

from .channels import get_email_channel, get_otp_channel
from .models import MagicLinkToken, OtpCode

OTP_TTL_MINUTES = 10
OTP_MAX_ATTEMPTS = 5
MAGIC_LINK_TTL_MINUTES = 15
# However many machines ask, one address never gets more than this many
# emails an hour, so nobody can flood someone's inbox through us.
EMAILS_PER_ADDRESS_PER_HOUR = 5


class AlreadyInUse(Exception):
    """The phone number or email belongs to another account."""


class AlreadySet(Exception):
    """The account already has a phone number (or email)."""


def _hash(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def _users():
    return get_user_model().objects


# ── Phone codes ──────────────────────────────────────────────────────────


def _send_otp(phone_number: str, purpose: str, user=None) -> str:
    code = f"{secrets.randbelow(1_000_000):06d}"
    OtpCode.objects.create(
        phone_number=phone_number,
        purpose=purpose,
        user=user,
        code_hash=_hash(code),
        expires_at=timezone.now() + timedelta(minutes=OTP_TTL_MINUTES),
    )
    get_otp_channel().send(phone_number, code)
    return code


def _check_otp(phone_number: str, code: str, purpose: str, user=None) -> None:
    """Raises ValueError unless `code` is the latest pending one."""
    otp = (
        OtpCode.objects.filter(
            phone_number=phone_number, purpose=purpose, user=user, consumed_at__isnull=True
        )
        .order_by("-created_at")
        .first()
    )
    if otp is None:
        raise ValueError("No pending code for this phone number.")
    if otp.expires_at < timezone.now():
        raise ValueError("Code expired — request a new one.")
    if otp.attempts >= OTP_MAX_ATTEMPTS:
        raise ValueError("Too many attempts — request a new code.")

    otp.attempts += 1
    otp.save(update_fields=["attempts"])

    if otp.code_hash != _hash(code):
        raise ValueError("Incorrect code.")

    otp.consumed_at = timezone.now()
    otp.save(update_fields=["consumed_at"])


def request_otp(phone_number: str) -> str:
    """Returns the generated code — callers decide whether it's safe to
    expose it (views.otp only does so when settings.DEBUG is true).
    """
    return _send_otp(phone_number, OtpCode.Purpose.SIGN_IN)


def verify_otp(phone_number: str, code: str):
    """Returns (user, created): the first correct code creates the
    account (phone signup and login are the same action). Raises
    ValueError on failure.
    """
    _check_otp(phone_number, code, OtpCode.Purpose.SIGN_IN)
    return _get_or_create(phone_number=phone_number)


def request_phone_add(user, phone_number: str) -> str:
    if user.phone_number:
        raise AlreadySet("This account already has a phone number.")
    if _users().filter(phone_number=phone_number).exists():
        raise AlreadyInUse("This phone number belongs to another account.")
    return _send_otp(phone_number, OtpCode.Purpose.ADD_PHONE, user)


def confirm_phone_add(user, phone_number: str, code: str):
    _check_otp(phone_number, code, OtpCode.Purpose.ADD_PHONE, user)
    return _attach(user, phone_number=phone_number)


# ── Email links ──────────────────────────────────────────────────────────


def _send_link(email: str, purpose: str, kind: str, base_url: str, user=None) -> str | None:
    """Returns the link, or None when this address already had its
    hourly share of emails (nothing is sent then)."""
    an_hour_ago = timezone.now() - timedelta(hours=1)
    if (
        MagicLinkToken.objects.filter(email=email, created_at__gte=an_hour_ago).count()
        >= EMAILS_PER_ADDRESS_PER_HOUR
    ):
        return None
    token = secrets.token_urlsafe(32)
    MagicLinkToken.objects.create(
        email=email,
        purpose=purpose,
        user=user,
        token_hash=_hash(token),
        expires_at=timezone.now() + timedelta(minutes=MAGIC_LINK_TTL_MINUTES),
    )
    link = f"{base_url}?token={token}"
    get_email_channel().send(email, link, kind)
    return link


def _use_link(token: str, purpose: str) -> MagicLinkToken:
    match = MagicLinkToken.objects.filter(
        token_hash=_hash(token), purpose=purpose, consumed_at__isnull=True
    ).first()
    if match is None:
        raise ValueError("Invalid or already-used link.")
    if match.expires_at < timezone.now():
        raise ValueError("This link has expired — request a new one.")
    match.consumed_at = timezone.now()
    match.save(update_fields=["consumed_at"])
    return match


def request_magic_link(email: str, verify_base_url: str) -> str | None:
    """Emails a link that signs in to the account with this email, or
    creates the account if there isn't one yet (the email says which).
    The view answers the same way either way, so the response never
    reveals whether an email has an account. Returns the link (or None
    when the address hit its hourly limit), only for the view's own
    DEBUG-mode use.
    """
    kind = "sign_in" if _users().filter(email=email).exists() else "sign_up"
    return _send_link(email, MagicLinkToken.Purpose.SIGN_IN, kind, verify_base_url)


def verify_magic_link(token: str):
    """Returns (user, created). The account is only created here, when
    the link is used, so a mistyped address never creates one."""
    match = _use_link(token, MagicLinkToken.Purpose.SIGN_IN)
    return _get_or_create(email=match.email)


def request_email_add(user, email: str, confirm_base_url: str) -> str | None:
    if user.email:
        raise AlreadySet("This account already has an email.")
    if _users().filter(email=email).exists():
        raise AlreadyInUse("This email belongs to another account.")
    return _send_link(
        email, MagicLinkToken.Purpose.ADD_EMAIL, "confirm_email", confirm_base_url, user
    )


def confirm_email_add(token: str):
    """No sign-in needed: the link may be opened on another device. The
    token itself says which account asked."""
    match = _use_link(token, MagicLinkToken.Purpose.ADD_EMAIL)
    return _attach(match.user, email=match.email)


# ── Shared ───────────────────────────────────────────────────────────────


def _get_or_create(**lookup):
    try:
        with transaction.atomic():
            return _users().get_or_create(**lookup)
    except IntegrityError:
        # Two sign-ins for the same new account at once: the other won.
        return _users().get(**lookup), False


def _attach(user, **field):
    """Sets the confirmed phone number or email on `user`."""
    ((name, value),) = field.items()
    if getattr(user, name):
        raise AlreadySet(f"This account already has a {name.replace('_', ' ')}.")
    setattr(user, name, value)
    try:
        with transaction.atomic():
            user.save(update_fields=[name])
    except IntegrityError as exc:
        # Someone else confirmed it first.
        raise AlreadyInUse(f"This {name.replace('_', ' ')} belongs to another account.") from exc
    return user
