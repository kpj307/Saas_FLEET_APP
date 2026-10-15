import json
import os
import urllib.error
import urllib.parse
import urllib.request
from datetime import timedelta
from decimal import Decimal

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from .models import Subscription, SubscriptionPayment
from .plans import PLANS


class PaymentGatewayError(Exception):
    pass


class PaymentVerificationError(Exception):
    pass


def effective_plan(subscription):
    """Return the plan currently entitled to be used, including expiry."""
    if subscription.plan == Subscription.Plan.FREE:
        return PLANS["free"]
    if subscription.status != Subscription.Status.ACTIVE:
        return PLANS["free"]
    if not subscription.current_period_end or subscription.current_period_end <= timezone.now():
        return PLANS["free"]
    return PLANS.get(subscription.plan, PLANS["free"])


def subscription_for(organization):
    subscription, _ = Subscription.objects.get_or_create(organization=organization)
    return subscription


def _flutterwave_request(url, method="GET", payload=None):
    secret_key = getattr(settings, "FLW_SECRET_KEY", "")
    if not secret_key:
        raise PaymentGatewayError("Payments are not configured yet. Please contact support.")

    data = None if payload is None else json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {secret_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            result = json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise PaymentGatewayError("Could not contact the payment provider. Please try again.") from exc

    if not isinstance(result, dict) or result.get("status") != "success":
        raise PaymentGatewayError("The payment provider could not process this request.")
    return result


def create_checkout(payment, user):
    plan = PLANS[payment.plan]
    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173").rstrip("/")
    redirect_url = getattr(settings, "FLW_REDIRECT_URL", "") or f"{frontend_url}/subscription"
    payload = {
        "tx_ref": payment.tx_ref,
        "amount": int(payment.amount),
        "currency": payment.currency,
        "redirect_url": redirect_url,
        "payment_options": "card,mobilemoneyuganda",
        "customer": {
            "email": user.email,
            "name": user.get_full_name() or user.get_username(),
        },
        "customizations": {
            "title": "Fleet App subscription",
            "description": f"{plan['name']} plan - 30 days",
        },
        "meta": {
            "organization_id": payment.organization_id,
            "subscription_payment_id": payment.pk,
            "plan": payment.plan,
        },
    }

    # Optional Flutterwave dashboard payment-plan IDs can enable provider-managed
    # recurring billing after they have been configured for matching prices.
    plan_env = f"FLW_PAYMENT_PLAN_{payment.plan.upper()}"
    provider_plan_id = os.environ.get(plan_env, "").strip()
    if provider_plan_id:
        payload["payment_plan"] = int(provider_plan_id)

    result = _flutterwave_request(
        "https://api.flutterwave.com/v3/payments",
        method="POST",
        payload=payload,
    )
    checkout_url = (result.get("data") or {}).get("link")
    if not checkout_url:
        raise PaymentGatewayError("The payment provider did not return a checkout link.")
    payment.checkout_url = checkout_url
    payment.save(update_fields=["checkout_url"])
    return checkout_url


def verify_provider_transaction(tx_ref):
    query = urllib.parse.urlencode({"tx_ref": tx_ref})
    result = _flutterwave_request(
        f"https://api.flutterwave.com/v3/transactions/verify_by_reference?{query}"
    )
    data = result.get("data")
    if not isinstance(data, dict):
        raise PaymentVerificationError("The provider returned an invalid transaction.")
    return data


def activate_verified_payment(payment, transaction_data):
    """Activate a paid plan only after server-side verification."""
    if transaction_data.get("status") != "successful":
        raise PaymentVerificationError("Payment has not completed successfully.")
    if transaction_data.get("tx_ref") != payment.tx_ref:
        raise PaymentVerificationError("Payment reference does not match.")
    if str(transaction_data.get("currency", "")).upper() != payment.currency:
        raise PaymentVerificationError("Payment currency does not match.")
    try:
        paid_amount = Decimal(str(transaction_data.get("amount", "0")))
    except Exception as exc:
        raise PaymentVerificationError("Payment amount is invalid.") from exc
    if paid_amount < payment.amount:
        raise PaymentVerificationError("The verified payment is below the required amount.")

    now = timezone.now()
    with transaction.atomic():
        locked_payment = SubscriptionPayment.objects.select_for_update().get(pk=payment.pk)
        if locked_payment.status == SubscriptionPayment.Status.SUCCESSFUL:
            return subscription_for(locked_payment.organization)

        locked_payment.status = SubscriptionPayment.Status.SUCCESSFUL
        locked_payment.provider_transaction_id = str(transaction_data.get("id", ""))
        locked_payment.paid_at = now
        locked_payment.save(update_fields=["status", "provider_transaction_id", "paid_at"])

        subscription = Subscription.objects.select_for_update().filter(
            organization=locked_payment.organization
        ).first()
        if subscription is None:
            subscription = Subscription.objects.create(
                organization=locked_payment.organization
            )

        same_active_plan = (
            subscription.plan == locked_payment.plan
            and subscription.status == Subscription.Status.ACTIVE
            and subscription.current_period_end
            and subscription.current_period_end > now
        )
        period_start = subscription.current_period_end if same_active_plan else now
        subscription.plan = locked_payment.plan
        subscription.status = Subscription.Status.ACTIVE
        subscription.current_period_start = period_start
        subscription.current_period_end = period_start + timedelta(days=30)
        subscription.save(update_fields=[
            "plan", "status", "current_period_start", "current_period_end", "updated_at"
        ])
        return subscription


def verify_and_activate(payment):
    transaction_data = verify_provider_transaction(payment.tx_ref)
    return activate_verified_payment(payment, transaction_data)
