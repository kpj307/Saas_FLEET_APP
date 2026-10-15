from rest_framework import serializers

from apps.vehicles.models import Vehicle
from .models import Insurance


class InsuranceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Insurance
        fields = [
            "id",
            "vehicle",
            "provider",
            "policy_number",
            "start_date",
            "expiry_date",
            "cost",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def validate_vehicle(self, vehicle):
        request = self.context.get("request")
        if request and not Vehicle.objects.filter(
            pk=vehicle.pk,
            organization__owner=request.user,
        ).exists():
            raise serializers.ValidationError(
                "You do not have access to this vehicle."
            )
        return vehicle
