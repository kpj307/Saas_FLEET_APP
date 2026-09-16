from decimal import Decimal

from django.db.models import Sum
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.insurance.models import Insurance
from apps.maintenance.models import Maintenance
from apps.notifications.models import Notification
from apps.vehicles.models import Vehicle
from apps.income.models import Income
from apps.expenses.models import Expense


class ReportsSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        organization = getattr(
            request.user,
            "organization",
            None,
        )

        if organization is None:
            return Response(
                {
                    "detail": "You do not have an organization."
                },
                status=403,
            )

        vehicles = Vehicle.objects.filter(
            organization=organization
        )

        maintenance_records = Maintenance.objects.filter(
            vehicle__organization=organization
        )

        insurance_records = Insurance.objects.filter(
            vehicle__organization=organization
        )

        income_records = Income.objects.filter(
            organization=organization
        )

        expense_records = Expense.objects.filter(
            organization=organization
        )

        notifications = Notification.objects.filter(
            organization=organization
        )

        total_maintenance_cost = (
            maintenance_records.aggregate(
                total=Sum("cost")
            )["total"]
            or Decimal("0.00")
        )

        total_insurance_cost = (
            insurance_records.aggregate(
                total=Sum("cost")
            )["total"]
            or Decimal("0.00")
        )

        total_income = (
            income_records.aggregate(
                total=Sum("amount")
            )["total"]
            or Decimal("0.00")
        )

        total_expenses = (
            expense_records.aggregate(
                total=Sum("amount")
            )["total"]
            or Decimal("0.00")
        )

        net_income = total_income - total_expenses

        total_costs = (
            total_maintenance_cost
            + total_insurance_cost
            + total_expenses
        )

        profit_after_all_costs = total_income - total_costs

        data = {
            "vehicles": {
                "total": vehicles.count(),
                "active": vehicles.filter(
                    status=Vehicle.Status.ACTIVE
                ).count(),
                "inactive": vehicles.filter(
                    status=Vehicle.Status.INACTIVE
                ).count(),
                "under_maintenance": vehicles.filter(
                    status=Vehicle.Status.MAINTENANCE
                ).count(),
            },
            "maintenance": {
                "total_records": maintenance_records.count(),
                "total_cost": str(
                    total_maintenance_cost
                ),
            },
            "insurance": {
                "total_policies": insurance_records.count(),
                "total_cost": str(
                    total_insurance_cost
                ),
            },
            "notifications": {
                "total": notifications.count(),
                "unread": notifications.filter(
                    is_read=False
                ).count(),
            },
            "income_expenses": {
                "total_income_records": income_records.count(),
                "total_income": str(total_income),
                "total_expense_records": expense_records.count(),
                "total_expenses": str(total_expenses),
                "net_income": str(net_income),
                "total_costs": str(total_costs),
                "profit_after_all_costs": str(
                    profit_after_all_costs
                ),
            },
        }

        return Response(data)