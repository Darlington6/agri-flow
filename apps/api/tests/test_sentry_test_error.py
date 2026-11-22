"""The staff-only address that fails on purpose, to check Sentry."""

import pytest
from django.test import Client

from apps.identity.models import User
from config.views import SentryTestError

pytestmark = pytest.mark.django_db
URL = "/api/v1/debug/sentry-error/"


def test_it_does_not_exist_for_visitors():
    assert Client().get(URL).status_code == 404


def test_it_does_not_exist_for_signed_in_non_staff():
    client = Client()
    client.force_login(User.objects.create_user(phone_number="+250788000010"))
    assert client.get(URL).status_code == 404


def test_it_fails_on_purpose_for_staff():
    client = Client()
    client.force_login(User.objects.create_user(phone_number="+250788000011", is_staff=True))
    with pytest.raises(SentryTestError):
        client.get(URL)
