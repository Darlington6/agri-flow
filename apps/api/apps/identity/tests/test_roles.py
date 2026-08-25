import pytest

from apps.identity.models import Role, User

pytestmark = pytest.mark.django_db


def test_seed_migration_created_all_six_roles():
    assert set(Role.objects.values_list("slug", flat=True)) == {
        "farmer",
        "buyer",
        "field_agent",
        "delivery_partner",
        "platform_admin",
        "super_admin",
    }


def test_is_admin_role_true_for_platform_admin():
    user = User.objects.create_user(phone_number="+233240000001")
    user.roles.add(Role.objects.get(slug="platform_admin"))
    assert user.is_admin_role() is True


def test_is_admin_role_true_for_super_admin():
    user = User.objects.create_user(phone_number="+233240000002")
    user.roles.add(Role.objects.get(slug="super_admin"))
    assert user.is_admin_role() is True


def test_is_admin_role_false_for_non_admin_role():
    user = User.objects.create_user(phone_number="+233240000003")
    user.roles.add(Role.objects.get(slug="farmer"))
    assert user.is_admin_role() is False


def test_admin_grant_is_additive_not_a_swap():
    """A buyer promoted to Platform Admin keeps the buyer role too — an
    extra Role row, not a role swap (Platform Blueprint, Section 6/7).
    """
    user = User.objects.create_user(phone_number="+233240000004")
    user.roles.add(Role.objects.get(slug="buyer"), Role.objects.get(slug="platform_admin"))
    slugs = set(user.roles.values_list("slug", flat=True))
    assert slugs == {"buyer", "platform_admin"}
    assert user.is_admin_role() is True
