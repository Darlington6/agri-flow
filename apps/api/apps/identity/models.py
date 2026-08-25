from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone

from .managers import UserManager


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
    PLATFORM_ADMIN = "platform_admin"
    SUPER_ADMIN = "super_admin"

    ADMIN_SLUGS = (PLATFORM_ADMIN, SUPER_ADMIN)

    slug = models.SlugField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    permissions = models.ManyToManyField(Permission, blank=True, related_name="roles")

    class Meta:
        ordering = ["slug"]

    def __str__(self) -> str:
        return self.name


class User(AbstractBaseUser, PermissionsMixin):
    """Phone number is the primary identifier — no username. `roles` is
    many-to-many (not a single FK) so an admin grant is additive: a Buyer
    promoted to Platform Admin gets a second Role row, never a role swap.
    """

    phone_number = models.CharField(max_length=20, unique=True)
    email = models.EmailField(unique=True, null=True, blank=True)
    display_name = models.CharField(max_length=150, blank=True)
    roles = models.ManyToManyField(Role, blank=True, related_name="users")

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    USERNAME_FIELD = "phone_number"
    REQUIRED_FIELDS: list[str] = []

    objects = UserManager()

    class Meta:
        ordering = ["phone_number"]

    def __str__(self) -> str:
        return self.display_name or self.phone_number

    def is_admin_role(self) -> bool:
        """Mirrors src/lib/permissions.ts's isAdminRole() — Platform Admin
        and Super Admin are equivalent everywhere except the
        Executive-only surface, checked as an OR here rather than a
        general role-hierarchy engine for what is currently two roles.
        """
        return self.roles.filter(slug__in=Role.ADMIN_SLUGS).exists()


class OtpCode(models.Model):
    """Codes are hashed at rest (see services.py) — never stored plain."""

    phone_number = models.CharField(max_length=20)
    code_hash = models.CharField(max_length=64)
    expires_at = models.DateTimeField()
    consumed_at = models.DateTimeField(null=True, blank=True)
    attempts = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["phone_number", "consumed_at"])]


class MagicLinkToken(models.Model):
    email = models.EmailField()
    token_hash = models.CharField(max_length=64, unique=True)
    expires_at = models.DateTimeField()
    consumed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["email", "consumed_at"])]
