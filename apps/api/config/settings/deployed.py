"""
Settings shared by every deployed environment (staging and prod), never
used on its own. Unlike base.py, nothing here falls back to a default:
a missing secret, database, host or origin stops the server at startup
with ImproperlyConfigured, rather than letting it run on a public key, a
throwaway database, or with every host and origin allowed.

The values are set on the host (Render; see render.yaml in the repo root
and the Deployments section of .github/CONTRIBUTING.md).
"""

import os

from config.observability import init_sentry

from .base import *  # noqa: F401,F403
from .base import MIDDLEWARE, env

DEBUG = False

SECRET_KEY = env("DJANGO_SECRET_KEY")

# Neon gives a postgres:// URL that already asks for SSL. Keeping a
# connection open for a minute saves a new SSL handshake on most requests;
# the health check reopens it if Neon closed it while idle.
DATABASES = {"default": env.db("DATABASE_URL")}
DATABASES["default"]["CONN_MAX_AGE"] = 60
DATABASES["default"]["CONN_HEALTH_CHECKS"] = True

# Render sets RENDER_EXTERNAL_HOSTNAME (e.g. agriflow-api.onrender.com) on
# every service, so its own address is always allowed; any extra domain
# goes in DJANGO_ALLOWED_HOSTS.
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS", default=[])
if env("RENDER_EXTERNAL_HOSTNAME", default=""):
    ALLOWED_HOSTS.append(env("RENDER_EXTERNAL_HOSTNAME"))
if not ALLOWED_HOSTS:
    from django.core.exceptions import ImproperlyConfigured

    raise ImproperlyConfigured("Set DJANGO_ALLOWED_HOSTS (or deploy on Render).")

# Only the app and the marketing site may call the API from a browser.
# CORS_ALLOWED_ORIGIN_REGEXES is optional: staging uses it so Vercel's
# preview addresses, which change with every deployment, can call it too.
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS")
CORS_ALLOWED_ORIGIN_REGEXES = env.list("CORS_ALLOWED_ORIGIN_REGEXES", default=[])

# Magic links must point at the real app, never the localhost default.
FRONTEND_URL = env("FRONTEND_URL")

# Serves /static/ (the admin's CSS and JS, collected into the image by the
# Dockerfile) from the API itself, so no separate file host is needed.
MIDDLEWARE = [
    *MIDDLEWARE[:1],  # SecurityMiddleware first, as WhiteNoise asks
    "whitenoise.middleware.WhiteNoiseMiddleware",
    *MIDDLEWARE[1:],
]

# HTTPS. Render ends HTTPS in front of the app and says so in
# X-Forwarded-Proto. Render's health check is exempt from the redirect.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = True
SECURE_REDIRECT_EXEMPT = [r"^api/v1/health/$"]
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# Magic links go out by email through Brevo. Brevo can send from a single
# verified address (DEFAULT_FROM_EMAIL) without a domain of our own.
EMAIL_BACKEND = "anymail.backends.brevo.EmailBackend"
ANYMAIL = {"BREVO_API_KEY": env("BREVO_API_KEY")}
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL")
EMAIL_DELIVERY_CHANNEL = "apps.identity.channels.DjangoEmailChannel"

# No SMS provider yet: phone sign-in answers "not available yet" (503)
# instead of pretending to send a code, or logging real users' codes.
OTP_DELIVERY_CHANNEL = "apps.identity.channels.UnconfiguredOtpChannel"

# Errors go to Sentry when SENTRY_DSN is set (see config/observability.py for
# what is and isn't sent). Render provides the commit as RENDER_GIT_COMMIT.
init_sentry(
    dsn=env("SENTRY_DSN", default=""),
    settings_module=os.environ.get("DJANGO_SETTINGS_MODULE", ""),
    release=os.environ.get("RENDER_GIT_COMMIT"),
)
