
import { useMemo } from "react";
import { Link } from "react-router-dom";

const EXPIRY_FIELDS = [
  {
    field: "insurance_expiry",
    label: "Insurance",
    path: "/insurance",
  },
  {
    field: "license_expiry",
    label: "Vehicle license",
    path: "/vehicles",
  },
  {
    field: "inspection_expiry",
    label: "Vehicle inspection",
    path: "/vehicles",
  },
];

function getExpiryStatus(value, today) {
  if (!value) return null;

  const expiry = new Date(`${value.slice(0, 10)}T00:00:00`);

  if (Number.isNaN(expiry.getTime())) return null;

  const daysRemaining = Math.round(
    (expiry.getTime() - today.getTime()) / 86400000
  );

  if (daysRemaining < 0) {
    return { label: "Expired", daysRemaining, severity: "expired" };
  }

  if (daysRemaining <= 30) {
    return { label: "Due soon", daysRemaining, severity: "soon" };
  }

  return null;
}

function ExpiryAlerts({ vehicles = [], documents = [] }) {
  const alerts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const results = [];

    vehicles.forEach((vehicle) => {
      EXPIRY_FIELDS.forEach(({ field, label, path }) => {
        const status = getExpiryStatus(vehicle[field], today);

        if (status) {
          results.push({
            id: `vehicle-${vehicle.id}-${field}`,
            title: label,
            name: vehicle.registration_number || `Vehicle #${vehicle.id}`,
            date: vehicle[field],
            path,
            ...status,
          });
        }
      });
    });

    documents.forEach((document) => {
      const status = getExpiryStatus(document.expiry_date, today);

      if (status) {
        results.push({
          id: `document-${document.id}`,
          title: "Vehicle document",
          name: document.title || `Document #${document.id}`,
          date: document.expiry_date,
          path: "/documents",
          ...status,
        });
      }
    });

    return results.sort((a, b) => {
      if (a.severity !== b.severity) {
        return a.severity === "expired" ? -1 : 1;
      }

      return a.daysRemaining - b.daysRemaining;
    });
  }, [vehicles, documents]);

  return (
    <section className="dashboard-section">
      <div className="dashboard-section-heading">
        <div>
          <h2>Expiry Alerts</h2>
          <p>Expired items and deadlines within 30 days</p>
        </div>
        <span className="expiry-alert-count">{alerts.length}</span>
      </div>

      {alerts.length === 0 ? (
        <div className="expiry-alert-empty">
          No expired items or upcoming deadlines found.
        </div>
      ) : (
        <div className="expiry-alert-list">
          {alerts.map((alert) => (
            <div
              className={`expiry-alert-item ${alert.severity}`}
              key={alert.id}
            >
              <div className="expiry-alert-info">
                <strong>{alert.title}</strong>
                <span>{alert.name}</span>
                <small>
                  Expires: {new Date(`${alert.date.slice(0, 10)}T00:00:00`).toLocaleDateString()}
                </small>
              </div>

              <div className="expiry-alert-status">
                <strong>{alert.label}</strong>
                <span>
                  {alert.daysRemaining < 0
                    ? `${Math.abs(alert.daysRemaining)} day(s) overdue`
                    : alert.daysRemaining === 0
                      ? "Expires today"
                      : `${alert.daysRemaining} day(s) left`}
                </span>
                <Link to={alert.path}>View →</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default ExpiryAlerts;