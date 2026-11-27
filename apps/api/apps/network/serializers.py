from decimal import Decimal

from rest_framework import serializers

from . import options
from .models import (
    PROFILE_MODELS,
    BuyerProfile,
    CooperativeProfile,
    DeliveryPartnerProfile,
    FarmerProfile,
    Membership,
    Verification,
)


def _tidy(value: str) -> str:
    return " ".join(value.split())


def _pick(values: list, allowed: set[str], what: str, required: bool) -> list[str]:
    """A de-duplicated list of codes, all from `allowed`, in the order given."""
    picked = list(dict.fromkeys(values))
    if required and not picked:
        raise serializers.ValidationError(f"Choose at least one {what}.")
    unknown = [value for value in picked if value not in allowed]
    if unknown:
        raise serializers.ValidationError(f"Unknown {what}: {', '.join(map(str, unknown))}.")
    return picked


class ProfileSerializer(serializers.ModelSerializer):
    """The shared parts: which role it's for and the read-only status.
    The account's country (needed to check places) comes in the context."""

    role = serializers.SerializerMethodField()

    class Meta:
        fields = ["role", "verification", "created_at", "updated_at"]
        read_only_fields = ["verification", "created_at", "updated_at"]

    def get_role(self, profile) -> str:
        return profile.ROLE

    @property
    def country(self) -> str:
        return self.context["country"]

    def validate_place(self, attrs: dict) -> dict:
        """Region and district must come from the list when the country
        has one; otherwise they're whatever the person typed, tidied."""
        if "region" not in attrs and "district" not in attrs:
            return attrs
        region = _tidy(attrs.get("region", getattr(self.instance, "region", "")))
        district = _tidy(attrs.get("district", getattr(self.instance, "district", "")))
        if not region:
            raise serializers.ValidationError({"region": "Choose your region."})
        places = options.PLACES.get(self.country)
        if places is not None:
            if region not in places:
                raise serializers.ValidationError({"region": "Choose a region from the list."})
            if district not in places[region]:
                raise serializers.ValidationError({"district": "Choose a district in that region."})
        attrs["region"], attrs["district"] = region, district
        return attrs

    def validate(self, attrs):
        return self.validate_place(attrs)


class FarmerProfileSerializer(ProfileSerializer):
    farm_size_hectares = serializers.DecimalField(
        max_digits=8,
        decimal_places=2,
        min_value=Decimal("0.01"),
        max_value=Decimal("100000"),
        required=False,
        allow_null=True,
    )

    # Choosing a cooperative on AgriFlow (its id, from the options' list)
    # asks to join it; null leaves it. `cooperative` says which, and
    # whether the cooperative has confirmed them yet.
    cooperative_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    cooperative = serializers.SerializerMethodField()

    class Meta(ProfileSerializer.Meta):
        model = FarmerProfile
        fields = ProfileSerializer.Meta.fields + [
            "region",
            "district",
            "crops",
            "farm_size_hectares",
            "cooperative_id",
            "cooperative",
            "cooperative_name",
        ]

    def validate_crops(self, value):
        return _pick(value, options.codes(options.CROPS), "crop", required=True)

    def validate_cooperative_name(self, value):
        return _tidy(value)

    def validate_cooperative_id(self, value):
        if value is None:
            return None
        cooperative = (
            CooperativeProfile.objects.filter(pk=value, user__country=self.country)
            .exclude(verification=Verification.REJECTED)
            .first()
        )
        if cooperative is None:
            raise serializers.ValidationError("Choose a cooperative from the list.")
        return cooperative

    def get_cooperative(self, farmer) -> dict | None:
        membership = Membership.objects.filter(farmer=farmer).select_related("cooperative").first()
        if membership is None:
            return None
        cooperative = membership.cooperative
        return {
            "id": cooperative.pk,
            "name": cooperative.name,
            "verified": cooperative.verification == Verification.VERIFIED,
            "membership": membership.status,
        }

    def create(self, validated_data):
        return self._save_membership(super().create, validated_data)

    def update(self, instance, validated_data):
        return self._save_membership(
            lambda data: super(FarmerProfileSerializer, self).update(instance, data), validated_data
        )

    def _save_membership(self, save, validated_data):
        """Choosing a cooperative on AgriFlow replaces a typed name, and
        asks to join (again only when it's a different cooperative)."""
        chosen = validated_data.pop("cooperative_id", ...)
        if chosen is not ... and chosen is not None:
            validated_data["cooperative_name"] = ""
        farmer = save(validated_data)
        if chosen is ...:
            return farmer
        current = Membership.objects.filter(farmer=farmer).first()
        if chosen is None:
            if current:
                current.delete()
        elif current is None or current.cooperative_id != chosen.pk:
            if current:
                current.delete()
            Membership.objects.create(farmer=farmer, cooperative=chosen)
        return farmer


