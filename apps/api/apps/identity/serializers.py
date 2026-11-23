import phonenumbers
from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Role
from .phone import InvalidPhoneNumber, to_e164


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ["slug", "name"]


class UserSerializer(serializers.ModelSerializer):
    roles = RoleSerializer(many=True, read_only=True)
    # The app sends anyone who still needs it to the account setup.
    needs_onboarding = serializers.BooleanField(read_only=True)

    class Meta:
        model = get_user_model()
        fields = [
            "id",
            "phone_number",
            "email",
            "display_name",
            "country",
            "language",
            "roles",
            "needs_onboarding",
            "onboarded_at",
            "date_joined",
        ]


class UserUpdateSerializer(serializers.ModelSerializer):
    """Self-service profile edits — deliberately narrow. display_name is
    cosmetic and always editable; country and language are preferences;
    phone_number/email are identity, not edited here; a legal name for KYC
    purposes belongs to the Compliance context once it exists, not
    Identity.
    """

    class Meta:
        model = get_user_model()
        fields = ["display_name", "country", "language"]

    def validate_display_name(self, value: str) -> str:
        return " ".join(value.split())

    def validate_country(self, value: str) -> str:
        code = value.strip().upper()
        # Every country that has phone numbers, which is every country.
        if code and code not in phonenumbers.SUPPORTED_REGIONS:
            raise serializers.ValidationError("Choose a country from the list.")
        return code


def normalize_phone_number(value: str) -> str:
    """Accepts international format and returns E.164 (+250788123456)."""
    try:
        return to_e164(value)
    except InvalidPhoneNumber as exc:
        raise serializers.ValidationError(str(exc)) from exc


class OtpRequestSerializer(serializers.Serializer):
    phone_number = serializers.CharField()

    def validate_phone_number(self, value: str) -> str:
        return normalize_phone_number(value)


class OtpVerifySerializer(serializers.Serializer):
    phone_number = serializers.CharField()
    code = serializers.CharField(min_length=6, max_length=6)


class PhoneConfirmSerializer(OtpVerifySerializer):
    def validate_phone_number(self, value: str) -> str:
        return normalize_phone_number(value)


class EmailSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value: str) -> str:
        return value.strip().lower()


class TokenSerializer(serializers.Serializer):
    token = serializers.CharField()
