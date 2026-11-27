"""Who someone is, for verifying their account (KYC) later.

Kept apart from the sign-in account (apps/identity): these details are
private. Only the person themselves (through the API) and staff (in
/admin) see them; buyers, farmers and everyone else see the account's
display_name instead. Verifying them against an ID comes later.

AgriFlow is for adults: someone under 18 needs a parent or guardian,
whose name, relationship and phone number are kept here too, so our team
can contact them and check they agree.
"""

from datetime import date

from django.conf import settings
from django.db import models

ADULT_AGE = 18


def age_on(born: date, day: date) -> int:
    """Whole years from `born` to `day`."""
    return day.year - born.year - ((day.month, day.day) < (born.month, born.day))


class PersonalDetails(models.Model):
    class Relationship(models.TextChoices):
        PARENT = "parent", "Parent"
        LEGAL_GUARDIAN = "legal_guardian", "Legal guardian"
        RELATIVE = "relative", "Other family member"

    class Gender(models.TextChoices):
        WOMAN = "woman", "Woman"
        MAN = "man", "Man"
        UNSAID = "prefer_not_to_say", "Prefer not to say"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="personal_details"
    )
    # Exactly as on their national ID or passport.
    legal_name = models.CharField(max_length=200)
    date_of_birth = models.DateField()
    # Optional; for reporting how many women and young people AgriFlow
    # reaches (funders ask), never shown to other people.
    gender = models.CharField(max_length=20, choices=Gender.choices, blank=True)
    # Only for someone under 18 (see ADULT_AGE); empty otherwise.
    guardian_name = models.CharField(max_length=200, blank=True)
    guardian_relationship = models.CharField(
        max_length=20, choices=Relationship.choices, blank=True
    )
    guardian_phone = models.CharField(
        max_length=20, blank=True, help_text="E.164, e.g. +250788123456"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "personal details"
        verbose_name_plural = "personal details"

    def __str__(self) -> str:
        return self.legal_name

    @property
    def is_minor(self) -> bool:
        return age_on(self.date_of_birth, date.today()) < ADULT_AGE
