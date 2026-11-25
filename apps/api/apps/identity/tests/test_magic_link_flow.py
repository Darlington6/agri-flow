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


def test_unknown_email_gets_a_sign_up_link_and_the_same_answer(email_channel):
    _make_user()
    client = APIClient()
    known = client.post("/api/v1/auth/magic-link/request/", {"email": EMAIL})
    unknown = client.post("/api/v1/auth/magic-link/request/", {"email": "nobody@example.com"})
    assert known.status_code == unknown.status_code == 202
    assert known.json() == unknown.json() == {}
    assert [kind for _, _, kind in email_channel.sent] == ["sign_in", "sign_up"]


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
    assert response.json() == {}


# ── The code in the same email, for the phone apps ──────────────────────


def _code_for(client, email_channel, email=EMAIL) -> str:
    client.post("/api/v1/auth/magic-link/request/", {"email": email})
    return email_channel.last_code


def _enter(client, code, email=EMAIL):
    return client.post("/api/v1/auth/magic-link/code/", {"email": email, "code": code})


def test_the_code_signs_in_like_the_link(email_channel):
    _make_user()
    client = APIClient()
    code = _code_for(client, email_channel)
    assert code is not None and len(code) == 6 and code.isdigit()

    response = _enter(client, code)
    assert response.status_code == 200
    body = response.json()
    assert body["user"]["email"] == EMAIL
    assert body["created"] is False
    assert "access" in body and "refresh" in body


def test_the_code_creates_the_account_for_a_new_email(email_channel):
    client = APIClient()
    code = _code_for(client, email_channel, "new@example.com")
    response = _enter(client, code, " New@Example.com ")
    assert response.status_code == 200
    assert response.json()["created"] is True
    assert User.objects.filter(email="new@example.com").exists()


def test_code_and_link_are_one_sign_in(email_channel):
    _make_user()
    client = APIClient()
    code = _code_for(client, email_channel)
    assert _enter(client, code).status_code == 200
    assert _enter(client, code).status_code == 400
    link = client.get(f"/api/v1/auth/magic-link/verify/?token={email_channel.last_token}")
    assert link.status_code == 400

    code = _code_for(client, email_channel)
    client.get(f"/api/v1/auth/magic-link/verify/?token={email_channel.last_token}")
    assert _enter(client, code).status_code == 400


def test_only_the_latest_email_code_works(email_channel):
    _make_user()
    client = APIClient()
    first = _code_for(client, email_channel)
    second = _code_for(client, email_channel)
    if first != second:
        assert _enter(client, first).status_code == 400
    assert _enter(client, second).status_code == 200


def test_five_wrong_codes_use_up_the_email(email_channel):
    _make_user()
    client = APIClient()
    code = _code_for(client, email_channel)
    wrong = f"{(int(code) + 1) % 1_000_000:06d}"
    for _ in range(5):
        response = _enter(client, wrong)
        assert response.json()["detail"] == "Incorrect code."
    response = _enter(client, code)
    assert response.status_code == 400
    assert "Too many attempts" in response.json()["detail"]


def test_an_expired_code_is_refused(email_channel):
    from datetime import timedelta

    from django.utils import timezone

    from apps.identity.models import MagicLinkToken

    _make_user()
    client = APIClient()
    code = _code_for(client, email_channel)
    MagicLinkToken.objects.update(expires_at=timezone.now() - timedelta(seconds=1))
    response = _enter(client, code)
    assert response.status_code == 400
    assert "expired" in response.json()["detail"]


def test_a_code_for_another_email_is_refused(email_channel):
    _make_user()
    client = APIClient()
    code = _code_for(client, email_channel)
    response = _enter(client, code, "someone-else@example.com")
    assert response.status_code == 400


@pytest.mark.parametrize("code", ["12345", "1234567", "abcdef", ""])
def test_the_code_must_be_six_digits(code):
    response = APIClient().post("/api/v1/auth/magic-link/code/", {"email": EMAIL, "code": code})
    assert response.status_code == 400
    assert "code" in response.json()


def test_debug_code_present_only_in_debug(settings, email_channel):
    settings.DEBUG = True
    response = APIClient().post("/api/v1/auth/magic-link/request/", {"email": EMAIL})
    assert response.json()["debug_code"] == email_channel.last_code


def test_confirming_an_added_email_carries_no_code(email_channel):
    from apps.identity.services import request_email_add

    user = User.objects.create_user(phone_number="+250788000009")
    request_email_add(user, "added@example.com", "https://app.example/confirm-email")
    assert email_channel.last_kind == "confirm_email"
    assert email_channel.last_code is None
