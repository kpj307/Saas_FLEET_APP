from rest_framework import serializers

from .models import Notification


class NotificationSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = Notification

        fields = [
            "id",
            "organization",
            "vehicle",
            "notification_type",
            "title",
            "message",
            "is_read",
            "reference_type",
            "reference_id",
            "reminder_days",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "organization",
            "reference_type",
            "reference_id",
            "reminder_days",
            "created_at",
        ]