import pytest
from rest_framework.test import APIClient

pytestmark = pytest.mark.django_db

PHONE = "+233241234567"


def test_otp_request_then_verify_issues_tokens(otp_channel):
    client = APIClient()

    response = client.post("/api/v1/auth/otp/request/", {"phone_number": PHONE})
    assert response.status_code == 202

    code = otp_channel.last_code
    response = client.post("/api/v1/auth/otp/verify/", {"phone_number": PHONE, "code": code})
    assert response.status_code == 200
    body = response.json()
    assert "access" in body
    assert "refresh" in body
    assert body["user"]["phone_number"] == PHONE


def test_wrong_code_is_rejected(otp_channel):
    client = APIClient()
    client.post("/api/v1/auth/otp/request/", {"phone_number": PHONE})

    response = client.post("/api/v1/auth/otp/verify/", {"phone_number": PHONE, "code": "000000"})
    assert response.status_code == 400


def test_verify_with_no_pending_code_is_rejected():
    client = APIClient()
    response = client.post(
        "/api/v1/auth/otp/verify/", {"phone_number": "+233209999999", "code": "123456"}
    )
    assert response.status_code == 400


def test_second_login_reuses_existing_user(otp_channel):
    client = APIClient()

    client.post("/api/v1/auth/otp/request/", {"phone_number": PHONE})
    first_code = otp_channel.last_code
    first = client.post("/api/v1/auth/otp/verify/", {"phone_number": PHONE, "code": first_code})
    user_id = first.json()["user"]["id"]

    client.post("/api/v1/auth/otp/request/", {"phone_number": PHONE})
    second_code = otp_channel.last_code
    second = client.post("/api/v1/auth/otp/verify/", {"phone_number": PHONE, "code": second_code})
    assert second.json()["user"]["id"] == user_id


def test_invalid_phone_number_is_rejected():
    client = APIClient()
    response = client.post("/api/v1/auth/otp/request/", {"phone_number": "not-a-phone"})
    assert response.status_code == 400


def test_debug_code_present_when_debug_true(settings, otp_channel):
    settings.DEBUG = True
    client = APIClient()
    response = client.post("/api/v1/auth/otp/request/", {"phone_number": PHONE})
    assert response.json()["debug_code"] == otp_channel.last_code


def test_debug_code_absent_when_debug_false(settings, otp_channel):
    settings.DEBUG = False
    client = APIClient()
    response = client.post("/api/v1/auth/otp/request/", {"phone_number": PHONE})
    assert "debug_code" not in response.json()
