from django.core.management.base import BaseCommand

from apps.notifications.services import check_all_expiries


class Command(BaseCommand):
    help = "Check vehicle-related expiry dates and create notifications."

    def handle(self, *args, **options):
        notifications = check_all_expiries()

        count = len(notifications)

        self.stdout.write(
            self.style.SUCCESS(
                f"Expiry check completed. "
                f"{count} notification(s) created."
            )
        )