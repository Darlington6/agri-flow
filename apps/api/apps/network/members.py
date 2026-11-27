"""A cooperative's members: farmers who chose it on AgriFlow, confirmed or
declined by the person who manages the cooperative.

A farmer who chooses a cooperative is a pending member (see Membership).
The manager sees them here and confirms or declines; a confirmed member
can be removed later, which declines them. Only confirmed members count.
Field agents will confirm members too, with their own tools.
"""

from django.db.models import Case, IntegerField, Value, When
from django.utils import timezone

from . import options
from .models import CooperativeProfile, Membership, Verification


class NotAManager(Exception):
    """The account doesn't manage a cooperative."""


def cooperative_of(user) -> CooperativeProfile:
    cooperative = CooperativeProfile.objects.filter(user=user).first()
    if cooperative is None:
        raise NotAManager("Only a cooperative's manager can see its members.")
    return cooperative


def counts(cooperative: CooperativeProfile) -> dict:
    by_status = {status: 0 for status in Membership.Status.values}
    for membership in cooperative.memberships.values_list("status", flat=True):
        by_status[membership] += 1
    return {"confirmed": by_status["confirmed"], "pending": by_status["pending"]}


def memberships(cooperative: CooperativeProfile):
    """Farmers waiting first (oldest first), then members, then declined."""
    order = Case(
        When(status=Membership.Status.PENDING, then=Value(0)),
        When(status=Membership.Status.CONFIRMED, then=Value(1)),
        default=Value(2),
        output_field=IntegerField(),
    )
    return (
        cooperative.memberships.select_related("farmer__user")
        .annotate(order=order)
        .order_by("order", "requested_at")
    )


def serialize(membership: Membership) -> dict:
    farmer = membership.farmer
    crops = dict(options.CROPS)
    return {
        "id": membership.pk,
        "status": membership.status,
        "requested_at": membership.requested_at,
        "decided_at": membership.decided_at,
        "farmer": {
            "name": farmer.user.display_name,
            # So the cooperative can reach its members (the privacy notice says so).
            "phone_number": farmer.user.phone_number,
            "region": farmer.region,
            "district": farmer.district,
            "crops": [crops.get(code, code) for code in farmer.crops],
            "farm_size_hectares": farmer.farm_size_hectares,
            "verified": farmer.verification == Verification.VERIFIED,
        },
    }


def decide(user, membership_id: int, status: str) -> Membership:
    """Confirms or declines a farmer, as the cooperative's manager. Raises
    NotAManager, or LookupError for a membership of another cooperative."""
    cooperative = cooperative_of(user)
    membership = cooperative.memberships.filter(pk=membership_id).first()
    if membership is None:
        raise LookupError("That farmer hasn't asked to join your cooperative.")
    membership.status = status
    membership.decided_at = timezone.now()
    membership.decided_by = user
    membership.save(update_fields=["status", "decided_at", "decided_by"])
    return membership
