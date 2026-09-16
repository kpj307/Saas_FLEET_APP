from django.db import models

from apps.organizations.models import Organization


class Vehicle(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        INACTIVE = "inactive", "Inactive"
        MAINTENANCE = "maintenance", "Maintenance"

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="vehicles",
    )
    registration_number = models.CharField(
        max_length=20,
        unique=True,
    )
    make = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
    )
    insurance_expiry = models.DateField(
        null=True,
        blank=True,
    )
    license_expiry = models.DateField(
        null=True,
        blank=True,
    )
    inspection_expiry = models.DateField(
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.registration_number} - {self.make} {self.model}"