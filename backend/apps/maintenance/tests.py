from datetime import date

from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from apps.organizations.models import Organization
from apps.vehicles.models import Vehicle
from .models import Maintenance


class MaintenanceTenantIsolationTests(APITestCase):
    def setUp(self):
        user_model = get_user_model()
        self.owner = user_model.objects.create_user(
            username="maintenance_owner_a", password="test-password-123"
        )
        other_owner = user_model.objects.create_user(
            username="maintenance_owner_b", password="test-password-123"
        )
        self.organization = Organization.objects.create(
            owner=self.owner, name="Maintenance Company A"
        )
        other_organization = Organization.objects.create(
            owner=other_owner, name="Maintenance Company B"
        )
        self.vehicle = Vehicle.objects.create(
            organization=self.organization,
            registration_number="MAINT-A-001", make="Toyota", model="Hiace"
        )
        self.other_vehicle = Vehicle.objects.create(
            organization=other_organization,
            registration_number="MAINT-B-001", make="Isuzu", model="NQR"
        )
        self.own_record = Maintenance.objects.create(
            vehicle=self.vehicle, title="Oil service", maintenance_date=date(2026, 1, 5)
        )
        self.other_record = Maintenance.objects.create(
            vehicle=self.other_vehicle, title="Brake service", maintenance_date=date(2026, 1, 6)
        )
        self.client.force_authenticate(user=self.owner)

    def test_list_only_returns_company_records(self):
        response = self.client.get("/api/maintenance/")
        self.assertEqual(response.status_code, 200)
        ids = {item["id"] for item in response.data}
        self.assertEqual(ids, {self.own_record.id})
        self.assertNotIn(self.other_record.id, ids)

    def test_cannot_assign_another_company_vehicle(self):
        response = self.client.post(
            "/api/maintenance/",
            {
                "vehicle": self.other_vehicle.id,
                "title": "Unauthorized work",
                "maintenance_date": "2026-01-10",
                "cost": "100.00",
                "status": "pending",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
