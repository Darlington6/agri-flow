import phonenumbers
from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Role


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ["slug", "name"]


class UserSerializer(serializers.ModelSerializer):
    roles = RoleSerializer(many=True, read_only=True)

    class Meta:
        model = get_user_model()
        fields = ["id", "phone_number", "email", "display_name", "roles", "date_joined"]


class OtpRequestSerializer(serializers.Serializer):
    phone_number = serializers.CharField()

    def validate_phone_number(self, value: str) -> str:
        try:
            parsed = phonenumbers.parse(value, None)
        except phonenumbers.NumberParseException as exc:
            raise serializers.ValidationError(
                "Enter a phone number in international format, e.g. +233241234567."
            ) from exc
        if not phonenumbers.is_valid_number(parsed):
            raise serializers.ValidationError("That doesn't look like a valid phone number.")
        return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)


class OtpVerifySerializer(serializers.Serializer):
    phone_number = serializers.CharField()
    code = serializers.CharField(min_length=6, max_length=6)


class MagicLinkRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()
