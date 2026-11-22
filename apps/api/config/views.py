from django.http import Http404
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from config.observability import identify


class HealthCheckView(APIView):
    """Proves the container runs and is wired correctly — nothing more.

    Real domain endpoints land under their own bounded-context app
    (Platform Blueprint, Section 1) once that work starts.
    """

    permission_classes = [AllowAny]
    throttle_classes: list = []

    def get(self, request):
        return Response({"status": "ok"})


class SentryTestError(Exception):
    """Raised on purpose, to check error reports reach Sentry."""


def sentry_test_error(request):
    """Fails on purpose so staff can check that errors reach Sentry.

    Sign in at /admin/ first (this is a plain Django view, so the admin's
    session counts). Everyone else gets a 404, as if it didn't exist.
    """
    if not (request.user.is_authenticated and request.user.is_staff):
        raise Http404
    identify(request.user)
    raise SentryTestError("Sentry test from the API, triggered by a staff member")
