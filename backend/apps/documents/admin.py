from django.contrib import admin

from .models import Document


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = (
        "vehicle",
        "title",
        "document_type",
        "expiry_date",
        "created_at",
    )
    list_filter = (
        "document_type",
        "expiry_date",
    )
    search_fields = (
        "vehicle__registration_number",
        "title",
    )