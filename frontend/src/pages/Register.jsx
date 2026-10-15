import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import api from "../api/axios";

function Register({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    company_name: "",
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("auth/register/", form);
      localStorage.setItem("access_token", response.data.access);
      localStorage.setItem("refresh_token", response.data.refresh);
      onLogin(response.data.access);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === "object") {
        const messages = Object.entries(data).flatMap(([field, value]) => {
          const values = Array.isArray(value) ? value : [value];
          return values.map((message) =>
            field === "detail" || field === "non_field_errors"
              ? String(message)
              : `${field.replaceAll("_", " ")}: ${message}`
          );
        });
        setError(messages.join(" "));
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Fleet App</h1>
        <h2>Create your company account</h2>
        <p>Start managing your vehicles, maintenance, documents, and costs in one place.</p>

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="company_name">Company name</label>
            <input
              id="company_name"
              name="company_name"
              value={form.company_name}
              onChange={handleChange}
              autoComplete="organization"
              maxLength={150}
              required
            />
          </div>

          <div>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              value={form.username}
              onChange={handleChange}
              autoComplete="username"
              maxLength={150}
              required
            />
          </div>

          <div>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>

          {error && <p className="error" role="alert">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create company account"}
          </button>
        </form>

        <p>Already registered? <Link to="/login">Log in</Link></p>
      </div>
    </div>
  );
}

export default Register;
