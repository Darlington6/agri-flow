"""Adding the second way to sign in: an email to a phone-only account, or
a phone number to an email-only one. Nothing is saved until it's
confirmed by the link or code sent to it.
"""

from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..channels import DeliveryUnavailable
from ..serializers import (
    EmailSerializer,
    OtpRequestSerializer,
    PhoneConfirmSerializer,
    TokenSerializer,
    UserSerializer,
)
from ..services import (
    AlreadyInUse,
    AlreadySet,
    confirm_email_add,
    confirm_phone_add,
    request_email_add,
    request_phone_add,
)
from ..throttles import EmailAddThrottle, PhoneAddThrottle


def _refused(exc: Exception) -> Response:
    code = (
        status.HTTP_409_CONFLICT if isinstance(exc, AlreadyInUse) else status.HTTP_400_BAD_REQUEST
    )
    return Response({"detail": str(exc)}, status=code)


class EmailAddView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [EmailAddThrottle]

    def post(self, request):
        serializer = EmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            link = request_email_add(
                request.user,
                serializer.validated_data["email"],
                f"{settings.FRONTEND_URL}/confirm-email",
            )
        except (AlreadyInUse, AlreadySet) as exc:
            return _refused(exc)
        body = {"debug_link": link} if settings.DEBUG and link else {}
        return Response(body, status=status.HTTP_202_ACCEPTED)


class EmailConfirmView(APIView):
    # No sign-in needed: the link may be opened on another device.
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = TokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            user = confirm_email_add(serializer.validated_data["token"])
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except (AlreadyInUse, AlreadySet) as exc:
            return _refused(exc)
        return Response({"email": user.email})


class PhoneAddView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [PhoneAddThrottle]

    def post(self, request):
        serializer = OtpRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            code = request_phone_add(request.user, serializer.validated_data["phone_number"])
        except (AlreadyInUse, AlreadySet) as exc:
            return _refused(exc)
        except DeliveryUnavailable as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        body = {"debug_code": code} if settings.DEBUG else {}
        return Response(body, status=status.HTTP_202_ACCEPTED)


class PhoneConfirmView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PhoneConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            user = confirm_phone_add(request.user, **serializer.validated_data)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except (AlreadyInUse, AlreadySet) as exc:
            return _refused(exc)
        return Response(UserSerializer(user).data)
