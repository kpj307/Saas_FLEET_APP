from django.contrib import admin

from .models import Vehicle


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = (
        "registration_number",
        "make",
        "model",
        "status",
        "organization",
        "insurance_expiry",
        "license_expiry",
        "inspection_expiry",
    )
    list_filter = ("status", "organization")
    search_fields = (
        "registration_number",
        "make",
        "model",
    )