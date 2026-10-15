from rest_framework import serializers

from apps.vehicles.models import Vehicle
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
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

    def validate_vehicle(self, vehicle):
        if vehicle is None:
            return vehicle

        request = self.context.get("request")
        if request and not Vehicle.objects.filter(
            pk=vehicle.pk,
            organization__owner=request.user,
        ).exists():
            raise serializers.ValidationError(
                "You do not have access to this vehicle."
            )
        return vehicle
