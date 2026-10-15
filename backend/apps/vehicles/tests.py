from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient

from apps.organizations.models import Organization
from .models import Vehicle


class VehicleTenantIsolationTests(APITestCase):
    def setUp(self):
        user_model = get_user_model()
        self.owner = user_model.objects.create_user(
            username="fleet_owner_a", password="test-password-123"
        )
        self.other_owner = user_model.objects.create_user(
            username="fleet_owner_b", password="test-password-123"
        )
        self.organization = Organization.objects.create(
            owner=self.owner, name="Company A"
        )
        self.other_organization = Organization.objects.create(
            owner=self.other_owner, name="Company B"
        )
        self.own_vehicle = Vehicle.objects.create(
            organization=self.organization,
            registration_number="TEST-A-001",
            make="Toyota",
            model="Hiace",
        )
        self.other_vehicle = Vehicle.objects.create(
            organization=self.other_organization,
            registration_number="TEST-B-001",
            make="Isuzu",
            model="NQR",
        )
        self.client.force_authenticate(user=self.owner)

    def test_list_only_returns_current_company_vehicles(self):
        response = self.client.get("/api/vehicles/")
        self.assertEqual(response.status_code, 200)
        ids = {item["id"] for item in response.data}
        self.assertEqual(ids, {self.own_vehicle.id})
        self.assertNotIn(self.other_vehicle.id, ids)

    def test_create_assigns_current_company_not_submitted_organization(self):
        response = self.client.post(
            "/api/vehicles/",
            {
                "organization": self.other_organization.id,
                "registration_number": "TEST-A-002",
                "make": "Toyota",
                "model": "Coaster",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        created = Vehicle.objects.get(registration_number="TEST-A-002")
        self.assertEqual(created.organization_id, self.organization.id)
