from rest_framework_simplejwt.authentication import JWTAuthentication

from config.observability import identify


class ReportingJWTAuthentication(JWTAuthentication):
    """simplejwt's authentication, plus the user's id on any error report.

    DRF authenticates inside the view, after middleware has run, so this is
    the first point where the signed-in user is known.
    """

    def authenticate(self, request):
        result = super().authenticate(request)
        if result is not None:
            identify(result[0])
        return result
