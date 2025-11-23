import axiosInstance from "@/api/axios";

export interface QRGenerationResponse {
  message: string;
  permit: {
    id: string;
    userId: string;
    studentId: string;
    permitCode: string;
    status: string;
    expiresAt: string;
    createdAt: string;
  };
  qrImage: string;
  token: string;
}

export interface QRGenerationError {
  error: string;
  missingRequirements?: {
    studentRequirements?: string[];
    institutionalRequirements?: string[];
  };
}

/**
 * Generate QR code for a student (Cashier only)
 * This will:
 * 1. Check if all student requirements are signed
 * 2. Check if all institutional requirements (except cashier's) are signed
 * 3. Automatically sign the cashier's own requirement
 * 4. Generate the QR code permit
 *
 * @param cashierId - The cashier's user ID
 * @param studentId - The student's school ID
 * @returns Promise with QR code data or throws error with missing requirements
 */
export const generateQRCodeForStudent = async (
  cashierId: string,
  studentId: string
): Promise<QRGenerationResponse> => {
  try {
    const response = await axiosInstance.post<QRGenerationResponse>(
      `/qr-code/generate/${cashierId}`,
      { studentId }
    );

    console.log(`✅ QR code generated for student ${studentId}`);
    return response.data;
  } catch (error: any) {
    console.error(
      `❌ Error generating QR code for student ${studentId}:`,
      error
    );

    // Extract error message from response
    if (error.response?.data) {
      throw {
        error: error.response.data.error || "Failed to generate QR code",
        missingRequirements: error.response.data.missingRequirements,
      };
    }

    throw {
      error: error.message || "Failed to generate QR code",
    };
  }
};

/**
 * Check if a student can generate QR code
 * This is a pre-validation check before attempting to generate
 *
 * @param studentId - The student's school ID
 * @returns Promise<boolean> - true if student can generate QR
 */
export const canGenerateQRCode = async (
  studentId: string
): Promise<boolean> => {
  try {
    // This endpoint should return whether student can generate QR
    const response = await axiosInstance.get(
      `/qr-code/can-generate/${studentId}`
    );
    return response.data.canGenerate;
  } catch (error) {
    console.error(
      `Error checking QR generation status for ${studentId}:`,
      error
    );
    return false;
  }
};
