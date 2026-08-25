from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthCheckView(APIView):
    """Proves the container runs and is wired correctly — nothing more.

    Real domain endpoints land under their own bounded-context app
    (Platform Blueprint, Section 1) once that work starts.
    """

    permission_classes = [AllowAny]
    throttle_classes: list = []

    def get(self, request):
        return Response({"status": "ok"})
