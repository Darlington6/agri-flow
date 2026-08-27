"""Business logic for OTP and magic-link auth — kept out of views.py so
the views stay thin request/response adapters (see views/ package).
"""

import hashlib
import secrets
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone

from .channels import get_email_channel, get_otp_channel
from .models import MagicLinkToken, OtpCode

OTP_TTL_MINUTES = 10
OTP_MAX_ATTEMPTS = 5
MAGIC_LINK_TTL_MINUTES = 15


def _hash(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def request_otp(phone_number: str) -> str:
    """Returns the generated code — callers decide whether it's safe to
    expose it (views.otp only does so when settings.DEBUG is true).
    """
    code = f"{secrets.randbelow(1_000_000):06d}"
    OtpCode.objects.create(
        phone_number=phone_number,
        code_hash=_hash(code),
        expires_at=timezone.now() + timedelta(minutes=OTP_TTL_MINUTES),
    )
    get_otp_channel().send(phone_number, code)
    return code


def verify_otp(phone_number: str, code: str):
    """Returns the User on success (creating it on first login — phone-first
    signup and login are the same action), raises ValueError on failure.
    """
    otp = (
        OtpCode.objects.filter(phone_number=phone_number, consumed_at__isnull=True)
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

    user_model = get_user_model()
    user, _ = user_model.objects.get_or_create(phone_number=phone_number)
    return user


def request_magic_link(email: str, verify_base_url: str) -> str | None:
    """No-ops silently if the email doesn't belong to an existing user —
    magic link is a login path for an account that already has an email
    on file, not a second signup path (see the Blueprint discussion this
    mirrors). Never reveal whether an email exists via response timing/
    shape either — the view's HTTP response is always the same either
    way; the return value here is only for the view's own DEBUG-mode use.
    """
    user_model = get_user_model()
    if not user_model.objects.filter(email=email).exists():
        return None

    token = secrets.token_urlsafe(32)
    MagicLinkToken.objects.create(
        email=email,
        token_hash=_hash(token),
        expires_at=timezone.now() + timedelta(minutes=MAGIC_LINK_TTL_MINUTES),
    )
    link = f"{verify_base_url}?token={token}"
    get_email_channel().send(email, link)
    return link


def verify_magic_link(token: str):
    match = MagicLinkToken.objects.filter(token_hash=_hash(token), consumed_at__isnull=True).first()
    if match is None:
        raise ValueError("Invalid or already-used link.")
    if match.expires_at < timezone.now():
        raise ValueError("This link has expired — request a new one.")

    match.consumed_at = timezone.now()
    match.save(update_fields=["consumed_at"])

    user_model = get_user_model()
    return user_model.objects.get(email=match.email)
