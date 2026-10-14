
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import Navbar from "../components/Navbar";

function Insurance({ onLogout }) {
  const [insuranceRecords, setInsuranceRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const selectedInsuranceId = searchParams.get("id");

  const loadInsurance = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [insuranceResponse, vehiclesResponse] =
        await Promise.all([
          api.get("insurance/"),
          api.get("vehicles/"),
        ]);

      const insuranceData = Array.isArray(insuranceResponse.data)
        ? insuranceResponse.data
        : insuranceResponse.data?.results || [];

      const vehiclesData = Array.isArray(vehiclesResponse.data)
        ? vehiclesResponse.data
        : vehiclesResponse.data?.results || [];

      setInsuranceRecords(insuranceData);
      setVehicles(vehiclesData);
    } catch (err) {
      console.error("Unable to load insurance records:", err);
      setError(
        "Unable to load insurance records. Check that the insurance API endpoint exists."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInsurance();
  }, [loadInsurance]);

  const selectedRecord = insuranceRecords.find(
    (record) => String(record.id) === String(selectedInsuranceId)
  );

  const getVehicleRegistration = (record) => {
    if (record.vehicle_registration) {
      return record.vehicle_registration;
    }

    if (typeof record.vehicle === "object" && record.vehicle !== null) {
      return (
        record.vehicle.registration_number ||
        `Vehicle #${record.vehicle.id}`
      );
    }

    const vehicle = vehicles.find(
      (item) => String(item.id) === String(record.vehicle)
    );

    return vehicle?.registration_number || `Vehicle #${record.vehicle}`;
  };

  const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleDateString();
  };

  return (
    <div className="dashboard-page">
      <Navbar onLogout={onLogout} />
      <header className="page-header">
        <div>
          <h1>Insurance</h1>
          <p>Manage vehicle insurance policies and expiry dates.</p>
        </div>
      </header>

      {loading ? (
        <p>Loading insurance records...</p>
      ) : error ? (
        <div role="alert">
          <p>{error}</p>
          <button type="button" onClick={loadInsurance}>
            Try again
          </button>
        </div>
      ) : insuranceRecords.length === 0 ? (
        <div>
          <h2>No insurance records found</h2>
          <p>Insurance records will appear here when available.</p>
        </div>
      ) : (
        <>
          {selectedInsuranceId && (
            <div className="insurance-selected-record">
              {selectedRecord ? (
                <>
                  <h2>Selected insurance policy</h2>
                  <p>
                    Policy:{" "}
                    {selectedRecord.policy_number ||
                      selectedRecord.policy_number_display ||
                      `Record #${selectedRecord.id}`}
                  </p>
                  <p>
                    Vehicle: {getVehicleRegistration(selectedRecord)}
                  </p>
                  <p>
                    Expiry date:{" "}
                    {formatDate(
                      selectedRecord.expiry_date ||
                        selectedRecord.end_date ||
                        selectedRecord.insurance_expiry
                    )}
                  </p>
                </>
              ) : (
                <p>
                  Insurance record #{selectedInsuranceId} was not found
                  in the loaded records.
                </p>
              )}
            </div>
          )}

          <div className="insurance-table-wrapper">
            <table className="insurance-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Policy Number</th>
                  <th>Provider</th>
                  <th>Expiry Date</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {insuranceRecords.map((record) => {
                  const expiry =
                    record.expiry_date ||
                    record.end_date ||
                    record.insurance_expiry;

                  const isSelected =
                    String(record.id) === String(selectedInsuranceId);

                  return (
                    <tr
                      key={record.id}
                      className={isSelected ? "selected-record" : ""}
                    >
                      <td>{getVehicleRegistration(record)}</td>
                      <td>
                        {record.policy_number ||
                          record.policy_number_display ||
                          "—"}
                      </td>
                      <td>
                        {record.provider ||
                          record.insurance_provider ||
                          "—"}
                      </td>
                      <td>{formatDate(expiry)}</td>
                      <td>
                        {record.status ||
                          (expiry && new Date(expiry) < new Date()
                            ? "Expired"
                            : "Active")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default Insurance;