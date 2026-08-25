from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import MagicLinkToken, OtpCode, Permission, Role, User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    model = User
    list_display = ["phone_number", "email", "display_name", "is_active", "is_staff"]
    list_filter = ["is_active", "is_staff", "roles"]
    search_fields = ["phone_number", "email", "display_name"]
    ordering = ["phone_number"]
    filter_horizontal = ["roles"]
    fieldsets = (
        (None, {"fields": ("phone_number", "password")}),
        ("Profile", {"fields": ("email", "display_name")}),
        ("Roles & permissions", {"fields": ("roles", "is_active", "is_staff", "is_superuser")}),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("phone_number", "password1", "password2"),
            },
        ),
    )


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ["slug", "name"]
    filter_horizontal = ["permissions"]


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ["codename", "description"]


@admin.register(OtpCode)
class OtpCodeAdmin(admin.ModelAdmin):
    # code_hash only — the plaintext code is never stored, so there's
    # nothing to accidentally expose here even to a Django Admin user.
    list_display = ["phone_number", "created_at", "expires_at", "consumed_at", "attempts"]
    readonly_fields = [f.name for f in OtpCode._meta.fields]


@admin.register(MagicLinkToken)
class MagicLinkTokenAdmin(admin.ModelAdmin):
    list_display = ["email", "created_at", "expires_at", "consumed_at"]
    readonly_fields = [f.name for f in MagicLinkToken._meta.fields]
