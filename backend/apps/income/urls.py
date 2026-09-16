from rest_framework.routers import DefaultRouter

from .views import IncomeViewSet


router = DefaultRouter()
router.register(
    "income",
    IncomeViewSet,
    basename="income",
)

urlpatterns = router.urls