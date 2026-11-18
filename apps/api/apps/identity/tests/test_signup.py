"""Signing up with either a phone number or an email, adding the other one
later (only once confirmed), the abuse limits, and logging out."""

import pytest
from django.db import IntegrityError
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.identity import services
from apps.identity.models import User
from apps.identity.throttles import EmailLinkThrottle

pytestmark = pytest.mark.django_db

PHONE = "+250788123456"
EMAIL = "buyer@example.com"


def signed_in_as(user) -> APIClient:
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {RefreshToken.for_user(user).access_token}")
    return client


# ── Accounts ─────────────────────────────────────────────────────────────


def test_an_account_needs_a_phone_number_or_an_email():
    with pytest.raises(ValueError):
        User.objects.create_user()
    with pytest.raises(IntegrityError):
        User.objects.create(display_name="Nobody")


def test_blank_values_are_stored_as_empty_so_many_accounts_can_lack_one():
    a = User.objects.create_user(email="a@example.com", phone_number="")
    b = User.objects.create_user(phone_number=PHONE, email="")
    c = User.objects.create_user(email="c@example.com")
    assert a.phone_number is None and c.phone_number is None
    assert b.email is None


def test_emails_are_stored_in_lower_case():
    assert User.objects.create_user(email=" Buyer@Example.COM ").email == EMAIL


def test_admin_accounts_need_a_phone_number():
    with pytest.raises(ValueError):
        User.objects.create_superuser(phone_number="", email=EMAIL, password="x")


# ── Signing up ───────────────────────────────────────────────────────────


def test_sign_up_by_email_creates_the_account_when_the_link_is_used(email_channel):
    client = APIClient()
    client.post("/api/v1/auth/magic-link/request/", {"email": "New@Example.com"})

    assert email_channel.last_kind == "sign_up"
    assert not User.objects.filter(email="new@example.com").exists()  # not until it's used

    response = client.get(f"/api/v1/auth/magic-link/verify/?token={email_channel.last_token}")
    assert response.status_code == 200
    body = response.json()
    assert body["created"] is True
    assert body["user"]["email"] == "new@example.com"
    assert body["user"]["phone_number"] is None

    client.post("/api/v1/auth/magic-link/request/", {"email": "new@example.com"})
    assert email_channel.last_kind == "sign_in"
    again = client.get(f"/api/v1/auth/magic-link/verify/?token={email_channel.last_token}")
    assert again.json()["created"] is False
    assert User.objects.filter(email="new@example.com").count() == 1


def test_sign_up_by_phone_says_the_account_was_created(otp_channel):
    client = APIClient()
    client.post("/api/v1/auth/otp/request/", {"phone_number": PHONE})
    first = client.post(
        "/api/v1/auth/otp/verify/", {"phone_number": PHONE, "code": otp_channel.last_code}
    )
    client.post("/api/v1/auth/otp/request/", {"phone_number": PHONE})
    second = client.post(
        "/api/v1/auth/otp/verify/", {"phone_number": PHONE, "code": otp_channel.last_code}
    )
    assert first.json()["created"] is True
    assert second.json()["created"] is False
    assert first.json()["user"]["email"] is None


# ── Abuse limits ─────────────────────────────────────────────────────────


def test_one_address_gets_at_most_five_emails_an_hour(email_channel):
    for _ in range(services.EMAILS_PER_ADDRESS_PER_HOUR + 2):
        services.request_magic_link(EMAIL, "https://app.example.com/magic-link")
    assert len(email_channel.sent) == services.EMAILS_PER_ADDRESS_PER_HOUR


def test_one_caller_can_ask_for_five_email_links_an_hour(email_channel):
    client = APIClient()
    answers = [
        client.post("/api/v1/auth/magic-link/request/", {"email": f"p{i}@example.com"}).status_code
        for i in range(6)
    ]
    assert answers == [202] * 5 + [429]


# ── Adding an email ──────────────────────────────────────────────────────


def test_phone_account_adds_an_email_once_confirmed(email_channel):
    user = User.objects.create_user(phone_number=PHONE)
    client = signed_in_as(user)

    response = client.post("/api/v1/auth/me/email/", {"email": EMAIL})
    assert response.status_code == 202
    assert email_channel.last_kind == "confirm_email"
    assert "/confirm-email?token=" in email_channel.last_link
    user.refresh_from_db()
    assert user.email is None  # not until it's confirmed

    # Opened on any device, signed in or not.
    confirmed = APIClient().post("/api/v1/auth/email/confirm/", {"token": email_channel.last_token})
    assert confirmed.status_code == 200
    assert confirmed.json() == {"email": EMAIL}
    assert client.get("/api/v1/auth/me/").json()["email"] == EMAIL


def test_adding_an_email_another_account_uses_is_refused(email_channel):
    User.objects.create_user(email=EMAIL)
    client = signed_in_as(User.objects.create_user(phone_number=PHONE))

    response = client.post("/api/v1/auth/me/email/", {"email": EMAIL.upper()})

    assert response.status_code == 409
    assert email_channel.sent == []


