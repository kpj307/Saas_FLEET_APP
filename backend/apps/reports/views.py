
from datetime import date
from decimal import Decimal

from django.db.models import Sum
from django.db.models.functions import TruncMonth
from django.utils import timezone
from django.utils.dateparse import parse_date

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.expenses.models import Expense
from apps.income.models import Income
from apps.insurance.models import Insurance
from apps.maintenance.models import Maintenance
from apps.notifications.models import Notification
from apps.vehicles.models import Vehicle


class ReportsSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # ---------------------------------------------------------
        # 1. Determine the user's organization
        # ---------------------------------------------------------
        organization = getattr(user, "organization", None)

        if organization is None:
            return Response(
                {"detail": "Your account is not associated with an organization."},
                status=400,
            )

        # ---------------------------------------------------------
        # 2. Base querysets: always restricted to this organization
        # ---------------------------------------------------------
        vehicles = Vehicle.objects.filter(organization=organization)

        maintenance_records = Maintenance.objects.filter(
            vehicle__organization=organization
        )

        insurance_records = Insurance.objects.filter(
            vehicle__organization=organization
        )

        income_records = Income.objects.filter(
            vehicle__organization=organization
        )

        expense_records = Expense.objects.filter(
            vehicle__organization=organization
        )

        notifications = Notification.objects.filter(
            organization=organization
        )

        # Keep original querysets unchanged for all-time totals.
        period_maintenance_records = maintenance_records
        period_insurance_records = insurance_records
        period_income_records = income_records
        period_expense_records = expense_records
        period_notifications = notifications

        # ---------------------------------------------------------
        # 3. Parse and validate date filters
        #
        # Supported:
        # ?month=9&year=2026
        # ?start_date=2026-09-01&end_date=2026-09-30
        # ---------------------------------------------------------
        month_value = request.query_params.get("month")
        year_value = request.query_params.get("year")
        start_value = request.query_params.get("start_date")
        end_value = request.query_params.get("end_date")

        has_month_filter = month_value not in (None, "")
        has_year_filter = year_value not in (None, "")
        has_start_filter = start_value not in (None, "")
        has_end_filter = end_value not in (None, "")

        if has_month_filter != has_year_filter:
            return Response(
                {"detail": "Provide both month and year."},
                status=400,
            )

        if has_start_filter != has_end_filter:
            return Response(
                {"detail": "Provide both start_date and end_date."},
                status=400,
            )

        if (
            has_month_filter or has_year_filter
        ) and (
            has_start_filter or has_end_filter
        ):
            return Response(
                {
                    "detail": (
                        "Use either month/year or start_date/end_date, "
                        "not both."
                    )
                },
                status=400,
            )

        filter_start_date = None
        filter_end_date = None

        if has_month_filter and has_year_filter:
            try:
                selected_month = int(month_value)
                selected_year = int(year_value)

                if not 1 <= selected_month <= 12:
                    raise ValueError

                if not 1 <= selected_year <= 9999:
                    raise ValueError

                filter_start_date = date(
                    selected_year, selected_month, 1
                )

                if selected_month == 12:
                    filter_end_date = date(
                        selected_year + 1, 1, 1
                    )
                    # Use the last day of December.
                    filter_end_date = date(
                        selected_year, 12, 31
                    )
                else:
                    filter_end_date = date(
                        selected_year,
                        selected_month + 1,
                        1,
                    )
                    from datetime import timedelta
                    filter_end_date -= timedelta(days=1)

            except (ValueError, OverflowError):
                return Response(
                    {"detail": "Invalid month or year."},
                    status=400,
                )

        elif has_start_filter and has_end_filter:
            filter_start_date = parse_date(start_value)
            filter_end_date = parse_date(end_value)

            if not filter_start_date or not filter_end_date:
                return Response(
                    {
                        "detail": (
                            "Dates must use YYYY-MM-DD format."
                        )
                    },
                    status=400,
                )

            if filter_start_date > filter_end_date:
                return Response(
                    {
                        "detail": (
                            "start_date cannot be later than end_date."
                        )
                    },
                    status=400,
                )

        filters_applied = (
            filter_start_date is not None
            and filter_end_date is not None
        )

        # ---------------------------------------------------------
        # 4. Apply period filters
        # ---------------------------------------------------------
        if filters_applied:
            period_maintenance_records = (
                period_maintenance_records.filter(
                    maintenance_date__gte=filter_start_date,
                    maintenance_date__lte=filter_end_date,
                )
            )

            # Insurance is filtered by policy start date.
            period_insurance_records = (
                period_insurance_records.filter(
                    start_date__gte=filter_start_date,
                    start_date__lte=filter_end_date,
                )
            )

            period_income_records = period_income_records.filter(
                income_date__gte=filter_start_date,
                income_date__lte=filter_end_date,
            )

            period_expense_records = period_expense_records.filter(
                expense_date__gte=filter_start_date,
                expense_date__lte=filter_end_date,
            )

            # Notification has created_at, not due_date.
            # This counts notifications created during the period.
            period_notifications = period_notifications.filter(
                created_at__date__gte=filter_start_date,
                created_at__date__lte=filter_end_date,
            )

        # ---------------------------------------------------------
        # 5. Vehicle summary (all-time)
        # ---------------------------------------------------------
        vehicle_summary = {
            "total": vehicles.count(),
            "active": vehicles.filter(status="active").count(),
            "inactive": vehicles.filter(status="inactive").count(),
            "under_maintenance": vehicles.filter(
                status="under_maintenance"
            ).count(),
        }

        # ---------------------------------------------------------
        # 6. Maintenance summary (all-time)
        # ---------------------------------------------------------
        maintenance_summary = {
            "total_records": maintenance_records.count(),
            "total_cost": (
                maintenance_records.aggregate(
                    total=Sum("cost")
                )["total"]
                or Decimal("0.00")
            ),
        }

        # ---------------------------------------------------------
        # 7. Insurance summary (all-time)
        # ---------------------------------------------------------
        insurance_summary = {
            "total_policies": insurance_records.count(),
            "total_cost": (
                insurance_records.aggregate(
                    total=Sum("cost")
                )["total"]
                or Decimal("0.00")
            ),
        }

        # ---------------------------------------------------------
        # 8. Notification summary (all-time)
        # ---------------------------------------------------------
        notifications_summary = {
            "total": notifications.count(),
            "unread": notifications.filter(is_read=False).count(),
            "read": notifications.filter(is_read=True).count(),
        }

        # ---------------------------------------------------------
        # 9. Income and expense summary (all-time)
        # ---------------------------------------------------------
        total_income = (
            income_records.aggregate(total=Sum("amount"))["total"]
            or Decimal("0.00")
        )

        total_expenses = (
            expense_records.aggregate(total=Sum("amount"))["total"]
            or Decimal("0.00")
        )

        net_income = total_income - total_expenses

        all_time_maintenance_cost = (
            maintenance_records.aggregate(
                total=Sum("cost")
            )["total"]
            or Decimal("0.00")
        )

        all_time_insurance_cost = (
            insurance_records.aggregate(
                total=Sum("cost")
            )["total"]
            or Decimal("0.00")
        )

        all_time_total_costs = (
            total_expenses
            + all_time_maintenance_cost
            + all_time_insurance_cost
        )

        income_expenses_summary = {
            "total_income_records": income_records.count(),
            "total_income": total_income,
            "total_expense_records": expense_records.count(),
            "total_expenses": total_expenses,
            "net_income": net_income,
            "total_costs": all_time_total_costs,
            "profit_after_all_costs": total_income - all_time_total_costs,
        }

        # ---------------------------------------------------------
        # 10. Period-specific maintenance and insurance costs
        # ---------------------------------------------------------
        period_maintenance_cost = (
            period_maintenance_records.aggregate(
                total=Sum("cost")
            )["total"]
            or Decimal("0.00")
        )

        period_insurance_cost = (
            period_insurance_records.aggregate(
                total=Sum("cost")
            )["total"]
            or Decimal("0.00")
        )

        period_income = (
            period_income_records.aggregate(
                total=Sum("amount")
            )["total"]
            or Decimal("0.00")
        )

        period_expenses = (
            period_expense_records.aggregate(
                total=Sum("amount")
            )["total"]
            or Decimal("0.00")
        )

        period_net_income = period_income - period_expenses

        period_total_costs = (
            period_expenses
            + period_maintenance_cost
            + period_insurance_cost
        )

        period_financials = {
            "total_income": period_income,
            "total_expenses": period_expenses,
            "net_income": period_net_income,
            "maintenance_cost": period_maintenance_cost,
            "insurance_cost": period_insurance_cost,
            "total_costs": period_total_costs,
            "profit_after_all_costs": (
                period_income - period_total_costs
            ),
        }

        # ---------------------------------------------------------
        # 11. Period-specific record counts
        # ---------------------------------------------------------
        period_counts = {
            "maintenance_records": (
                period_maintenance_records.count()
            ),
            "insurance_policies": (
                period_insurance_records.count()
            ),
            "notifications_total": period_notifications.count(),
            "notifications_unread": (
                period_notifications.filter(is_read=False).count()
            ),
            "notifications_read": (
                period_notifications.filter(is_read=True).count()
            ),
        }

        # ---------------------------------------------------------
        # 12. Monthly income and expense chart
        #
        # When a date range is selected, use that range.
        # Otherwise, show the current month and previous 11 months.
        # ---------------------------------------------------------
        today = timezone.localdate()

        if filters_applied:
            chart_start_date = filter_start_date
            chart_end_date = filter_end_date
        else:
            chart_start_date = date(
                today.year - 1 if today.month == 1 else today.year,
                12 if today.month == 1 else today.month - 1,
                1,
            )

            # Move back 11 months from the current month.
            month_index = today.year * 12 + today.month - 1 - 11
            chart_year = month_index // 12
            chart_month = month_index % 12 + 1
            chart_start_date = date(chart_year, chart_month, 1)
            chart_end_date = today

        chart_income_records = income_records.filter(
            income_date__gte=chart_start_date,
            income_date__lte=chart_end_date,
        )

        chart_expense_records = expense_records.filter(
            expense_date__gte=chart_start_date,
            expense_date__lte=chart_end_date,
        )

        monthly_income_rows = (
            chart_income_records.annotate(
                month=TruncMonth("income_date")
            )
            .values("month")
            .annotate(total=Sum("amount"))
            .order_by("month")
        )

        monthly_expense_rows = (
            chart_expense_records.annotate(
                month=TruncMonth("expense_date")
            )
            .values("month")
            .annotate(total=Sum("amount"))
            .order_by("month")
        )

        monthly_income_map = {
            row["month"].strftime("%Y-%m"): row["total"]
            for row in monthly_income_rows
            if row["month"] is not None
        }

        monthly_expense_map = {
            row["month"].strftime("%Y-%m"): row["total"]
            for row in monthly_expense_rows
            if row["month"] is not None
        }

        monthly_finances = []

        current_month = date(
            chart_start_date.year,
            chart_start_date.month,
            1,
        )

        while current_month <= chart_end_date:
            month_key = current_month.strftime("%Y-%m")
            month_income = (
                monthly_income_map.get(month_key)
                or Decimal("0.00")
            )
            month_expenses = (
                monthly_expense_map.get(month_key)
                or Decimal("0.00")
            )

            monthly_finances.append(
                {
                    "month": month_key,
                    "income": month_income,
                    "expenses": month_expenses,
                    "net_income": month_income - month_expenses,
                }
            )

            if current_month.month == 12:
                current_month = date(
                    current_month.year + 1, 1, 1
                )
            else:
                current_month = date(
                    current_month.year,
                    current_month.month + 1,
                    1,
                )

        # ---------------------------------------------------------
        # 13. Return report data
        # ---------------------------------------------------------
        return Response(
            {
                "vehicles": vehicle_summary,
                "maintenance": maintenance_summary,
                "insurance": insurance_summary,
                "notifications": notifications_summary,
                "income_expenses": income_expenses_summary,
                "financial_filters": {
                    "applied": filters_applied,
                    "start_date": (
                        filter_start_date.isoformat()
                        if filter_start_date
                        else None
                    ),
                    "end_date": (
                        filter_end_date.isoformat()
                        if filter_end_date
                        else None
                    ),
                },
                "monthly_finances": monthly_finances,
                "period_financials": period_financials,
                "period_counts": period_counts,
            }
        )