from rest_framework import serializers

from apps.vehicles.models import Vehicle

from .models import Document


class DocumentSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = Document

        fields = [
            "id",
            "vehicle",
            "title",
            "document_type",
            "file",
            "expiry_date",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def validate_vehicle(self, vehicle):
        request = self.context.get(
            "request"
        )

        if not request:
            return vehicle

        if not Vehicle.objects.filter(
            id=vehicle.id,
            organization__owner=request.user,
        ).exists():
            raise serializers.ValidationError(
                "You do not have permission to use this vehicle."
            )

        return vehicle

    def validate_file(self, file):
        """
        The model validator performs the actual
        security validation. This serializer
        provides an additional API-level check.
        """

        if not file:
            return file

        allowed_extensions = {
            ".pdf",
            ".jpg",
            ".jpeg",
            ".png",
            ".webp",
            ".txt",
        }

        import os

        extension = os.path.splitext(
            file.name
        )[1].lower()

        if extension not in allowed_extensions:
            raise serializers.ValidationError(
                "Unsupported file extension."
            )

        if file.size > 5 * 1024 * 1024:
            raise serializers.ValidationError(
                "Document file must not exceed 5 MB."
            )

        return file