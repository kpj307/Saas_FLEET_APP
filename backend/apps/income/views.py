from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Income
from .serializers import IncomeSerializer


class IncomeViewSet(viewsets.ModelViewSet):
    serializer_class = IncomeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Income.objects.filter(
            organization__owner=self.request.user
        )

    def perform_create(self, serializer):
        organization = getattr(
            self.request.user,
            "organization",
            None,
        )

        if organization is None:
            from rest_framework.exceptions import ValidationError

            raise ValidationError(
                "You do not have an organization."
            )

        serializer.save(organization=organization)