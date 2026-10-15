from datetime import timedelta
from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APITestCase

from apps.organizations.models import Organization
from apps.vehicles.models import Vehicle
from .models import Subscription, SubscriptionPayment
from .plans import PLANS
from .services import activate_verified_payment, effective_plan


class SubscriptionPlanTests(APITestCase):
    def setUp(self):
        user_model = get_user_model()
        self.user = user_model.objects.create_user(
            username="plan_owner", email="plan@example.com", password="Strong!Password849"
        )
        self.organization = Organization.objects.create(owner=self.user, name="Plan Company")
        self.client.force_authenticate(user=self.user)

    def test_overview_defaults_to_free_plan(self):
        response = self.client.get("/api/subscription/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["plan"]["code"], "free")
        self.assertEqual(response.data["vehicle_usage"]["limit"], 3)
        self.assertEqual(response.data["vehicle_usage"]["used"], 0)

    def test_plans_are_available_to_authenticated_users(self):
        response = self.client.get("/api/subscription/plans/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual([plan["code"] for plan in response.data["plans"]], ["free", "starter", "business"])

    def test_free_plan_blocks_vehicle_creation_after_three(self):
        for index in range(3):
            Vehicle.objects.create(
                organization=self.organization,
                registration_number=f"FREE-{index:03}",
                make="Toyota",
                model="Hiace",
            )
        response = self.client.post(
            "/api/vehicles/",
            {"registration_number": "FREE-004", "make": "Toyota", "model": "Hiace"},
            format="json",
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(Vehicle.objects.filter(organization=self.organization).count(), 3)
        self.assertEqual(response.data["code"], "vehicle_limit_reached")

    def test_paid_plan_expires_to_free_entitlement(self):
        subscription = Subscription.objects.create(
            organization=self.organization,
            plan=Subscription.Plan.STARTER,
            status=Subscription.Status.ACTIVE,
            current_period_start=timezone.now() - timedelta(days=40),
            current_period_end=timezone.now() - timedelta(days=10),
        )
        self.assertEqual(effective_plan(subscription)["code"], "free")

    def test_payment_activation_requires_matching_verified_transaction(self):
        payment = SubscriptionPayment.objects.create(
            organization=self.organization,
            plan="starter",
            amount=Decimal("30000.00"),
            currency="UGX",
            tx_ref="test-ref-123",
        )
        with self.assertRaises(Exception):
            activate_verified_payment(payment, {
                "status": "successful",
                "tx_ref": "different-reference",
                "currency": "UGX",
                "amount": 30000,
            })
        self.assertEqual(payment.status, SubscriptionPayment.Status.PENDING)

    @override_settings(FLW_SECRET_KEY="")
    def test_checkout_is_not_enabled_without_provider_credentials(self):
        response = self.client.post("/api/subscription/checkout/", {"plan": "starter"}, format="json")
        self.assertEqual(response.status_code, 503)
