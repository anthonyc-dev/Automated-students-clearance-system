import axiosInstance, { API_URL } from "@/api/axios";

/**
 * Student year level types
 */
export type YearLevel = "1st Year" | "2nd Year" | "3rd Year" | "4th Year";

/**
 * Interface representing a Student in the system
 */
export interface Student {
  _id: string;
  schoolId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  program: string;
  yearLevel: YearLevel;
  department?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Payload for creating a new student
 */
export interface CreateStudentPayload {
  schoolId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  program: string;
  yearLevel: YearLevel;
  password: string;
}

/**
 * Payload for updating an existing student
 */
export interface UpdateStudentPayload {
  schoolId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  program?: string;
  yearLevel?: YearLevel;
}

/**
 * Response type from API that might have 'id' or '_id'
 */
interface StudentResponse {
  _id?: string;
  id?: string;
  schoolId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  program: string;
  yearLevel: YearLevel;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Fetch all students from the system
 * @returns Array of students
 */
export const getAllStudents = async (): Promise<Student[]> => {
  try {
    const response = await axiosInstance.get<StudentResponse[]>(
      "/student/getAllStudent"
    );
    const students = response.data;

    // Normalize ID field: handle both 'id' and '_id'
    return students.map((student) => ({
      ...student,
      _id: student._id || student.id || "",
    }));
  } catch (error) {
    console.error("Error fetching students:", error);
    throw error;
  }
};

/**
 * Fetch a single student by ID
 * @param id - The student's unique identifier
 * @returns The student data
 */
export const getStudentById = async (id: string): Promise<Student> => {
  try {
    const response = await axiosInstance.get(`/student/getByIdStudent/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching student with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Fetch a single student by schoolId
 * @param schoolId - The student's school ID
 * @returns The student data
 */
export const getStudentBySchoolId = async (
  schoolId: string
): Promise<Student> => {
  try {
    console.log("📤 Fetching student by schoolId:", schoolId);
    const response = await axiosInstance.get(
      `/student/getBySchoolId/${schoolId}`
    );
    console.log("✅ Student fetched successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      `❌ Error fetching student with schoolId ${schoolId}:`,
      error
    );
    throw error;
  }
};

/**
 * Create a new student
 * @param data - The student data including password
 * @returns The newly created student
 */
export const createStudent = async (
  data: CreateStudentPayload
): Promise<Student> => {
  try {
    console.log("Creating student with payload:", data);
    const response = await axiosInstance.post("/student/registerStudent", data);
    console.log("Create response:", response.data);
    return response.data;
  } catch (error: unknown) {
    console.error("Error creating student:", error);

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
 * Update an existing student
 * @param id - The student's unique identifier
 * @param data - The fields to update
 * @returns The updated student data
 */
export const updateStudent = async (
  id: string,
  data: UpdateStudentPayload
): Promise<Student> => {
  try {
    const response = await axiosInstance.put(
      `/student/updateStudent/${id}`,
      data
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating student with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a student from the system
 * @param id - The student's unique identifier
 * @returns Success message
 */
export const deleteStudent = async (
  id: string
): Promise<{ message: string }> => {
  try {
    const response = await axiosInstance.delete(`/student/deleteStudent/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting student with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Sanitize search query to prevent SQL injection
 * Removes or escapes potentially dangerous characters
 * @param query - The raw search query
 * @returns Sanitized query string
 */
const sanitizeSearchQuery = (query: string): string => {
  // Trim whitespace
  let sanitized = query.trim();

  // Limit length to prevent DoS attacks
  const MAX_LENGTH = 100;
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH);
  }

  // Remove SQL injection patterns (basic sanitization)
  // Note: Backend should also use parameterized queries
  const dangerousPatterns = [
    /['";]/g, // Remove quotes and semicolons
    /--/g, // Remove SQL comments
    /\/\*/g, // Remove SQL comment start
    /\/\//g, // Remove double slashes
  ];

  dangerousPatterns.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, "");
  });

  // Remove control characters (0x00-0x1F and 0x7F)
  // eslint-disable-next-line no-control-regex
  sanitized = sanitized.replace(/[\u0000-\u001F\u007F]/g, "");

  return sanitized;
};

/**
 * Search students securely by query
 * Uses query parameters to prevent SQL injection
 * @param query - Search query (will be sanitized)
 * @returns Array of matching students
 */
export const searchStudents = async (query: string): Promise<Student[]> => {
  try {
    // Sanitize the input
    const sanitizedQuery = sanitizeSearchQuery(query);

    // If query is empty after sanitization, return empty array
    if (!sanitizedQuery) {
      return [];
    }

    // Use query parameters (axios will handle URL encoding)
    // Backend should use parameterized queries for security
    const response = await axiosInstance.get<StudentResponse[]>(
      `${API_URL}/enroll/getAllEnrollments`,
      {
        params: {
          q: sanitizedQuery, // Using 'q' as query parameter name
        },
      }
    );

    const students = response.data;

    // Normalize ID field: handle both 'id' and '_id'
    return students.map((student) => ({
      ...student,
      _id: student._id || student.id || "",
    }));
  } catch (error) {
    // If endpoint doesn't exist, fallback to client-side search
    // This is a temporary fallback - backend should implement the endpoint
    console.warn(
      "Search endpoint not available, falling back to client-side search:",
      error
    );

    try {
      const allStudents = await getAllStudents();
      const lowerQuery = query.toLowerCase().trim();

      return allStudents.filter((student) => {
        const fullName =
          `${student.firstName} ${student.lastName}`.toLowerCase();
        return (
          fullName.includes(lowerQuery) ||
          student.schoolId.toLowerCase().includes(lowerQuery) ||
          student.email.toLowerCase().includes(lowerQuery) ||
          student.phoneNumber.includes(lowerQuery)
        );
      });
    } catch (fallbackError) {
      console.error("Error in fallback search:", fallbackError);
      throw fallbackError;
    }
  }
};
