from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from ..serializers import EmailSerializer
from ..services import request_magic_link, verify_magic_link
from ..throttles import EmailLinkThrottle
from .tokens import signed_in


class MagicLinkRequestView(APIView):
    """Sign in or sign up by email: the link signs in to the account with
    this email, or creates one when it's used."""

    permission_classes = [AllowAny]
    throttle_classes = [EmailLinkThrottle]

    def post(self, request):
        serializer = EmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # Points at the frontend, not this API — clicking the email link
        # should land the user back in the SPA, which then calls
        # GET /api/v1/auth/magic-link/verify/ itself (see AuthContext).
        verify_base_url = f"{settings.FRONTEND_URL}/magic-link"
        link = request_magic_link(serializer.validated_data["email"], verify_base_url)
        # Always 202, whether the email has an account or not (see
        # services.request_magic_link). debug_link is dev-only.
        body = {"debug_link": link} if settings.DEBUG and link else {}
        return Response(body, status=status.HTTP_202_ACCEPTED)


class MagicLinkVerifyView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        token = request.query_params.get("token", "")
        try:
            user, created = verify_magic_link(token)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(signed_in(user, created))
