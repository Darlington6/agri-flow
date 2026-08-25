from .base import *  # noqa: F401,F403

DEBUG = False

SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# No real SMS/email provider is configured yet — fail loudly rather than
# silently logging real users' OTP codes/magic links (see
# apps/identity/channels.py). Point these at a real implementation before
# this settings module is ever actually used to serve traffic.
OTP_DELIVERY_CHANNEL = "apps.identity.channels.UnconfiguredOtpChannel"
EMAIL_DELIVERY_CHANNEL = "apps.identity.channels.UnconfiguredEmailChannel"
