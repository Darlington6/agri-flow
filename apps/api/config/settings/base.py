"""
Shared settings for every environment. Nothing environment-specific lives
here — dev.py / staging.py / prod.py each import * from this module and
override only what genuinely differs (Platform Blueprint, Section 19).

Every value that varies by environment or is secret comes from the
environment (django-environ), never hardcoded — see ../../.env.example
for the variables this file expects.
"""

import os
from datetime import timedelta
from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parent.parent.parent

env = environ.Env()
# A local .env is for running on your own machine only: it's never read
# when the settings module is staging or prod, so a stray file can't
# quietly supply a deployed server's secrets or database.
if os.environ.get("DJANGO_SETTINGS_MODULE", "config.settings.dev").endswith(".dev"):
    environ.Env.read_env(BASE_DIR / ".env")

SECRET_KEY = env(
    "DJANGO_SECRET_KEY",
    default="django-insecure-agriflow-fallback-secret-key-2026",
)
DEBUG = env.bool("DJANGO_DEBUG", default=False)
ALLOWED_HOSTS = env.list(
    "DJANGO_ALLOWED_HOSTS",
    default=[".vercel.app", "localhost", "127.0.0.1", "*"],
)

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party
    "rest_framework",
    "rest_framework_simplejwt.token_blacklist",
    "drf_spectacular",
    "corsheaders",
    # AgriFlow bounded-context apps land here one at a time
    # (Identity & Access, Network, Demand & Matching, Contracts, ...)
    # — Platform Blueprint, Section 1.
    "apps.identity",
    "apps.network",
]

AUTH_USER_MODEL = "identity.User"

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

# Database — DATABASE_URL, e.g. postgres://user:pass@host:5432/dbname
DATABASES = {
    "default": env.db("DATABASE_URL", default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}"),
}

# Cache / Celery broker
REDIS_URL = env("REDIS_URL", default="redis://redis:6379/0")
CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = REDIS_URL

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# Internationalization — Platform Blueprint, Section 22. English is the
# only shipped language today; USE_I18N stays on from day one regardless,
# so strings are externalized as the app grows rather than retrofitted.
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {"class": "logging.StreamHandler"},
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
}

# Where apps/web lives — used to build links that need to land the user
# back in the SPA (the magic-link email), not the API itself.
FRONTEND_URL = env("FRONTEND_URL", default="http://localhost:5173")

# The version of the terms of use and privacy notice people agree to when
# they set up their account. Change it when either changes materially:
# everyone is asked to agree again the next time they open the app.
TERMS_VERSION = env("TERMS_VERSION", default="2026-11-draft")

# CORS: explicit allow-list from the environment or allow all for prototype
CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=[])
CORS_ALLOW_ALL_ORIGINS = env.bool("CORS_ALLOW_ALL_ORIGINS", default=True)

# Sign-in limits: texts or emails one caller can ask for an hour, and emails
# one address can get an hour. Strict by default (tests, staging,
# production); local Docker raises them (docker-compose.yml) so trying
# sign-in over and over doesn't lock a developer out for an hour.
SIGN_IN_THROTTLE_RATE = env("SIGN_IN_THROTTLE_RATE", default="5/hour")
EMAILS_PER_ADDRESS_PER_HOUR = env.int("EMAILS_PER_ADDRESS_PER_HOUR", default=5)

REST_FRAMEWORK = {
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "apps.identity.authentication.ReportingJWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.UserRateThrottle",
        "rest_framework.throttling.AnonRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        # Starting rates — revisit once real usage patterns exist.
        # Distinct from the circuit-breaker/load-shedding "throttling"
        # in Platform Blueprint Section 17; this is the per-client cap.
        "user": "1000/hour",
        "anon": "100/hour",
        # OTP request is a real abuse target (SMS costs money once a real
        # provider is behind it) — deliberately much stricter.
        "otp_request": SIGN_IN_THROTTLE_RATE,
        # Email links: anyone can type any address, so the same strict cap
        # per caller (services.py also caps emails per address).
        "email_link": SIGN_IN_THROTTLE_RATE,
        # Google sign-in sends nothing, but each try checks a token.
        "google": "30/hour",
    },
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=30),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
}

# OTP/magic-link delivery — no real SMS/email provider is set up yet, so
# every environment defaults to logging instead of sending (see
# apps/identity/channels.py). prod.py overrides this to a hard failure
# rather than silently logging real users' codes.
OTP_DELIVERY_CHANNEL = env(
    "OTP_DELIVERY_CHANNEL",
    default="apps.identity.channels.ConsoleOtpChannel",
)
# "Continue with Google": the OAuth client IDs whose sign-in tokens this
# API accepts (the web app's now; the mobile apps' later). Client IDs are
# public, not secrets. Empty turns Google sign-in off.
GOOGLE_CLIENT_IDS = env.list(
    "GOOGLE_CLIENT_IDS",
    default=["725235480256-at4gqeelol3iqgdat4ae1h3vvf3mhs5j.apps.googleusercontent.com"],
)

EMAIL_DELIVERY_CHANNEL = env(
    "EMAIL_DELIVERY_CHANNEL",
    default="apps.identity.channels.ConsoleEmailChannel",
)

# The public website. Emails link to it and load the logo from it
# (apps/site/public/email/). Change it when the real domain is live.
PUBLIC_SITE_URL = env("PUBLIC_SITE_URL", default="https://agri-flow-site.vercel.app")

# Outgoing email. With docker compose it goes to Mailpit (EMAIL_HOST, see
# docker-compose.yml); otherwise it's printed to the console. Staging and
# prod send through Brevo via django-anymail (see deployed.py), so switching
# provider later is a settings change, not a code change.
EMAIL_HOST = env("EMAIL_HOST", default="")
EMAIL_PORT = env.int("EMAIL_PORT", default=25)
EMAIL_BACKEND = (
    "django.core.mail.backends.smtp.EmailBackend"
    if EMAIL_HOST
    else "django.core.mail.backends.console.EmailBackend"
)
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="AgriFlow <no-reply@localhost>")

SPECTACULAR_SETTINGS = {
    "TITLE": "AgriFlow API",
    "DESCRIPTION": "Climate-smart demand-to-farm platform — API schema, "
    "the source of truth for the generated frontend client "
    "(Platform Blueprint, Section 5).",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
}
