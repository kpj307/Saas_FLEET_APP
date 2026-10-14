from django.db import models

from apps.organizations.models import Organization
from apps.vehicles.models import Vehicle


class Notification(models.Model):
    class NotificationType(models.TextChoices):
        DOCUMENT_EXPIRY = (
            "document_expiry",
            "Document Expiry",
        )
        INSURANCE_EXPIRY = (
            "insurance_expiry",
            "Insurance Expiry",
        )
        LICENSE_EXPIRY = (
            "license_expiry",
            "License Expiry",
        )
        INSPECTION_EXPIRY = (
            "inspection_expiry",
            "Inspection Expiry",
        )
        MAINTENANCE = (
            "maintenance",
            "Maintenance",
        )
        GENERAL = (
            "general",
            "General",
        )

    class ReferenceType(models.TextChoices):
        DOCUMENT = (
            "document",
            "Document",
        )
        INSURANCE = (
            "insurance",
            "Insurance",
        )
        VEHICLE = (
            "vehicle",
            "Vehicle",
        )
        MAINTENANCE = (
            "maintenance",
            "Maintenance",
        )
        GENERAL = (
            "general",
            "General",
        )

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="notifications",
    )

    vehicle = models.ForeignKey(
        Vehicle,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notifications",
    )

    notification_type = models.CharField(
        max_length=50,
        choices=NotificationType.choices,
        default=NotificationType.GENERAL,
    )

    title = models.CharField(
        max_length=150
    )

    message = models.TextField()

    is_read = models.BooleanField(
        default=False
    )

    # Identifies the type of object that triggered
    # the notification.
    reference_type = models.CharField(
        max_length=30,
        choices=ReferenceType.choices,
        default=ReferenceType.GENERAL,
    )

    # Stores the ID of the related object.
    #
    # This is intentionally an IntegerField rather
    # than a GenericForeignKey so that the database
    # uniqueness constraint remains straightforward.
    reference_id = models.PositiveBigIntegerField(
        null=True,
        blank=True,
    )

    # Examples:
    # 30 = 30 days before expiry
    # 7  = 7 days before expiry
    # 1  = 1 day before expiry
    # 0  = expiry date
    reminder_days = models.IntegerField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        ordering = ["-created_at"]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "organization",
                    "reference_type",
                    "reference_id",
                    "notification_type",
                    "reminder_days",
                ],
                name=(
                    "unique_expiry_notification"
                ),
            ),
        ]

    def __str__(self):
        return self.title