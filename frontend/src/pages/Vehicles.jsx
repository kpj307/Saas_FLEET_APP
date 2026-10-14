import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import api from "../api/axios";
import Navbar from "../components/Navbar";

const emptyForm = {
  registration_number: "",
  make: "",
  model: "",
  status: "active",
  insurance_expiry: "",
  license_expiry: "",
  inspection_expiry: "",
};

function Vehicles({ onLogout }) {
  const [searchParams] = useSearchParams();

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [editingVehicleId, setEditingVehicleId] =
    useState(null);

  async function loadVehicles() {
    try {
      const response = await api.get("vehicles/");
      setVehicles(response.data);
    } catch (err) {
      console.error(
        "Vehicle loading error:",
        err
      );

      setError("Unable to load vehicles.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVehicles();
  }, []);

  useEffect(() => {
    const vehicleId = searchParams.get("id");

    if (!vehicleId || vehicles.length === 0) {
      return;
    }

    const vehicle = vehicles.find(
      (item) => String(item.id) === String(vehicleId)
    );

    if (vehicle) {
      handleEdit(vehicle);
    }
  }, [searchParams, vehicles]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingVehicleId(null);
    setError("");
  }

  function handleEdit(vehicle) {
    setEditingVehicleId(vehicle.id);

    setForm({
      registration_number:
        vehicle.registration_number || "",
      make: vehicle.make || "",
      model: vehicle.model || "",
      status: vehicle.status || "active",
      insurance_expiry:
        vehicle.insurance_expiry || "",
      license_expiry:
        vehicle.license_expiry || "",
      inspection_expiry:
        vehicle.inspection_expiry || "",
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

    const vehicleData = {
      ...form,
      insurance_expiry:
        form.insurance_expiry || null,
      license_expiry:
        form.license_expiry || null,
      inspection_expiry:
        form.inspection_expiry || null,
    };

    try {
      if (editingVehicleId) {
        await api.put(
          `vehicles/${editingVehicleId}/`,
          vehicleData
        );
      } else {
        await api.post(
          "vehicles/",
          vehicleData
        );
      }

      resetForm();
      await loadVehicles();
    } catch (err) {
      console.error(
        "Vehicle saving error:",
        err
      );

      if (err.response?.data) {
        setError(
          JSON.stringify(err.response.data)
        );
      } else {
        setError("Unable to save vehicle.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(vehicleId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this vehicle?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(
        `vehicles/${vehicleId}/`
      );

      if (editingVehicleId === vehicleId) {
        resetForm();
      }

      await loadVehicles();
    } catch (err) {
      console.error(
        "Vehicle deletion error:",
        err
      );

      setError("Unable to delete vehicle.");
    }
  }

  return (
    <div className="dashboard-page">
      <Navbar onLogout={onLogout} />

      <header className="dashboard-header">
        <div>
          <h1>Vehicles</h1>
          <p>Manage your fleet vehicles</p>
        </div>
      </header>

      {error && (
        <p className="error">
          {error}
        </p>
      )}

      <section className="form-card">
        <h2>
          {editingVehicleId
            ? "Edit Vehicle"
            : "Add Vehicle"}
        </h2>

        <form
          className="vehicle-form"
          onSubmit={handleSubmit}
        >
          <div>
            <label htmlFor="registration_number">
              Registration Number
            </label>

            <input
              id="registration_number"
              name="registration_number"
              value={form.registration_number}
              onChange={handleChange}
              placeholder="UAX 123A"
              required
            />
          </div>

          <div>
            <label htmlFor="make">
              Make
            </label>

            <input
              id="make"
              name="make"
              value={form.make}
              onChange={handleChange}
              placeholder="Toyota"
              required
            />
          </div>

          <div>
            <label htmlFor="model">
              Model
            </label>

            <input
              id="model"
              name="model"
              value={form.model}
              onChange={handleChange}
              placeholder="Hiace"
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
              <option value="active">
                Active
              </option>

              <option value="inactive">
                Inactive
              </option>

              <option value="maintenance">
                Maintenance
              </option>
            </select>
          </div>

          <div>
            <label htmlFor="insurance_expiry">
              Insurance Expiry
            </label>

            <input
              id="insurance_expiry"
              name="insurance_expiry"
              type="date"
              value={form.insurance_expiry}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="license_expiry">
              License Expiry
            </label>

            <input
              id="license_expiry"
              name="license_expiry"
              type="date"
              value={form.license_expiry}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="inspection_expiry">
              Inspection Expiry
            </label>

            <input
              id="inspection_expiry"
              name="inspection_expiry"
              type="date"
              value={form.inspection_expiry}
              onChange={handleChange}
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingVehicleId
                ? "Update Vehicle"
                : "Add Vehicle"}
            </button>

            {editingVehicleId && (
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
        <h2>Vehicle List</h2>

        {loading ? (
          <p>Loading vehicles...</p>
        ) : vehicles.length === 0 ? (
          <p>No vehicles found.</p>
        ) : (
          <div className="vehicle-table-wrapper">
            <table className="vehicle-table">
              <thead>
                <tr>
                  <th>Registration</th>
                  <th>Make</th>
                  <th>Model</th>
                  <th>Status</th>
                  <th>Insurance Expiry</th>
                  <th>License Expiry</th>
                  <th>Inspection Expiry</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id}>
                    <td>
                      {vehicle.registration_number}
                    </td>

                    <td>{vehicle.make}</td>

                    <td>{vehicle.model}</td>

                    <td>
                      <span
                        className={`status-badge status-${vehicle.status}`}
                      >
                        {vehicle.status}
                      </span>
                    </td>

                    <td>
                      {vehicle.insurance_expiry ||
                        "—"}
                    </td>

                    <td>
                      {vehicle.license_expiry ||
                        "—"}
                    </td>

                    <td>
                      {vehicle.inspection_expiry ||
                        "—"}
                    </td>

                    <td>
                      <div className="table-actions">
                        <button
                          className="edit-button"
                          onClick={() =>
                            handleEdit(vehicle)
                          }
                        >
                          Edit
                        </button>

                        <button
                          className="delete-button"
                          onClick={() =>
                            handleDelete(vehicle.id)
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

export default Vehicles;