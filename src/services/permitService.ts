import axiosInstance from "@/api/axios";

/**
 * Interface for permit response from the API
 */
export interface PermitResponse {
  message: string;
  permit: {
    id: string;
    userId: string;
    studentId: string;
    permitCode: string;
    expiresAt: string;
    status: "active" | "expired" | "revoked";
    createdAt: string;
  };
  qrImage: string;
  token: string;
}

/**
 * Check if a student has an active permit (QR code)
 * @param schoolId - The student's school ID
 * @returns Promise with permit data if exists, null if not found or error
 */
export const checkStudentPermit = async (
  schoolId: string
): Promise<PermitResponse | null> => {
  try {
    const response = await axiosInstance.get<PermitResponse>(
      `/permit/student/${schoolId}`
    );

    // Check if permit exists and is active
    if (response.data?.permit?.status === "active") {
      console.log(`✅ Student ${schoolId} has active permit:`, response.data);
      return response.data;
    }

    return null;
  } catch (error) {
    // 404 means no permit found - this is expected for students without permits
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      (error as { response?: { status?: number } })?.response?.status === 404
    ) {
      console.log(`ℹ️ No permit found for student ${schoolId}`);
      return null;
    }

    // Log other errors but don't throw - we don't want to break the UI
    console.error(`❌ Error checking permit for student ${schoolId}:`, error);
    return null;
  }
};

/**
 * Check if a student has cleared all requirements (has active permit)
 * This is a convenience function that returns a boolean
 * @param schoolId - The student's school ID
 * @returns Promise<boolean> - true if student has active permit, false otherwise
 */
export const hasActivePermit = async (schoolId: string): Promise<boolean> => {
  const permit = await checkStudentPermit(schoolId);
  return permit !== null && permit.permit.status === "active";
};

/**
 * Revoke a student's permit (cashier only)
 * @param permitId - The permit ID to revoke
 * @returns Promise with the revoked permit data
 */
export const revokeStudentPermit = async (
  permitId: string
): Promise<{ message: string; permit: PermitResponse["permit"] }> => {
  try {
    const response = await axiosInstance.post(
      `/qr-code/revoke-permit/${permitId}`
    );

    console.log(`✅ Successfully revoked permit ${permitId}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Error revoking permit ${permitId}:`, error);
    throw error;
  }
};
