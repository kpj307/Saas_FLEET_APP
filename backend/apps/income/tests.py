from datetime import date
from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from apps.organizations.models import Organization
from apps.vehicles.models import Vehicle
from .models import Income


class IncomeTenantIsolationTests(APITestCase):
    def setUp(self):
        user_model = get_user_model()
        self.owner = user_model.objects.create_user(
            username="income_owner_a", password="Strong!Password849"
        )
        other_owner = user_model.objects.create_user(
            username="income_owner_b", password="Strong!Password849"
        )
        self.organization = Organization.objects.create(owner=self.owner, name="Income A")
        other_organization = Organization.objects.create(owner=other_owner, name="Income B")
        self.own_vehicle = Vehicle.objects.create(
            organization=self.organization, registration_number="INC-A-001",
            make="Toyota", model="Hiace"
        )
        self.other_vehicle = Vehicle.objects.create(
            organization=other_organization, registration_number="INC-B-001",
            make="Isuzu", model="NQR"
        )
        self.own_record = Income.objects.create(
            organization=self.organization, vehicle=None,
            description="Company income", amount=Decimal("250.00"),
            income_date=date(2026, 1, 5)
        )
        self.other_record = Income.objects.create(
            organization=other_organization, vehicle=None,
            description="Private income", amount=Decimal("900.00"),
            income_date=date(2026, 1, 5)
        )
        self.client.force_authenticate(user=self.owner)

    def test_list_includes_only_company_income_even_without_vehicle(self):
        response = self.client.get("/api/income/")
        self.assertEqual(response.status_code, 200)
        ids = {item["id"] for item in response.data}
        self.assertEqual(ids, {self.own_record.id})
        self.assertNotIn(self.other_record.id, ids)

    def test_cannot_assign_another_company_vehicle(self):
        response = self.client.post(
            "/api/income/",
            {
                "vehicle": self.other_vehicle.id,
                "description": "Unauthorized income",
                "amount": "100.00",
                "income_date": "2026-01-05",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
