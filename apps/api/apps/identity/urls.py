from django.urls import path
from rest_framework_simplejwt.views import TokenBlacklistView, TokenRefreshView

from .views.contact import EmailAddView, EmailConfirmView, PhoneAddView, PhoneConfirmView
from .views.google import GoogleSignInView
from .views.magic_link import MagicLinkRequestView, MagicLinkVerifyView
from .views.me import MeView
from .views.otp import OtpRequestView, OtpVerifyView

urlpatterns = [
    path("otp/request/", OtpRequestView.as_view(), name="otp-request"),
    path("otp/verify/", OtpVerifyView.as_view(), name="otp-verify"),
    path("magic-link/request/", MagicLinkRequestView.as_view(), name="magic-link-request"),
    path("magic-link/verify/", MagicLinkVerifyView.as_view(), name="magic-link-verify"),
    path("google/", GoogleSignInView.as_view(), name="google-sign-in"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    # Log out: cancels the refresh token so it can't be used again.
    path("token/logout/", TokenBlacklistView.as_view(), name="token-logout"),
    path("me/", MeView.as_view(), name="me"),
    path("me/email/", EmailAddView.as_view(), name="me-email-add"),
    path("email/confirm/", EmailConfirmView.as_view(), name="email-confirm"),
    path("me/phone/", PhoneAddView.as_view(), name="me-phone-add"),
    path("me/phone/confirm/", PhoneConfirmView.as_view(), name="me-phone-confirm"),
]
