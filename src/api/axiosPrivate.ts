import axios from "axios";
import { tokenService } from "@/authentication/tokenService";
const BASE_URL = import.meta.env.VITE_API_URL;

/**
 * Private axios instance for authenticated requests
 * This instance automatically includes auth tokens and handles token refresh
 */
const axiosPrivate = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Request interceptor to add auth token
axiosPrivate.interceptors.request.use(
  (config) => {
    const token = tokenService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
axiosPrivate.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't try to refresh for auth endpoints
    if (originalRequest?.url?.includes("/auth/")) {
      return Promise.reject(error);
    }

    // If access token expired, try to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newToken = await tokenService.refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosPrivate(originalRequest);
      } catch (refreshError) {
        // Token service handles the redirect and message
        console.log(
          "🔄 Token refresh failed, token service will handle redirect"
        );
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosPrivate;
