from django.db import models

from apps.organizations.models import Organization
from apps.vehicles.models import Vehicle


class Expense(models.Model):
    class Category(models.TextChoices):
        FUEL = "Fuel", "Fuel"
        MAINTENANCE = "Maintenance", "Maintenance"
        REPAIRS = "Repairs", "Repairs"
        INSURANCE = "Insurance", "Insurance"
        LICENSING = "Licensing", "Licensing"
        SALARIES = "Salaries", "Salaries"
        ROUTINE = "Routine", "Routine"
        OTHER = "Other", "Other"

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="expense_records",
    )

    vehicle = models.ForeignKey(
        Vehicle,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="expense_records",
    )

    description = models.CharField(max_length=150)

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    expense_date = models.DateField()

    category = models.CharField(
        max_length=30,
        choices=Category.choices,
        default=Category.OTHER,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-expense_date", "-created_at"]

    def __str__(self):
        return self.description
