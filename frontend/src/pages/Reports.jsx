import { useEffect, useState } from "react";

import api from "../api/axios";
import Navbar from "../components/Navbar";

function Reports({ onLogout }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadReport() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("reports/summary/");
      setReport(response.data);
    } catch (err) {
      console.error("Reports loading error:", err);

      if (err.response?.data) {
        setError(
          typeof err.response.data === "string"
            ? err.response.data
            : JSON.stringify(err.response.data)
        );
      } else {
        setError("Unable to load report.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport();
  }, []);

  function formatAmount(amount) {
    if (
      amount === null ||
      amount === undefined ||
      amount === ""
    ) {
      return "0.00";
    }

    return `UGX ${amount.toLocaleString("en-UG", {
      maximumFractionDigits: 0,
    })}`;
  }

  if (loading) {
    return (
      <div className="dashboard-page">
        <Navbar onLogout={onLogout} />

        <header className="dashboard-header">
          <div>
            <h1>Reports</h1>
            <p>Fleet performance and financial overview</p>
          </div>
        </header>

        <p>Loading report...</p>
      </div>
    );
  }

  const vehicles = report?.vehicles || {};
  const maintenance = report?.maintenance || {};
  const insurance = report?.insurance || {};
  const notifications = report?.notifications || {};

  // Financial data comes from the backend under income_expenses
  const incomeExpenses = report?.income_expenses || {};

  const totalIncome = Number(
    incomeExpenses.total_income || 0
  );

  const totalExpenses = Number(
    incomeExpenses.total_expenses || 0
  );

  const netIncome = Number(
    incomeExpenses.net_income || 0
  );

  const totalCosts = Number(
    incomeExpenses.total_costs || 0
  );

  const profitAfterAllCosts = Number(
    incomeExpenses.profit_after_all_costs || 0
  );

  return (
    <div className="dashboard-page">
      <Navbar onLogout={onLogout} />

      <header className="dashboard-header">
        <div>
          <h1>Reports</h1>
          <p>Fleet performance and financial overview</p>
        </div>

        <button
          className="dashboard-primary-link"
          type="button"
          onClick={loadReport}
        >
          Refresh Report
        </button>
      </header>

      {error && (
        <p className="error">
          {error}
        </p>
      )}

      {/* Fleet Overview */}
      <section className="report-section">
        <h2>Fleet Overview</h2>

        <div className="report-grid">
          <div className="summary-card">
            <h3>Total Vehicles</h3>
            <p>{vehicles.total || 0}</p>
          </div>

          <div className="summary-card">
            <h3>Active Vehicles</h3>
            <p>{vehicles.active || 0}</p>
          </div>

          <div className="summary-card">
            <h3>Inactive Vehicles</h3>
            <p>{vehicles.inactive || 0}</p>
          </div>

          <div className="summary-card">
            <h3>Under Maintenance</h3>
            <p>{vehicles.under_maintenance || 0}</p>
          </div>
        </div>
      </section>

      {/* Maintenance */}
      <section className="report-section">
        <h2>Maintenance</h2>

        <div className="report-grid">
          <div className="summary-card">
            <h3>Total Records</h3>
            <p>{maintenance.total_records || 0}</p>
          </div>

          <div className="summary-card">
            <h3>Total Cost</h3>
            <p>
              {formatAmount(Number(maintenance.total_cost))}
            </p>
          </div>
        </div>
      </section>

      {/* Insurance */}
      <section className="report-section">
        <h2>Insurance</h2>

        <div className="report-grid">
          <div className="summary-card">
            <h3>Total Policies</h3>
            <p>{insurance.total_policies || 0}</p>
          </div>

          <div className="summary-card">
            <h3>Total Cost</h3>
            <p>
              {formatAmount(
                Number(insurance.total_cost)
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Financial Overview */}
      <section className="report-section">
        <h2>Financial Overview</h2>

        <div className="report-grid">
          <div className="summary-card">
            <h3>Total Income</h3>
            <p>
              {formatAmount(totalIncome)}
            </p>
          </div>

          <div className="summary-card">
            <h3>Total Expenses</h3>
            <p>
              {formatAmount(totalExpenses)}
            </p>
          </div>

          <div className="summary-card">
            <h3>Net Income</h3>
            <p>
              {formatAmount(netIncome)}
            </p>
          </div>

          <div className="summary-card">
            <h3>Total Costs</h3>
            <p>
              {formatAmount(totalCosts)}
            </p>
          </div>

          <div className="summary-card">
            <h3>Profit After All Costs</h3>
            <p>
              {formatAmount(
                profitAfterAllCosts
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="report-section">
        <h2>Notifications</h2>

        <div className="report-grid">
          <div className="summary-card">
            <h3>Total Notifications</h3>
            <p>
              {notifications.total || 0}
            </p>
          </div>

          <div className="summary-card">
            <h3>Unread Notifications</h3>
            <p>
              {notifications.unread || 0}
            </p>
          </div>

          <div className="summary-card">
            <h3>Read Notifications</h3>
            <p>
              {notifications.read || 0}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Reports;
