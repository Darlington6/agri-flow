"""The deployed settings (staging, prod) refuse to start without their
secrets and addresses, and come up strict when they have them.

Each case loads Django in a fresh process with only the given environment,
since settings are read once per process.
"""

import json
import os
import subprocess
import sys
from pathlib import Path

import pytest

API_DIR = Path(__file__).resolve().parent.parent

# What Render provides: the values in render.yaml plus RENDER_EXTERNAL_HOSTNAME.
RENDER_ENV = {
    "DJANGO_SECRET_KEY": "test-only-not-a-real-secret",
    "DATABASE_URL": "postgres://user:pass@db.example.com:5432/agriflow?sslmode=require",
    "RENDER_EXTERNAL_HOSTNAME": "agriflow-api.onrender.com",
    "FRONTEND_URL": "https://agri-flow-eight.vercel.app",
    "CORS_ALLOWED_ORIGINS": "https://agri-flow-eight.vercel.app,https://agri-flow-site.vercel.app",
    "BREVO_API_KEY": "test-only-not-a-real-key",
    "DEFAULT_FROM_EMAIL": "AgriFlow <sender@example.com>",
}

REPORT = """
import json, django
from django.conf import settings
django.setup()
print(json.dumps({
    "DEBUG": settings.DEBUG,
    "ALLOWED_HOSTS": settings.ALLOWED_HOSTS,
    "CORS_ALLOW_ALL_ORIGINS": settings.CORS_ALLOW_ALL_ORIGINS,
    "CORS_ALLOWED_ORIGINS": settings.CORS_ALLOWED_ORIGINS,
    "SECURE_SSL_REDIRECT": settings.SECURE_SSL_REDIRECT,
    "SECURE_HSTS_SECONDS": getattr(settings, "SECURE_HSTS_SECONDS", 0),
    "EMAIL_BACKEND": settings.EMAIL_BACKEND,
    "EMAIL_DELIVERY_CHANNEL": settings.EMAIL_DELIVERY_CHANNEL,
    "OTP_DELIVERY_CHANNEL": settings.OTP_DELIVERY_CHANNEL,
    "DB_ENGINE": settings.DATABASES["default"]["ENGINE"],
    "MIDDLEWARE": settings.MIDDLEWARE[:2],
}))
"""


def load(module: str, env: dict[str, str]) -> subprocess.CompletedProcess:
    return subprocess.run(
        [sys.executable, "-c", REPORT],
        cwd=API_DIR,
        env={"PATH": os.environ["PATH"], "DJANGO_SETTINGS_MODULE": module, **env},
        capture_output=True,
        text=True,
        timeout=60,
    )


@pytest.mark.parametrize("module", ["config.settings.staging", "config.settings.prod"])
def test_comes_up_strict_on_render(module):
    result = load(module, RENDER_ENV)
    assert result.returncode == 0, result.stderr
    s = json.loads(result.stdout)
    assert s["DEBUG"] is False
    assert s["ALLOWED_HOSTS"] == ["agriflow-api.onrender.com"]
    assert s["CORS_ALLOW_ALL_ORIGINS"] is False
    assert s["CORS_ALLOWED_ORIGINS"] == RENDER_ENV["CORS_ALLOWED_ORIGINS"].split(",")
    assert s["SECURE_SSL_REDIRECT"] is True
    assert s["EMAIL_BACKEND"] == "anymail.backends.brevo.EmailBackend"
    assert s["EMAIL_DELIVERY_CHANNEL"] == "apps.identity.channels.DjangoEmailChannel"
    assert s["OTP_DELIVERY_CHANNEL"] == "apps.identity.channels.UnconfiguredOtpChannel"
    assert s["DB_ENGINE"] == "django.db.backends.postgresql"
    assert s["MIDDLEWARE"] == [
        "django.middleware.security.SecurityMiddleware",
        "whitenoise.middleware.WhiteNoiseMiddleware",
    ]


def test_only_prod_sends_hsts():
    prod = json.loads(load("config.settings.prod", RENDER_ENV).stdout)
    staging = json.loads(load("config.settings.staging", RENDER_ENV).stdout)
    assert prod["SECURE_HSTS_SECONDS"] == 31536000
    assert staging["SECURE_HSTS_SECONDS"] == 0


@pytest.mark.parametrize(
    "missing",
    [
        "DJANGO_SECRET_KEY",
        "DATABASE_URL",
        "FRONTEND_URL",
        "CORS_ALLOWED_ORIGINS",
        "BREVO_API_KEY",
        "DEFAULT_FROM_EMAIL",
    ],
)
def test_refuses_to_start_without(missing):
    env = {k: v for k, v in RENDER_ENV.items() if k != missing}
    result = load("config.settings.prod", env)
    assert result.returncode != 0
    assert "ImproperlyConfigured" in result.stderr
    assert missing in result.stderr


def test_refuses_to_start_without_a_host():
    env = {k: v for k, v in RENDER_ENV.items() if k != "RENDER_EXTERNAL_HOSTNAME"}
    result = load("config.settings.prod", env)
    assert result.returncode != 0
    assert "DJANGO_ALLOWED_HOSTS" in result.stderr

    env["DJANGO_ALLOWED_HOSTS"] = "api.example.com"
    result = load("config.settings.prod", env)
    assert json.loads(result.stdout)["ALLOWED_HOSTS"] == ["api.example.com"]


def test_never_reads_a_local_env_file(tmp_path):
    # A .env with every value would let prod start; it must be ignored.
    env_file = API_DIR / ".env"
    if env_file.exists():
        pytest.skip("a real .env exists here; not overwriting it")
    env_file.write_text("".join(f"{k}={v}\n" for k, v in RENDER_ENV.items()))
    try:
        result = load("config.settings.prod", {})
    finally:
        env_file.unlink()
    assert result.returncode != 0
    assert "ImproperlyConfigured" in result.stderr
