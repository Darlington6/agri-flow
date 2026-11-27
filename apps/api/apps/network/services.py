"""Choosing what you do on AgriFlow, and setting up your account.

Setting up an account (onboarding) is a few steps, each saved as soon as
it's done, so people can stop and pick up later on any device:

1. name      - who they are: their full name, date of birth and (optionally)
               gender as on their ID, kept private (apps/compliance), and the
               name other people see (User.display_name)
2. place     - country and language
3. role      - a farmer, buyer, delivery partner or cooperative profile
4. phone     - add a phone number (optional: they can skip it)
5. terms     - agree to the current terms and privacy notice

The steps' state is worked out from the account itself rather than kept
as a separate "current step", so it can't drift from the real data.
"""

from django.conf import settings
from django.db import IntegrityError, transaction
from django.utils import timezone

from apps.compliance.services import has_personal_details
from apps.identity.models import Role

from .models import PROFILE_MODELS
from .serializers import PROFILE_SERIALIZERS

STEPS = ("name", "place", "role", "phone", "terms")
# Everything but the phone step has to be done to finish.
REQUIRED_STEPS = ("name", "place", "role")


class NotAllowed(Exception):
    """That role can't be chosen by the person themselves."""


class AlreadyExists(Exception):
    """They already have a profile for that role."""


class NotReady(Exception):
    """Something has to be done first (the message says what)."""


def profiles(user) -> list:
    """The account's profiles, one per role it chose."""
    return [
        profile
        for model in PROFILE_MODELS.values()
        if (profile := model.objects.filter(user=user).first()) is not None
    ]


def serialize(profile, country: str) -> dict:
    return PROFILE_SERIALIZERS[profile.ROLE](profile, context={"country": country}).data


def create_profile(user, role: str, data: dict):
    """Validates `data` for `role`, then creates the profile and grants
    the role together. Raises NotAllowed, NotReady, AlreadyExists, or
    DRF's ValidationError."""
    if role not in Role.SELF_SERVE_SLUGS:
        raise NotAllowed("That role is given by AgriFlow, not chosen.")
    if not user.country:
        raise NotReady("Choose your country first.")
    model = PROFILE_MODELS[role]
    if model.objects.filter(user=user).exists():
        raise AlreadyExists("You already have that role.")

    serializer = PROFILE_SERIALIZERS[role](data=data, context={"country": user.country})
    serializer.is_valid(raise_exception=True)
    try:
        with transaction.atomic():
            profile = serializer.save(user=user)
            user.roles.add(Role.objects.get(slug=role))
    except IntegrityError as exc:
        # The same request sent twice at once: the other one won.
        raise AlreadyExists("You already have that role.") from exc
    return profile


def update_profile(user, role: str, data: dict):
    model = PROFILE_MODELS.get(role)
    profile = model.objects.filter(user=user).first() if model else None
    if profile is None:
        raise LookupError("You don't have that role.")
    serializer = PROFILE_SERIALIZERS[role](
        profile, data=data, partial=True, context={"country": user.country}
    )
    serializer.is_valid(raise_exception=True)
    return serializer.save()


# ── Onboarding ──────────────────────────────────────────────────────────


def steps(user) -> dict[str, bool]:
    """Which steps are done."""
    has_role = bool(profiles(user)) or user.roles.filter(slug__in=Role.STAFF_SLUGS).exists()
    return {
        "name": bool(user.display_name.strip()) and has_personal_details(user),
        "place": bool(user.country and user.language),
        # Staff accounts (given their roles in /admin) don't choose one.
        "role": has_role,
        # Only offered while first setting up, never again afterwards.
        "phone": bool(user.phone_number or user.phone_prompted_at or user.onboarded_at),
        "terms": user.terms_version == settings.TERMS_VERSION,
    }


def state(user) -> dict:
    done = steps(user)
    return {
        "steps": done,
        "next_step": next((step for step in STEPS if not done[step]), None),
        "complete": not user.needs_onboarding(),
        "terms_version": settings.TERMS_VERSION,
    }


def skip_phone(user) -> None:
    if not user.phone_prompted_at:
        user.phone_prompted_at = timezone.now()
        user.save(update_fields=["phone_prompted_at"])


def complete(user, terms_version: str) -> None:
    """Records their agreement to the terms and finishes setting up the
    account. Also how someone already set up agrees to new terms."""
    if terms_version != settings.TERMS_VERSION:
        raise NotReady("The terms have changed. Read the new version and agree again.")
    done = steps(user)
    missing = [step for step in REQUIRED_STEPS if not done[step]]
    if missing:
        raise NotReady(f"Finish these steps first: {', '.join(missing)}.")
    now = timezone.now()
    user.terms_version = terms_version
    user.terms_accepted_at = now
    fields = ["terms_version", "terms_accepted_at"]
    if not user.onboarded_at:
        user.onboarded_at = now
        fields.append("onboarded_at")
    user.save(update_fields=fields)
