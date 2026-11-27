from django.contrib import admin

from .models import (
    BuyerProfile,
    CooperativeProfile,
    DeliveryPartnerProfile,
    FarmerProfile,
    Membership,
)


class ProfileAdmin(admin.ModelAdmin):
    """Staff verify profiles here (the `verification` field)."""

    list_filter = ["verification", "created_at"]
    list_select_related = ["user"]
    raw_id_fields = ["user"]
    readonly_fields = ["created_at", "updated_at"]
    search_fields = ["user__phone_number", "user__email", "user__display_name"]


@admin.register(FarmerProfile)
class FarmerProfileAdmin(ProfileAdmin):
    list_display = ["user", "region", "district", "cooperative_name", "verification"]
    list_filter = ProfileAdmin.list_filter + ["region"]
    search_fields = ProfileAdmin.search_fields + ["cooperative_name", "district"]


@admin.register(BuyerProfile)
class BuyerProfileAdmin(ProfileAdmin):
    list_display = ["business_name", "user", "business_type", "region", "verification"]
    list_filter = ProfileAdmin.list_filter + ["business_type", "region"]
    search_fields = ProfileAdmin.search_fields + ["business_name"]


@admin.register(DeliveryPartnerProfile)
class DeliveryPartnerProfileAdmin(ProfileAdmin):
    list_display = ["user", "business_name", "verification"]
    search_fields = ProfileAdmin.search_fields + ["business_name"]


@admin.register(CooperativeProfile)
class CooperativeProfileAdmin(ProfileAdmin):
    list_display = ["name", "user", "region", "district", "member_count", "verification"]
    list_filter = ProfileAdmin.list_filter + ["region"]
    search_fields = ProfileAdmin.search_fields + ["name", "registration_number"]


@admin.register(Membership)
class MembershipAdmin(admin.ModelAdmin):
    """Who has asked to join which cooperative, and whether it's confirmed."""

    list_display = ["farmer", "cooperative", "status", "requested_at", "decided_at"]
    list_filter = ["status", "requested_at"]
    list_select_related = ["farmer__user", "cooperative"]
    raw_id_fields = ["farmer", "cooperative", "decided_by"]
    readonly_fields = ["requested_at"]
    search_fields = [
        "cooperative__name",
        "farmer__user__display_name",
        "farmer__user__phone_number",
    ]
