"""Checking a "Continue with Google" sign-in.

The app gets an ID token from Google (a JWT Google signs) and sends it
here. We check it ourselves against Google's published keys (PyJWT,
already used for our own tokens, so no Google library is needed): signed
by Google, issued by Google, meant for one of our client IDs
(settings.GOOGLE_CLIENT_IDS), and not expired.
"""

import logging
from dataclasses import dataclass

import jwt
from django.conf import settings

logger = logging.getLogger(__name__)

GOOGLE_KEYS_URL = "https://www.googleapis.com/oauth2/v3/certs"
GOOGLE_ISSUERS = ("accounts.google.com", "https://accounts.google.com")

# Keys are fetched once and cached; Google rotates them every few days and
# the client fetches again when a token names a key it hasn't seen.
_keys = jwt.PyJWKClient(GOOGLE_KEYS_URL, cache_keys=True, lifespan=6 * 3600, timeout=10)


class InvalidGoogleToken(ValueError):
    pass


@dataclass(frozen=True)
class GoogleIdentity:
    sub: str
    email: str
    email_verified: bool
    name: str


def verify(token: str) -> GoogleIdentity:
    """The person the token is about, or InvalidGoogleToken."""
    if not settings.GOOGLE_CLIENT_IDS:
        raise InvalidGoogleToken("Google sign-in isn't available.")
    try:
        key = _keys.get_signing_key_from_jwt(token)
        claims = jwt.decode(
            token,
            key.key,
            algorithms=["RS256"],
            audience=settings.GOOGLE_CLIENT_IDS,
            options={"require": ["iss", "aud", "exp", "sub"]},
            leeway=30,
        )
    except (jwt.PyJWTError, jwt.PyJWKClientError) as exc:
        # Why, for whoever reads the logs (never the token itself): an
        # expired token, the wrong client ID, or Google's keys unreachable
        # all look the same to the person signing in.
        logger.warning("Google sign-in token refused: %s: %s", type(exc).__name__, exc)
        raise InvalidGoogleToken("Google sign-in didn't work. Try again.") from exc
    if claims["iss"] not in GOOGLE_ISSUERS:
        logger.warning("Google sign-in token refused: unexpected issuer %s", claims["iss"])
        raise InvalidGoogleToken("Google sign-in didn't work. Try again.")
    return GoogleIdentity(
        sub=str(claims["sub"]),
        email=str(claims.get("email", "")).strip().lower(),
        email_verified=claims.get("email_verified") is True,
        name=" ".join(str(claims.get("name", "")).split())[:150],
    )
