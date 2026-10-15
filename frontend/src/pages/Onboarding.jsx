import { useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../api/axios";

function Onboarding() {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("auth/onboarding/", { company_name: companyName });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === "object") {
        setError(
          Object.values(data)
            .flatMap((value) => Array.isArray(value) ? value : [value])
            .map(String)
            .join(" ")
        );
      } else {
        setError("We couldn't save your company details. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Fleet App</h1>
        <h2>Set up your company</h2>
        <p>Enter your transport company's name to finish setting up your fleet workspace.</p>

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="company_name">Company name</label>
            <input
              id="company_name"
              name="company_name"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              autoComplete="organization"
              maxLength={150}
              required
            />
          </div>

          {error && <p className="error" role="alert">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Saving company..." : "Finish setup"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Onboarding;
