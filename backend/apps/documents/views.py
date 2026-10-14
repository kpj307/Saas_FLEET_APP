from rest_framework import status, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from .models import Document
from .serializers import DocumentSerializer


class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer

    def get_queryset(self):
        return (
            Document.objects
            .filter(
                vehicle__organization__owner=self.request.user
            )
            .select_related(
                "vehicle",
                "vehicle__organization",
            )
        )

    def perform_create(self, serializer):
        vehicle = serializer.validated_data["vehicle"]

        if (
            vehicle.organization.owner
            != self.request.user
        ):
            raise PermissionDenied(
                "You do not have permission to use this vehicle."
            )

        serializer.save()

    def destroy(self, request, *args, **kwargs):
        document = self.get_object()

        document.delete()

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )