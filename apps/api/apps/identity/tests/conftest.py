import pytest
from django.core.cache import cache

from apps.identity import services


class RecordingOtpChannel:
    def __init__(self):
        self.sent: list[tuple[str, str]] = []

    def send(self, phone_number: str, code: str) -> None:
        self.sent.append((phone_number, code))

    @property
    def last_code(self) -> str:
        return self.sent[-1][1]


class RecordingEmailChannel:
    def __init__(self):
        self.sent: list[tuple[str, str, str]] = []

    def send(self, email: str, link: str, kind: str) -> None:
        self.sent.append((email, link, kind))

    @property
    def last_link(self) -> str:
        return self.sent[-1][1]

    @property
    def last_token(self) -> str:
        return self.last_link.split("token=")[-1]

    @property
    def last_kind(self) -> str:
        return self.sent[-1][2]


@pytest.fixture(autouse=True)
def _reset_throttle_cache():
    # DRF throttling is cache-backed and otherwise persists across tests
    # in the same process — reset it so one test's OTP requests don't
    # trip another test's throttle limit.
    cache.clear()


@pytest.fixture
def otp_channel(monkeypatch):
    channel = RecordingOtpChannel()
    monkeypatch.setattr(services, "get_otp_channel", lambda: channel)
    return channel


@pytest.fixture
def email_channel(monkeypatch):
    channel = RecordingEmailChannel()
    monkeypatch.setattr(services, "get_email_channel", lambda: channel)
    return channel
