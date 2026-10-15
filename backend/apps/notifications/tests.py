from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from apps.organizations.models import Organization
from apps.vehicles.models import Vehicle
from .models import Notification


class NotificationTenantIsolationTests(APITestCase):
    def setUp(self):
        user_model = get_user_model()
        self.owner = user_model.objects.create_user(
            username="notification_owner_a", password="test-password-123"
        )
        other_owner = user_model.objects.create_user(
            username="notification_owner_b", password="test-password-123"
        )
        self.organization = Organization.objects.create(
            owner=self.owner, name="Notification Company A"
        )
        other_organization = Organization.objects.create(
            owner=other_owner, name="Notification Company B"
        )
        self.vehicle = Vehicle.objects.create(
            organization=self.organization,
            registration_number="NOTIFY-A-001", make="Toyota", model="Hiace"
        )
        other_vehicle = Vehicle.objects.create(
            organization=other_organization,
            registration_number="NOTIFY-B-001", make="Isuzu", model="NQR"
        )
        self.own_notification = Notification.objects.create(
            organization=self.organization, vehicle=self.vehicle,
            title="Own alert", message="Company A alert"
        )
        self.other_notification = Notification.objects.create(
            organization=other_organization, vehicle=other_vehicle,
            title="Private alert", message="Company B alert"
        )
        self.client.force_authenticate(user=self.owner)

    def test_list_only_returns_company_notifications(self):
        response = self.client.get("/api/notifications/")
        self.assertEqual(response.status_code, 200)
        ids = {item["id"] for item in response.data}
        self.assertEqual(ids, {self.own_notification.id})
        self.assertNotIn(self.other_notification.id, ids)

    def test_account_without_organization_gets_empty_list(self):
        user = get_user_model().objects.create_user(
            username="no_organization", password="test-password-123"
        )
        self.client.force_authenticate(user=user)
        response = self.client.get("/api/notifications/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, [])
