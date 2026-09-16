from rest_framework import serializers

from .models import Expense


class ExpenseSerializer(serializers.ModelSerializer):
    organization = serializers.PrimaryKeyRelatedField(
        read_only=True
    )

    class Meta:
        model = Expense
        fields = [
            "id",
            "organization",
            "vehicle",
            "description",
            "amount",
            "expense_date",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "organization",
            "created_at",
            "updated_at",
        ]

    def validate_vehicle(self, vehicle):
        request = self.context.get("request")

        if request and vehicle.organization.owner != request.user:
            raise serializers.ValidationError(
                "You do not have access to this vehicle."
            )

        return vehicle