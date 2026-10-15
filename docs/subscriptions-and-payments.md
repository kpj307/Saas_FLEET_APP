# Subscription plans and payments

## Default plan configuration

The starting prices live in `backend/apps/subscriptions/plans.py` and are editable before launch:

| Plan | Default price | Vehicle limit |
| --- | ---: | ---: |
| Free | UGX 0 | 3 |
| Starter | UGX 30,000 per 30 days | 15 |
| Business | UGX 75,000 per 30 days | 50 |

These are starter values, not a market-price recommendation. Review and change them before you advertise the plans. The API uses the backend plan configuration as the source of truth.

## Configure Flutterwave

1. Create/configure your Flutterwave account and enable the payment methods your business can accept.
2. Configure the checkout API credentials in the server environment:
   - `FLW_SECRET_KEY`: server-side secret key
   - `FLW_SECRET_HASH`: webhook secret hash configured in the provider dashboard
   - `FRONTEND_URL`: public frontend URL
   - `FLW_REDIRECT_URL`: public callback URL, normally the subscription page
3. Configure the provider webhook to POST to `https://YOUR_API_DOMAIN/api/subscription/webhook/`.
4. Never expose the secret key in React/Vite environment variables, frontend code, or browser requests.
5. Test with provider test credentials and test transactions first. Switch to live credentials only after successful end-to-end verification.

Optional `FLW_PAYMENT_PLAN_STARTER` and `FLW_PAYMENT_PLAN_BUSINESS` values can reference recurring plans created in the Flutterwave dashboard. Until those are configured, the checkout is a 30-day paid subscription that the customer must renew manually. A successful payment activates 30 days; the backend does not claim to have auto-renewed a customer without a configured provider plan.

## API

All endpoints except the webhook require a logged-in user with an organization:

- `GET /api/subscription/plans/` — list plan options
- `GET /api/subscription/` — current plan, subscription period, and vehicle usage
- `POST /api/subscription/checkout/` with `{"plan":"starter"}` or `{"plan":"business"}` — create a pending payment and return a hosted checkout URL
- `GET /api/subscription/verify/?tx_ref=...` — server-side verification for the signed-in company's payment
- `POST /api/subscription/webhook/` — provider webhook authenticated with the configured secret hash

The backend activates a plan only after the provider verification response matches the saved reference, currency, successful status, and expected amount. Webhook processing is safe to retry. Each organization has its own subscription and payment history.

## Vehicle limit behavior

Vehicle creation is enforced server-side. Free allows 3 vehicles, Starter 15, and Business 50. Editing and deleting existing vehicles remain available at the limit. If a paid subscription expires, its effective entitlement falls back to the Free plan; existing vehicles are retained, but additional vehicle creation is blocked until the company upgrades again.

## Before production

- Run `python manage.py migrate` and `python manage.py test` from `backend/`.
- Run `npm run lint` and `npm run build` from `frontend/`.
- Configure production HTTPS, allowed hosts, CORS, provider credentials, and webhook URL.
- Verify successful, failed, canceled, duplicated, wrong-currency, wrong-amount, and cross-company payment-reference scenarios using provider test mode.
- Confirm whether you want automatic recurring billing and configure the matching provider-side plans if so.
