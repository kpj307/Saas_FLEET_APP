from django.db import models
from apps.vehicles.models import Vehicle


class Insurance(models.Model):
    vehicle = models.ForeignKey(
        Vehicle,
        on_delete=models.CASCADE,
        related_name="insurance_records",
    )
    provider = models.CharField(max_length=150)
    policy_number = models.CharField(max_length=100)
    start_date = models.DateField()
    expiry_date = models.DateField()
    cost = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-expiry_date", "-created_at"]

    def __str__(self):
        return (
            f"{self.vehicle.registration_number} - "
            f"{self.provider} - {self.policy_number}"
        )