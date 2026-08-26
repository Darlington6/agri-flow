from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from ..serializers import OtpRequestSerializer, OtpVerifySerializer, UserSerializer
from ..services import request_otp, verify_otp


class OtpRequestThrottle(AnonRateThrottle):
    # A real abuse target even in dev — deliberately stricter than the
    # default anon rate (see REST_FRAMEWORK.DEFAULT_THROTTLE_RATES).
    scope = "otp_request"


class OtpRequestView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [OtpRequestThrottle]

    def post(self, request):
        serializer = OtpRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        code = request_otp(serializer.validated_data["phone_number"])
        # Dev-only convenience so the browser flow is testable without
        # tailing logs — never present outside DEBUG (see dev.py vs.
        # staging.py/prod.py).
        body = {"debug_code": code} if settings.DEBUG else {}
        return Response(body, status=status.HTTP_202_ACCEPTED)


class OtpVerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OtpVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            user = verify_otp(**serializer.validated_data)
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
