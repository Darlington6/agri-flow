"""Strict per-caller limits for anything that sends a text or an email
(rates in REST_FRAMEWORK.DEFAULT_THROTTLE_RATES). Signed-out requests are
limited per IP address, signed-in ones per account.
"""

from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class OtpRequestThrottle(AnonRateThrottle):
    # Texts cost money once a real SMS provider is behind them.
    scope = "otp_request"


class PhoneAddThrottle(UserRateThrottle):
    scope = "otp_request"


class EmailLinkThrottle(AnonRateThrottle):
    scope = "email_link"


class EmailAddThrottle(UserRateThrottle):
    scope = "email_link"


class GoogleSignInThrottle(AnonRateThrottle):
    scope = "google"
