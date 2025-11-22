import axiosInstance, { API_URL } from "@/api/axios";
import { message } from "antd";
import axios from "axios";

/**
 * Course/School Integration Service
 * Handles CRUD operations for courses and school-related data
 */

// Helper function to extract error message
const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    return axiosError.response?.data?.message || defaultMessage;
  }
  return defaultMessage;
};

// Types/Interfaces

export interface Course {
  _id?: string;
  id?: string;
  courseCode: string;
  courseName: string;
  department: string;
  schoolId: string;
  credits?: number;
  description?: string;
  semester?: string;
  year?: number;
}

export interface CreateCourseDto {
  _id?: string;
  id?: string;
  schoolId: string;
  courseCode: string;
  courseName: string;
  requirements: string[];
  yearLevel: string;
  semester: string;
  department: string;
  description?: string;
  dueDate: string;
}

export interface UpdateCourseDto {
  _id?: string;
  id?: string;
  schoolId: string;
  courseCode: string;
  courseName: string;
  requirements: string[];
  yearLevel: string;
  semester: string;
  department: string;
  description?: string;
  dueDate: string;
}

export const getCoursesBySchoolId = async (
  schoolId: string
): Promise<Course[] | null> => {
  try {
    const encodedSchoolId = encodeURIComponent(schoolId);
    const response = await axios.get(
      `${API_URL}/intigration/getCoursesBySchoolId/${encodedSchoolId}`
    );
    return response.data;
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error, "Failed to fetch courses");
    message.error(errorMessage);
    console.error("Fetch courses by school ID error:", error);
    return null;
  }
};

/**
 * Create a new course
 * POST /intigration/createCourse
 */
export const createCourseReq = async (
  data: CreateCourseDto
): Promise<Course | null> => {
  try {
    const response = await axiosInstance.post(`/req/createReq`, data);
    message.success("Course created successfully");
    return response.data;
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error, "Failed to create course");
    message.error(errorMessage);
    console.error("Create course error:", error);
    return null;
  }
};

/**
 * Get all courses
 * GET /intigration/getAllCourses
 */
export const getAllCourses = async (): Promise<Course[] | null> => {
  try {
    const response = await axiosInstance.get("/intigration/getAllCourses");
    return response.data;
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error, "Failed to fetch all courses");
    message.error(errorMessage);
    console.error("Fetch all courses error:", error);
    return null;
  }
};

/**
 * Get course by ID
 * GET /intigration/getCourseById/:id
 */
export const getCourseById = async (id: string): Promise<Course | null> => {
  try {
    const response = await axiosInstance.get(
      `/intigration/getCourseById/${id}`
    );
    return response.data;
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error, "Failed to fetch course");
    message.error(errorMessage);
    console.error("Fetch course by ID error:", error);
    return null;
  }
};

/**
 * Update course by ID
 * PUT /intigration/updateCourse/:id
 */
export const updateCourse = async (
  id: string,
  data: UpdateCourseDto
): Promise<Course | null> => {
  try {
    const response = await axiosInstance.put(
      `/intigration/updateCourse/${id}`,
      data
    );
    message.success("Course updated successfully");
    return response.data;
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error, "Failed to update course");
    message.error(errorMessage);
    console.error("Update course error:", error);
    return null;
  }
};

/**
 * Delete course by ID
 * DELETE /intigration/deleteCourse/:id
 */
export const deleteCourse = async (id: string): Promise<boolean> => {
  try {
    await axiosInstance.delete(`/intigration/deleteCourse/${id}`);
    message.success("Course deleted successfully");
    return true;
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error, "Failed to delete course");
    message.error(errorMessage);
    console.error("Delete course error:", error);
    return false;
  }
};

/**
 * Get courses by department
 * GET /intigration/getCoursesByDepartment/:department
 */
export const getCoursesByDepartment = async (
  department: string
): Promise<Course[] | null> => {
  try {
    const encodedDepartment = encodeURIComponent(department);
    const response = await axiosInstance.get(
      `/intigration/getCoursesByDepartment/${encodedDepartment}`
    );
    return response.data;
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(
      error,
      "Failed to fetch courses by department"
    );
    message.error(errorMessage);
    console.error("Fetch courses by department error:", error);
    return null;
  }
};

/**
 * Get courses by semester and year
 * GET /intigration/getCoursesBySemester/:semester/:year
 */
export const getCoursesBySemester = async (
  semester: string,
  year: number
): Promise<Course[] | null> => {
  try {
    const response = await axiosInstance.get(
      `/intigration/getCoursesBySemester/${semester}/${year}`
    );
    return response.data;
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(
      error,
      "Failed to fetch courses by semester"
    );
    message.error(errorMessage);
    console.error("Fetch courses by semester error:", error);
    return null;
  }
};

/**
 * Search courses by course code or name
 * GET /intigration/searchCourses?query=
 */
export const searchCourses = async (
  query: string
): Promise<Course[] | null> => {
  try {
    const response = await axiosInstance.get("/intigration/searchCourses", {
      params: { query },
    });
    return response.data;
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error, "Failed to search courses");
    message.error(errorMessage);
    console.error("Search courses error:", error);
    return null;
  }
};

/**
 * Bulk create courses
 * POST /intigration/bulkCreateCourses
 */
export const bulkCreateCourses = async (
  courses: CreateCourseDto[]
): Promise<Course[] | null> => {
  try {
    const response = await axiosInstance.post(
      "/intigration/bulkCreateCourses",
      { courses }
    );
    message.success(`${courses.length} courses created successfully`);
    return response.data;
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(
      error,
      "Failed to bulk create courses"
    );
    message.error(errorMessage);
    console.error("Bulk create courses error:", error);
    return null;
  }
};

/**
 * Get course statistics
 */
export const getCourseStats = async (): Promise<{
  total: number;
  byDepartment: Record<string, number>;
  bySemester: Record<string, number>;
} | null> => {
  try {
    const courses = await getAllCourses();
    if (!courses) return null;

    const stats = {
      total: courses.length,
      byDepartment: courses.reduce((acc, course) => {
        acc[course.department] = (acc[course.department] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      bySemester: courses.reduce((acc, course) => {
        const key = course.semester
          ? `${course.semester} ${course.year}`
          : "Unknown";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    return stats;
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(
      error,
      "Failed to fetch course statistics"
    );
    message.error(errorMessage);
    console.error("Fetch course stats error:", error);
    return null;
  }
};
