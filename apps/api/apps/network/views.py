from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.identity.serializers import UserSerializer

from . import members, options, services
from .serializers import (
    CompleteOnboardingSerializer,
    MembershipDecisionSerializer,
    NewProfileSerializer,
)


class OptionsView(APIView):
    """The pick lists for setting up an account. Places depend on the
    country (?country=RW); `regions` is null where people type theirs."""

    def get(self, request):
        country = request.query_params.get("country", request.user.country).upper()
        return Response(
            {
                "country": country,
                "regions": options.places_for(country),
                "crops": options.as_options(options.CROPS),
                "buyer_types": options.as_options(options.BUYER_TYPES),
                "vehicle_types": options.as_options(options.VEHICLE_TYPES),
                "cooperatives": options.cooperatives_for(country),
            }
        )


class ProfileListView(APIView):
    """GET lists the account's profiles; POST chooses a new role, with
    that role's details (see serializers.py)."""

    def get(self, request):
        return Response(
            [services.serialize(p, request.user.country) for p in services.profiles(request.user)]
        )

    def post(self, request):
        chosen = NewProfileSerializer(data=request.data)
        chosen.is_valid(raise_exception=True)
        role = chosen.validated_data["role"]
        try:
            profile = services.create_profile(request.user, role, request.data)
        except services.NotAllowed as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_403_FORBIDDEN)
        except services.NotReady as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except services.AlreadyExists as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_409_CONFLICT)
        return Response(
            services.serialize(profile, request.user.country), status=status.HTTP_201_CREATED
        )


class ProfileDetailView(APIView):
    def patch(self, request, role: str):
        try:
            profile = services.update_profile(request.user, role, request.data)
        except LookupError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        return Response(services.serialize(profile, request.user.country))


class OnboardingView(APIView):
    """Where the account is in setting up: which steps are done, the
    next one, and the terms version to show."""

    def get(self, request):
        return Response(services.state(request.user))


class SkipPhoneView(APIView):
    def post(self, request):
        services.skip_phone(request.user)
        return Response(services.state(request.user))


class CompleteOnboardingView(APIView):
    """Agrees to the terms and finishes. Answers with the updated user."""

    def post(self, request):
        serializer = CompleteOnboardingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            services.complete(request.user, serializer.validated_data["terms_version"])
        except services.NotReady as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_409_CONFLICT)
        return Response(UserSerializer(request.user).data)


class CooperativeMembersView(APIView):
    """The farmers who chose the signed-in manager's cooperative: waiting
    first, then members, then declined; with the counts."""

    def get(self, request):
        try:
            cooperative = members.cooperative_of(request.user)
        except members.NotAManager as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_403_FORBIDDEN)
        return Response(
            {
                "cooperative": {"name": cooperative.name, **members.counts(cooperative)},
                "members": [members.serialize(m) for m in members.memberships(cooperative)],
            }
        )


class MembershipDecisionView(APIView):
    """POST {"status": "confirmed" | "declined"}: confirms a farmer as a
    member, or declines them (removing a member declines them too)."""

    def post(self, request, membership_id: int):
        decision = MembershipDecisionSerializer(data=request.data)
        decision.is_valid(raise_exception=True)
        try:
            membership = members.decide(
                request.user, membership_id, decision.validated_data["status"]
            )
        except members.NotAManager as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_403_FORBIDDEN)
        except LookupError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        return Response(members.serialize(membership))
