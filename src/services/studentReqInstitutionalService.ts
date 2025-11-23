import axiosInstance from "@/api/axios";
import { message } from "antd";

// Helper function to extract error message
const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    return axiosError.response?.data?.message || defaultMessage;
  }
  return defaultMessage;
};

// Types/Interfaces
export interface CreateStudentRequirementDto {
  studentId: string;
  coId: string;
  requirementId: string;
  signedBy: string;
  status: "signed" | "incomplete" | "missing";
}

export interface StudentRequirement {
  _id?: string;
  id?: string;
  studentId: string;
  coId: string;
  requirementId: string;
  signedBy: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  requirement?: {
    id: string;
    userId: string;
    courseCode: string;
    courseName: string;
    yearLevel: string;
    semester: string;
    requirements: string[];
    department: string;
    dueDate: string;
    description: string;
    createdAt: string;
    updatedAt: string;
  };
  clearingOfficer?: {
    id: string;
    schoolId: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    role: string;
    createdAt: string;
    updatedAt: string;
  };
}

export const createStudentRequirementIns = async (
  data: CreateStudentRequirementDto
): Promise<StudentRequirement | null> => {
  try {
    const response = await axiosInstance.post(
      "/institutionalReq/studentRequirement",
      data
    );

    console.log("✅ Response received:", response.data);

    // Check if response has nested data property
    const requirementData = response.data.data || response.data;
    console.log("✅ Extracted requirement data:", requirementData);

    message.success("Student requirement created successfully");
    return requirementData;
  } catch (error: unknown) {
    console.error("❌ Full error object:", error);

    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as {
        response?: {
          data?: { message?: string; error?: string };
          status?: number;
          statusText?: string;
        };
      };
      console.error("❌ Error response data:", axiosError.response?.data);
      console.error("❌ Error status:", axiosError.response?.status);
      console.error("❌ Error status text:", axiosError.response?.statusText);
    }

    const errorMessage = getErrorMessage(
      error,
      "Failed to create student requirement"
    );
    message.error(errorMessage);
    console.error("Create student requirement error:", error);
    return null;
  }
};

export const createBulkStudentRequirementsIns = async (
  requirements: CreateStudentRequirementDto[]
): Promise<StudentRequirement[]> => {
  try {
    const promises = requirements.map((req) =>
      axiosInstance.post("/institutionalReq/studentRequirement", req)
    );
    const results = await Promise.allSettled(promises);

    const successfulRequirements: StudentRequirement[] = [];
    let failedCount = 0;

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        // Check if response has nested data property (same as single create)
        const requirementData = result.value.data.data || result.value.data;
        console.log(
          `✅ Bulk create - Student ${requirements[index].studentId}:`,
          requirementData
        );
        console.log(
          `   - Extracted ID: ${requirementData._id || requirementData.id}`
        );
        successfulRequirements.push(requirementData);
      } else {
        failedCount++;
        console.error(
          `Failed to create requirement for student ${requirements[index].studentId}:`,
          result.reason
        );
      }
    });

    if (failedCount > 0) {
      message.warning(
        `Created ${successfulRequirements.length} requirements. ${failedCount} failed.`
      );
    } else {
      message.success(
        `Successfully created ${successfulRequirements.length} student requirements`
      );
    }

    return successfulRequirements;
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(
      error,
      "Failed to create bulk student requirements"
    );
    message.error(errorMessage);
    console.error("Create bulk student requirements error:", error);
    return [];
  }
};

/**
 * Get all student requirements with populated requirement and clearingOfficer data
 * GET /studentReq/getAllStudentRequirements
 */
export const getAllStudentRequirementsIns = async (): Promise<
  StudentRequirement[]
> => {
  try {
    console.log("📤 Fetching all student requirements");
    console.log("📍 Endpoint: GET /studentReq/getAllStudentRequirements");

    const response = await axiosInstance.get(
      "/institutionalReq/getAllStudentRequirements"
    );

    console.log("✅ Response received:", response.data);

    // Check if response has nested data property (array might be in response.data.data or response.data)
    const requirements = Array.isArray(response.data)
      ? response.data
      : response.data.data || [];

    console.log(`✅ Total requirements fetched: ${requirements.length}`);
    console.log("✅ Sample requirement:", requirements[0]);

    return requirements;
  } catch (error: unknown) {
    console.error("❌ Full error object:", error);

    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as {
        response?: {
          data?: { message?: string; error?: string };
          status?: number;
          statusText?: string;
        };
      };
      console.error("❌ Error response data:", axiosError.response?.data);
      console.error("❌ Error status:", axiosError.response?.status);
      console.error("❌ Error status text:", axiosError.response?.statusText);
    }

    const errorMessage = getErrorMessage(
      error,
      "Failed to fetch student requirements"
    );
    message.error(errorMessage);
    console.error("Get all student requirements error:", error);
    return [];
  }
};

