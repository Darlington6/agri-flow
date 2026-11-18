"""Swappable delivery for OTP codes and magic links — same adapter shape
as AIService/MockAIService in apps/web (Platform Blueprint, Section 4).
Locally and in tests, codes and links are logged instead of sent. Staging
and prod email magic links through Django's email system (Brevo, see
config/settings/deployed.py); there's no SMS provider yet, so phone codes
are unavailable there. A real SMS provider (Africa's Talking, Twilio, ...)
plugs in later by pointing the settings value at a new class here — call
sites in services.py never change.
"""

import logging
from typing import Protocol

from django.conf import settings
from django.core.mail import send_mail
from django.utils.module_loading import import_string

logger = logging.getLogger("agriflow.identity.delivery")


class OtpDeliveryChannel(Protocol):
    def send(self, phone_number: str, code: str) -> None: ...


class EmailDeliveryChannel(Protocol):
    def send(self, email: str, link: str) -> None: ...


class ConsoleOtpChannel:
    """Dev-only: logs the code instead of sending an SMS."""

    def send(self, phone_number: str, code: str) -> None:
        logger.info("OTP for %s: %s", phone_number, code)


class ConsoleEmailChannel:
    """Dev-only: logs the magic link instead of sending an email."""

    def send(self, email: str, link: str) -> None:
        logger.info("Magic link for %s: %s", email, link)


class DeliveryUnavailable(Exception):
    """This way of signing in has no provider yet. The views answer 503
    ("not available yet") rather than pretend a code or link was sent.
    """


class DjangoEmailChannel:
    """Sends the magic link with Django's email system, so the provider
    (Brevo today, via django-anymail) is chosen by EMAIL_BACKEND in
    settings, not here.
    """

    def send(self, email: str, link: str) -> None:
        minutes = 15  # services.MAGIC_LINK_TTL_MINUTES; not imported, to avoid a cycle
        try:
            send_mail(
                subject="Your AgriFlow sign-in link",
                message=(
                    "Hello,\n\n"
                    "Use this link to sign in to AgriFlow:\n\n"
                    f"{link}\n\n"
                    f"It works once, for the next {minutes} minutes. If you didn't ask to "
                    "sign in, you can ignore this email.\n\n"
                    "AgriFlow"
                ),
                from_email=None,  # DEFAULT_FROM_EMAIL
                recipient_list=[email],
            )
        except Exception:
            # Logged, never raised: the request must answer the same way
            # whether or not the email has an account (see
            # services.request_magic_link), and a send is only attempted
            # for addresses that do.
            logger.exception("Couldn't send the magic link email")


class UnconfiguredOtpChannel:
    """No SMS provider yet: deployed settings use this, so phone sign-in
    says it's unavailable instead of silently logging real users' codes.
    """

    def send(self, phone_number: str, code: str) -> None:
        raise DeliveryUnavailable("Phone sign-in isn't available yet.")


class UnconfiguredEmailChannel:
    def send(self, email: str, link: str) -> None:
        raise DeliveryUnavailable("Email sign-in isn't available yet.")


def get_otp_channel() -> OtpDeliveryChannel:
    return import_string(settings.OTP_DELIVERY_CHANNEL)()


def get_email_channel() -> EmailDeliveryChannel:
    return import_string(settings.EMAIL_DELIVERY_CHANNEL)()
