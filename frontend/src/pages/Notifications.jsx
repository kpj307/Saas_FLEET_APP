import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./Notifications.css";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadNotifications = async () => {
    try {
      setLoading(true);

      const response = await api.get("notifications/");

      const data = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];

      setNotifications(data);
    } catch (error) {
      console.error("Unable to load notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  const getNotificationPath = (notification) => {
    switch (notification.notification_type) {
      case "insurance_expiry":
        return "/insurance";

      case "license_expiry":
      case "inspection_expiry":
        return "/vehicles";

      case "maintenance":
      case "maintenance_due":
        return "/maintenance";

      case "document_expiry":
        return "/documents";

      default:
        return null;
    }
  };

  const handleNotificationClick = async (notification) => {
    const path = getNotificationPath(notification);

    if (!path) {
      return;
    }

    if (!notification.is_read) {
      try {
        await api.post(
          `notifications/${notification.id}/mark-read/`
        );

        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id
              ? { ...item, is_read: true }
              : item
          )
        );
      } catch (error) {
        console.error(
          "Unable to mark notification as read:",
          error
        );
      }
    }

    navigate(path);
  };

  const handleMarkRead = async (notificationId) => {
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
    } catch (error) {
      console.error(
        "Unable to mark notification as read:",
        error
      );
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) {
      return;
    }

    try {
      await api.post("notifications/mark-all-read/");

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          is_read: true,
        }))
      );
    } catch (error) {
      console.error(
        "Unable to mark all notifications as read:",
        error
      );
    }
  };

  const handleCardKeyDown = (event, notification) => {
    if (event.target !== event.currentTarget) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleNotificationClick(notification);
    }
  };

  return (
    <div className="notifications-page">
      <div className="notifications-page-header">
        <div>
          <h1>Notifications</h1>

          <p>
            {unreadCount > 0
              ? `${unreadCount} unread notification${
                  unreadCount === 1 ? "" : "s"
                }`
              : "You're all caught up."}
          </p>
        </div>

        <div className="notifications-page-actions">
          <Link
            to="/dashboard"
            className="back-dashboard-button"
          >
            Back to Dashboard
          </Link>

          {unreadCount > 0 && (
            <button
              type="button"
              className="mark-all-page-button"
              onClick={handleMarkAllRead}
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>

      <div className="notifications-list">
        {loading ? (
          <div className="notifications-state">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="notifications-state">
            <div className="notifications-empty-icon">
              🔔
            </div>

            <h3>No notifications</h3>

            <p>You don't have any notifications yet.</p>
          </div>
        ) : (
          notifications.map((notification) => {
            const path = getNotificationPath(notification);
            const clickable = Boolean(path);

            return (
              <div
                key={notification.id}
                className={`notification-card ${
                  notification.is_read ? "read" : "unread"
                } ${clickable ? "clickable" : ""}`}
                onClick={() =>
                  handleNotificationClick(notification)
                }
                onKeyDown={(event) =>
                  handleCardKeyDown(event, notification)
                }
                role={clickable ? "link" : undefined}
                tabIndex={clickable ? 0 : undefined}
                aria-label={
                  clickable
                    ? `Open ${notification.title}`
                    : undefined
                }
              >
                <div className="notification-card-main">
                  <div className="notification-card-heading">
                    {!notification.is_read && (
                      <span className="unread-dot" />
                    )}

                    <h3>{notification.title}</h3>
                  </div>

                  <p className="notification-card-message">
                    {notification.message}
                  </p>

                  <div className="notification-card-meta">
                    {notification.notification_type && (
                      <span>
                        Type: {notification.notification_type}
                      </span>
                    )}

                    {notification.created_at && (
                      <span>
                        Created:{" "}
                        {new Date(
                          notification.created_at
                        ).toLocaleString()}
                      </span>
                    )}
                  </div>

                  {clickable && (
                    <span className="notification-open-hint">
                      Click to view details →
                    </span>
                  )}
                </div>

                {!notification.is_read && (
                  <button
                    type="button"
                    className="notification-card-read-button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleMarkRead(notification.id);
                    }}
                  >
                    Mark as read
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Notifications;