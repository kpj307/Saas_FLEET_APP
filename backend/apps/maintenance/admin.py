from django.contrib import admin

from .models import Maintenance


@admin.register(Maintenance)
class MaintenanceAdmin(admin.ModelAdmin):
    list_display = (
        "vehicle",
        "title",
        "maintenance_date",
        "cost",
        "status",
    )
    list_filter = (
        "status",
        "maintenance_date",
    )
    search_fields = (
        "vehicle__registration_number",
        "title",
        "description",
    )