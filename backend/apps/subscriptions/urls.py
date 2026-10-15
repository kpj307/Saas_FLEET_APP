from django.urls import path

from .views import (
    CheckoutView,
    PlansView,
    SubscriptionOverviewView,
    VerifyPaymentView,
    flutterwave_webhook,
)

urlpatterns = [
    path("subscription/", SubscriptionOverviewView.as_view(), name="subscription-overview"),
    path("subscription/plans/", PlansView.as_view(), name="subscription-plans"),
    path("subscription/checkout/", CheckoutView.as_view(), name="subscription-checkout"),
    path("subscription/verify/", VerifyPaymentView.as_view(), name="subscription-verify"),
    path("subscription/webhook/", flutterwave_webhook, name="flutterwave-webhook"),
]
