import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
  headers: {
    "Content-Type": "application/json",
  },
});

// Prevent multiple refresh requests at the same time
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });

  failedQueue = [];
};

// Attach access token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle expired access tokens
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Only handle 401 responses
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Don't try to refresh the login/refresh endpoints themselves
    if (
      originalRequest?.url?.includes("auth/token/") ||
      originalRequest?.url?.includes("auth/token/refresh/")
    ) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }

      return Promise.reject(error);
    }

    // Prevent the same request from being retried repeatedly
    if (originalRequest._retry) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }

      return Promise.reject(error);
    }

    // If another request is already refreshing the token,
    // wait for that refresh to finish.
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve,
          reject,
        });
      })
        .then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        })
        .catch((refreshError) => {
          return Promise.reject(refreshError);
        });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = localStorage.getItem("refresh_token");

    // No refresh token available
    if (!refreshToken) {
      isRefreshing = false;

      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");

      if (window.location.pathname !== "/login") {
        window.location.href = "/login?session=expired";
      }

      return Promise.reject(error);
    }

    try {
      // Request a new access token
      const response = await axios.post(
        "http://127.0.0.1:8000/api/auth/token/refresh/",
        {
          refresh: refreshToken,
        }
      );

      const newAccessToken = response.data.access;

      // Save the new access token
      localStorage.setItem("access_token", newAccessToken);

      if (response.data.refresh) {
        localStorage.setItem(
          "refresh_token",
          response.data.refresh
        );
      }

      // Notify queued requests
      processQueue(null, newAccessToken);

      // Update the original request
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      // Retry the original request
      return api(originalRequest);
    } catch (refreshError) {
      // Refresh token has expired/been rejected
      processQueue(refreshError, null);

      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");

      if (window.location.pathname !== "/login") {
        window.location.href = "/login?session=expired";
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;