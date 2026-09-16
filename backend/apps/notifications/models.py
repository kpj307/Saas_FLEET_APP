from django.conf import settings
from django.db import models
from apps.organizations.models import Organization
from apps.vehicles.models import Vehicle


class Notification(models.Model):
    class NotificationType(models.TextChoices):
        INSURANCE_EXPIRY = "insurance_expiry", "Insurance Expiry"
        LICENSE_EXPIRY = "license_expiry", "License Expiry"
        INSPECTION_EXPIRY = "inspection_expiry", "Inspection Expiry"
        DOCUMENT_EXPIRY = "document_expiry", "Document Expiry"
        MAINTENANCE = "maintenance", "Maintenance"
        OTHER = "other", "Other"

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    vehicle = models.ForeignKey(
        Vehicle,
        on_delete=models.CASCADE,
        related_name="notifications",
        null=True,
        blank=True,
    )
    notification_type = models.CharField(
        max_length=30,
        choices=NotificationType.choices,
        default=NotificationType.OTHER,
    )
    title = models.CharField(max_length=150)
    message = models.TextField()
    due_date = models.DateField(null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["is_read", "-created_at"]

    def __str__(self):
        return self.title