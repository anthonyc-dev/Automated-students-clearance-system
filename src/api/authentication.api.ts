import axiosInstance from "@/api/axios";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: string;
}

export interface AuthResponse {
  message: string;
  user: {
    id: string;
    studentId?: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    role: string;
  };
  accessToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}

/**
 * Authentication API service
 */
export const authApi = {
  /**
   * Login user
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await axiosInstance.post("/auth/login", data);
    return response.data;
  },

  /**
   * Register new user
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await axiosInstance.post("/auth/register", data);
    return response.data;
  },

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<RefreshResponse> {
    const response = await axiosInstance.post(
      "/auth/refresh-token",
      {},
      { withCredentials: true }
    );
    return response.data;
  },

  /**
   * Logout user
   */
  async logout(): Promise<{ message: string }> {
    const response = await axiosInstance.post(
      "/auth/logout",
      {},
      { withCredentials: true }
    );
    return response.data;
  },

  /**
   * Get user profile (protected route)
   */
  async getProfile(): Promise<{ user: any }> {
    const response = await axiosInstance.get("/auth/profile");
    return response.data;
  },
};
