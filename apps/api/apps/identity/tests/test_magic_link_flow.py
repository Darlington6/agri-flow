import pytest
from rest_framework.test import APIClient

from apps.identity.models import User

pytestmark = pytest.mark.django_db

EMAIL = "buyer@example.com"


def _make_user(email=EMAIL, phone="+233241111111"):
    return User.objects.create_user(phone_number=phone, email=email)


def test_magic_link_happy_path(email_channel):
    _make_user()
    client = APIClient()

    response = client.post("/api/v1/auth/magic-link/request/", {"email": EMAIL})
    assert response.status_code == 202

    token = email_channel.last_link.split("token=")[-1]
    response = client.get(f"/api/v1/auth/magic-link/verify/?token={token}")
    assert response.status_code == 200
    body = response.json()
    assert body["user"]["email"] == EMAIL
    assert "access" in body


def test_magic_link_does_not_reveal_unknown_email(email_channel):
    client = APIClient()
    response = client.post("/api/v1/auth/magic-link/request/", {"email": "nobody@example.com"})
    assert response.status_code == 202
    assert email_channel.sent == []


def test_magic_link_token_is_single_use(email_channel):
    _make_user()
    client = APIClient()
    client.post("/api/v1/auth/magic-link/request/", {"email": EMAIL})
    token = email_channel.last_link.split("token=")[-1]

    first = client.get(f"/api/v1/auth/magic-link/verify/?token={token}")
    assert first.status_code == 200

    second = client.get(f"/api/v1/auth/magic-link/verify/?token={token}")
    assert second.status_code == 400


def test_invalid_token_is_rejected():
    client = APIClient()
    response = client.get("/api/v1/auth/magic-link/verify/?token=not-a-real-token")
    assert response.status_code == 400


def test_debug_link_present_when_debug_true(settings, email_channel):
    settings.DEBUG = True
    _make_user()
    client = APIClient()
    response = client.post("/api/v1/auth/magic-link/request/", {"email": EMAIL})
    assert response.json()["debug_link"] == email_channel.last_link


def test_debug_link_absent_when_debug_false(settings, email_channel):
    settings.DEBUG = False
    _make_user()
    client = APIClient()
    response = client.post("/api/v1/auth/magic-link/request/", {"email": EMAIL})
    assert "debug_link" not in response.json()