class BuyerProfileSerializer(ProfileSerializer):
    class Meta(ProfileSerializer.Meta):
        model = BuyerProfile
        fields = ProfileSerializer.Meta.fields + [
            "business_name",
            "business_type",
            "region",
            "district",
            "crops",
        ]

    def validate_business_name(self, value):
        value = _tidy(value)
        if not value:
            raise serializers.ValidationError("Enter your business name.")
        return value

    def validate_business_type(self, value):
        if value not in options.codes(options.BUYER_TYPES):
            raise serializers.ValidationError("Choose a business type from the list.")
        return value

    def validate_crops(self, value):
        return _pick(value, options.codes(options.CROPS), "crop", required=False)


class DeliveryPartnerProfileSerializer(ProfileSerializer):
    class Meta(ProfileSerializer.Meta):
        model = DeliveryPartnerProfile
        fields = ProfileSerializer.Meta.fields + [
            "business_name",
            "vehicle_types",
            "service_regions",
        ]
        extra_kwargs = {"vehicle_types": {"required": True}, "service_regions": {"required": True}}

    def validate_business_name(self, value):
        return _tidy(value)

    def validate_vehicle_types(self, value):
        return _pick(value, options.codes(options.VEHICLE_TYPES), "vehicle", required=True)

    def validate_service_regions(self, value):
        if not isinstance(value, list) or not all(isinstance(v, str) for v in value):
            raise serializers.ValidationError("Choose the regions you deliver in.")
        regions = [_tidy(v) for v in value if v.strip()]
        places = options.PLACES.get(self.country)
        allowed = set(places) if places is not None else set(regions)
        return _pick(regions, allowed, "region", required=True)

    def validate(self, attrs):
        return attrs  # no single home region: service_regions covers it


class CooperativeProfileSerializer(ProfileSerializer):
    member_count = serializers.IntegerField(
        min_value=1, max_value=1_000_000, required=False, allow_null=True
    )

    class Meta(ProfileSerializer.Meta):
        model = CooperativeProfile
        fields = ProfileSerializer.Meta.fields + [
            "name",
            "registration_number",
            "region",
            "district",
            "member_count",
            "crops",
        ]

    def validate_name(self, value):
        value = _tidy(value)
        if not value:
            raise serializers.ValidationError("Enter the cooperative's name.")
        return value

    def validate_registration_number(self, value):
        return _tidy(value)

    def validate_crops(self, value):
        return _pick(value, options.codes(options.CROPS), "crop", required=True)


PROFILE_SERIALIZERS: dict[str, type[ProfileSerializer]] = {
    serializer.Meta.model.ROLE: serializer
    for serializer in (
        FarmerProfileSerializer,
        BuyerProfileSerializer,
        DeliveryPartnerProfileSerializer,
        CooperativeProfileSerializer,
    )
}
assert PROFILE_SERIALIZERS.keys() == PROFILE_MODELS.keys()


class NewProfileSerializer(serializers.Serializer):
    """Which role a new profile is for; the rest is that role's fields."""

    role = serializers.ChoiceField(choices=sorted(PROFILE_MODELS))


class CompleteOnboardingSerializer(serializers.Serializer):
    # The version of the terms the app showed them, so nobody agrees to
    # terms they didn't see (e.g. the version changed while they read).
    terms_version = serializers.CharField(max_length=40)
    accept_terms = serializers.BooleanField()

    def validate_accept_terms(self, value):
        if not value:
            raise serializers.ValidationError("Agree to the terms to continue.")
        return value
