"""
Shared settings for every environment. Nothing environment-specific lives
here — dev.py / staging.py / prod.py each import * from this module and
override only what genuinely differs (Platform Blueprint, Section 19).

Every value that varies by environment or is secret comes from the
environment (django-environ), never hardcoded — see ../../.env.example
for the variables this file expects.
"""

from datetime import timedelta
from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parent.parent.parent

env = environ.Env()
environ.Env.read_env(BASE_DIR / ".env")

SECRET_KEY = env("DJANGO_SECRET_KEY")
DEBUG = env.bool("DJANGO_DEBUG", default=False)
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS", default=[])

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
    "default": env.db("DATABASE_URL"),
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

# CORS: explicit allow-list from the environment, never "allow all" outside
# of DEBUG — apps/web (and later apps/site, apps/mobile) are the intended
# callers.
CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=[])

REST_FRAMEWORK = {
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
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
        "otp_request": "5/hour",
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
OTP_DELIVERY_CHANNEL = "apps.identity.channels.ConsoleOtpChannel"
EMAIL_DELIVERY_CHANNEL = "apps.identity.channels.ConsoleEmailChannel"

SPECTACULAR_SETTINGS = {
    "TITLE": "AgriFlow API",
    "DESCRIPTION": "Climate-smart demand-to-farm platform — API schema, "
    "the source of truth for the generated frontend client "
    "(Platform Blueprint, Section 5).",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
}
