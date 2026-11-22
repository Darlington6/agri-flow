"""Delivery in deployed environments: magic links go out through Django's
email system (Brevo there; the in-memory outbox in tests), and phone sign-in
answers "not available yet" while there's no SMS provider.
"""

from pathlib import Path

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


def test_the_email_has_a_button_and_a_plain_text_version(settings):
    settings.EMAIL_DELIVERY_CHANNEL = EMAIL_CHANNEL
    settings.FRONTEND_URL = "https://app.example.com"

    APIClient().post("/api/v1/auth/magic-link/request/", {"email": "new@example.com"})

    sent = mail.outbox[0]
    link = next(
        w for w in sent.body.split() if w.startswith("https://app.example.com/magic-link?token=")
    )
    html, content_type = sent.alternatives[0]
    assert content_type == "text/html"
    assert f'href="{link}"' in html
    assert "Create my account" in html
    assert "Welcome to AgriFlow" in sent.body
    assert "works once, within 15 minutes" in sent.body
    for version in (sent.body, html):
        assert "The AgriFlow team" in version


def test_the_logo_and_links_point_at_the_website(settings):
    settings.PUBLIC_SITE_URL = "https://site.example"
    channels.DjangoEmailChannel().send(
        "someone@example.com", "https://app.example.com/x?token=t", "sign_in"
    )

    html = mail.outbox[0].alternatives[0][0]
    assert 'src="https://site.example/email/agriflow-mark-reversed.png"' in html
    assert 'href="https://site.example/privacy/"' in html


def test_the_logo_the_emails_load_is_on_the_website():
    # Emails load it from the site's public folder (apps/site/public/email/).
    repo = Path(__file__).resolve().parents[5]
    assert (repo / "apps/site/public/email/agriflow-mark-reversed.png").is_file()


@pytest.mark.parametrize("kind", sorted(channels.EMAIL_WORDING))
def test_every_kind_of_email_renders(kind):
    link = "https://app.example.com/x?token=t"
    channels.DjangoEmailChannel().send("someone@example.com", link, kind)

    sent = mail.outbox[0]
    wording = channels.EMAIL_WORDING[kind]
    assert sent.subject == wording.subject
    assert wording.button in sent.alternatives[0][0]
    assert "{{" not in sent.body and "{{" not in sent.alternatives[0][0]


@pytest.mark.parametrize("debug", [True, False])
def test_the_link_is_logged_only_in_local_development(settings, caplog, debug):
    settings.DEBUG = debug
    with caplog.at_level("INFO", logger="agriflow.identity.delivery"):
        channels.DjangoEmailChannel().send(
            "someone@example.com", "https://app.example.com/x?token=t", "sign_in"
        )
    assert ("token=t" in caplog.text) is debug


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