/**
 * Find existing student requirement by studentId, coId, and requirementId
 * Returns the student requirement if it exists, null otherwise
 */
export const findExistingStudentRequirementIns = (
  allRequirements: StudentRequirement[],
  studentId: string,
  coId: string,
  requirementId: string
): StudentRequirement | null => {
  const found = allRequirements.find(
    (req) =>
      req.studentId === studentId &&
      req.coId === coId &&
      req.requirementId === requirementId
  );
  return found || null;
};

/**
 * Find existing student requirement by studentId, coId, requirementId, AND signedBy role
 * This ensures role-specific requirement filtering
 * Returns the student requirement if it exists for the specific role, null otherwise
 */
export const findExistingStudentRequirementInsByRole = (
  allRequirements: StudentRequirement[],
  studentId: string,
  coId: string,
  requirementId: string,
  signedByRole: string
): StudentRequirement | null => {
  const found = allRequirements.find(
    (req) =>
      req.studentId === studentId &&
      req.coId === coId &&
      req.requirementId === requirementId &&
      req.signedBy === signedByRole
  );
  return found || null;
};

/**
 * Update student requirement by ID
 * PUT /studentReq/updateStudentRequirement/:id
 */
export const updateStudentRequirementIns = async (
  id: string,
  status: "signed" | "incomplete" | "missing",
  studentId?: string,
  coId?: string,
  requirementId?: string,
  signedBy?: string
): Promise<StudentRequirement | null> => {
  try {
    console.log("📤 Updating student requirement:");
    console.log("   - ID:", id);
    console.log("   - New Status:", status);
    console.log("   - Student ID:", studentId);
    console.log("   - CO ID:", coId);
    console.log("   - Requirement ID:", requirementId);
    console.log(
      "📍 Full Endpoint: PUT",
      `${
        import.meta.env.VITE_API_URL || "http://localhost:3000"
      }/institutionalReq/updateStudentRequirement/${studentId}`
    );

    // Prepare request body - include all fields if provided
    const requestBody: {
      status: string;
      studentId?: string;
      coId?: string;
      requirementId?: string;
      signedBy?: string;
    } = { status };

    if (studentId) requestBody.studentId = studentId;
    if (coId) requestBody.coId = coId;
    if (requirementId) requestBody.requirementId = requirementId;
    if (signedBy) requestBody.signedBy = signedBy;

    console.log("📦 Request body:", requestBody);

    const response = await axiosInstance.put(
      `/institutionalReq/updateStudentRequirement/${studentId}`,
      requestBody
    );

    console.log("✅ Update response received:", response.data);

    // Check if response has nested data property
    const requirementData = response.data.data || response.data;
    console.log("✅ Extracted requirement data:", requirementData);
    console.log("✅ Updated status:", requirementData?.status);

    message.success("Student requirement updated successfully");
    return requirementData;
  } catch (error: unknown) {
    console.error("❌ Full error object:", error);

    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as {
        response?: {
          data?: { message?: string; error?: string };
          status?: number;
          statusText?: string;
        };
      };
      console.error("❌ Error response data:", axiosError.response?.data);
      console.error("❌ Error status:", axiosError.response?.status);
      console.error("❌ Error status text:", axiosError.response?.statusText);
    }

    const errorMessage = getErrorMessage(
      error,
      "Failed to update student requirement"
    );
    message.error(errorMessage);
    console.error("Update student requirement error:", error);
    return null;
  }
};

/**
 * Bulk update institutional student requirements to "missing" status when deadline passes
 * This function handles automatic status updates for incomplete requirements
 * @param requirements - Array of student requirements to update
 * @returns Updated count statistics
 */
export const bulkUpdateToMissingStatusIns = async (
  requirements: StudentRequirement[]
): Promise<{ updated: number; failed: number }> => {
  try {
    console.log(
      `🔄 [Institutional] Starting bulk update to missing status for ${requirements.length} requirements`
    );

    // Filter only incomplete or signed requirements (not already missing)
    const requirementsToUpdate = requirements.filter(
      (req) => req.status !== "missing"
    );

    if (requirementsToUpdate.length === 0) {
      console.log(
        "✅ [Institutional] No requirements need to be updated to missing status"
      );
      return { updated: 0, failed: 0 };
    }

    console.log(
      `📊 [Institutional] ${requirementsToUpdate.length} requirements will be updated to missing`
    );

    // Update all requirements in parallel with Promise.allSettled for better error handling
    const updatePromises = requirementsToUpdate.map((req) =>
      updateStudentRequirementIns(
        req._id || req.id || "",
        "missing",
        req.studentId,
        req.coId,
        req.requirementId,
        req.signedBy
      )
    );

    const results = await Promise.allSettled(updatePromises);

    // Count successes and failures
    const updated = results.filter(
      (r) => r.status === "fulfilled" && r.value !== null
    ).length;
    const failed = results.length - updated;

    console.log(
      `✅ [Institutional] Bulk update complete: ${updated} updated, ${failed} failed`
    );

    if (updated > 0) {
      message.info(
        `Automatically marked ${updated} incomplete requirement(s) as missing due to passed deadline`,
        6
      );
    }

    if (failed > 0) {
      console.warn(
        `⚠️ [Institutional] ${failed} requirements failed to update`
      );
    }

    return { updated, failed };
  } catch (error: unknown) {
    console.error(
      "❌ [Institutional] Error in bulk update to missing status:",
      error
    );
    return { updated: 0, failed: requirements.length };
  }
};

