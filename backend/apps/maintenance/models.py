from django.db import models

from apps.vehicles.models import Vehicle


class Maintenance(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        IN_PROGRESS = "in_progress", "In Progress"
        COMPLETED = "completed", "Completed"

    vehicle = models.ForeignKey(
        Vehicle,
        on_delete=models.CASCADE,
        related_name="maintenance_records",
    )
    title = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    maintenance_date = models.DateField()
    cost = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-maintenance_date", "-created_at"]

    def __str__(self):
        return f"{self.vehicle.registration_number} - {self.title}"