from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied

from .models import Vehicle
from .serializers import VehicleSerializer


class VehicleViewSet(viewsets.ModelViewSet):
    serializer_class = VehicleSerializer

    def get_queryset(self):
        return Vehicle.objects.filter(
            organization__owner=self.request.user
        )

    def perform_create(self, serializer):
        if not hasattr(self.request.user, "organization"):
            raise PermissionDenied(
                "You do not have an organization."
            )

        serializer.save(
            organization=self.request.user.organization
        )