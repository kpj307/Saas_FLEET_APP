import hmac
import json
import uuid

from django.conf import settings
from django.http import HttpResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from rest_framework import status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.vehicles.models import Vehicle
from .models import SubscriptionPayment
from .plans import PLANS, public_plans
from .serializers import CheckoutSerializer
from .services import (
    PaymentGatewayError,
    PaymentVerificationError,
    activate_verified_payment,
    create_checkout,
    effective_plan,
    subscription_for,
    verify_and_activate,
    verify_provider_transaction,
)


def current_organization(request):
    organization = getattr(request.user, "organization", None)
    if organization is None:
        raise PermissionDenied("Your account is not associated with a company.")
    return organization


class PlansView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"plans": public_plans()})


class SubscriptionOverviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        organization = current_organization(request)
        subscription = subscription_for(organization)
        plan = effective_plan(subscription)
        vehicle_count = Vehicle.objects.filter(organization=organization).count()
        return Response({
            "organization": {"id": organization.id, "name": organization.name},
            "plan": plan,
            "subscription": {
                "stored_plan": subscription.plan,
                "status": (
                    "expired"
                    if subscription.plan != "free" and plan["code"] == "free"
                    else subscription.status
                ),
                "current_period_start": subscription.current_period_start,
                "current_period_end": subscription.current_period_end,
            },
            "vehicle_usage": {
                "used": vehicle_count,
                "limit": plan["vehicle_limit"],
                "remaining": max(0, plan["vehicle_limit"] - vehicle_count),
                "limit_reached": vehicle_count >= plan["vehicle_limit"],
            },
        })


class CheckoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        organization = current_organization(request)
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        plan_code = serializer.validated_data["plan"]
        plan = PLANS[plan_code]

        if not request.user.email:
            raise ValidationError({"email": "Add an email address to your account before paying."})

        payment = SubscriptionPayment.objects.create(
            organization=organization,
            plan=plan_code,
            amount=plan["price"],
            currency=plan["currency"],
            tx_ref=f"fleet-{organization.pk}-{uuid.uuid4().hex}",
        )
        try:
            checkout_url = create_checkout(payment, request.user)
        except PaymentGatewayError as exc:
            payment.status = SubscriptionPayment.Status.FAILED
            payment.save(update_fields=["status"])
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response({
            "checkout_url": checkout_url,
            "tx_ref": payment.tx_ref,
            "plan": plan,
            "message": "Complete payment on the secure Flutterwave checkout page.",
        }, status=status.HTTP_201_CREATED)


class VerifyPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        organization = current_organization(request)
        tx_ref = request.query_params.get("tx_ref", "").strip()
        if not tx_ref:
            raise ValidationError({"tx_ref": "A transaction reference is required."})

        try:
            payment = SubscriptionPayment.objects.get(
                organization=organization,
                tx_ref=tx_ref,
            )
        except SubscriptionPayment.DoesNotExist:
            raise PermissionDenied("This payment does not belong to your company.")

        try:
            subscription = verify_and_activate(payment)
        except (PaymentGatewayError, PaymentVerificationError) as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            "message": "Payment verified and subscription updated.",
            "plan": subscription.plan,
            "status": subscription.status,
            "current_period_end": subscription.current_period_end,
        })


@csrf_exempt
@require_POST
def flutterwave_webhook(request):
    expected_hash = getattr(settings, "FLW_SECRET_HASH", "")
    received_hash = request.headers.get("verif-hash", "")
    if not expected_hash or not received_hash or not hmac.compare_digest(expected_hash, received_hash):
        return HttpResponse(status=401)

    try:
        payload = json.loads(request.body.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        return HttpResponse(status=400)

    data = payload.get("data") or {}
    tx_ref = data.get("tx_ref")
    if not tx_ref:
        return HttpResponse(status=200)

    try:
        payment = SubscriptionPayment.objects.get(tx_ref=tx_ref)
    except SubscriptionPayment.DoesNotExist:
        return HttpResponse(status=200)

    try:
        provider_data = verify_provider_transaction(payment.tx_ref)
        activate_verified_payment(payment, provider_data)
    except (PaymentGatewayError, PaymentVerificationError):
        # Acknowledge the webhook; the customer can retry verification from the app.
        return HttpResponse(status=200)
    return HttpResponse(status=200)
