// User interface
export interface User {
  id: string;
  schoolId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  profileImage?: string;
  profile?: string;
  role: string;
  department?: string;
  createdAt?: string;
  updatedAt?: string;
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
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  registerUser: (
    schoolId: string,
    firstName: string,
    lastName: string,
    email: string,
    phoneNumber: string,
    password: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  logoutLoading: boolean;
  updateUser: (userData: User) => void;
}
