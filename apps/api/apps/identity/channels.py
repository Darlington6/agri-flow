"""Swappable delivery for OTP codes and magic links — same adapter shape
as AIService/MockAIService in apps/web (Platform Blueprint, Section 4).
No SMS/email provider account exists yet, so dev/staging/test default to
logging instead of sending. A real provider (Twilio, Africa's Talking,
Clerk, ...) plugs in later by pointing the settings value at a new class
here — call sites in services.py never change.
"""

import logging
from typing import Protocol

from django.conf import settings
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


class UnconfiguredOtpChannel:
    """prod.py must point OTP_DELIVERY_CHANNEL at a real implementation
    before this ever deploys — no silent fallback to logging real codes.
    """

    def send(self, phone_number: str, code: str) -> None:
        raise NotImplementedError(
            "Configure a real OtpDeliveryChannel before deploying to production."
        )


class UnconfiguredEmailChannel:
    def send(self, email: str, link: str) -> None:
        raise NotImplementedError(
            "Configure a real EmailDeliveryChannel before deploying to production."
        )


def get_otp_channel() -> OtpDeliveryChannel:
    return import_string(settings.OTP_DELIVERY_CHANNEL)()


def get_email_channel() -> EmailDeliveryChannel:
    return import_string(settings.EMAIL_DELIVERY_CHANNEL)()
