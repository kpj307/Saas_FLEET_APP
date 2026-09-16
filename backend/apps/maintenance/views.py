from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied

from .models import Maintenance
from .serializers import MaintenanceSerializer


class MaintenanceViewSet(viewsets.ModelViewSet):
    serializer_class = MaintenanceSerializer

    def get_queryset(self):
        return Maintenance.objects.filter(
            vehicle__organization__owner=self.request.user
        )

    def perform_create(self, serializer):
        vehicle = serializer.validated_data["vehicle"]

        if vehicle.organization.owner != self.request.user:
            raise PermissionDenied(
                "You cannot add maintenance for this vehicle."
            )

        serializer.save()