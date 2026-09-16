from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Expense
from .serializers import ExpenseSerializer


class ExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Expense.objects.filter(
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