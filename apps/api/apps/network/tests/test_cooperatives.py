import pytest

from apps.identity.models import User
from apps.network.models import CooperativeProfile, Membership, Verification

from .conftest import FARMER

pytestmark = pytest.mark.django_db

OPTIONS = "/api/v1/network/options/?country=RW"
PROFILES = "/api/v1/network/profiles/"


def cooperative(name: str, country: str = "RW", **fields) -> CooperativeProfile:
    manager = User.objects.create_user(
        email=f"{name.split()[0].lower()}@example.com", country=country
    )
    return CooperativeProfile.objects.create(
        user=manager, name=name, region="Northern Province", crops=["beans"], **fields
    )


def test_cooperatives_in_the_country_are_listed_by_name(client):
    cooperative("Twisungane")
    abahuza = cooperative("Abahuzamugambi", verification=Verification.VERIFIED)
    cooperative("Kenyan Growers", country="KE")
    cooperative("Turned Down", verification=Verification.REJECTED)

    listed = client.get(OPTIONS).json()["cooperatives"]
    assert [c["name"] for c in listed] == ["Abahuzamugambi", "Twisungane"]
    assert listed[0] == {
        "id": abahuza.pk,
        "name": "Abahuzamugambi",
        "region": "Northern Province",
        "district": "",
        "verified": True,
    }
    # New cooperatives are listed straight away, marked unverified.
    assert listed[1]["verified"] is False


def test_choosing_a_cooperative_asks_to_join_it(client, user):
    coop = cooperative("Abahuzamugambi")
    response = client.post(PROFILES, {**FARMER, "cooperative_id": coop.pk}, format="json")
    assert response.status_code == 201
    body = response.json()
    assert body["cooperative"] == {
        "id": coop.pk,
        "name": "Abahuzamugambi",
        "verified": False,
        "membership": "pending",
    }
    # A cooperative on AgriFlow replaces a typed name.
    assert body["cooperative_name"] == ""
    assert Membership.objects.get().status == Membership.Status.PENDING


def test_a_typed_cooperative_name_still_works(client):
    body = client.post(PROFILES, FARMER, format="json").json()
    assert body["cooperative"] is None
    assert body["cooperative_name"] == "Abahuzamugambi"


def test_only_cooperatives_in_the_list_can_be_chosen(client):
    elsewhere = cooperative("Kenyan Growers", country="KE")
    rejected = cooperative("Turned Down", verification=Verification.REJECTED)
    for coop_id in (elsewhere.pk, rejected.pk, 999_999):
        response = client.post(PROFILES, {**FARMER, "cooperative_id": coop_id}, format="json")
        assert response.status_code == 400
        assert "cooperative_id" in response.json()


def test_changing_or_leaving_a_cooperative(client):
    first, second = cooperative("Abahuzamugambi"), cooperative("Twisungane")
    client.post(PROFILES, {**FARMER, "cooperative_id": first.pk}, format="json")
    membership = Membership.objects.get()
    membership.status = Membership.Status.CONFIRMED
    membership.save()

    # Saving the same cooperative again keeps the confirmed membership.
    client.patch(f"{PROFILES}farmer/", {"cooperative_id": first.pk}, format="json")
    assert Membership.objects.get().status == Membership.Status.CONFIRMED

    # Another cooperative asks to join that one instead.
    body = client.patch(f"{PROFILES}farmer/", {"cooperative_id": second.pk}, format="json").json()
    assert body["cooperative"]["name"] == "Twisungane"
    assert body["cooperative"]["membership"] == "pending"
    assert Membership.objects.count() == 1

    # None leaves it.
    body = client.patch(f"{PROFILES}farmer/", {"cooperative_id": None}, format="json").json()
    assert body["cooperative"] is None
    assert not Membership.objects.exists()
