from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)


urlpatterns = [
    path("admin/", admin.site.urls),

    path("api/", include("apps.vehicles.urls")),
    path("api/", include("apps.maintenance.urls")),
    path("api/", include("apps.documents.urls")),
    path("api/", include("apps.insurance.urls")),
    path("api/", include("apps.notifications.urls")),
    path("api/", include("apps.reports.urls")),
    path("api/",include("apps.income.urls"),),
    path("api/",include("apps.expenses.urls"),),

    path(
        "api/auth/token/",
        TokenObtainPairView.as_view(),
        name="token_obtain_pair",
    ),
    path(
        "api/auth/token/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh",
    ),
]

if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT,
    )