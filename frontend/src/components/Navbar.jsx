import { NavLink } from "react-router-dom";
import NotificationBell from "./NotificationBell";

function Navbar({ onLogout }) {
  const links = [
    {
      label: "Dashboard",
      path: "/dashboard",
    },
    {
      label: "Vehicles",
      path: "/vehicles",
    },
    {
      label: "Maintenance",
      path: "/maintenance",
    },
    {
      label: "Documents",
      path: "/documents",
    },
    {
      label: "Insurance",
      path: "/insurance",
    },
    {
      label: "Notifications",
      path: "/notifications",
    },
    {
      label: "Reports",
      path: "/reports",
    },
    {
      label: "Income",
      path: "/income",
    },
    {
      label: "Expenses",
      path: "/expenses",
    },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        Fleet App
      </div>

      <div className="navbar-links">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              isActive
                ? "nav-link active"
                : "nav-link"
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