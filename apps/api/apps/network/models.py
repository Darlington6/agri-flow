"""The people and businesses on the platform (Platform Blueprint: the
Network context): farmers, buyers, delivery partners and cooperatives.

An account gets one of these profiles, and the matching role, when its
owner chooses what they do on AgriFlow (see services.py). One account can
hold several, e.g. a farmer who also buys. Choosing a role isn't the same
as being verified: every profile starts unverified, and verification
(KYC) is a separate step done by AgriFlow staff.
"""

from django.conf import settings
from django.db import models

from apps.identity.models import Role


class Verification(models.TextChoices):
    UNVERIFIED = "unverified", "Unverified"
    PENDING = "pending", "Pending"
    VERIFIED = "verified", "Verified"
    REJECTED = "rejected", "Rejected"


class Profile(models.Model):
    ROLE: str  # the Role slug this profile goes with

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="%(class)s"
    )
    verification = models.CharField(
        max_length=20, choices=Verification.choices, default=Verification.UNVERIFIED
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ["created_at"]

    def __str__(self) -> str:
        return f"{self._meta.verbose_name}: {self.user}"


class Located(models.Model):
    """Where someone is. The country is the account's own (User.country);
    region is a province, state or region, district the area within it."""

    region = models.CharField(max_length=100)
    district = models.CharField(max_length=100, blank=True)

    class Meta:
        abstract = True


class FarmerProfile(Profile, Located):
    ROLE = Role.FARMER

    crops = models.JSONField(default=list, help_text="Crop codes from options.CROPS")
    farm_size_hectares = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    # Free text until cooperatives can invite their members.
    cooperative_name = models.CharField(max_length=150, blank=True)

    class Meta(Profile.Meta):
        verbose_name = "farmer"


class BuyerProfile(Profile, Located):
    ROLE = Role.BUYER

    business_name = models.CharField(max_length=150)
    business_type = models.CharField(max_length=30, help_text="From options.BUYER_TYPES")
    crops = models.JSONField(default=list, blank=True, help_text="Crops they buy")

    class Meta(Profile.Meta):
        verbose_name = "buyer"


class DeliveryPartnerProfile(Profile):
    ROLE = Role.DELIVERY_PARTNER

    # Blank for someone working on their own.
    business_name = models.CharField(max_length=150, blank=True)
    vehicle_types = models.JSONField(default=list, help_text="From options.VEHICLE_TYPES")
    service_regions = models.JSONField(default=list, help_text="Regions they deliver in")

    class Meta(Profile.Meta):
        verbose_name = "delivery partner"


class CooperativeProfile(Profile, Located):
    """Set up by the person who manages the cooperative. Members join it
    in a later release; until then farmers name their cooperative."""

    ROLE = Role.COOPERATIVE

    name = models.CharField(max_length=150)
    registration_number = models.CharField(max_length=50, blank=True)
    member_count = models.PositiveIntegerField(null=True, blank=True)
    crops = models.JSONField(default=list, help_text="Crop codes from options.CROPS")

    class Meta(Profile.Meta):
        verbose_name = "cooperative"


PROFILE_MODELS: dict[str, type[Profile]] = {
    model.ROLE: model
    for model in (FarmerProfile, BuyerProfile, DeliveryPartnerProfile, CooperativeProfile)
}
