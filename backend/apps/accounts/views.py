from django.db import transaction
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.serializers import ValidationError
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.organizations.models import Organization
from .serializers import CompanyRegistrationSerializer


class CompanyRegistrationView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = CompanyRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user, organization = serializer.save()

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": {
                    "id": user.pk,
                    "username": user.get_username(),
                    "email": user.email,
                },
                "organization": {
                    "id": organization.pk,
                    "name": organization.name,
                },
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            },
            status=status.HTTP_201_CREATED,
        )


class CompanyOnboardingView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if getattr(request.user, "organization", None) is not None:
            return Response(
                {"detail": "Your account already has a company."},
                status=status.HTTP_409_CONFLICT,
            )

        company_name = request.data.get("company_name", "")
        if not isinstance(company_name, str) or not company_name.strip():
            raise ValidationError({"company_name": "Enter your company name."})
        if len(company_name.strip()) > 150:
            raise ValidationError(
                {"company_name": "Company name must be 150 characters or fewer."}
            )

        with transaction.atomic():
            organization = Organization.objects.create(
                owner=request.user,
                name=company_name.strip(),
            )

        return Response(
            {"organization": {"id": organization.pk, "name": organization.name}},
            status=status.HTTP_201_CREATED,
        )
