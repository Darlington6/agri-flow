from django.db import migrations

ROLES = [
    ("farmer", "Farmer"),
    ("buyer", "Buyer"),
    ("field_agent", "Field Agent"),
    ("delivery_partner", "Delivery Partner"),
    ("platform_admin", "Platform Admin"),
    ("super_admin", "Super Admin"),
]


def seed_roles(apps, schema_editor):
    Role = apps.get_model("identity", "Role")
    for slug, name in ROLES:
        Role.objects.get_or_create(slug=slug, defaults={"name": name})


def remove_roles(apps, schema_editor):
    Role = apps.get_model("identity", "Role")
    Role.objects.filter(slug__in=[slug for slug, _ in ROLES]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("identity", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_roles, remove_roles),
    ]
