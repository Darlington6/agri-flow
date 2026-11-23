from django.db import migrations


def add_role(apps, schema_editor):
    Role = apps.get_model("identity", "Role")
    Role.objects.get_or_create(slug="cooperative", defaults={"name": "Cooperative"})


def remove_role(apps, schema_editor):
    apps.get_model("identity", "Role").objects.filter(slug="cooperative").delete()


class Migration(migrations.Migration):
    dependencies = [
        ("identity", "0005_account_setup"),
    ]

    operations = [
        migrations.RunPython(add_role, remove_role),
    ]
