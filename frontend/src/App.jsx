import { useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Vehicles from "./pages/Vehicles";
import Maintenance from "./pages/Maintenance";
import Documents from "./pages/Documents";
import Notifications from "./pages/Notifications";
import Insurance from "./pages/Insurance";
import Reports from "./pages/Reports";
import Income from "./pages/Income";
import Expenses from "./pages/Expenses";
import Subscription from "./pages/Subscription";

function App() {
  const [token, setToken] = useState(
    localStorage.getItem("access_token")
  );

  function handleLogin(accessToken) {
    localStorage.setItem("access_token", accessToken);
    setToken(accessToken);
  }

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    setToken(null);
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Home */}
        <Route
          path="/"
          element={
            <Navigate
              to={token ? "/dashboard" : "/login"}
              replace
            />
          }
        />

        {/* Login */}
        <Route
          path="/login"
          element={
            token ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />

        {/* Company registration */}
        <Route
          path="/register"
          element={
            token ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Register onLogin={handleLogin} />
            )
          }
        />

        {/* Company onboarding for existing accounts without a company */}
        <Route
          path="/onboarding"
          element={
            token ? (
              <Onboarding />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Subscription plans and billing */}
        <Route
          path="/subscription"
          element={
            token ? (
              <Subscription onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            token ? (
              <Dashboard onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Vehicles */}
        <Route
          path="/vehicles"
          element={
            token ? (
              <Vehicles onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Maintenance */}
        <Route
          path="/maintenance"
          element={
            token ? (
              <Maintenance onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Documents */}
        <Route
          path="/documents"
          element={
            token ? (
              <Documents onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Notifications */}
        <Route
          path="/notifications"
          element={
            token ? (
              <Notifications onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Insurance */}
        <Route
          path="/insurance"
          element={
            token ? (
              <Insurance onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/reports"
          element={
            token ? (
              <Reports onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/income"
          element={
            token ? (
              <Income onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/expenses"
          element={
            token ? (
              <Expenses onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;