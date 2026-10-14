import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../api/axios";
import Navbar from "../components/Navbar";
import FinancialCharts from "../components/FinancialCharts";
import ExpiryAlerts from "../components/ExpiryAlerts";

function Dashboard({ onLogout }) {
  const [summary, setSummary] = useState(null);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [vehicleRecords, setVehicleRecords] = useState([]);
  const [documentRecords, setDocumentRecords] = useState([]);
  
  const [filterMode, setFilterMode] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(
    String(new Date().getMonth() + 1)
  );
  const [selectedYear, setSelectedYear] = useState(
    String(new Date().getFullYear())
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeReportParams, setActiveReportParams] = useState({});
  
  const loadDashboard = useCallback( async (isRefresh = false, reportParams = {}) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [
        summaryResponse,
        notificationsResponse,
        vehiclesResponse,
        documentsResponse,
      ] = await Promise.all([
        api.get("reports/summary/", {
          params: reportParams,
        }),
        api.get("notifications/"),
        api.get("vehicles/"),
        api.get("documents/"),
      ]);

      // Dashboard summary
      setSummary(summaryResponse.data);

      // Vehicle records for expiry alerts
      const vehicleData = vehiclesResponse.data;

      setVehicleRecords(
        Array.isArray(vehicleData)
          ? vehicleData
          : vehicleData.results || []
      );

      // Document records for expiry alerts
      const documentData = documentsResponse.data;

      setDocumentRecords(
        Array.isArray(documentData)
          ? documentData
          : documentData.results || []
      );

      // Recent notifications
      const notificationData = notificationsResponse.data;

      const notificationList = Array.isArray(notificationData)
        ? notificationData
        : notificationData.results || [];

      const sortedNotifications = [...notificationList].sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      );

      setRecentNotifications(sortedNotifications.slice(0, 5));
    } catch (err) {
      console.error("Dashboard loading error:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to load dashboard data. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  async function applyFinancialFilters() {
    let params = {};

    if (filterMode === "month") {
      params = {
        month: selectedMonth,
        year: selectedYear,
      };
    } else if (filterMode === "custom") {
      if (!startDate || !endDate) {
        setError("Please select both a start date and an end date.");
        return;
      }

      if (startDate > endDate) {
        setError("The start date must not be after the end date.");
        return;
      }

      params = {
        start_date: startDate,
        end_date: endDate,
      };
    }

    setActiveReportParams(params);
    await loadDashboard(true, params);
  }

  async function resetFinancialFilters() {
    setFilterMode("all");
    setStartDate("");
    setEndDate("");

    const params = {};
    setActiveReportParams(params);

    await loadDashboard(true, params);
  }

  function formatAmount(value) {
    const amount = Number(value ?? 0);

    if (!Number.isFinite(amount)) {
      return "UGX 0";
    }

    return `UGX ${amount.toLocaleString("en-UG", {
      maximumFractionDigits: 0,
    })}`;
  }

  function formatDate(value) {
    if (!value) return "Date unavailable";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Date unavailable";
    }

    return date.toLocaleString();
  }

  if (loading) {
    return (
      <div className="dashboard-page">
        <Navbar onLogout={onLogout} />

        <main className="dashboard-content">
          <h1>Fleet Dashboard</h1>
          <p>Loading dashboard...</p>
        </main>
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="dashboard-page">
        <Navbar onLogout={onLogout} />

        <main className="dashboard-content">
          <header className="dashboard-header">
            <div>
              <h1>Fleet Dashboard</h1>
              <p>Overview of your fleet business</p>
            </div>
          </header>

          <div className="dashboard-error">
            <p>{error}</p>

            <button
              type="button"
              onClick={() => loadDashboard()}
            >
              Try Again
            </button>
          </div>
        </main>
      </div>
    );
  }

  const vehicles = summary?.vehicles || {};
  const maintenance = summary?.maintenance || {};
  const insurance = summary?.insurance || {};
  const notifications = summary?.notifications || {};
  
  const hasAppliedFinancialFilters =
    Object.keys(activeReportParams).length > 0;

  const finances = hasAppliedFinancialFilters
    ? {
        ...(summary?.income_expenses || {}),
        ...(summary?.period_financials || {}),
      }
    : summary?.income_expenses || {};

  const periodCounts = summary?.period_counts || {};

  const fleetCards = [
    {
      title: "Total Vehicles",
      value: vehicles.total ?? 0,
      detail: `${vehicles.active ?? 0} active`,
      path: "/vehicles",
    },
    {
      title: "Inactive Vehicles",
      value: vehicles.inactive ?? 0,
      detail: "Vehicles not currently active",
      path: "/vehicles",
    },
    {
      title: "Under Maintenance",
      value: vehicles.under_maintenance ?? 0,
      detail: `${maintenance.total_records ?? 0} maintenance records`,
      path: "/maintenance",
    },
    {
      title: "Insurance Policies",
      value: insurance.total_policies ?? 0,
      detail: `Total cost: ${formatAmount(insurance.total_cost)}`,
      path: "/insurance",
    },
  ];

  const financialCards = [
    {
      title: "Total Income",
      value: formatAmount(finances.total_income),
      detail: `${finances.total_income_records ?? 0} income records`,
      path: "/income",
    },
    {
      title: "Total Expenses",
      value: formatAmount(finances.total_expenses),
      detail: `${finances.total_expense_records ?? 0} expense records`,
      path: "/expenses",
    },
    {
      title: "Net Income",
      value: formatAmount(finances.net_income),
      detail: "Income minus expenses",
      path: "/reports",
    },
    {
      title: "Profit After All Costs",
      value: formatAmount(finances.profit_after_all_costs),
      detail: "Includes maintenance and insurance",
      path: "/reports",
    },
  ];

  const quickActions = [
    {
      title: "Manage Vehicles",
      description: "View and update your fleet",
      path: "/vehicles",
    },
    {
      title: "Record Income",
      description: "Add a vehicle income record",
      path: "/income",
    },
    {
      title: "Record Expense",
      description: "Track fleet spending",
      path: "/expenses",
    },
    {
      title: "Maintenance",
      description: "Manage service records",
      path: "/maintenance",
    },
    {
      title: "Documents",
      description: "Manage vehicle documents",
      path: "/documents",
    },
    {
      title: "View Reports",
      description: "Review financial performance",
      path: "/reports",
    },
  ];

  return (
    <div className="dashboard-page">
      <Navbar onLogout={onLogout} />

      <main className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <h1>Fleet Dashboard</h1>
            <p>
              Monitor your vehicles, finances, and fleet operations.
            </p>
          </div>

          <button
            type="button"
            className="dashboard-primary-link"
            onClick={() => {
              console.log("Refresh Dashboard clicked");
              loadDashboard(true, activeReportParams);
            }}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing..." : "Refresh Dashboard"}
          </button>
        </header>

        {error && (
          <div className="dashboard-error dashboard-inline-error">
            <p>{error}</p>
          </div>
        )}

        {/* Fleet overview */}
        <section className="dashboard-section">
          <div className="dashboard-section-heading">
            <div>
              <h2>Fleet Overview</h2>
              <p>Current status of your fleet</p>
            </div>
          </div>

          <div className="summary-grid">
            {fleetCards.map((card) => (
              <Link
                to={card.path}
                className="summary-card dashboard-card-link"
                key={card.title}
              >
                <span className="summary-label">
                  {card.title}
                </span>

                <strong className="summary-value">
                  {card.value}
                </strong>

                <span className="summary-detail">
                  {card.detail}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Expired Alerts */}
        <ExpiryAlerts
          vehicles={vehicleRecords}
          documents={documentRecords}
        />
   
        <section className="dashboard-section">
          <div className="dashboard-section-heading">
            <div>
              <h2>Financial Date Filters</h2>
              <p>
                Choose which period to use for the financial overview and charts.
              </p>
            </div>
          </div>

          <div className="financial-filter-panel">
            <div className="financial-filter-field">
              <label htmlFor="filterMode">Report period</label>
              <select
                id="filterMode"
                value={filterMode}
                onChange={(event) => setFilterMode(event.target.value)}
              >
                <option value="all">All time</option>
                <option value="month">Month and year</option>
                <option value="custom">Custom date range</option>
              </select>
            </div>

            {filterMode === "month" && (
              <>
                <div className="financial-filter-field">
                  <label htmlFor="filterMonth">Month</label>
                  <select
                    id="filterMonth"
                    value={selectedMonth}
                    onChange={(event) => setSelectedMonth(event.target.value)}
                  >
                    {[
                      ["1", "January"],
                      ["2", "February"],
                      ["3", "March"],
                      ["4", "April"],
                      ["5", "May"],
                      ["6", "June"],
                      ["7", "July"],
                      ["8", "August"],
                      ["9", "September"],
                      ["10", "October"],
                      ["11", "November"],
                      ["12", "December"],
                    ].map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="financial-filter-field">
                  <label htmlFor="filterYear">Year</label>
                  <select
                    id="filterYear"
                    value={selectedYear}
                    onChange={(event) => setSelectedYear(event.target.value)}
                  >
                    {Array.from(
                      { length: 10 },
                      (_, index) => new Date().getFullYear() - 5 + index
                    ).map((year) => (
                      <option key={year} value={String(year)}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {filterMode === "custom" && (
              <>
                <div className="financial-filter-field">
                  <label htmlFor="startDate">Start date</label>
                  <input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                  />
                </div>

                <div className="financial-filter-field">
                  <label htmlFor="endDate">End date</label>
                  <input
                    id="endDate"
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(event) => setEndDate(event.target.value)}
                  />
                </div>
              </>
            )}

            <div className="financial-filter-actions">
              <button
                type="button"
                className="dashboard-primary-link"
                onClick={applyFinancialFilters}
                disabled={refreshing}
              >
                {refreshing ? "Applying..." : "Apply Filters"}
              </button>

              <button
                type="button"
                className="dashboard-primary-link"
                onClick={resetFinancialFilters}
                disabled={refreshing}
              >
                Reset
              </button>
            </div>
          </div>
        </section>

        {/* Financial overview */}
        <section className="dashboard-section">
          <div className="dashboard-section-heading">
            <div>
              <h2>Financial Overview</h2>
              <p>Income, expenses, and profitability</p>
            </div>

            <Link
              to="/reports"
              className="dashboard-secondary-link"
            >
              Full reports →
            </Link>
          </div>

          <div className="summary-grid">
            {financialCards.map((card) => (
              <Link
                to={card.path}
                className="summary-card dashboard-card-link"
                key={card.title}
              >
                <span className="summary-label">
                  {card.title}
                </span>

                <strong className="summary-value">
                  {card.value}
                </strong>

                <span className="summary-detail">
                  {card.detail}
                </span>
              </Link>
            ))}
          </div>
        </section>
                
        <section className="dashboard-section">
          <div className="dashboard-section-heading">
            <div>
              <h2>Financial Trends</h2>
              <p>Monthly income, expenses, and net income for the last 12 months.</p>
            </div>
          </div>

          <FinancialCharts data={summary?.monthly_finances ?? []} />
        </section>

        {/* Operations */}
        <section className="dashboard-section">
          <div className="dashboard-section-heading">
            <div>
              <h2>Operations at a Glance</h2>
              <p>Maintenance and notifications</p>
            </div>
          </div>

          <div className="summary-grid">
            <Link
              to="/maintenance"
              className="summary-card dashboard-card-link"
            >
              <span className="summary-label">
                Total Maintenance Cost
              </span>

              <strong className="summary-value">
                {formatAmount(
                  hasAppliedFinancialFilters
                  ? summary?.period_financials?.maintenance_cost ?? "0.00"
                  : summary?.maintenance?.total_cost ?? "0.00"
                )}
              </strong>

              <span className="summary-detail">
                {hasAppliedFinancialFilters
                  ? periodCounts.maintenance_records ?? 0
                  : maintenance?.total_records ?? 0
                } maintenance records
              </span>
            </Link>

            <Link
              to="/insurance"
              className="summary-card dashboard-card-link"
            >
              <span className="summary-label">
                Insurance Costs
              </span>

              <strong className="summary-value">
                {
                  formatAmount(hasAppliedFinancialFilters
                  ? summary?.period_financials?.insurance_cost ?? "0.00"
                  : summary?.insurance?.total_cost ?? "0.00")
                }
              </strong>

              <span className="summary-detail">
                {hasAppliedFinancialFilters
                  ? periodCounts.insurance_policies ?? 0
                  : insurance?.total_policies ?? 0
                } insurance policies
              </span>
            </Link>

            <Link
              to="/notifications"
              className="summary-card dashboard-card-link"
            >
              <span className="summary-label">
                Unread Notifications
              </span>

              <strong className="summary-value">
                {hasAppliedFinancialFilters
                  ? periodCounts.notifications_unread ?? 0
                  : notifications?.unread ?? 0
                }
              </strong>

              <span className="summary-detail">
                { hasAppliedFinancialFilters
                  ? periodCounts.notifications_total ?? 0
                  : notifications?.total ?? 0
                } total notifications
              </span>
            </Link>
          </div>
        </section>

        {/* Quick actions */}
        <section className="dashboard-section">
          <div className="dashboard-section-heading">
            <div>
              <h2>Quick Actions</h2>
              <p>Navigate directly to a module</p>
            </div>
          </div>

          <div className="quick-actions-grid">
            {quickActions.map((action) => (
              <Link
                to={action.path}
                className="quick-action-card"
                key={action.title}
              >
                <strong>{action.title}</strong>

                <span>{action.description}</span>

                <span className="quick-action-arrow">
                  Open module →
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent notifications */}
        <section className="dashboard-section">
          <div className="dashboard-section-heading">
            <div>
              <h2>Recent Notifications</h2>
              <p>Your five most recent notifications</p>
            </div>

            <Link
              to="/notifications"
              className="dashboard-secondary-link"
            >
              View all →
            </Link>
          </div>

          <div className="recent-notifications">
            {recentNotifications.length === 0 ? (
              <p className="empty-notifications">
                No notifications to display.
              </p>
            ) : (
              recentNotifications.map((notification) => (
                <div
                  className={`recent-notification ${
                    notification.is_read ? "is-read" : "is-unread"
                  }`}
                  key={notification.id}
                >
                  <div className="recent-notification-content">
                    <strong>{notification.title}</strong>

                    <p>{notification.message}</p>

                    <span>
                      {formatDate(notification.created_at)}
                    </span>
                  </div>

                  <span
                    className={`notification-status ${
                      notification.is_read ? "read" : "unread"
                    }`}
                  >
                    {notification.is_read ? "Read" : "Unread"}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;