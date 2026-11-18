"""Delivery in deployed environments: magic links go out through Django's
email system (Brevo there; the in-memory outbox in tests), and phone sign-in
answers "not available yet" while there's no SMS provider.
"""

import pytest
from django.core import mail
from rest_framework.test import APIClient

from apps.identity import channels
from apps.identity.models import User

pytestmark = pytest.mark.django_db

EMAIL_CHANNEL = "apps.identity.channels.DjangoEmailChannel"
NO_SMS = "apps.identity.channels.UnconfiguredOtpChannel"


def test_magic_link_is_emailed(settings):
    settings.EMAIL_DELIVERY_CHANNEL = EMAIL_CHANNEL
    settings.FRONTEND_URL = "https://app.example.com"
    User.objects.create_user(phone_number="+250788000001", email="farmer@example.com")

    response = APIClient().post("/api/v1/auth/magic-link/request/", {"email": "farmer@example.com"})

    assert response.status_code == 202
    assert len(mail.outbox) == 1
    sent = mail.outbox[0]
    assert sent.to == ["farmer@example.com"]
    assert sent.subject == "Your AgriFlow sign-in link"
    assert "https://app.example.com/magic-link?token=" in sent.body


def test_unknown_email_gets_a_sign_up_email(settings):
    settings.EMAIL_DELIVERY_CHANNEL = EMAIL_CHANNEL

    response = APIClient().post("/api/v1/auth/magic-link/request/", {"email": "new@example.com"})

    assert response.status_code == 202
    assert mail.outbox[0].subject == "Finish creating your AgriFlow account"


def test_failed_send_is_logged_not_shown(settings, monkeypatch, caplog):
    # The answer must look the same as for an unknown email, or it would
    # reveal that the address has an account.
    settings.EMAIL_DELIVERY_CHANNEL = EMAIL_CHANNEL
    User.objects.create_user(phone_number="+250788000002", email="buyer@example.com")

    def broken(**_):
        raise ConnectionError("Brevo is down")

    monkeypatch.setattr(channels, "send_mail", broken)

    response = APIClient().post("/api/v1/auth/magic-link/request/", {"email": "buyer@example.com"})

    assert response.status_code == 202
    assert response.json() == {}
    assert "Couldn't send the sign_in email" in caplog.text


def test_phone_sign_in_says_unavailable_without_sms(settings):
    settings.OTP_DELIVERY_CHANNEL = NO_SMS

    response = APIClient().post("/api/v1/auth/otp/request/", {"phone_number": "+250788000003"})

    assert response.status_code == 503
    assert response.json() == {"detail": "Phone sign-in isn't available yet."}
