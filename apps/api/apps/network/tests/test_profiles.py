import pytest

from apps.identity.models import User
from apps.network.models import FarmerProfile, Verification

from .conftest import FARMER, client_for

pytestmark = pytest.mark.django_db

URL = "/api/v1/network/profiles/"


def test_profiles_need_sign_in():
    from rest_framework.test import APIClient

    assert APIClient().get(URL).status_code == 401


def test_choosing_farmer_creates_the_profile_and_grants_the_role(client, user):
    response = client.post(URL, FARMER, format="json")

    assert response.status_code == 201
    body = response.json()
    assert body["role"] == "farmer"
    assert body["verification"] == "unverified"
    assert body["crops"] == ["irish_potato", "beans"]
    assert body["cooperative_name"] == "Abahuzamugambi"
    assert list(user.roles.values_list("slug", flat=True)) == ["farmer"]
    assert client.get(URL).json() == [body]


def test_an_account_can_hold_several_roles(client, user):
    client.post(URL, FARMER, format="json")
    response = client.post(
        URL,
        {
            "role": "buyer",
            "business_name": "Musanze Fresh",
            "business_type": "aggregator",
            "region": "Northern Province",
            "district": "Musanze",
        },
        format="json",
    )
    assert response.status_code == 201
    assert set(user.roles.values_list("slug", flat=True)) == {"farmer", "buyer"}
    assert [p["role"] for p in client.get(URL).json()] == ["farmer", "buyer"]


def test_choosing_the_same_role_twice_is_a_conflict(client):
    client.post(URL, FARMER, format="json")
    response = client.post(URL, FARMER, format="json")
    assert response.status_code == 409
    assert FarmerProfile.objects.count() == 1


@pytest.mark.parametrize("role", ["field_agent", "platform_admin", "super_admin"])
def test_staff_roles_cant_be_chosen(client, user, role):
    response = client.post(URL, {**FARMER, "role": role}, format="json")
    assert response.status_code == 400  # not even offered as a choice
    assert not user.roles.exists()


def test_country_comes_first(db):
    user = User.objects.create_user(email="nocountry@example.com")
    response = client_for(user).post(URL, FARMER, format="json")
    assert response.status_code == 400
    assert "country" in response.json()["detail"]


@pytest.mark.parametrize(
    "change,field",
    [
        ({"region": "Atlantis"}, "region"),
        ({"district": "Huye"}, "district"),  # Huye is in the Southern Province
        ({"crops": []}, "crops"),
        ({"crops": ["maize", "gold"]}, "crops"),
        ({"farm_size_hectares": "0"}, "farm_size_hectares"),
    ],
)
def test_farmer_details_are_checked(client, user, change, field):
    response = client.post(URL, {**FARMER, **change}, format="json")
    assert response.status_code == 400
    assert field in response.json()
    assert not user.roles.exists()


def test_places_are_typed_where_theres_no_list(db):
    user = User.objects.create_user(email="ke@example.com", country="KE", language="sw")
    response = client_for(user).post(
        URL, {**FARMER, "region": " Nakuru  County ", "district": "Njoro"}, format="json"
    )
    assert response.status_code == 201
    assert response.json()["region"] == "Nakuru County"


def test_buyer_needs_a_business_name_and_known_type(client):
    response = client.post(
        URL,
        {"role": "buyer", "business_name": "  ", "business_type": "pirate", "region": "Kigali"},
        format="json",
    )
    assert response.status_code == 400
    assert {"business_name", "business_type"} <= response.json().keys()


def test_delivery_partner_lists_vehicles_and_regions(client):
    response = client.post(
        URL,
        {
            "role": "delivery_partner",
            "vehicle_types": ["pickup", "pickup", "motorbike"],
            "service_regions": ["City of Kigali", "Eastern Province"],
        },
        format="json",
    )
    assert response.status_code == 201
    assert response.json()["vehicle_types"] == ["pickup", "motorbike"]
    assert response.json()["business_name"] == ""


def test_delivery_partner_regions_come_from_the_list(client):
    response = client.post(
        URL,
        {"role": "delivery_partner", "vehicle_types": ["truck"], "service_regions": ["Mars"]},
        format="json",
    )
    assert response.status_code == 400
    assert "service_regions" in response.json()


def test_cooperative_profile(client, user):
    response = client.post(
        URL,
        {
            "role": "cooperative",
            "name": "Koperative Abahinzi ba Kawa",
            "registration_number": "RCA/0123/2019",
            "region": "Western Province",
            "district": "Nyamasheke",
            "member_count": 240,
            "crops": ["coffee"],
        },
        format="json",
    )
    assert response.status_code == 201
    assert response.json()["member_count"] == 240
    assert list(user.roles.values_list("slug", flat=True)) == ["cooperative"]


def test_editing_a_profile(client):
    client.post(URL, FARMER, format="json")
    response = client.patch(f"{URL}farmer/", {"crops": ["maize"]}, format="json")
    assert response.status_code == 200
    assert response.json()["crops"] == ["maize"]
    assert response.json()["district"] == "Musanze"


def test_editing_checks_the_district_against_the_saved_region(client):
    client.post(URL, FARMER, format="json")
    response = client.patch(f"{URL}farmer/", {"district": "Huye"}, format="json")
    assert response.status_code == 400


def test_verification_cant_be_set_by_the_owner(client):
    client.post(URL, {**FARMER, "verification": "verified"}, format="json")
    client.patch(f"{URL}farmer/", {"verification": "verified"}, format="json")
    assert FarmerProfile.objects.get().verification == Verification.UNVERIFIED


def test_editing_a_role_you_dont_have(client):
    assert client.patch(f"{URL}buyer/", {"business_name": "X"}, format="json").status_code == 404


def test_options_list_rwandas_places_and_the_crops(client):
    body = client.get("/api/v1/network/options/").json()
    assert body["country"] == "RW"
    assert len(body["regions"]) == 5
    assert sum(len(r["districts"]) for r in body["regions"]) == 30
    assert {"value": "coffee", "label": "Coffee"} in body["crops"]
    assert body["buyer_types"] and body["vehicle_types"]


def test_options_elsewhere_have_no_place_list(client):
    assert client.get("/api/v1/network/options/?country=ke").json()["regions"] is None
