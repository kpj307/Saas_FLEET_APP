from django.db import models

from apps.organizations.models import Organization
from apps.vehicles.models import Vehicle


class Income(models.Model):
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="income_records",
    )
    vehicle = models.ForeignKey(
        Vehicle,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="income_records",
    )
    description = models.CharField(max_length=150)
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )
    income_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-income_date", "-created_at"]

    def __str__(self):
        return self.description