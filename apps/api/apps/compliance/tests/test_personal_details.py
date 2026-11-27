from datetime import date, timedelta

import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.compliance.models import PersonalDetails
from apps.identity.models import User

pytestmark = pytest.mark.django_db

URL = "/api/v1/compliance/personal-details/"
DETAILS = {"legal_name": "  Aline   Uwase ", "date_of_birth": "1994-03-12", "gender": "woman"}


def client_for(user) -> APIClient:
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {RefreshToken.for_user(user).access_token}")
    return client


@pytest.fixture
def user():
    return User.objects.create_user(email="aline@example.com", display_name="Aline U.")


NO_GUARDIAN = {"guardian_name": "", "guardian_relationship": "", "guardian_phone": ""}


def test_empty_until_given(user):
    assert client_for(user).get(URL).json() == {
        "legal_name": "",
        "date_of_birth": None,
        "gender": "",
        "is_minor": False,
        **NO_GUARDIAN,
    }


def test_saved_tidied_and_read_back(user):
    client = client_for(user)
    response = client.put(URL, DETAILS, format="json")
    assert response.status_code == 200
    expected = {
        "legal_name": "Aline Uwase",
        "date_of_birth": "1994-03-12",
        "gender": "woman",
        "is_minor": False,
        **NO_GUARDIAN,
    }
    assert response.json() == expected
    assert client.get(URL).json() == expected

    # Saving again changes the same record.
    client.put(URL, {**DETAILS, "gender": ""}, format="json")
    assert PersonalDetails.objects.get(user=user).gender == ""
    assert PersonalDetails.objects.count() == 1


def test_gender_is_optional_but_name_and_birth_date_are_not(user):
    client = client_for(user)
    assert client.put(URL, {**DETAILS, "gender": ""}, format="json").status_code == 200
    response = client.put(URL, {"legal_name": "   ", "gender": "man"}, format="json")
    assert response.status_code == 400
    assert set(response.json()) == {"legal_name", "date_of_birth"}


def test_a_birth_date_in_the_future_or_long_ago_is_refused(user):
    client = client_for(user)
    tomorrow = (date.today() + timedelta(days=1)).isoformat()
    assert client.put(URL, {**DETAILS, "date_of_birth": tomorrow}, format="json").status_code == 400
    assert (
        client.put(URL, {**DETAILS, "date_of_birth": "1899-12-31"}, format="json").status_code
        == 400
    )


def test_private_details_never_appear_on_the_account(user):
    client = client_for(user)
    client.put(URL, DETAILS, format="json")
    me = client.get("/api/v1/auth/me/").json()
    assert "Uwase" not in str(me)
    assert "1994" not in str(me)
    assert "woman" not in str(me)


def test_needs_sign_in():
    assert APIClient().get(URL).status_code == 401


def test_the_name_step_needs_them(user):
    client = client_for(user)
    assert client.get("/api/v1/onboarding/").json()["steps"]["name"] is False
    client.put(URL, DETAILS, format="json")
    assert client.get("/api/v1/onboarding/").json()["steps"]["name"] is True


def years_ago(years: int, days: int = 0) -> str:
    today = date.today()
    # 29 February has no match in most years: use the 28th then.
    day = today.replace(day=28) if (today.month, today.day) == (2, 29) else today
    return (day.replace(year=day.year - years) + timedelta(days=days)).isoformat()


GUARDIAN = {
    "guardian_name": "  Jean  Uwase ",
    "guardian_relationship": "parent",
    "guardian_phone": "+250 788 123 456",
}


def test_under_18_needs_a_parent_or_guardian(user):
    client = client_for(user)
    # A day short of 18.
    young = {**DETAILS, "date_of_birth": years_ago(18, days=1)}
    response = client.put(URL, young, format="json")
    assert response.status_code == 400
    assert set(response.json()) == {"guardian_name", "guardian_relationship", "guardian_phone"}

    response = client.put(URL, {**young, **GUARDIAN}, format="json")
    assert response.status_code == 200
    body = response.json()
    assert body["is_minor"] is True
    assert body["guardian_name"] == "Jean Uwase"
    assert body["guardian_phone"] == "+250788123456"


def test_a_guardians_number_must_be_real(user):
    young = {**DETAILS, "date_of_birth": years_ago(15), **GUARDIAN, "guardian_phone": "12"}
    response = client_for(user).put(URL, young, format="json")
    assert response.status_code == 400
    assert "guardian_phone" in response.json()


def test_adults_keep_no_guardian(user):
    client = client_for(user)
    # 18 today.
    response = client.put(
        URL, {**DETAILS, "date_of_birth": years_ago(18), **GUARDIAN}, format="json"
    )
    assert response.status_code == 200
    assert response.json()["is_minor"] is False
    assert PersonalDetails.objects.get(user=user).guardian_name == ""
