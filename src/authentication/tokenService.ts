import axiosInstance from "@/api/axios";
import type { User } from "./AuthContext.types";
import { redirectService } from "./redirectService";

// Token management service
class TokenService {
  private accessToken: string | null = null;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    // Initialize from localStorage
    this.accessToken = localStorage.getItem("accessToken");
  }

  getAccessToken(): string | null {
    return this.accessToken || localStorage.getItem("accessToken");
  }

  setAccessToken(token: string | null): void {
    this.accessToken = token;
    if (token) {
      localStorage.setItem("accessToken", token);
    } else {
      localStorage.removeItem("accessToken");
    }
  }

  getUserData() {
    const userData = localStorage.getItem("userData");
    return userData ? JSON.parse(userData) : null;
  }

  setUserData(userData: User): void {
    if (userData) {
      localStorage.setItem("userData", JSON.stringify(userData));
    } else {
      localStorage.removeItem("userData");
    }
  }

  clearTokens(): void {
    this.accessToken = null;
    this.refreshPromise = null;
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userData");
    localStorage.removeItem("role");
  }

  async refreshAccessToken(): Promise<string> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this._performRefresh();

    try {
      const token = await this.refreshPromise;
      this.refreshPromise = null;
      return token;
    } catch (error) {
      this.refreshPromise = null;
      throw error;
    }
  }

  private async _performRefresh(): Promise<string> {
    try {
      console.log("🔄 Attempting token refresh...");
      const res = await axiosInstance.post(
        `/auth/refresh-token`,
        {},
        { withCredentials: true }
      );

      const newToken = res.data.accessToken;
      this.setAccessToken(newToken);

      console.log("✅ Token refresh successful!");
      return newToken;
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { status?: number };
        request?: unknown;
      };
      console.log("❌ Token refresh failed:", axiosError.response?.status);
      this.clearTokens();

      // Show message and redirect to login
      const errorMessage =
        axiosError.response?.status === 401
          ? "Your session has expired. Please log in again."
          : "Authentication failed. Please log in again.";

      redirectService.redirectToLogin(errorMessage);

      throw error;
    }
  }

  isTokenExpired(token: string): boolean {
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }
}

export const tokenService = new TokenService();
