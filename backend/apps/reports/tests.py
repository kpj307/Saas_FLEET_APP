from datetime import date
from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from apps.organizations.models import Organization
from apps.income.models import Income
from apps.expenses.models import Expense


class ReportTenantIsolationTests(APITestCase):
    def setUp(self):
        user_model = get_user_model()
        self.owner = user_model.objects.create_user(
            username="reports_owner_a", password="Strong!Password849"
        )
        other_owner = user_model.objects.create_user(
            username="reports_owner_b", password="Strong!Password849"
        )
        self.organization = Organization.objects.create(owner=self.owner, name="Reports A")
        other_organization = Organization.objects.create(owner=other_owner, name="Reports B")
        Income.objects.create(
            organization=self.organization, vehicle=None, description="Own income",
            amount=Decimal("300.00"), income_date=date(2026, 1, 5)
        )
        Income.objects.create(
            organization=other_organization, vehicle=None, description="Other income",
            amount=Decimal("9000.00"), income_date=date(2026, 1, 5)
        )
        Expense.objects.create(
            organization=self.organization, vehicle=None, description="Own expense",
            amount=Decimal("40.00"), expense_date=date(2026, 1, 5)
        )
        Expense.objects.create(
            organization=other_organization, vehicle=None, description="Other expense",
            amount=Decimal("4000.00"), expense_date=date(2026, 1, 5)
        )
        self.client.force_authenticate(user=self.owner)

    def test_report_totals_use_only_current_organization_records(self):
        response = self.client.get("/api/reports/summary/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Decimal(str(response.data["income_expenses"]["total_income"])), Decimal("300.00"))
        self.assertEqual(Decimal(str(response.data["income_expenses"]["total_expenses"])), Decimal("40.00"))
        self.assertEqual(Decimal(str(response.data["period_financials"]["total_income"])), Decimal("300.00"))
        self.assertEqual(Decimal(str(response.data["period_financials"]["total_expenses"])), Decimal("40.00"))
