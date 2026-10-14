import os
import uuid

from django.core.exceptions import ValidationError
from django.db import models

from apps.vehicles.models import Vehicle


ALLOWED_DOCUMENT_EXTENSIONS = {
    ".pdf",
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".txt",
}

MAX_DOCUMENT_SIZE = 5 * 1024 * 1024


def validate_document_file(file):
    """
    Validate uploaded vehicle documents.
    """

    if not file:
        return

    if file.size > MAX_DOCUMENT_SIZE:
        raise ValidationError(
            "Document file must not exceed 5 MB."
        )

    extension = os.path.splitext(
        file.name
    )[1].lower()

    if extension not in ALLOWED_DOCUMENT_EXTENSIONS:
        raise ValidationError(
            "Unsupported file type. "
            "Allowed types: PDF, JPG, JPEG, PNG, WEBP, TXT."
        )

    allowed_content_types = {
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/webp",
        "text/plain",
    }

    content_type = getattr(
        file,
        "content_type",
        None,
    )

    if (
        content_type
        and content_type not in allowed_content_types
    ):
        raise ValidationError(
            "Unsupported file content type."
        )


def document_upload_path(instance, filename):
    """
    Generate a unique filename for uploaded documents.
    """

    extension = os.path.splitext(
        filename
    )[1].lower()

    unique_filename = (
        f"{uuid.uuid4().hex}{extension}"
    )

    return (
        f"vehicle_documents/"
        f"{instance.vehicle_id}/"
        f"{unique_filename}"
    )


class Document(models.Model):
    class DocumentType(models.TextChoices):
        LOGBOOK = "logbook", "Logbook"
        REGISTRATION = "registration", "Registration"
        INSPECTION = "inspection", "Inspection"
        SERVICE_RECEIPT = (
            "service_receipt",
            "Service Receipt",
        )
        OTHER = "other", "Other"

    vehicle = models.ForeignKey(
        Vehicle,
        on_delete=models.CASCADE,
        related_name="documents",
    )

    title = models.CharField(
        max_length=150
    )

    document_type = models.CharField(
        max_length=30,
        choices=DocumentType.choices,
        default=DocumentType.OTHER,
    )

    file = models.FileField(
        upload_to=document_upload_path,
        validators=[validate_document_file],
    )

    expiry_date = models.DateField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def delete(self, *args, **kwargs):
        file = self.file

        super().delete(*args, **kwargs)

        if file and file.name:
            if file.storage.exists(file.name):
                file.delete(save=False)

    def save(self, *args, **kwargs):
        old_file = None

        if self.pk:
            try:
                old_document = Document.objects.get(
                    pk=self.pk
                )
                old_file = old_document.file
            except Document.DoesNotExist:
                pass

        super().save(*args, **kwargs)

        if (
            old_file
            and old_file.name
            and old_file.name != self.file.name
        ):
            if old_file.storage.exists(
                old_file.name
            ):
                old_file.delete(
                    save=False
                )

    class Meta:
        ordering = [
            "-created_at"
        ]

    def __str__(self):
        return self.title