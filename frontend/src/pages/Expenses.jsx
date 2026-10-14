import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import api from "../api/axios";
import Navbar from "../components/Navbar";

const emptyForm = {
  vehicle: "",
  amount: "",
  expense_date: "",
  category: "",
  description: "",
};

const categories = [
  "Fuel",
  "Maintenance",
  "Repairs",
  "Insurance",
  "Licensing",
  "Salaries",
  "Routine",
  "Other",
];

function Expenses({ onLogout }) {
  const [searchParams] = useSearchParams();

  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [editingExpenseId, setEditingExpenseId] =
    useState(null);

  async function loadExpenses() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("expenses/");

      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.results || [];

      setExpenses(data);
    } catch (err) {
      console.error(
        "Expenses loading error:",
        err
      );

      setError(
        "Unable to load expense records."
      );
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

      setError(
        "Unable to load vehicles."
      );
    }
  }

  useEffect(() => {
    loadExpenses();
    loadVehicles();
  }, []);

  useEffect(() => {
    const expenseId = searchParams.get("id");

    if (
      !expenseId ||
      expenses.length === 0
    ) {
      return;
    }

    const record = expenses.find(
      (item) =>
        String(item.id) ===
        String(expenseId)
    );

    if (record) {
      handleEdit(record);
    }
  }, [searchParams, expenses]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingExpenseId(null);
    setError("");
  }

  function handleEdit(record) {
    setEditingExpenseId(record.id);

    setForm({
      vehicle:
        record.vehicle?.id ||
        record.vehicle_id ||
        record.vehicle ||
        "",
      amount: record.amount || "",
      expense_date:
        record.expense_date ||
        record.date ||
        "",
      category:
        record.category ||
        "Other",
      description:
        record.description || "",
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

    const expenseData = {
      vehicle: Number(form.vehicle),
      amount: form.amount,
      expense_date: form.expense_date,
      category: form.category,
      description: form.description,
    };

    try {
      if (editingExpenseId) {
        await api.put(
          `expenses/${editingExpenseId}/`,
          expenseData
        );
      } else {
        await api.post(
          "expenses/",
          expenseData
        );
      }

      resetForm();
      await loadExpenses();
    } catch (err) {
      console.error(
        "Expense saving error:",
        err
      );

      if (err.response?.data) {
        setError(
          JSON.stringify(
            err.response.data
          )
        );
      } else {
        setError(
          "Unable to save expense record."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(expenseId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this expense record?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(
        `expenses/${expenseId}/`
      );

      if (
        editingExpenseId === expenseId
      ) {
        resetForm();
      }

      await loadExpenses();
    } catch (err) {
      console.error(
        "Expense deletion error:",
        err
      );

      setError(
        "Unable to delete expense record."
      );
    }
  }

  function getVehicleRegistration(record) {
    if (record.vehicle_plate) {
      return record.vehicle_plate;
    }

    if (record.vehicle_registration) {
      return record.vehicle_registration;
    }

    if (
      record.vehicle?.registration_number
    ) {
      return (
        record.vehicle
          .registration_number
      );
    }

    const vehicleId =
      record.vehicle?.id ||
      record.vehicle_id ||
      record.vehicle;

    const vehicle = vehicles.find(
      (item) =>
        String(item.id) ===
        String(vehicleId)
    );

    return (
      vehicle?.registration_number ||
      vehicle?.plate ||
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

  const totalExpenses =
    expenses.reduce(
      (total, record) =>
        total +
        Number(record.amount || 0),
      0
    );

  return (
    <div className="dashboard-page">
      <Navbar onLogout={onLogout} />

      <header className="dashboard-header">
        <div>
          <h1>Expenses</h1>
          <p>
            Manage vehicle expenses and
            costs
          </p>
        </div>
      </header>

      {error && (
        <p className="error">
          {error}
        </p>
      )}

      <section className="form-card">
        <h2>
          {editingExpenseId
            ? "Edit Expense"
            : "Add Expense"}
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

              {vehicles.map(
                (vehicle) => (
                  <option
                    key={vehicle.id}
                    value={vehicle.id}
                  >
                    {vehicle.registration_number ||
                      vehicle.plate}
                  </option>
                )
              )}
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
              placeholder="500000"
              required
            />
          </div>

          <div>
            <label htmlFor="expense_date">
              Expense Date
            </label>

            <input
              id="expense_date"
              name="expense_date"
              type="date"
              value={form.expense_date}
              onChange={handleChange}
              required
            />
          </div>

          <div>
              <label htmlFor="category">Category</label>

              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                required
              >
                <option value="">Select category</option>

                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              
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
              placeholder="Vehicle maintenance expense"
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingExpenseId
                ? "Update Expense"
                : "Add Expense"}
            </button>

            {editingExpenseId && (
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
          <h3>Total Expenses</h3>
          <p>
            {formatAmount(
              totalExpenses
            )}
          </p>
        </div>

        <div className="summary-card">
          <h3>Expense Records</h3>
          <p>{expenses.length}</p>
        </div>
      </section>

      <section className="income-list-section">
        <h2>Expense List</h2>

        {loading ? (
          <p>
            Loading expense records...
          </p>
        ) : expenses.length === 0 ? (
          <p>
            No expense records found.
          </p>
        ) : (
          <div className="income-table-wrapper">
            <table className="income-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Amount</th>
                  <th>Expense Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {expenses.map(
                  (record) => (
                    <tr key={record.id}>
                      <td>
                        {getVehicleRegistration(
                          record
                        )}
                      </td>

                      <td>
                        {formatAmount(
                          record.amount
                        )}
                      </td>

                      <td>
                        {record.expense_date ||
                          record.date ||
                          "—"}
                      </td>

                      <td>
                        {record.category ||
                          "Other"}
                      </td>

                      <td>
                        {record.description ||
                          "—"}
                      </td>

                      <td>
                        <div className="table-actions">
                          <button
                            className="edit-button"
                            onClick={() =>
                              handleEdit(
                                record
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            className="delete-button"
                            onClick={() =>
                              handleDelete(
                                record.id
                              )
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default Expenses;
