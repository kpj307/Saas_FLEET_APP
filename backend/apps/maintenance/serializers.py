from rest_framework import serializers

from .models import Maintenance


class MaintenanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Maintenance
        fields = [
            "id",
            "vehicle",
            "title",
            "description",
            "maintenance_date",
            "cost",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]