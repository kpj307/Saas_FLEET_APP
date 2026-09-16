from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied

from .models import Insurance
from .serializers import InsuranceSerializer


class InsuranceViewSet(viewsets.ModelViewSet):
    serializer_class = InsuranceSerializer

    def get_queryset(self):
        return Insurance.objects.filter(
            vehicle__organization__owner=self.request.user
        )

    def perform_create(self, serializer):
        vehicle = serializer.validated_data["vehicle"]

        if vehicle.organization.owner != self.request.user:
            raise PermissionDenied(
                "You cannot add insurance for this vehicle."
            )

        serializer.save()