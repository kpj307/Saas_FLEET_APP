from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from apps.organizations.models import Organization

User = get_user_model()


class CompanyRegistrationTests(APITestCase):
    def test_registration_creates_user_and_separate_organization(self):
        response = self.client.post(
            "/api/auth/register/",
            {
                "username": "new_fleet_owner",
                "email": "owner@example.com",
                "password": "Strong!Password849",
                "company_name": "New Fleet Company",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        user = User.objects.get(username="new_fleet_owner")
        organization = Organization.objects.get(owner=user)
        self.assertEqual(organization.name, "New Fleet Company")
        self.assertTrue(user.check_password("Strong!Password849"))
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_registration_rejects_duplicate_username(self):
        User.objects.create_user(
            username="already_taken",
            email="first@example.com",
            password="Strong!Password849",
        )
        response = self.client.post(
            "/api/auth/register/",
            {
                "username": "already_taken",
                "email": "second@example.com",
                "password": "Strong!Password849",
                "company_name": "Another Company",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_registration_rejects_weak_password(self):
        response = self.client.post(
            "/api/auth/register/",
            {
                "username": "weak_password_user",
                "email": "weak@example.com",
                "password": "123",
                "company_name": "Weak Password Company",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertFalse(User.objects.filter(username="weak_password_user").exists())


class CompanyOnboardingTests(APITestCase):
    def test_authenticated_user_can_create_company_once(self):
        user = User.objects.create_user(
            username="needs_onboarding",
            email="onboarding@example.com",
            password="Strong!Password849",
        )
        self.client.force_authenticate(user=user)

        response = self.client.post(
            "/api/auth/onboarding/",
            {"company_name": "Onboarded Fleet"},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Organization.objects.get(owner=user).name, "Onboarded Fleet")

        second_response = self.client.post(
            "/api/auth/onboarding/",
            {"company_name": "Duplicate Company"},
            format="json",
        )
        self.assertEqual(second_response.status_code, 409)
        self.assertEqual(Organization.objects.filter(owner=user).count(), 1)

    def test_onboarding_requires_authentication(self):
        response = self.client.post(
            "/api/auth/onboarding/",
            {"company_name": "Unauthorized Company"},
            format="json",
        )
        self.assertEqual(response.status_code, 401)
