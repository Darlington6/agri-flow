from django.contrib import admin

from .models import PersonalDetails


@admin.register(PersonalDetails)
class PersonalDetailsAdmin(admin.ModelAdmin):
    list_display = ["legal_name", "user", "date_of_birth", "gender", "guardian_name", "updated_at"]
    list_filter = ["gender"]
    search_fields = ["legal_name", "user__email", "user__phone_number", "user__display_name"]
    raw_id_fields = ["user"]
    readonly_fields = ["created_at", "updated_at"]
