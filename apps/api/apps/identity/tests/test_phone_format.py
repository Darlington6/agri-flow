"""One phone number, one account, however it's typed."""

import importlib

import pytest
from django.apps import apps as django_apps
from django.contrib.auth import authenticate
from django.test import Client

from apps.identity.models import User
from apps.identity.phone import InvalidPhoneNumber, tidy, to_e164

pytestmark = pytest.mark.django_db


@pytest.mark.parametrize("typed", ["+250 793 440 734", "+250793440734", " +250-793-440-734 "])
def test_every_way_of_typing_gives_the_same_number(typed):
    assert to_e164(typed) == "+250793440734"


def test_invalid_numbers_are_refused_with_a_hint():
    with pytest.raises(InvalidPhoneNumber, match="international format"):
        to_e164("0793440734")
    assert tidy("0793 440734 ") == "0793 440734"


def test_createsuperuser_stores_the_standard_form():
    admin = User.objects.create_superuser(
        phone_number="+250 793 440 734", password="a-long-passphrase"
    )
    admin.refresh_from_db()
    assert admin.phone_number == "+250793440734"


@pytest.mark.parametrize("typed", ["+250793440734", "+250 793 440 734"])
def test_the_admin_login_accepts_either_way_of_typing(typed):
    User.objects.create_superuser(phone_number="+250 793 440 734", password="a-long-passphrase")
    assert authenticate(username=typed, password="a-long-passphrase") is not None
    assert Client().login(username=typed, password="a-long-passphrase")


def test_signing_in_with_spaces_finds_the_existing_account(email_channel, otp_channel):
    from rest_framework.test import APIClient

    existing = User.objects.create_user(phone_number="+250 793 440 734")
    client = APIClient()
    client.post("/api/v1/auth/otp/request/", {"phone_number": "+250793440734"}, format="json")
    response = client.post(
        "/api/v1/auth/otp/verify/",
        {"phone_number": "+250793440734", "code": otp_channel.last_code},
        format="json",
    )
    assert response.status_code == 200
    assert response.json()["user"]["id"] == existing.pk
    assert User.objects.count() == 1


def test_the_migration_tidies_old_numbers_and_leaves_clashes_alone():
    tidy_up = importlib.import_module("apps.identity.migrations.0004_phone_numbers_e164").to_e164
    spaced = User.objects.create_user(email="a@example.com")
    clash = User.objects.create_user(email="b@example.com")
    standard = User.objects.create_user(phone_number="+250788123456")
    # Written straight to the database, as before phone.py existed.
    User.objects.filter(pk=spaced.pk).update(phone_number="+250 793 440 734")
    User.objects.filter(pk=clash.pk).update(phone_number="+250 788 123 456")

    tidy_up(django_apps, None)

    assert User.objects.get(pk=spaced.pk).phone_number == "+250793440734"
    assert User.objects.get(pk=clash.pk).phone_number == "+250 788 123 456"
    assert User.objects.get(pk=standard.pk).phone_number == "+250788123456"
