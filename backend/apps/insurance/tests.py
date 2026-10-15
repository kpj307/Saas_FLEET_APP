from datetime import date

from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from apps.organizations.models import Organization
from apps.vehicles.models import Vehicle
from .models import Insurance


class InsuranceTenantIsolationTests(APITestCase):
    def setUp(self):
        user_model = get_user_model()
        self.owner = user_model.objects.create_user(
            username="insurance_owner_a", password="test-password-123"
        )
        other_owner = user_model.objects.create_user(
            username="insurance_owner_b", password="test-password-123"
        )
        self.organization = Organization.objects.create(
            owner=self.owner, name="Insurance Company A"
        )
        other_organization = Organization.objects.create(
            owner=other_owner, name="Insurance Company B"
        )
        self.vehicle = Vehicle.objects.create(
            organization=self.organization,
            registration_number="INS-A-001", make="Toyota", model="Hiace"
        )
        self.other_vehicle = Vehicle.objects.create(
            organization=other_organization,
            registration_number="INS-B-001", make="Isuzu", model="NQR"
        )
        self.own_policy = Insurance.objects.create(
            vehicle=self.vehicle, provider="Provider A", policy_number="POL-A",
            start_date=date(2026, 1, 1), expiry_date=date(2027, 1, 1)
        )
        self.other_policy = Insurance.objects.create(
            vehicle=self.other_vehicle, provider="Provider B", policy_number="POL-B",
            start_date=date(2026, 1, 1), expiry_date=date(2027, 1, 1)
        )
        self.client.force_authenticate(user=self.owner)

    def test_list_only_returns_company_policies(self):
        response = self.client.get("/api/insurance/")
        self.assertEqual(response.status_code, 200)
        ids = {item["id"] for item in response.data}
        self.assertEqual(ids, {self.own_policy.id})
        self.assertNotIn(self.other_policy.id, ids)

    def test_cannot_assign_another_company_vehicle(self):
        response = self.client.post(
            "/api/insurance/",
            {
                "vehicle": self.other_vehicle.id,
                "provider": "Unauthorized provider",
                "policy_number": "POL-X",
                "start_date": "2026-01-01",
                "expiry_date": "2027-01-01",
                "cost": "100.00",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
