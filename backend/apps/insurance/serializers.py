from rest_framework import serializers
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