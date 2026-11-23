from django.conf import settings
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone

from .managers import UserManager
from .phone import tidy

# The launch languages (see the README's internationalisation notes).
LANGUAGES = [
    ("en", "English"),
    ("fr", "Français"),
    ("rw", "Ikinyarwanda"),
    ("sw", "Kiswahili"),
    ("tw", "Twi"),
]


class Permission(models.Model):
    """A stable vocabulary of capability codenames. Seeded empty — each
    bounded context registers its own permissions as it's built (Contracts
    adds `confirm_match_request`, Finance adds `view_finance`, ...), rather
    than Identity guessing another context's needs upfront (Platform
    Blueprint, Section 7).
    """

    codename = models.SlugField(max_length=100, unique=True)
    description = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["codename"]

    def __str__(self) -> str:
        return self.codename


class Role(models.Model):
    """The six roles as data, not a hardcoded enum — so a future
    permission tweak is a data change, not a release (Platform Blueprint,
    Section 7). Slugs match the prototype's DemoRole values exactly.
    """

    FARMER = "farmer"
    BUYER = "buyer"
    FIELD_AGENT = "field_agent"
    DELIVERY_PARTNER = "delivery_partner"
    COOPERATIVE = "cooperative"
    PLATFORM_ADMIN = "platform_admin"
    SUPER_ADMIN = "super_admin"

    ADMIN_SLUGS = (PLATFORM_ADMIN, SUPER_ADMIN)
    # People choose one of these for themselves while setting up their
    # account. Field agents are invited and admins are granted in /admin,
    # so nobody can give themselves a staff role.
    SELF_SERVE_SLUGS = (FARMER, BUYER, DELIVERY_PARTNER, COOPERATIVE)
    STAFF_SLUGS = (FIELD_AGENT, PLATFORM_ADMIN, SUPER_ADMIN)

    slug = models.SlugField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    permissions = models.ManyToManyField(Permission, blank=True, related_name="roles")

    class Meta:
        ordering = ["slug"]

    def __str__(self) -> str:
        return self.name


class User(AbstractBaseUser, PermissionsMixin):
    """An account has a phone number, an email, or both, but always at
    least one: people sign up with either and can add the other later
    (confirmed by a code or a link, see services.py). Phone stays the
    login for Django Admin, so staff accounts need one. `roles` is
    many-to-many (not a single FK) so an admin grant is additive: a Buyer
    promoted to Platform Admin gets a second Role row, never a role swap.
    """

    # Blank values are stored as NULL (see save()), so many accounts can
    # be without one while each real number or address stays unique.
    phone_number = models.CharField(max_length=20, unique=True, null=True, blank=True)
    email = models.EmailField(unique=True, null=True, blank=True)
    display_name = models.CharField(max_length=150, blank=True)
    # Google's own, permanent ID for the person ("sub"), set the first time
    # they continue with Google, so the link holds even if their Google
    # email changes.
    google_sub = models.CharField(max_length=255, unique=True, null=True, blank=True)
    roles = models.ManyToManyField(Role, blank=True, related_name="users")

    # Set while setting up the account (see apps/network/onboarding.py).
    # Country decides currency, place lists and the phone default;
    # language is kept for when the app is translated.
    country = models.CharField(max_length=2, blank=True, help_text="ISO 3166-1 alpha-2, e.g. RW")
    language = models.CharField(max_length=5, choices=LANGUAGES, blank=True)
    # Which version of the terms and privacy notice they agreed to, and
    # when. A new version (settings.TERMS_VERSION) asks them again.
    terms_version = models.CharField(max_length=40, blank=True)
    terms_accepted_at = models.DateTimeField(null=True, blank=True)
    # When they saw (or skipped) the "add your phone number" step, so it
    # isn't asked again on every visit.
    phone_prompted_at = models.DateTimeField(null=True, blank=True)
    onboarded_at = models.DateTimeField(null=True, blank=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    USERNAME_FIELD = "phone_number"
    REQUIRED_FIELDS: list[str] = []

    objects = UserManager()

    class Meta:
        ordering = ["date_joined"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(phone_number__isnull=False) | models.Q(email__isnull=False),
                name="user_has_phone_or_email",
            )
        ]

    def save(self, *args, **kwargs):
        # Always stored as E.164, however it was typed (see phone.py).
        self.phone_number = tidy(self.phone_number) if self.phone_number else None
        self.email = self.email.strip().lower() if self.email else None
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.display_name or self.phone_number or self.email or f"User {self.pk}"

    def needs_onboarding(self) -> bool:
        """True until they've finished setting up their account, and again
        whenever the terms change and they haven't agreed to the new ones."""
        return self.onboarded_at is None or self.terms_version != settings.TERMS_VERSION

    def is_admin_role(self) -> bool:
        """Mirrors src/lib/permissions.ts's isAdminRole() — Platform Admin
        and Super Admin are equivalent everywhere except the
        Executive-only surface, checked as an OR here rather than a
        general role-hierarchy engine for what is currently two roles.
        """
        return self.roles.filter(slug__in=Role.ADMIN_SLUGS).exists()


class OtpCode(models.Model):
    """Codes are hashed at rest (see services.py) — never stored plain.
    A code either signs someone in (creating the account on first use) or
    confirms a phone number a signed-in user is adding (`user` set).
    """

    class Purpose(models.TextChoices):
        SIGN_IN = "sign_in", "Sign in or sign up"
        ADD_PHONE = "add_phone", "Add a phone number"

    phone_number = models.CharField(max_length=20)
    purpose = models.CharField(max_length=20, choices=Purpose.choices, default=Purpose.SIGN_IN)
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.CASCADE)
    code_hash = models.CharField(max_length=64)
    expires_at = models.DateTimeField()
    consumed_at = models.DateTimeField(null=True, blank=True)
    attempts = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["phone_number", "consumed_at"])]


class MagicLinkToken(models.Model):
    """Hashed at rest, like OtpCode. A link either signs someone in
    (creating the account on first use) or confirms an email a signed-in
    user is adding (`user` set).
    """

    class Purpose(models.TextChoices):
        SIGN_IN = "sign_in", "Sign in or sign up"
        ADD_EMAIL = "add_email", "Add an email"

    email = models.EmailField()
    purpose = models.CharField(max_length=20, choices=Purpose.choices, default=Purpose.SIGN_IN)
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.CASCADE)
    token_hash = models.CharField(max_length=64, unique=True)
    expires_at = models.DateTimeField()
    consumed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["email", "consumed_at"])]
