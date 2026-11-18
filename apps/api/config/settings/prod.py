from .deployed import *  # noqa: F401,F403

# Browsers remember to use HTTPS only, for a year. Prod only: it's hard to
# take back, so staging doesn't send it.
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
