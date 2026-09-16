from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(
            organization__owner=self.request.user
        )

    def perform_create(self, serializer):
        if not hasattr(self.request.user, "organization"):
            raise PermissionDenied(
                "You do not have an organization."
            )

        vehicle = serializer.validated_data.get("vehicle")

        if vehicle is not None:
            if vehicle.organization.owner != self.request.user:
                raise PermissionDenied(
                    "You cannot create a notification for this vehicle."
                )

        serializer.save(
            organization=self.request.user.organization
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="mark-read",
    )
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save(update_fields=["is_read", "updated_at"])

        return Response(
            {
                "message": "Notification marked as read.",
                "notification": NotificationSerializer(
                    notification
                ).data,
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="mark-unread",
    )
    def mark_unread(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = False
        notification.save(update_fields=["is_read", "updated_at"])

        return Response(
            {
                "message": "Notification marked as unread.",
                "notification": NotificationSerializer(
                    notification
                ).data,
            },
            status=status.HTTP_200_OK,
        )