/**
 * Check if a student is fully cleared by all clearing officers (including institutional)
 * A student is considered cleared when all their requirements have status "signed"
 * @param studentId - The student's ID to check
 * @param allRequirements - Array of all student requirements (institutional)
 * @returns boolean - true if student is fully cleared, false otherwise
 */
export const isStudentFullyClearedIns = (
  studentId: string,
  allRequirements: StudentRequirement[]
): boolean => {
  // Get all requirements for this specific student
  const studentRequirements = allRequirements.filter(
    (req) => req.studentId === studentId
  );

  // If no requirements found, student is not cleared
  if (studentRequirements.length === 0) {
    return false;
  }

  // Check if ALL requirements for this student have "signed" status
  const allSigned = studentRequirements.every((req) => req.status === "signed");

  console.log(`🔍 [Institutional] Clearance check for student ${studentId}:`, {
    totalRequirements: studentRequirements.length,
    signedRequirements: studentRequirements.filter((r) => r.status === "signed")
      .length,
    isFullyCleared: allSigned,
  });

  return allSigned;
};

/**
 * Get clearance statistics for a student (institutional requirements)
 * Returns detailed breakdown of signed/incomplete/missing requirements
 * @param studentId - The student's ID
 * @param allRequirements - Array of all student requirements (institutional)
 * @returns Clearance statistics object
 */
export const getStudentClearanceStatsIns = (
  studentId: string,
  allRequirements: StudentRequirement[]
): {
  total: number;
  signed: number;
  incomplete: number;
  missing: number;
  isCleared: boolean;
} => {
  const studentRequirements = allRequirements.filter(
    (req) => req.studentId === studentId
  );

  const signed = studentRequirements.filter(
    (req) => req.status === "signed"
  ).length;
  const incomplete = studentRequirements.filter(
    (req) => req.status === "incomplete"
  ).length;
  const missing = studentRequirements.filter(
    (req) => req.status === "missing"
  ).length;

  return {
    total: studentRequirements.length,
    signed,
    incomplete,
    missing,
    isCleared:
      studentRequirements.length > 0 && signed === studentRequirements.length,
  };
};

/**
 * Get institutional student requirements by studentId
 * GET /institutionalReq/getStudentRequirementsByStudentId/:studentId
 * @param studentId - The student's database ID
 * @returns Array of institutional student requirements with populated data
 */
export const getStudentRequirementsByStudentIdIns = async (
  studentId: string
): Promise<StudentRequirement[]> => {
  try {
    console.log(
      "📤 [Institutional] Fetching student requirements by studentId:",
      studentId
    );
    console.log(
      `📍 Endpoint: GET /institutionalReq/getStudentRequirementsByStudentId/${studentId}`
    );

    const response = await axiosInstance.get(
      `/institutionalReq/getStudentRequirementsByStudentId/${studentId}`
    );

    console.log("✅ [Institutional] Response received:", response.data);

    // Check if response has nested data property
    const requirements = Array.isArray(response.data)
      ? response.data
      : response.data.data || [];

    console.log(
      `✅ [Institutional] Total requirements fetched for student ${studentId}: ${requirements.length}`
    );
    console.log("✅ [Institutional] Sample requirement:", requirements[0]);

    console.log("✅ [Institutional] Sample requirement:", requirements);

    return requirements;
  } catch (error: unknown) {
    console.error("❌ [Institutional] Full error object:", error);

    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as {
        response?: {
          data?: { message?: string; error?: string };
          status?: number;
          statusText?: string;
        };
      };
      console.error(
        "❌ [Institutional] Error response data:",
        axiosError.response?.data
      );
      console.error(
        "❌ [Institutional] Error status:",
        axiosError.response?.status
      );
      console.error(
        "❌ [Institutional] Error status text:",
        axiosError.response?.statusText
      );
    }

    const errorMessage = getErrorMessage(
      error,
      "Failed to fetch institutional student requirements by studentId"
    );
    message.error(errorMessage);
    console.error(
      "[Institutional] Get student requirements by studentId error:",
      error
    );
    return [];
  }
};
