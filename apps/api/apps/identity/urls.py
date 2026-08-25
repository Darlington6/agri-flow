from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views.magic_link import MagicLinkRequestView, MagicLinkVerifyView
from .views.me import MeView
from .views.otp import OtpRequestView, OtpVerifyView

urlpatterns = [
    path("otp/request/", OtpRequestView.as_view(), name="otp-request"),
    path("otp/verify/", OtpVerifyView.as_view(), name="otp-verify"),
    path("magic-link/request/", MagicLinkRequestView.as_view(), name="magic-link-request"),
    path("magic-link/verify/", MagicLinkVerifyView.as_view(), name="magic-link-verify"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("me/", MeView.as_view(), name="me"),
]
