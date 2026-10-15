# Initial subscription and payment records.
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("organizations", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Subscription",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("plan", models.CharField(choices=[("free", "Free"), ("starter", "Starter"), ("business", "Business")], default="free", max_length=20)),
                ("status", models.CharField(choices=[("active", "Active"), ("expired", "Expired"), ("canceled", "Canceled")], default="active", max_length=20)),
                ("current_period_start", models.DateTimeField(blank=True, null=True)),
                ("current_period_end", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("organization", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="subscription", to="organizations.organization")),
            ],
        ),
        migrations.CreateModel(
            name="SubscriptionPayment",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("plan", models.CharField(choices=[("free", "Free"), ("starter", "Starter"), ("business", "Business")], max_length=20)),
                ("amount", models.DecimalField(decimal_places=2, max_digits=12)),
                ("currency", models.CharField(default="UGX", max_length=3)),
                ("tx_ref", models.CharField(max_length=100, unique=True)),
                ("status", models.CharField(choices=[("pending", "Pending"), ("successful", "Successful"), ("failed", "Failed")], default="pending", max_length=20)),
                ("checkout_url", models.URLField(blank=True, max_length=1000)),
                ("provider_transaction_id", models.CharField(blank=True, max_length=100)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("paid_at", models.DateTimeField(blank=True, null=True)),
                ("organization", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="subscription_payments", to="organizations.organization")),
            ],
            options={"ordering": ["-created_at"]},
        ),
    ]
