from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from ..serializers import MagicLinkRequestSerializer, UserSerializer
from ..services import request_magic_link, verify_magic_link


class MagicLinkRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = MagicLinkRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # Points at the frontend, not this API — clicking the email link
        # should land the user back in the SPA, which then calls
        # GET /api/v1/auth/magic-link/verify/ itself (see AuthContext).
        verify_base_url = f"{settings.FRONTEND_URL}/magic-link"
        link = request_magic_link(serializer.validated_data["email"], verify_base_url)
        # Always 202 regardless of whether the email belongs to an account
        # (see services.request_magic_link) — debug_link is dev-only and
        # simply absent when link is None, so it never hints at existence.
        body = {"debug_link": link} if settings.DEBUG and link else {}
        return Response(body, status=status.HTTP_202_ACCEPTED)


class MagicLinkVerifyView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        token = request.query_params.get("token", "")
        try:
            user = verify_magic_link(token)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserSerializer(user).data,
            }
        )
