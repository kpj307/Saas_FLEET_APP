import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import api from "../api/axios";

function Login({ onLogin }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [showSessionExpired, setShowSessionExpired] = useState(
    searchParams.get("session") === "expired"
  );

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await api.post("auth/token/", {
        username,
        password,
      });

      console.log("Login response:", response.data);

      localStorage.setItem(
        "access_token",
        response.data.access
      );

      localStorage.setItem(
        "refresh_token",
        response.data.refresh
      );

      onLogin(response.data.access);

      navigate("/dashboard", {
        replace: true,
      });
    } catch (err) {
      console.error("Login error:", err);

      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError(
          "Login failed. Check the browser console for details."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  function handleUsernameChange(event) {
    setUsername(event.target.value);

    if (showSessionExpired) {
      setShowSessionExpired(false);
    }
  }

  function handlePasswordChange(event) {
    setPassword(event.target.value);

    if (showSessionExpired) {
      setShowSessionExpired(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Fleet App</h1>
        <h2>Login</h2>

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username">
              Username
            </label>

            <input
              id="username"
              type="text"
              value={username}
              onChange={handleUsernameChange}
              required
            />
          </div>

          <div>
            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              required
            />
          </div>

          {showSessionExpired && !error && (
            <p className="session-expired-message">
              Your session has expired. Please log in again.
            </p>
          )}

          {error && (
            <p className="error">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p>New to Fleet App? <Link to="/register">Create a company account</Link></p>
      </div>
    </div>
  );
}

export default Login;