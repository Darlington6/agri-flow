from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from ..channels import DeliveryUnavailable
from ..serializers import OtpRequestSerializer, OtpVerifySerializer
from ..services import request_otp, verify_otp
from ..throttles import OtpRequestThrottle
from .tokens import signed_in


class OtpRequestView(APIView):
    """Sign in or sign up by phone: the first correct code creates the
    account."""

    permission_classes = [AllowAny]
    throttle_classes = [OtpRequestThrottle]

    def post(self, request):
        serializer = OtpRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            code = request_otp(serializer.validated_data["phone_number"])
        except DeliveryUnavailable as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
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
            user, created = verify_otp(**serializer.validated_data)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(signed_in(user, created))
