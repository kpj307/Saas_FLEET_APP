from django.db import models

from apps.vehicles.models import Vehicle


class Document(models.Model):
    class DocumentType(models.TextChoices):
        LOGBOOK = "logbook", "Logbook"
        REGISTRATION = "registration", "Registration"
        INSPECTION = "inspection", "Inspection"
        SERVICE_RECEIPT = "service_receipt", "Service Receipt"
        OTHER = "other", "Other"

    vehicle = models.ForeignKey(
        Vehicle,
        on_delete=models.CASCADE,
        related_name="documents",
    )
    title = models.CharField(max_length=150)
    document_type = models.CharField(
        max_length=30,
        choices=DocumentType.choices,
        default=DocumentType.OTHER,
    )
    file = models.FileField(upload_to="vehicle_documents/")
    expiry_date = models.DateField(
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.vehicle.registration_number} - {self.title}"