from .base import *  # noqa: F401,F403

# Staging is prod-shaped on purpose — this is where the Platform Blueprint's
# QA/UAT and demos happen against realistic data (Section 19). DEBUG stays
# off; ALLOWED_HOSTS and CORS_ALLOWED_ORIGINS come from the environment,
# same as prod, deliberately not relaxed for convenience.
DEBUG = False
