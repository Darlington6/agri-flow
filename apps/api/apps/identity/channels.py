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
from dataclasses import asdict, dataclass
from typing import Protocol

from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.module_loading import import_string

logger = logging.getLogger("agriflow.identity.delivery")


class OtpDeliveryChannel(Protocol):
    def send(self, phone_number: str, code: str) -> None: ...


class EmailDeliveryChannel(Protocol):
    # kind: "sign_in" (the account exists), "sign_up" (the link creates
    # it) or "confirm_email" (a signed-in user is adding this address).
    def send(self, email: str, link: str, kind: str) -> None: ...


@dataclass(frozen=True)
class EmailWording:
    subject: str
    label: str  # the small line above the heading
    heading: str
    intro: str
    button: str


# What each email says; the layout is the same for all three
# (templates/identity/email/link.html and link.txt).
EMAIL_WORDING = {
    "sign_in": EmailWording(
        subject="Your AgriFlow sign-in link",
        label="Sign in",
        heading="Welcome back",
        intro="Use the button below to sign in to AgriFlow. There's no password to remember.",
        button="Sign in",
    ),
    "sign_up": EmailWording(
        subject="Finish creating your AgriFlow account",
        label="New account",
        heading="Welcome to AgriFlow",
        intro="You're one step away. Use the button below to finish creating your account.",
        button="Create my account",
    ),
    "confirm_email": EmailWording(
        subject="Confirm your email for AgriFlow",
        label="Confirm email",
        heading="Is this your email?",
        intro="Use the button below to add this email to your AgriFlow account.",
        button="Confirm email",
    ),
}


class ConsoleOtpChannel:
    """Dev-only: logs the code instead of sending an SMS."""

    def send(self, phone_number: str, code: str) -> None:
        logger.info("OTP for %s: %s", phone_number, code)


class ConsoleEmailChannel:
    """Dev-only: logs the magic link instead of sending an email."""

    def send(self, email: str, link: str, kind: str) -> None:
        logger.info("Email link (%s) for %s: %s", kind, email, link)


class DeliveryUnavailable(Exception):
    """This way of signing in has no provider yet. The views answer 503
    ("not available yet") rather than pretend a code or link was sent.
    """


class DjangoEmailChannel:
    """Sends the magic link with Django's email system, so the provider
    (Brevo today, via django-anymail) is chosen by EMAIL_BACKEND in
    settings, not here.
    """

    def send(self, email: str, link: str, kind: str) -> None:
        minutes = 15  # services.MAGIC_LINK_TTL_MINUTES; not imported, to avoid a cycle
        wording = EMAIL_WORDING[kind]
        site = settings.PUBLIC_SITE_URL
        context = {
            **asdict(wording),
            "link": link,
            "minutes": minutes,
            "preview": wording.intro,
            "site_url": site,
            "logo_url": f"{site}/email/agriflow-mark-reversed.png",
        }
        if settings.DEBUG:
            # Local development only: the link in the terminal too, even if
            # sending fails. Never in staging or production (DEBUG is off).
            logger.info("Email link (%s) for %s: %s", kind, email, link)
        try:
            send_mail(
                subject=wording.subject,
                message=render_to_string("identity/email/link.txt", context),
                html_message=render_to_string("identity/email/link.html", context),
                from_email=None,  # DEFAULT_FROM_EMAIL
                recipient_list=[email],
            )
        except Exception:
            # Logged, never raised: the request answers the same way
            # whether or not the email has an account (see
            # services.request_magic_link), so a failure mustn't show.
            logger.exception("Couldn't send the %s email", kind)


class UnconfiguredOtpChannel:
    """No SMS provider yet: deployed settings use this, so phone sign-in
    says it's unavailable instead of silently logging real users' codes.
    """

    def send(self, phone_number: str, code: str) -> None:
        raise DeliveryUnavailable("Phone sign-in isn't available yet.")


class UnconfiguredEmailChannel:
    def send(self, email: str, link: str, kind: str) -> None:
        raise DeliveryUnavailable("Email sign-in isn't available yet.")


def get_otp_channel() -> OtpDeliveryChannel:
    return import_string(settings.OTP_DELIVERY_CHANNEL)()


def get_email_channel() -> EmailDeliveryChannel:
    return import_string(settings.EMAIL_DELIVERY_CHANNEL)()
