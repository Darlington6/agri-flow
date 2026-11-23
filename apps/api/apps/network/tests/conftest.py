import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.identity.models import User


@pytest.fixture
def user(db):
    return User.objects.create_user(
        email="aline@example.com", display_name="Aline", country="RW", language="en"
    )


def client_for(user) -> APIClient:
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {RefreshToken.for_user(user).access_token}")
    return client


@pytest.fixture
def client(user):
    return client_for(user)


FARMER = {
    "role": "farmer",
    "region": "Northern Province",
    "district": "Musanze",
    "crops": ["irish_potato", "beans"],
    "farm_size_hectares": "1.5",
    "cooperative_name": "  Abahuzamugambi  ",
}
