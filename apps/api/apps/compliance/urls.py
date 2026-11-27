from django.urls import path

from .views import PersonalDetailsView

urlpatterns = [
    path("compliance/personal-details/", PersonalDetailsView.as_view(), name="personal-details"),
]
