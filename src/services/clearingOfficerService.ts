import axiosInstance from "@/api/axios";

/**
 * Clearing officer role types
 */
export type ClearingOfficerRole =
  | "clearingOfficer"
  | "sao"
  | "registrar"
  | "admin"
  | "cashier"
  | "dean"
  | "library"
  | "tailoring"
  | "guidance"
  | "laboratory";

/**
 * Interface representing a Clearing Officer in the system
 */
export interface ClearingOfficer {
  _id: string;
  schoolId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: ClearingOfficerRole;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Payload for creating a new clearing officer
 */
export interface CreateClearingOfficerPayload {
  schoolId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: ClearingOfficerRole;
}

/**
 * Payload for updating an existing clearing officer
 */
export interface UpdateClearingOfficerPayload {
  schoolId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  role?: ClearingOfficerRole;
}

/**
 * Response type from API that might have 'id' or '_id'
 */
interface ClearingOfficerResponse {
  _id?: string;
  id?: string;
  schoolId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: ClearingOfficerRole;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Fetch all clearing officers from the system
 * @returns Array of clearing officers
 */
export const getAllClearingOfficers = async (): Promise<ClearingOfficer[]> => {
  try {
    const response = await axiosInstance.get<ClearingOfficerResponse[]>(
      "/auth/getAllClearingOfficers"
    );
    const officers = response.data;

    // Normalize ID field: handle both 'id' and '_id'
    return officers.map((officer) => ({
      ...officer,
      _id: officer._id || officer.id || "",
    }));
  } catch (error) {
    console.error("Error fetching clearing officers:", error);
    throw error;
  }
};

/**
 * Fetch a single clearing officer by ID
 * @param id - The clearing officer's unique identifier
 * @returns The clearing officer data
 */
export const getClearingOfficerById = async (
  id: string
): Promise<ClearingOfficer> => {
  try {
    const response = await axiosInstance.get(
      `/auth/getAllClearingOfficerbyId/${id}`
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching clearing officer with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Create a new clearing officer
 * @param data - The clearing officer data including password
 * @returns The newly created clearing officer
 */
export const createClearingOfficer = async (
  data: CreateClearingOfficerPayload
): Promise<ClearingOfficer> => {
  try {
    console.log("Creating clearing officer with payload:", data);
    const response = await axiosInstance.post("/auth/register", data);
    console.log("Create response:", response.data);
    return response.data;
  } catch (error: unknown) {
    console.error("Error creating clearing officer:", error);

    // Type guard for axios error
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as {
        response?: {
          data?: { message?: string; error?: string };
          status?: number;
        };
      };
      console.error("Error response:", axiosError.response?.data);
      console.error("Error status:", axiosError.response?.status);

      // Extract the actual error message from the backend
      const backendMessage =
        axiosError.response?.data?.message || axiosError.response?.data?.error;
      if (backendMessage) {
        throw new Error(backendMessage);
      }
    }
    throw error;
  }
};

/**
 * Update an existing clearing officer
 * @param id - The clearing officer's unique identifier
 * @param data - The fields to update
 * @returns The updated clearing officer data
 */
export const updateClearingOfficer = async (
  id: string,
  data: UpdateClearingOfficerPayload
): Promise<ClearingOfficer> => {
  try {
    const response = await axiosInstance.put(
      `/auth/updateClearingOfficers/${id}`,
      data
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating clearing officer with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a clearing officer from the system
 * @param id - The clearing officer's unique identifier
 * @returns Success message
 */
export const deleteClearingOfficer = async (
  id: string
): Promise<{ message: string }> => {
  try {
    const response = await axiosInstance.delete(
      `/auth/deleteClearingOfficer/${id}`
    );
    return response.data;
  } catch (error) {
    console.error(`Error deleting clearing officer with ID ${id}:`, error);
    throw error;
  }
};
