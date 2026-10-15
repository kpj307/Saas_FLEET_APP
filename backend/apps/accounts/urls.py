from django.urls import path

from .views import CompanyOnboardingView, CompanyRegistrationView

urlpatterns = [
    path("auth/register/", CompanyRegistrationView.as_view(), name="company-register"),
    path("auth/onboarding/", CompanyOnboardingView.as_view(), name="company-onboarding"),
]
