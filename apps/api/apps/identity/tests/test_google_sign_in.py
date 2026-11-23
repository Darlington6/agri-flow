import time
from types import SimpleNamespace

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa
from django.test import override_settings
from rest_framework.test import APIClient

from apps.identity import google
from apps.identity.models import User

pytestmark = pytest.mark.django_db

URL = "/api/v1/auth/google/"
CLIENT_ID = "test-client.apps.googleusercontent.com"
GOOGLE_KEY = rsa.generate_private_key(public_exponent=65537, key_size=2048)
OTHER_KEY = rsa.generate_private_key(public_exponent=65537, key_size=2048)


@pytest.fixture(autouse=True)
def google_keys(monkeypatch, settings):
    """Google's published key is our test key (no network in tests)."""
    settings.GOOGLE_CLIENT_IDS = [CLIENT_ID]
    monkeypatch.setattr(
        google._keys,
        "get_signing_key_from_jwt",
        lambda token: SimpleNamespace(key=GOOGLE_KEY.public_key()),
    )


def credential(key=GOOGLE_KEY, **overrides) -> str:
    claims = {
        "iss": "https://accounts.google.com",
        "aud": CLIENT_ID,
        "sub": "google-123",
        "email": "Aline@Example.com",
        "email_verified": True,
        "name": "Aline  Uwase",
        "iat": int(time.time()),
        "exp": int(time.time()) + 3600,
        **overrides,
    }
    return jwt.encode({k: v for k, v in claims.items() if v is not None}, key, algorithm="RS256")


def post(token: str):
    return APIClient().post(URL, {"credential": token}, format="json")


def test_a_new_person_gets_an_account_named_from_google():
    response = post(credential())

    assert response.status_code == 200
    body = response.json()
    assert body["created"] is True
    assert body["access"] and body["refresh"]
    assert body["user"]["email"] == "aline@example.com"
    assert body["user"]["display_name"] == "Aline Uwase"
    assert body["user"]["needs_onboarding"] is True
    assert User.objects.get().google_sub == "google-123"


def test_coming_back_signs_in_to_the_same_account():
    post(credential())
    response = post(credential())
    assert response.json()["created"] is False
    assert User.objects.count() == 1


def test_found_by_googles_id_even_after_their_email_changes():
    post(credential())
    response = post(credential(email="aline.new@example.com"))
    assert response.json()["user"]["email"] == "aline@example.com"
    assert User.objects.count() == 1


def test_an_existing_email_account_is_linked_not_duplicated():
    existing = User.objects.create_user(email="aline@example.com", display_name="Aline U.")
    response = post(credential())

    assert response.json()["created"] is False
    assert response.json()["user"]["id"] == existing.pk
    existing.refresh_from_db()
    assert existing.google_sub == "google-123"
    assert existing.display_name == "Aline U."  # their own name is kept


def test_an_unverified_google_email_cant_claim_an_account():
    User.objects.create_user(email="aline@example.com")
    response = post(credential(email_verified=False))
    assert response.status_code == 400
    assert User.objects.get().google_sub is None


def test_an_email_already_linked_to_another_google_account():
    User.objects.create_user(email="aline@example.com", google_sub="google-999")
    assert post(credential()).status_code == 409


@pytest.mark.parametrize(
    "token",
    [
        pytest.param(lambda: credential(key=OTHER_KEY), id="not signed by Google"),
        pytest.param(
            lambda: credential(aud="someone-else.apps.googleusercontent.com"), id="for another app"
        ),
        pytest.param(lambda: credential(iss="https://evil.example.com"), id="not issued by Google"),
        pytest.param(lambda: credential(exp=int(time.time()) - 3600), id="expired"),
        pytest.param(lambda: credential(sub=None), id="no subject"),
        pytest.param(lambda: "not-a-token", id="garbage"),
    ],
)
def test_tokens_that_arent_genuine_are_refused(token):
    response = post(token())
    assert response.status_code == 400
    assert not User.objects.exists()


def test_off_when_no_client_ids_are_set():
    with override_settings(GOOGLE_CLIENT_IDS=[]):
        assert post(credential()).status_code == 400


def test_a_turned_off_account_cant_sign_in():
    User.objects.create_user(email="aline@example.com", google_sub="google-123", is_active=False)
    assert post(credential()).status_code == 403


def test_a_credential_is_required():
    assert APIClient().post(URL, {}, format="json").status_code == 400


def test_the_reason_a_token_was_refused_is_logged_without_the_token(caplog):
    token = credential(aud="someone-else.apps.googleusercontent.com")
    post(token)
    assert "InvalidAudienceError" in caplog.text
    assert token not in caplog.text
