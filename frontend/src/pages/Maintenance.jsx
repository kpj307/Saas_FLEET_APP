import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import api from "../api/axios";
import Navbar from "../components/Navbar";

const emptyForm = {
  vehicle: "",
  title: "",
  description: "",
  maintenance_date: "",
  cost: "",
  status: "pending",
};

function Maintenance({ onLogout }) {
  const [searchParams] = useSearchParams();

  const [vehicles, setVehicles] = useState([]);
  const [records, setRecords] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [editingRecordId, setEditingRecordId] =
    useState(null);

  async function loadData() {
    try {
      const [vehiclesResponse, recordsResponse] =
        await Promise.all([
          api.get("vehicles/"),
          api.get("maintenance/"),
        ]);

      setVehicles(vehiclesResponse.data);
      setRecords(recordsResponse.data);
    } catch (err) {
      console.error(
        "Maintenance loading error:",
        err
      );

      setError(
        "Unable to load maintenance data."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const recordId = searchParams.get("id");

    if (!recordId || records.length === 0) {
      return;
    }

    const record = records.find(
      (item) => String(item.id) === String(recordId)
    );

    if (record) {
      handleEdit(record);
    }
  }, [searchParams, records]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingRecordId(null);
    setError("");
  }

  function handleEdit(record) {
    setEditingRecordId(record.id);

    setForm({
      vehicle: String(record.vehicle),
      title: record.title || "",
      description: record.description || "",
      maintenance_date:
        record.maintenance_date || "",
      cost: record.cost || "",
      status: record.status || "pending",
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

    const recordData = {
      ...form,
      vehicle: Number(form.vehicle),
      cost: form.cost,
    };

    try {
      if (editingRecordId) {
        await api.put(
          `maintenance/${editingRecordId}/`,
          recordData
        );
      } else {
        await api.post(
          "maintenance/",
          recordData
        );
      }

      resetForm();
      await loadData();
    } catch (err) {
      console.error(
        "Maintenance saving error:",
        err
      );

      if (err.response?.data) {
        setError(
          JSON.stringify(err.response.data)
        );
      } else {
        setError(
          "Unable to save maintenance record."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(recordId) {
    const confirmed = window.confirm(
      "Delete this maintenance record?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(
        `maintenance/${recordId}/`
      );

      if (editingRecordId === recordId) {
        resetForm();
      }

      await loadData();
    } catch (err) {
      console.error(
        "Maintenance deletion error:",
        err
      );

      setError(
        "Unable to delete maintenance record."
      );
    }
  }

  function getVehicleName(vehicleId) {
    const vehicle = vehicles.find(
      (item) => item.id === vehicleId
    );

    return vehicle
      ? `${vehicle.registration_number} - ${vehicle.make} ${vehicle.model}`
      : "Unknown vehicle";
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

  return (
    <div className="dashboard-page">
      <Navbar onLogout={onLogout} />

      <header className="dashboard-header">
        <div>
          <h1>Maintenance</h1>
          <p>Manage vehicle maintenance records</p>
        </div>
      </header>

      {error && (
        <p className="error">
          {error}
        </p>
      )}

      <section className="form-card">
        <h2>
          {editingRecordId
            ? "Edit Maintenance Record"
            : "Add Maintenance Record"}
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
                  {vehicle.registration_number} -{" "}
                  {vehicle.make} {vehicle.model}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="title">
              Title
            </label>

            <input
              id="title"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Oil change"
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
              value={form.description}
              onChange={handleChange}
              placeholder="Changed engine oil"
            />
          </div>

          <div>
            <label htmlFor="maintenance_date">
              Maintenance Date
            </label>

            <input
              id="maintenance_date"
              name="maintenance_date"
              type="date"
              value={form.maintenance_date}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="cost">
              Cost
            </label>

            <input
              id="cost"
              name="cost"
              type="number"
              min="0"
              step="0.01"
              value={form.cost}
              onChange={handleChange}
              placeholder="250000"
              required
            />
          </div>

          <div>
            <label htmlFor="status">
              Status
            </label>

            <select
              id="status"
              name="status"
              value={form.status}
              onChange={handleChange}
            >
              <option value="pending">
                Pending
              </option>

              <option value="in_progress">
                In Progress
              </option>

              <option value="completed">
                Completed
              </option>
            </select>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingRecordId
                ? "Update Maintenance"
                : "Add Maintenance"}
            </button>

            {editingRecordId && (
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

      <section className="vehicle-list-section">
        <h2>Maintenance Records</h2>

        {loading ? (
          <p>Loading maintenance records...</p>
        ) : records.length === 0 ? (
          <p>No maintenance records found.</p>
        ) : (
          <div className="vehicle-table-wrapper">
            <table className="vehicle-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Date</th>
                  <th>Cost</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td>
                      {getVehicleName(record.vehicle)}
                    </td>

                    <td>{record.title}</td>

                    <td>
                      {record.description || "—"}
                    </td>

                    <td>
                      {record.maintenance_date}
                    </td>

                    <td>{formatAmount(record.cost)}</td>

                    <td>
                      <span
                        className={`status-badge status-${record.status}`}
                      >
                        {record.status.replace(
                          "_",
                          " "
                        )}
                      </span>
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

export default Maintenance;