def test_an_email_taken_before_confirmation_is_refused(email_channel):
    client = signed_in_as(User.objects.create_user(phone_number=PHONE))
    client.post("/api/v1/auth/me/email/", {"email": EMAIL})
    token = email_channel.last_token
    User.objects.create_user(email=EMAIL)  # someone signs up with it meanwhile

    response = APIClient().post("/api/v1/auth/email/confirm/", {"token": token})

    assert response.status_code == 409


def test_an_account_with_an_email_cant_add_another(email_channel):
    client = signed_in_as(User.objects.create_user(email=EMAIL))
    response = client.post("/api/v1/auth/me/email/", {"email": "other@example.com"})
    assert response.status_code == 400


def test_a_sign_in_link_cant_confirm_an_email(email_channel):
    APIClient().post("/api/v1/auth/magic-link/request/", {"email": EMAIL})
    response = APIClient().post("/api/v1/auth/email/confirm/", {"token": email_channel.last_token})
    assert response.status_code == 400


# ── Adding a phone number ────────────────────────────────────────────────


def test_email_account_adds_a_phone_number_once_confirmed(otp_channel):
    user = User.objects.create_user(email=EMAIL)
    client = signed_in_as(user)

    assert client.post("/api/v1/auth/me/phone/", {"phone_number": PHONE}).status_code == 202
    user.refresh_from_db()
    assert user.phone_number is None

    response = client.post(
        "/api/v1/auth/me/phone/confirm/", {"phone_number": PHONE, "code": otp_channel.last_code}
    )
    assert response.status_code == 200
    assert response.json()["phone_number"] == PHONE


def test_a_code_only_confirms_for_the_account_that_asked(otp_channel):
    asker = signed_in_as(User.objects.create_user(email=EMAIL))
    asker.post("/api/v1/auth/me/phone/", {"phone_number": PHONE})
    other = signed_in_as(User.objects.create_user(email="other@example.com"))

    response = other.post(
        "/api/v1/auth/me/phone/confirm/", {"phone_number": PHONE, "code": otp_channel.last_code}
    )

    assert response.status_code == 400


def test_a_sign_in_code_cant_add_a_phone_number(otp_channel):
    APIClient().post("/api/v1/auth/otp/request/", {"phone_number": PHONE})
    client = signed_in_as(User.objects.create_user(email=EMAIL))
    response = client.post(
        "/api/v1/auth/me/phone/confirm/", {"phone_number": PHONE, "code": otp_channel.last_code}
    )
    assert response.status_code == 400


def test_adding_a_phone_number_another_account_uses_is_refused(otp_channel):
    User.objects.create_user(phone_number=PHONE)
    client = signed_in_as(User.objects.create_user(email=EMAIL))
    assert client.post("/api/v1/auth/me/phone/", {"phone_number": PHONE}).status_code == 409
    assert otp_channel.sent == []


def test_adding_a_phone_number_says_unavailable_without_sms(settings):
    settings.OTP_DELIVERY_CHANNEL = "apps.identity.channels.UnconfiguredOtpChannel"
    client = signed_in_as(User.objects.create_user(email=EMAIL))
    assert client.post("/api/v1/auth/me/phone/", {"phone_number": PHONE}).status_code == 503


def test_adding_needs_sign_in():
    assert APIClient().post("/api/v1/auth/me/email/", {"email": EMAIL}).status_code == 401
    assert APIClient().post("/api/v1/auth/me/phone/", {"phone_number": PHONE}).status_code == 401


# ── Tokens ───────────────────────────────────────────────────────────────


def test_each_refresh_gives_a_new_refresh_token_and_retires_the_old_one():
    refresh = str(RefreshToken.for_user(User.objects.create_user(email=EMAIL)))
    client = APIClient()

    first = client.post("/api/v1/auth/token/refresh/", {"refresh": refresh})
    assert first.status_code == 200
    assert first.json()["refresh"] != refresh

    assert client.post("/api/v1/auth/token/refresh/", {"refresh": refresh}).status_code == 401
    newer = client.post("/api/v1/auth/token/refresh/", {"refresh": first.json()["refresh"]})
    assert newer.status_code == 200


def test_logging_out_retires_the_refresh_token():
    refresh = str(RefreshToken.for_user(User.objects.create_user(email=EMAIL)))
    client = APIClient()

    assert client.post("/api/v1/auth/token/logout/", {"refresh": refresh}).status_code == 200
    assert client.post("/api/v1/auth/token/refresh/", {"refresh": refresh}).status_code == 401


@pytest.fixture(autouse=True)
def _lenient_email_throttle(request, monkeypatch):
    # Only the throttle test needs the real limit; the others make several
    # requests from the same test client.
    if request.node.name != "test_one_caller_can_ask_for_five_email_links_an_hour":
        monkeypatch.setattr(EmailLinkThrottle, "rate", "1000/hour", raising=False)
