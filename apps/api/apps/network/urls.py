from django.urls import path

from .views import (
    CompleteOnboardingView,
    OnboardingView,
    OptionsView,
    ProfileDetailView,
    ProfileListView,
    SkipPhoneView,
)

urlpatterns = [
    path("network/options/", OptionsView.as_view(), name="network-options"),
    path("network/profiles/", ProfileListView.as_view(), name="network-profiles"),
    path("network/profiles/<slug:role>/", ProfileDetailView.as_view(), name="network-profile"),
    path("onboarding/", OnboardingView.as_view(), name="onboarding"),
    path("onboarding/skip-phone/", SkipPhoneView.as_view(), name="onboarding-skip-phone"),
    path("onboarding/complete/", CompleteOnboardingView.as_view(), name="onboarding-complete"),
]
