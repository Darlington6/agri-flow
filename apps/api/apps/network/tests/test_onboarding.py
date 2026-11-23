import pytest
from django.test import override_settings

from apps.identity.models import Role, User

from .conftest import FARMER, client_for

pytestmark = pytest.mark.django_db

URL = "/api/v1/onboarding/"
TERMS = {"terms_version": "2026-11-draft", "accept_terms": True}


def test_a_brand_new_account_starts_at_the_name_step(db):
    user = User.objects.create_user(phone_number="+250788123456")
    body = client_for(user).get(URL).json()
    assert body == {
        "steps": {"name": False, "place": False, "role": False, "phone": True, "terms": False},
        "next_step": "name",
        "complete": False,
        "terms_version": "2026-11-draft",
    }


def test_the_steps_follow_the_account(client, user):
    # The fixture user has a name, country and language but no role yet.
    assert client.get(URL).json()["next_step"] == "role"
    client.post("/api/v1/network/profiles/", FARMER, format="json")
    # Signed up with email, so they're offered a phone number next.
    assert client.get(URL).json()["next_step"] == "phone"
    assert client.post(f"{URL}skip-phone/").json()["next_step"] == "terms"


def test_finishing_records_the_terms_and_the_time(client, user):
    client.post("/api/v1/network/profiles/", FARMER, format="json")
    response = client.post(f"{URL}complete/", TERMS, format="json")

    assert response.status_code == 200
    assert response.json()["needs_onboarding"] is False
    user.refresh_from_db()
    assert user.terms_version == "2026-11-draft"
    assert user.terms_accepted_at is not None
    assert user.onboarded_at == user.terms_accepted_at
    assert client.get(URL).json()["complete"] is True


def test_the_phone_step_is_optional(client):
    client.post("/api/v1/network/profiles/", FARMER, format="json")
    assert client.post(f"{URL}complete/", TERMS, format="json").status_code == 200


def test_cant_finish_with_steps_missing(client):
    response = client.post(f"{URL}complete/", TERMS, format="json")
    assert response.status_code == 409
    assert "role" in response.json()["detail"]


def test_must_agree_to_the_terms(client):
    client.post("/api/v1/network/profiles/", FARMER, format="json")
    response = client.post(f"{URL}complete/", {**TERMS, "accept_terms": False}, format="json")
    assert response.status_code == 400


def test_cant_agree_to_an_old_version(client):
    client.post("/api/v1/network/profiles/", FARMER, format="json")
    response = client.post(f"{URL}complete/", {**TERMS, "terms_version": "2025-01"}, format="json")
    assert response.status_code == 409


def test_new_terms_ask_everyone_again(client, user):
    client.post("/api/v1/network/profiles/", FARMER, format="json")
    client.post(f"{URL}complete/", TERMS, format="json")
    first_finished = User.objects.get(pk=user.pk).onboarded_at

    with override_settings(TERMS_VERSION="2027-01"):
        body = client.get(URL).json()
        assert body["complete"] is False
        assert body["next_step"] == "terms"
        assert client.get("/api/v1/auth/me/").json()["needs_onboarding"] is True

        client.post(f"{URL}complete/", {**TERMS, "terms_version": "2027-01"}, format="json")
        user.refresh_from_db()
        assert user.terms_version == "2027-01"
        assert user.onboarded_at == first_finished  # still when they first joined


def test_staff_dont_choose_a_role(db):
    agent = User.objects.create_user(
        phone_number="+250788000111", display_name="Eric", country="RW", language="rw"
    )
    agent.roles.add(Role.objects.get(slug="field_agent"))
    assert client_for(agent).get(URL).json()["next_step"] == "terms"


def test_skipping_the_phone_is_remembered(client, user):
    client.post(f"{URL}skip-phone/")
    first = User.objects.get(pk=user.pk).phone_prompted_at
    client.post(f"{URL}skip-phone/")
    assert User.objects.get(pk=user.pk).phone_prompted_at == first
