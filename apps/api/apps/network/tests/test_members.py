import pytest

from apps.identity.models import User
from apps.network.models import FarmerProfile, Membership

from .conftest import client_for
from .test_cooperatives import cooperative

pytestmark = pytest.mark.django_db

URL = "/api/v1/network/cooperative/members/"


def farmer(name: str, coop, phone: str | None = None, **membership) -> Membership:
    user = User.objects.create_user(
        email=f"{name.lower()}@example.com", phone_number=phone, display_name=name, country="RW"
    )
    profile = FarmerProfile.objects.create(
        user=user, region="Northern Province", district="Musanze", crops=["beans", "maize"]
    )
    return Membership.objects.create(farmer=profile, cooperative=coop, **membership)


@pytest.fixture
def coop():
    return cooperative("Abahuzamugambi")


def test_the_manager_sees_who_chose_their_cooperative_waiting_first(coop):
    member = farmer("Jean", coop, status=Membership.Status.CONFIRMED)
    waiting = farmer("Aline", coop, phone="+250788123456")
    farmer("Eric", coop, status=Membership.Status.DECLINED)
    farmer("Other", cooperative("Twisungane"))

    body = client_for(coop.user).get(URL).json()
    assert body["cooperative"] == {"name": "Abahuzamugambi", "confirmed": 1, "pending": 1}
    assert [m["farmer"]["name"] for m in body["members"]] == ["Aline", "Jean", "Eric"]
    first = body["members"][0]
    assert first["id"] == waiting.pk
    assert first["status"] == "pending"
    assert first["farmer"]["phone_number"] == "+250788123456"
    assert first["farmer"]["crops"] == ["Beans", "Maize"]
    assert member.pk == body["members"][1]["id"]


def test_confirming_and_removing_a_member(coop):
    waiting = farmer("Aline", coop)
    client = client_for(coop.user)

    response = client.post(f"{URL}{waiting.pk}/", {"status": "confirmed"}, format="json")
    assert response.status_code == 200
    assert response.json()["status"] == "confirmed"
    waiting.refresh_from_db()
    assert waiting.decided_by == coop.user
    assert waiting.decided_at is not None

    # The farmer sees it on their profile.
    farmer_body = client_for(waiting.farmer.user).get("/api/v1/network/profiles/").json()
    assert farmer_body[0]["cooperative"]["membership"] == "confirmed"

    # Removing a member declines them.
    client.post(f"{URL}{waiting.pk}/", {"status": "declined"}, format="json")
    assert client.get(URL).json()["cooperative"] == {
        "name": "Abahuzamugambi",
        "confirmed": 0,
        "pending": 0,
    }


def test_the_cooperative_profile_counts_its_members(coop):
    farmer("Aline", coop)
    farmer("Jean", coop, status=Membership.Status.CONFIRMED)
    body = client_for(coop.user).get("/api/v1/network/profiles/").json()
    assert body[0]["members"] == {"confirmed": 1, "pending": 1}


def test_only_the_manager_can_see_or_decide(coop, user):
    waiting = farmer("Grace", coop)
    other = cooperative("Twisungane")

    # Someone without a cooperative.
    assert client_for(user).get(URL).status_code == 403
    assert client_for(user).post(f"{URL}{waiting.pk}/", {"status": "confirmed"}).status_code == 403
    # Another cooperative's manager.
    response = client_for(other.user).post(f"{URL}{waiting.pk}/", {"status": "confirmed"})
    assert response.status_code == 404
    waiting.refresh_from_db()
    assert waiting.status == Membership.Status.PENDING


def test_only_confirm_or_decline(coop):
    waiting = farmer("Aline", coop)
    response = client_for(coop.user).post(f"{URL}{waiting.pk}/", {"status": "pending"})
    assert response.status_code == 400
