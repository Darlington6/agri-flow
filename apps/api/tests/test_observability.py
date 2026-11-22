"""Error reports reach Sentry with the user's id and nothing personal."""

import json

import pytest
import sentry_sdk
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from sentry_sdk.transport import Transport

from apps.identity import channels, services
from apps.identity.models import User
from config import observability
from config.observability import FILTERED, init_sentry, scrub_event, scrub_text, scrub_url

FAKE_DSN = "https://public@o0.ingest.de.sentry.io/0"


class RecordingTransport(Transport):
    def __init__(self, options=None):
        super().__init__(options)
        self.events = []

    def capture_envelope(self, envelope):
        event = envelope.get_event()
        if event is not None:
            self.events.append(event)


def without_source_lines(value):
    """Drops the lines of code Sentry shows around each stack frame: they
    are this test file's own source (which mentions the sample phone number),
    not data from the request."""
    if isinstance(value, dict):
        return {
            k: without_source_lines(v)
            for k, v in value.items()
            if k not in {"pre_context", "context_line", "post_context"}
        }
    if isinstance(value, list):
        return [without_source_lines(v) for v in value]
    return value


@pytest.fixture
def sentry():
    transport = RecordingTransport()
    init_sentry(
        FAKE_DSN, "config.settings.prod", "abc123", transport=transport, traces_sample_rate=0
    )
    yield transport
    sentry_sdk.get_client().close()
    sentry_sdk.init()  # back to a client that sends nothing


def test_scrub_text_hides_emails_and_phone_numbers():
    text = "Brevo refused abena@example.com; SMS to +250 788 123 456 failed"
    assert scrub_text(text) == f"Brevo refused {FILTERED}; SMS to {FILTERED} failed"


def test_scrub_url_hides_one_time_tokens_and_codes():
    url = "https://app.example/magic-link?token=secret-token&next=/account"
    assert scrub_url(url) == "https://app.example/magic-link?token=[Filtered]&next=%2Faccount"
    assert "secret" not in scrub_url(
        "https://api.example/api/v1/auth/magic-link/verify/?token=secret"
    )
    assert scrub_url("https://app.example/account") == "https://app.example/account"


def test_scrub_event_drops_request_bodies_cookies_and_secrets():
    event = {
        "request": {
            "url": "https://api.example/api/v1/auth/magic-link/verify/?token=secret",
            "query_string": "token=secret",
            "data": {"email": "abena@example.com"},
            "cookies": {"sessionid": "x"},
            "env": {"REMOTE_ADDR": "1.2.3.4"},
        },
        "exception": {"values": [{"type": "Error", "value": "No account for abena@example.com"}]},
        "logentry": {"message": "Couldn't text %s", "params": ["+250788123456"]},
        "breadcrumbs": {
            "values": [{"message": "to +250788123456", "data": {"url": "/x?code=123456"}}]
        },
    }
    scrubbed = json.dumps(scrub_event(event))
    for secret in (
        "secret",
        "abena@example.com",
        "+250788123456",
        "123456",
        "sessionid",
        "1.2.3.4",
    ):
        assert secret not in scrubbed


def test_init_sentry_does_nothing_without_a_dsn(monkeypatch):
    calls = []
    monkeypatch.setattr(observability.sentry_sdk, "init", lambda **kw: calls.append(kw))
    init_sentry("", "config.settings.prod", None)
    assert calls == []


@pytest.mark.parametrize(
    ("module", "environment"),
    [("config.settings.prod", "production"), ("config.settings.staging", "staging")],
)
def test_init_sentry_names_the_environment_and_sends_no_personal_data(
    monkeypatch, module, environment
):
    calls = []
    monkeypatch.setattr(observability.sentry_sdk, "init", lambda **kw: calls.append(kw))
    init_sentry(FAKE_DSN, module, "abc123")
    (options,) = calls
    assert options["environment"] == environment
    assert options["release"] == "abc123"
    assert options["data_collection"]["user_info"] is False
    assert options["data_collection"]["http_bodies"] == []
    assert options["data_collection"]["stack_frame_variables"] is False
    assert options["before_send"] is scrub_event


@pytest.mark.django_db
def test_a_failed_email_is_reported_with_the_user_id_but_not_their_address(sentry, monkeypatch):
    user = User.objects.create_user(phone_number="+250788123456")
    monkeypatch.setattr(services, "get_email_channel", lambda: channels.DjangoEmailChannel())

    def refuse(**kwargs):
        raise RuntimeError(f"Brevo refused {kwargs['recipient_list'][0]}")

    monkeypatch.setattr(channels, "send_mail", refuse)

    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {RefreshToken.for_user(user).access_token}")
    response = client.post("/api/v1/auth/me/email/", {"email": "abena@example.com"}, format="json")
    sentry_sdk.flush()

    assert response.status_code == 202  # the failure is reported, never shown
    (event,) = [e for e in sentry.events if e.get("level") == "error"]
    assert event["user"] == {"id": str(user.pk)}
    assert event["environment"] == "production"
    reported = json.dumps(without_source_lines(event))
    assert "abena@example.com" not in reported
    assert "+250788123456" not in reported
    assert "Bearer" not in reported
