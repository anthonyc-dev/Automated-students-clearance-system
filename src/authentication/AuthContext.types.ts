// User interface
export interface User {
  id: string;
  studentId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  role: string;
}

// Error interface for Axios responses
export interface AxiosError {
  response?: {
    status?: number;
    data?: {
      message?: string;
      error?: string;
    };
  };
  config?: {
    url?: string;
    _retry?: boolean;
    headers: Record<string, string>;
  };
}

/**
 * AuthContextType defines the shape of the authentication context.
 */
export interface AuthContextType {
  accessToken: string | null;
  user: User | null;
  role?: string;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  registerUser: (
    studentId: string,
    firstName: string,
    lastName: string,
    email: string,
    phoneNumber: string,
    password: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}
