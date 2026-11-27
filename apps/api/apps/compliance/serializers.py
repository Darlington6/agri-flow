from datetime import date

from rest_framework import serializers

from apps.identity.phone import InvalidPhoneNumber, to_e164

from .models import ADULT_AGE, PersonalDetails, age_on

OLDEST = date(1900, 1, 1)
GUARDIAN_FIELDS = ["guardian_name", "guardian_relationship", "guardian_phone"]


class PersonalDetailsSerializer(serializers.ModelSerializer):
    legal_name = serializers.CharField(max_length=200)
    guardian_name = serializers.CharField(max_length=200, required=False, allow_blank=True)
    guardian_phone = serializers.CharField(max_length=32, required=False, allow_blank=True)
    is_minor = serializers.BooleanField(read_only=True)

    class Meta:
        model = PersonalDetails
        fields = ["legal_name", "date_of_birth", "gender", "is_minor", *GUARDIAN_FIELDS]

    def validate_legal_name(self, value: str) -> str:
        tidy = " ".join(value.split())
        if not tidy:
            raise serializers.ValidationError("Enter your full name as it appears on your ID.")
        return tidy

    def validate_date_of_birth(self, value: date) -> date:
        if value > date.today():
            raise serializers.ValidationError("Your date of birth can’t be in the future.")
        if value < OLDEST:
            raise serializers.ValidationError("Check the year of your date of birth.")
        return value

    def validate_guardian_name(self, value: str) -> str:
        return " ".join(value.split())

    def validate_guardian_phone(self, value: str) -> str:
        if not value.strip():
            return ""
        try:
            return to_e164(value)
        except InvalidPhoneNumber as exc:
            raise serializers.ValidationError(str(exc)) from exc

    def validate(self, attrs):
        """Under 18: a parent or guardian is required. Adults: none is kept."""
        if age_on(attrs["date_of_birth"], date.today()) < ADULT_AGE:
            missing = {
                field: "Needed for anyone under 18."
                for field in GUARDIAN_FIELDS
                if not attrs.get(field)
            }
            if missing:
                raise serializers.ValidationError(missing)
        else:
            for field in GUARDIAN_FIELDS:
                attrs[field] = ""
        return attrs
