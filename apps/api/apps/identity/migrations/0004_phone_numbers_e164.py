"""Stores every existing phone number in E.164 (+250788123456).

Numbers saved before phone.py existed could keep spaces (e.g. an admin made
with `createsuperuser`), which made them a different account from the same
number typed without spaces. A number that would clash with another account
once tidied is left alone, to be sorted out by hand in the admin.
"""

from django.db import migrations


def to_e164(apps, schema_editor):
    from apps.identity.phone import tidy

    User = apps.get_model("identity", "User")
    for user in User.objects.exclude(phone_number=None):
        tidied = tidy(user.phone_number)
        if tidied == user.phone_number:
            continue
        if User.objects.filter(phone_number=tidied).exclude(pk=user.pk).exists():
            continue
        User.objects.filter(pk=user.pk).update(phone_number=tidied)


class Migration(migrations.Migration):
    dependencies = [("identity", "0003_phone_or_email")]

    operations = [migrations.RunPython(to_e164, migrations.RunPython.noop)]
