from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Notification.objects
            .filter(
                organization=self.request.user.organization
            )
            .select_related("vehicle")
            .order_by("-created_at")
        )

    def perform_create(self, serializer):
        serializer.save(
            organization=self.request.user.organization
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="unread-count",
    )
    def unread_count(self, request):
        count = self.get_queryset().filter(
            is_read=False
        ).count()

        return Response(
            {"count": count},
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="mark-read",
    )
    def mark_read(self, request, pk=None):
        notification = self.get_object()

        notification.is_read = True
        notification.save(
            update_fields=["is_read"]
        )

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
    detail=False,
    methods=["post"],
    url_path="mark-all-read",
    )
    def mark_all_read(self, request):
        updated_count = (
            self.get_queryset()
            .filter(is_read=False)
            .update(is_read=True)
        )

        return Response(
            {
                "message": "All notifications marked as read.",
                "updated_count": updated_count,
            },
            status=status.HTTP_200_OK,
        )