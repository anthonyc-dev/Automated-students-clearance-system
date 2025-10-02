import axiosInstance from "@/api/axios";
import { tokenService } from "@/authentication/tokenService";
import { AuthContext } from "@/authentication/context";
import { redirectService } from "@/authentication/redirectService";
import type { AxiosError, User } from "@/authentication/AuthContext.types";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

/**
 * AuthProvider manages authentication state and logic.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [accessToken, setAccessToken] = useState<string | null>(() =>
    tokenService.getAccessToken()
  );
  const [user, setUser] = useState<User | null>(() =>
    tokenService.getUserData()
  );
  const [loading, setLoading] = useState(false);

  // Computed values
  const isAuthenticated = Boolean(accessToken && user);
  const role = user?.role;

  /**
   * Handles user login.
   */
  const login = async (email: string, password: string) => {
    console.log("🔑 Starting login process...");
    const res = await axiosInstance.post("/auth/login", { email, password });
    const token = res.data.accessToken;
    const userData = res.data.user;

    // Store token and user data
    tokenService.setAccessToken(token);
    tokenService.setUserData(userData);

    // Update state
    setAccessToken(token);
    setUser(userData);

    console.log("✅ Login successful");
  };

  /**
   * Handles user registration.
   */
  const registerUser = async (
    studentId: string,
    firstName: string,
    lastName: string,
    email: string,
    phoneNumber: string,
    password: string
  ) => {
    try {
      await axiosInstance.post("/auth/register", {
        studentId,
        firstName,
        lastName,
        email,
        phoneNumber,
        password,
        role: "clearingOfficer" as const,
      });
    } catch (err: unknown) {
      const error = err as AxiosError;
      if (error.response?.status === 400) {
        toast.error(
          error?.response?.data?.message ||
            error?.response?.data?.error ||
            "Registration failed."
        );
      }
      throw error;
    }
  };

  /**
   * Logs out the user, clears all local storage, and redirects to login.
   */
  const logout = async () => {
    try {
      const currentToken = tokenService.getAccessToken();
      await axiosInstance.post(
        "/auth/logout",
        {},
        {
          withCredentials: true,
          headers: currentToken
            ? { Authorization: `Bearer ${currentToken}` }
            : {},
        }
      );
    } catch (error) {
      console.error("Logout failed on server:", error);
    }

    // Local cleanup
    tokenService.clearTokens();
    setAccessToken(null);
    setUser(null);

    redirectService.redirectToLogin(
      "You have been logged out successfully.",
      false
    );
  };

  /**
   * Attempts to refresh the access token using the token service.
   */
  const refreshAccessToken = async (): Promise<string> => {
    try {
      const newToken = await tokenService.refreshAccessToken();
      setAccessToken(newToken);
      return newToken;
    } catch (err: unknown) {
      // Token service handles cleanup and redirect
      setAccessToken(null);
      setUser(null);
      throw err;
    }
  };

  /**
   * On mount, try to refresh token if user data exists but no valid access token.
   */
  useEffect(() => {
    const tryInitialRefresh = async () => {
      const storedToken = tokenService.getAccessToken();
      const storedUser = tokenService.getUserData();

      // If we have user data but no valid token, try to refresh
      if (
        storedUser &&
        (!storedToken || tokenService.isTokenExpired(storedToken))
      ) {
        console.log("🔄 Attempting initial token refresh...");
        try {
          await refreshAccessToken();
        } catch {
          console.log("❌ Initial refresh failed - clearing data");
          tokenService.clearTokens();
          setAccessToken(null);
          setUser(null);
        }
      }
    };
    tryInitialRefresh();
  }, []);

  /**
   * Set up axios interceptors for request and response.
   * Handles automatic token refresh and logout on refresh token expiry.
   */
  useEffect(() => {
    console.log("🔧 Setting up axios interceptors");

    const requestIntercept = axiosInstance.interceptors.request.use(
      (config) => {
        const currentToken = tokenService.getAccessToken();
        if (currentToken && !config.url?.includes("/auth/")) {
          config.headers.Authorization = `Bearer ${currentToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseIntercept = axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Don't try to refresh for auth endpoints
        if (originalRequest?.url?.includes("/auth/")) {
          return Promise.reject(error);
        }

        // If access token expired, try to refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          console.log("🚨 401 - Attempting token refresh");
          originalRequest._retry = true;

          try {
            const newToken = await refreshAccessToken();
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axiosInstance(originalRequest);
          } catch (refreshError: unknown) {
            // Token service handles cleanup and redirect
            setAccessToken(null);
            setUser(null);
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axiosInstance.interceptors.request.eject(requestIntercept);
      axiosInstance.interceptors.response.eject(responseIntercept);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        user,
        role,
        isAuthenticated,
        login,
        registerUser,
        logout,
        loading,
        setLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Export useAuth hook separately to avoid fast refresh issues
