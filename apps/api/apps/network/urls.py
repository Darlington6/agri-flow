from django.urls import path

from .views import (
    CompleteOnboardingView,
    CooperativeMembersView,
    MembershipDecisionView,
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
    path(
        "network/cooperative/members/", CooperativeMembersView.as_view(), name="cooperative-members"
    ),
    path(
        "network/cooperative/members/<int:membership_id>/",
        MembershipDecisionView.as_view(),
        name="cooperative-member",
    ),
    path("onboarding/", OnboardingView.as_view(), name="onboarding"),
    path("onboarding/skip-phone/", SkipPhoneView.as_view(), name="onboarding-skip-phone"),
    path("onboarding/complete/", CompleteOnboardingView.as_view(), name="onboarding-complete"),
]
