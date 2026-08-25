"""
URL configuration for the AgriFlow API.

Everything real lives under /api/v1/ — versioned from day one (Platform
Blueprint, Section 5). Bounded-context apps add their own `path('api/v1/
<context>/', include(...))` entries here as they're built; nothing exists
yet beyond the health check and the OpenAPI schema itself.
"""

from django.contrib import admin
from django.urls import path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from .views import HealthCheckView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/health/", HealthCheckView.as_view(), name="health"),
    path("api/v1/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/v1/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="docs"),
]
