from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied, APIException
from rest_framework import status

from apps.subscriptions.services import effective_plan, subscription_for

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

        organization = self.request.user.organization
        plan = effective_plan(subscription_for(organization))
        vehicle_count = Vehicle.objects.filter(organization=organization).count()
        if vehicle_count >= plan["vehicle_limit"]:
            raise APIException(
                {
                    "code": "vehicle_limit_reached",
                    "detail": (
                        f"Your {plan['name']} plan allows up to "
                        f"{plan['vehicle_limit']} vehicles. Upgrade your plan to add more."
                    ),
                    "plan": plan["code"],
                    "vehicle_limit": plan["vehicle_limit"],
                    "vehicle_count": vehicle_count,
                },
                code=status.HTTP_403_FORBIDDEN,
            )

        serializer.save(organization=organization)