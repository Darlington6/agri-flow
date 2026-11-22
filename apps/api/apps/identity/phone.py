"""Phone numbers are stored one way only: E.164 (+250788123456, no spaces).

Every path that takes a phone number goes through here: the API's sign-in
and sign-up (serializers), creating users (including `createsuperuser`),
saving a user, and the Django admin login. So "+250 788 123 456" and
"+250788123456" are always the same person.
"""

import phonenumbers

FORMAT_HINT = "Enter a phone number in international format, e.g. +250788123456."


class InvalidPhoneNumber(ValueError):
    pass


def to_e164(value: str) -> str:
    """The number in E.164, or InvalidPhoneNumber with a message for people."""
    try:
        parsed = phonenumbers.parse(value, None)
    except phonenumbers.NumberParseException as exc:
        raise InvalidPhoneNumber(FORMAT_HINT) from exc
    if not phonenumbers.is_valid_number(parsed):
        raise InvalidPhoneNumber("That doesn't look like a valid phone number.")
    return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)


def tidy(value: str) -> str:
    """E.164 when the number is valid; otherwise just trimmed (so a lookup
    with a mistyped number simply finds nobody instead of crashing)."""
    try:
        return to_e164(value)
    except InvalidPhoneNumber:
        return value.strip()
