import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import api from "../api/axios";
import Navbar from "../components/Navbar";

const emptyForm = {
  vehicle: "",
  amount: "",
  income_date: "",
  description: "",
};

function Income({ onLogout }) {
  const [searchParams] = useSearchParams();

  const [income, setIncome] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [editingIncomeId, setEditingIncomeId] =
    useState(null);

  async function loadIncome() {
    try {
      const response = await api.get("income/");

      setIncome(
        Array.isArray(response.data)
          ? response.data
          : response.data?.results || []
      );
    } catch (err) {
      console.error("Income loading error:", err);

      setError("Unable to load income records.");
    } finally {
      setLoading(false);
    }
  }

  async function loadVehicles() {
    try {
      const response = await api.get("vehicles/");

      setVehicles(
        Array.isArray(response.data)
          ? response.data
          : response.data?.results || []
      );
    } catch (err) {
      console.error(
        "Vehicle loading error:",
        err
      );

      setError("Unable to load vehicles.");
    }
  }

  useEffect(() => {
    loadIncome();
    loadVehicles();
  }, []);

  useEffect(() => {
    const incomeId = searchParams.get("id");

    if (!incomeId || income.length === 0) {
      return;
    }

    const record = income.find(
      (item) => String(item.id) === String(incomeId)
    );

    if (record) {
      handleEdit(record);
    }
  }, [searchParams, income]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingIncomeId(null);
    setError("");
  }

  function handleEdit(record) {
    setEditingIncomeId(record.id);

    setForm({
      vehicle:
        record.vehicle?.id ||
        record.vehicle_id ||
        record.vehicle ||
        "",
      amount: record.amount || "",
      income_date: record.income_date || "",
      description: record.description || "",
    });

    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setError("");

    const incomeData = {
      vehicle: Number(form.vehicle),
      amount: form.amount,
      income_date: form.income_date,
      description: form.description,
    };

    try {
      if (editingIncomeId) {
        await api.put(
          `income/${editingIncomeId}/`,
          incomeData
        );
      } else {
        await api.post(
          "income/",
          incomeData
        );
      }

      resetForm();
      await loadIncome();
    } catch (err) {
      console.error(
        "Income saving error:",
        err
      );

      if (err.response?.data) {
        setError(
          JSON.stringify(err.response.data)
        );
      } else {
        setError("Unable to save income record.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(incomeId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this income record?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(
        `income/${incomeId}/`
      );

      if (editingIncomeId === incomeId) {
        resetForm();
      }

      await loadIncome();
    } catch (err) {
      console.error(
        "Income deletion error:",
        err
      );

      setError(
        "Unable to delete income record."
      );
    }
  }

  function getVehicleRegistration(record) {
    if (record.vehicle_registration) {
      return record.vehicle_registration;
    }

    if (record.vehicle?.registration_number) {
      return record.vehicle.registration_number;
    }

    const vehicleId =
      record.vehicle?.id ||
      record.vehicle_id ||
      record.vehicle;

    const vehicle = vehicles.find(
      (item) =>
        String(item.id) === String(vehicleId)
    );

    return (
      vehicle?.registration_number ||
      "—"
    );
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

  const totalIncome = income.reduce(
    (total, record) =>
      total + Number(record.amount || 0),
    0
  );

  return (
    <div className="dashboard-page">
      <Navbar onLogout={onLogout} />

      <header className="dashboard-header">
        <div>
          <h1>Income</h1>
          <p>Manage vehicle income and revenue</p>
        </div>
      </header>

      {error && (
        <p className="error">
          {error}
        </p>
      )}

      <section className="form-card">
        <h2>
          {editingIncomeId
            ? "Edit Income"
            : "Add Income"}
        </h2>

        <form
          className="vehicle-form"
          onSubmit={handleSubmit}
        >
          <div>
            <label htmlFor="vehicle">
              Vehicle
            </label>

            <select
              id="vehicle"
              name="vehicle"
              value={form.vehicle}
              onChange={handleChange}
              required
            >
              <option value="">
                Select vehicle
              </option>

              {vehicles.map((vehicle) => (
                <option
                  key={vehicle.id}
                  value={vehicle.id}
                >
                  {vehicle.registration_number}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="amount">
              Amount
            </label>

            <input
              id="amount"
              name="amount"
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={handleChange}
              placeholder="1500000"
              required
            />
          </div>

          <div>
            <label htmlFor="income_date">
              Income Date
            </label>

            <input
              id="income_date"
              name="income_date"
              type="date"
              value={form.income_date}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="description">
              Description
            </label>

            <input
              id="description"
              name="description"
              type="text"
              value={form.description}
              onChange={handleChange}
              placeholder="Monthly vehicle rental income"
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingIncomeId
                ? "Update Income"
                : "Add Income"}
            </button>

            {editingIncomeId && (
              <button
                type="button"
                className="cancel-button"
                onClick={resetForm}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="income-summary">
        <div className="summary-card">
          <h3>Total Income</h3>

          <p>
            {formatAmount(totalIncome)}
          </p>
        </div>

        <div className="summary-card">
          <h3>Income Records</h3>

          <p>{income.length}</p>
        </div>
      </section>

      <section className="income-list-section">
        <h2>Income List</h2>

        {loading ? (
          <p>Loading income records...</p>
        ) : income.length === 0 ? (
          <p>No income records found.</p>
        ) : (
          <div className="income-table-wrapper">
            <table className="income-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Amount</th>
                  <th>Income Date</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {income.map((record) => (
                  <tr key={record.id}>
                    <td>
                      {getVehicleRegistration(record)}
                    </td>

                    <td>
                      {formatAmount(record.amount)}
                    </td>

                    <td>
                      {record.income_date || "—"}
                    </td>

                    <td>
                      {record.description || "—"}
                    </td>

                    <td>
                      <div className="table-actions">
                        <button
                          className="edit-button"
                          onClick={() =>
                            handleEdit(record)
                          }
                        >
                          Edit
                        </button>

                        <button
                          className="delete-button"
                          onClick={() =>
                            handleDelete(record.id)
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default Income;