from rest_framework import serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .. import google
from ..services import AlreadyInUse, GoogleEmailNotVerified, sign_in_with_google
from ..throttles import GoogleSignInThrottle
from .tokens import signed_in


class GoogleCredentialSerializer(serializers.Serializer):
    # The ID token Google hands the app.
    credential = serializers.CharField(max_length=4096)
    # The random value the web apps put in their request to Google; the
    # token must carry it. Optional: Google's own buttons don't use one.
    nonce = serializers.CharField(max_length=256, required=False)


class GoogleSignInView(APIView):
    """Continue with Google: signs in, links an existing account with the
    same (Google-confirmed) email, or creates one. Answers like the other
    sign-ins, with `created` true for a new account."""

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [GoogleSignInThrottle]

    def post(self, request):
        serializer = GoogleCredentialSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            identity = google.verify(
                serializer.validated_data["credential"], serializer.validated_data.get("nonce")
            )
            user, created = sign_in_with_google(identity)
        except (google.InvalidGoogleToken, GoogleEmailNotVerified) as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except AlreadyInUse as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_409_CONFLICT)
        if not user.is_active:
            return Response(
                {"detail": "This account is turned off. Contact AgriFlow."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return Response(signed_in(user, created), status=status.HTTP_200_OK)
