from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied

from .models import Document
from .serializers import DocumentSerializer


class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer

    def get_queryset(self):
        return Document.objects.filter(
            vehicle__organization__owner=self.request.user
        )

    def perform_create(self, serializer):
        vehicle = serializer.validated_data["vehicle"]

        if vehicle.organization.owner != self.request.user:
            raise PermissionDenied(
                "You cannot add documents for this vehicle."
            )

        serializer.save()