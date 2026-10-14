
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./NotificationBell.css";

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  // Load notifications from the backend.
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("notifications/");
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.results || [];

      setNotifications(data);
    } catch (err) {
      console.error("Unable to load notifications:", err);
      setError("Unable to load notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Close the dropdown when clicking outside.
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  // Map backend notification types to application routes.
  const getNotificationPath = (notification) => {
    switch (notification.reference_type || notification.notification_type) {
      case "insurance":
      case "insurance_expiry":
        return notification.reference_id
          ? `/insurance?id=${notification.reference_id}`
          : "/insurance";

      case "maintenance":
      case "maintenance_due":
        return notification.reference_id
          ? `/maintenance?id=${notification.reference_id}`
          : "/maintenance";

      case "document":
      case "document_expiry":
        return notification.reference_id
          ? `/documents?id=${notification.reference_id}`
          : "/documents";

      case "vehicle":
      case "license_expiry":
      case "inspection_expiry":
        return notification.reference_id
          ? `/vehicles?id=${notification.reference_id}`
          : "/vehicles";

      case "general":
      default:
        return "/notifications";
    }
  };

  // Mark one notification as read.
  const markNotificationRead = async (notificationId) => {
    try {
      await api.post(
        `notifications/${notificationId}/mark-read/`
      );

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );
    } catch (err) {
      console.error("Unable to mark notification as read:", err);
    }
  };

  // Navigate immediately, then mark as read in the background.
  const handleNotificationClick = (notification) => {
    if (!notification) return;

    const path = getNotificationPath(notification);

    setIsOpen(false);
    navigate(path);

    if (!notification.is_read) {
      markNotificationRead(notification.id);
    }
  };

  // Mark all notifications as read.
  const handleMarkAllRead = async (event) => {
    event.stopPropagation();

    if (unreadCount === 0) return;

    try {
      await api.post("notifications/mark-all-read/");

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          is_read: true,
        }))
      );

      setError("");
    } catch (err) {
      console.error("Unable to mark all notifications as read:", err);
      setError("Unable to mark all notifications as read.");
    }
  };

  // Toggle dropdown and refresh its contents when opened.
  const handleToggle = () => {
    const shouldOpen = !isOpen;
    setIsOpen(shouldOpen);

    if (shouldOpen) {
      loadNotifications();
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleString();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "insurance_expiry":
        return "🛡️";

      case "license_expiry":
        return "📋";

      case "inspection_expiry":
        return "🔍";

      case "maintenance":
      case "maintenance_due":
        return "🔧";

      case "document_expiry":
        return "📄";

      default:
        return "🔔";
    }
  };

  return (
    <div
      className="notification-bell-container"
      ref={dropdownRef}
    >
      <button
        type="button"
        className="notification-bell-button"
        onClick={handleToggle}
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="notification-bell-icon">🔔</span>

        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="notification-dropdown"
          role="dialog"
          aria-label="Notifications"
        >
          <div className="notification-dropdown-header">
            <div>
              <h3>Notifications</h3>
              <span className="notification-unread-count">
                {unreadCount} unread
              </span>
            </div>

            <button
              type="button"
              className="notification-close-button"
              onClick={() => setIsOpen(false)}
              aria-label="Close notifications"
            >
              ×
            </button>
          </div>

          {unreadCount > 0 && (
            <div className="notification-dropdown-actions">
              <button
                type="button"
                className="notification-mark-all-button"
                onClick={handleMarkAllRead}
              >
                Mark all as read
              </button>
            </div>
          )}

          <div className="notification-dropdown-list">
            {loading && notifications.length === 0 ? (
              <div className="notification-state">
                Loading notifications...
              </div>
            ) : error && notifications.length === 0 ? (
              <div className="notification-state">
                <p>{error}</p>
                <button
                  type="button"
                  onClick={loadNotifications}
                >
                  Try again
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="notification-state">
                <span className="notification-empty-icon">🔔</span>
                <p>No notifications yet.</p>
              </div>
            ) : (
              notifications.slice(0, 8).map((notification) => (
                <button
                  type="button"
                  key={notification.id}
                  className={`notification-item notification-clickable ${
                    notification.is_read
                      ? "notification-read"
                      : "notification-unread"
                  }`}
                  onClick={() =>
                    handleNotificationClick(notification)
                  }
                  aria-label={`Open notification: ${
                    notification.title || "Notification"
                  }`}
                >
                  <span className="notification-item-icon">
                    {getNotificationIcon(
                      notification.notification_type
                    )}
                  </span>

                  <span className="notification-item-content">
                    <span className="notification-item-title">
                      {notification.title || "Notification"}
                    </span>

                    <span className="notification-item-message">
                      {notification.message}
                    </span>

                    {notification.created_at && (
                      <span className="notification-item-date">
                        {formatDate(notification.created_at)}
                      </span>
                    )}

                    <span className="notification-item-open-hint">
                      Click to view →
                    </span>
                  </span>

                  {!notification.is_read && (
                    <span
                      className="notification-unread-indicator"
                      aria-label="Unread"
                    />
                  )}
                </button>
              ))
            )}
          </div>

          <div className="notification-dropdown-footer">
            <Link
              to="/notifications"
              className="notification-view-all"
              onClick={() => setIsOpen(false)}
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;