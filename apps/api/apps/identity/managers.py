from django.contrib.auth.base_user import BaseUserManager


class UserManager(BaseUserManager):
    """Phone-first: no username, no required password for regular users —
    they authenticate via OTP/magic-link (see services.py), never a
    Django password form. `create_superuser` is the one exception, since
    Django Admin login is password-based and that's an internal ops tool,
    not part of the consumer auth flow (Platform Blueprint, Section 2).
    """

    use_in_migrations = True

    def _create_user(self, phone_number: str, **extra_fields):
        if not phone_number:
            raise ValueError("Users must have a phone number.")
        user = self.model(phone_number=phone_number, **extra_fields)
        user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_user(self, phone_number: str, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(phone_number, **extra_fields)

    def create_superuser(self, phone_number: str, password: str | None = None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        user = self._create_user(phone_number, **extra_fields)
        if password:
            user.set_password(password)
            user.save(using=self._db)
        return user
