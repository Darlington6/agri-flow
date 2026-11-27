from .models import PersonalDetails


def details_for(user) -> PersonalDetails | None:
    return PersonalDetails.objects.filter(user=user).first()


def has_personal_details(user) -> bool:
    """The account-setup step that asks for them is done (apps/network)."""
    return PersonalDetails.objects.filter(user=user).exists()
