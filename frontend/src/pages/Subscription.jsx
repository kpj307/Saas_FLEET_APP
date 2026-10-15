import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import api from "../api/axios";
import Navbar from "../components/Navbar";

function Subscription({ onLogout }) {
  const [searchParams] = useSearchParams();
  const [overview, setOverview] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyPlan, setBusyPlan] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        const txRef = searchParams.get("tx_ref");
        const paymentStatus = searchParams.get("status");

        if (txRef && paymentStatus && paymentStatus !== "cancelled") {
          try {
            await api.get("subscription/verify/", { params: { tx_ref: txRef } });
            if (active) setMessage("Payment verified. Your subscription is now active.");
          } catch (err) {
            if (active) {
              setError(err.response?.data?.detail || "We could not verify this payment yet. You can retry by refreshing this page.");
            }
          }
        } else if (paymentStatus === "cancelled") {
          if (active) setMessage("Checkout was cancelled. Your current plan has not changed.");
        }

        const [overviewResponse, plansResponse] = await Promise.all([
          api.get("subscription/"),
          api.get("subscription/plans/"),
        ]);
        if (active) {
          setOverview(overviewResponse.data);
          setPlans(plansResponse.data.plans);
        }
      } catch {
        if (active) setError("Unable to load subscription details. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    }

    initialize();
    return () => { active = false; };
  }, [searchParams]);

  async function startCheckout(planCode) {
    setError("");
    setMessage("");
    setBusyPlan(planCode);

    try {
      const response = await api.post("subscription/checkout/", { plan: planCode });
      window.location.assign(response.data.checkout_url);
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to start checkout. Check your account email and try again.");
      setBusyPlan("");
    }
  }

  const money = (amount, currency = "UGX") =>
    new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="dashboard-page">
      <Navbar onLogout={onLogout} />
      <header className="dashboard-header">
        <div>
          <h1>Plans and billing</h1>
          <p>Choose a plan that matches the size of your fleet.</p>
        </div>
      </header>

      {message && <p className="subscription-message" role="status">{message}</p>}
      {error && <p className="error" role="alert">{error}</p>}

      {loading ? (
        <p>Loading subscription details...</p>
      ) : (
        <>
          {overview && (
            <section className="subscription-current">
              <div>
                <p className="subscription-eyebrow">CURRENT PLAN</p>
                <h2>{overview.plan.name}</h2>
                <p>{overview.plan.description}</p>
              </div>
              <div className="subscription-usage">
                <strong>{overview.vehicle_usage.used} / {overview.vehicle_usage.limit}</strong>
                <span>vehicles used</span>
                <div className="subscription-progress" aria-label="Vehicle usage">
                  <span
                    style={{
                      width: `${Math.min(100, (overview.vehicle_usage.used / overview.vehicle_usage.limit) * 100)}%`,
                    }}
                  />
                </div>
                {overview.subscription.current_period_end && (
                  <small>Renews/expires: {new Date(overview.subscription.current_period_end).toLocaleDateString()}</small>
                )}
              </div>
            </section>
          )}

          <section className="subscription-plans" aria-label="Available subscription plans">
            {plans.map((plan) => {
              const current = overview?.plan.code === plan.code;
              return (
                <article className={current ? "subscription-plan current" : "subscription-plan"} key={plan.code}>
                  <div>
                    <h2>{plan.name}</h2>
                    <p>{plan.description}</p>
                  </div>
                  <p className="subscription-price">
                    {plan.price === 0 ? "Free" : money(plan.price, plan.currency)}
                    {plan.billing_period_days && <span> / 30 days</span>}
                  </p>
                  <p className="subscription-limit">Up to {plan.vehicle_limit} vehicles</p>
                  <ul>
                    {plan.features.map((feature) => <li key={feature}>{feature}</li>)}
                  </ul>
                  {current ? (
                    <button type="button" disabled className="subscription-current-button">Current plan</button>
                  ) : plan.price > 0 ? (
                    <button
                      type="button"
                      disabled={Boolean(busyPlan)}
                      onClick={() => startCheckout(plan.code)}
                    >
                      {busyPlan === plan.code ? "Connecting to checkout..." : `Choose ${plan.name}`}
                    </button>
                  ) : (
                    <p className="subscription-note">Contact support to move to the Free plan.</p>
                  )}
                </article>
              );
            })}
          </section>
          <p className="subscription-footnote">
            Payments are processed by Flutterwave. Your paid plan is activated only after the server verifies the transaction.
          </p>
        </>
      )}
    </div>
  );
}

export default Subscription;
