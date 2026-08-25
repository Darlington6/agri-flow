import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.identity.models import Role, User

pytestmark = pytest.mark.django_db


def test_me_requires_auth():
    client = APIClient()
    response = client.get("/api/v1/auth/me/")
    assert response.status_code == 401


def test_me_returns_user_and_roles():
    user = User.objects.create_user(phone_number="+233241234567", display_name="Abena")
    user.roles.add(Role.objects.get(slug="farmer"))

    access = str(RefreshToken.for_user(user).access_token)
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

    response = client.get("/api/v1/auth/me/")
    assert response.status_code == 200
    body = response.json()
    assert body["phone_number"] == "+233241234567"
    assert body["roles"] == [{"slug": "farmer", "name": "Farmer"}]
