from rest_framework_simplejwt.tokens import RefreshToken

from ..serializers import UserSerializer


def signed_in(user, created: bool = False) -> dict:
    """The body every successful sign-in answers with. `created` is true
    when this sign-in also created the account."""
    refresh = RefreshToken.for_user(user)
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": UserSerializer(user).data,
        "created": created,
    }
