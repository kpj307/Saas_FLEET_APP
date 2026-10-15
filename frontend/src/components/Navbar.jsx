import { NavLink } from "react-router-dom";
import NotificationBell from "./NotificationBell";

function Navbar({ onLogout }) {
  // Keep the primary navigation focused on the most common fleet tasks.
  // Finance, insurance, and notifications remain accessible from the dashboard
  // and notification bell.
  const links = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Vehicles", path: "/vehicles" },
    { label: "Maintenance", path: "/maintenance" },
    { label: "Documents", path: "/documents" },
    { label: "Reports", path: "/reports" },
    { label: "Plans & Billing", path: "/subscription" },
  ];

  return (
    <nav className="navbar" aria-label="Main navigation">
      <div className="navbar-brand">Fleet App</div>

      <div className="navbar-links">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            {link.label}
          </NavLink>
        ))}
      </div>

      <div className="navbar-actions">
        <NotificationBell />
        <button
          type="button"
          className="navbar-logout"
          onClick={onLogout}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
