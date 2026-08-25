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
        verify_base_url = request.build_absolute_uri("/api/v1/auth/magic-link/verify/")
        request_magic_link(serializer.validated_data["email"], verify_base_url)
        # Always 202 — whether or not the email belongs to an account,
        # never leaked via the response (see services.request_magic_link).
        return Response(status=status.HTTP_202_ACCEPTED)


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
