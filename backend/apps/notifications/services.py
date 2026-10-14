from apps.documents.models import Document
from apps.vehicles.models import Vehicle
from apps.insurance.models import Insurance

from .models import Notification


REMINDER_DAYS = [30, 7, 1, 0]


def create_expiry_notification(
    *,
    organization,
    vehicle,
    notification_type,
    title,
    message,
    reference_type,
    reference_id,
    reminder_days,
):
    """
    Create an expiry notification.

    The database uniqueness constraint prevents
    duplicate notifications for the same reminder.
    """

    notification, created = (
        Notification.objects.get_or_create(
            organization=organization,
            reference_type=reference_type,
            reference_id=reference_id,
            notification_type=notification_type,
            reminder_days=reminder_days,
            defaults={
                "vehicle": vehicle,
                "title": title,
                "message": message,
            },
        )
    )

    if created:
        return notification

    return None


def check_vehicle_expiries():
    """
    Check vehicle license and inspection
    expiry dates.
    """

    from django.utils import timezone

    today = timezone.localdate()

    created_notifications = []

    vehicles = (
        Vehicle.objects
        .select_related("organization")
        .all()
    )

    for vehicle in vehicles:

        # -----------------------------
        # License
        # -----------------------------

        if vehicle.license_expiry:

            days_until_expiry = (
                vehicle.license_expiry - today
            ).days

            if (
                days_until_expiry
                in REMINDER_DAYS
            ):
                if days_until_expiry == 0:
                    title = (
                        "License Expired Today"
                    )
                else:
                    title = (
                        f"License Expires in "
                        f"{days_until_expiry} Days"
                    )

                message = (
                    f"Vehicle "
                    f"{vehicle.registration_number} "
                    f"license expires on "
                    f"{vehicle.license_expiry}."
                )

                notification = (
                    create_expiry_notification(
                        organization=(
                            vehicle.organization
                        ),
                        vehicle=vehicle,
                        notification_type=(
                            Notification
                            .NotificationType
                            .LICENSE_EXPIRY
                        ),
                        title=title,
                        message=message,
                        reference_type=(
                            Notification
                            .ReferenceType
                            .VEHICLE
                        ),
                        reference_id=vehicle.id,
                        reminder_days=(
                            days_until_expiry
                        ),
                    )
                )

                if notification:
                    created_notifications.append(
                        notification
                    )

        # -----------------------------
        # Inspection
        # -----------------------------

        if vehicle.inspection_expiry:

            days_until_expiry = (
                vehicle.inspection_expiry - today
            ).days

            if (
                days_until_expiry
                in REMINDER_DAYS
            ):
                if days_until_expiry == 0:
                    title = (
                        "Inspection Expired Today"
                    )
                else:
                    title = (
                        f"Inspection Expires in "
                        f"{days_until_expiry} Days"
                    )

                message = (
                    f"Vehicle "
                    f"{vehicle.registration_number} "
                    f"inspection expires on "
                    f"{vehicle.inspection_expiry}."
                )

                notification = (
                    create_expiry_notification(
                        organization=(
                            vehicle.organization
                        ),
                        vehicle=vehicle,
                        notification_type=(
                            Notification
                            .NotificationType
                            .INSPECTION_EXPIRY
                        ),
                        title=title,
                        message=message,
                        reference_type=(
                            Notification
                            .ReferenceType
                            .VEHICLE
                        ),
                        reference_id=vehicle.id,
                        reminder_days=(
                            days_until_expiry
                        ),
                    )
                )

                if notification:
                    created_notifications.append(
                        notification
                    )

    return created_notifications


def check_document_expiries():
    """
    Check document expiry dates.
    """

    from django.utils import timezone

    today = timezone.localdate()

    created_notifications = []

    documents = (
        Document.objects
        .select_related(
            "vehicle",
            "vehicle__organization",
        )
        .filter(
            expiry_date__isnull=False
        )
    )

    for document in documents:

        days_until_expiry = (
            document.expiry_date - today
        ).days

        if (
            days_until_expiry
            not in REMINDER_DAYS
        ):
            continue

        if days_until_expiry == 0:
            title = (
                "Document Expires Today"
            )
        else:
            title = (
                f"Document Expires in "
                f"{days_until_expiry} Days"
            )

        message = (
            f"{document.title} for vehicle "
            f"{document.vehicle.registration_number} "
            f"expires on "
            f"{document.expiry_date}."
        )

        notification = (
            create_expiry_notification(
                organization=(
                    document.vehicle.organization
                ),
                vehicle=document.vehicle,
                notification_type=(
                    Notification
                    .NotificationType
                    .DOCUMENT_EXPIRY
                ),
                title=title,
                message=message,
                reference_type=(
                    Notification
                    .ReferenceType
                    .DOCUMENT
                ),
                reference_id=document.id,
                reminder_days=(
                    days_until_expiry
                ),
            )
        )

        if notification:
            created_notifications.append(
                notification
            )

    return created_notifications


def check_insurance_expiries():
    from django.utils import timezone

    today = timezone.localdate()
    created_notifications = []

    insurance_records = (
        Insurance.objects
        .select_related("vehicle", "vehicle__organization")
        .filter(expiry_date__isnull=False)
    )

    for insurance in insurance_records:
        days_until_expiry = (insurance.expiry_date - today).days

        if days_until_expiry not in REMINDER_DAYS:
            continue

        if days_until_expiry == 0:
            title = "Insurance Expires Today"
        else:
            title = f"Insurance Expires in {days_until_expiry} Days"

        message = (
            f"Insurance policy {insurance.policy_number} "
            f"for vehicle {insurance.vehicle.registration_number} "
            f"expires on {insurance.expiry_date}."
        )

        notification = create_expiry_notification(
            organization=insurance.vehicle.organization,
            vehicle=insurance.vehicle,
            notification_type=Notification.NotificationType.INSURANCE_EXPIRY,
            title=title,
            message=message,
            reference_type=Notification.ReferenceType.INSURANCE,
            reference_id=insurance.id,
            reminder_days=days_until_expiry,
        )

        if notification:
            created_notifications.append(notification)

    return created_notifications

def check_all_expiries():
    """
        Check all supported expiry dates.
    """
    vehicle_notifications = check_vehicle_expiries()
    document_notifications = check_document_expiries()
    insurance_notifications = check_insurance_expiries()

    return (
        vehicle_notifications
        + document_notifications
        + insurance_notifications
    )