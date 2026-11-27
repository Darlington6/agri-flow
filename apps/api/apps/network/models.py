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
    # A cooperative not on AgriFlow yet, typed. One on AgriFlow is a
    # Membership instead (below), and this stays empty.
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
    """Set up by the person who manages the cooperative. It's listed for
    farmers to choose straight away, marked unverified until staff check
    its registration; farmers who choose it are members once it confirms
    them (Membership)."""

    ROLE = Role.COOPERATIVE

    name = models.CharField(max_length=150)
    registration_number = models.CharField(max_length=50, blank=True)
    member_count = models.PositiveIntegerField(null=True, blank=True)
    crops = models.JSONField(default=list, help_text="Crop codes from options.CROPS")

    class Meta(Profile.Meta):
        verbose_name = "cooperative"


class Membership(models.Model):
    """A farmer belonging to a cooperative on AgriFlow. Choosing one asks
    to join: the farmer is a pending member until the cooperative's
    manager (or a field agent) confirms them, and only confirmed members
    count in the cooperative's totals. A farmer belongs to one cooperative
    at a time."""

    class Status(models.TextChoices):
        PENDING = "pending", "Waiting for the cooperative"
        CONFIRMED = "confirmed", "Confirmed"
        DECLINED = "declined", "Declined"

    farmer = models.OneToOneField(
        FarmerProfile, on_delete=models.CASCADE, related_name="membership"
    )
    cooperative = models.ForeignKey(
        CooperativeProfile, on_delete=models.CASCADE, related_name="memberships"
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    requested_at = models.DateTimeField(auto_now_add=True)
    # Who confirmed or declined it, and when.
    decided_at = models.DateTimeField(null=True, blank=True)
    decided_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )

    class Meta:
        ordering = ["requested_at"]

    def __str__(self) -> str:
        return f"{self.farmer.user} in {self.cooperative.name} ({self.get_status_display()})"


PROFILE_MODELS: dict[str, type[Profile]] = {
    model.ROLE: model
    for model in (FarmerProfile, BuyerProfile, DeliveryPartnerProfile, CooperativeProfile)
}
