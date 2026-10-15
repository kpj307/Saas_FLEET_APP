from rest_framework import serializers

from .models import SubscriptionPayment


class CheckoutSerializer(serializers.Serializer):
    plan = serializers.ChoiceField(choices=["starter", "business"])


class SubscriptionPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPayment
        fields = ["tx_ref", "plan", "amount", "currency", "status", "created_at", "paid_at"]
        read_only_fields = fields
