import axiosInstance from "../api/axios";

export interface RequirementUpdatePayload {
  courseCode?: string;
  courseName?: string;
  yearLevel?: string;
  semester?: string;
  requirements?: string[];
  department?: string;
  dueDate?: string;
  description?: string;
}

export interface CreateRequirementPayload {
  courseCode: string;
  courseName: string;
  yearLevel: string;
  semester: string;
  requirements: string[];
  department: string;
  description?: string;
  userId: string;
}

/**
 * Update a requirement by ID
 * @param id - The requirement ID (_id from MongoDB)
 * @param data - The fields to update
 * @returns The updated requirement data
 */
export const updateRequirement = async (
  id: string,
  data: RequirementUpdatePayload
) => {
  try {
    const response = await axiosInstance.put(`/req/updateReq/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("Error updating requirement:", error);
    throw error;
  }
};

/**
 * Delete a requirement by ID
 * @param id - The requirement ID (_id from MongoDB)
 * @returns Success message or deleted requirement data
 */
export const deleteRequirement = async (id: string) => {
  try {
    const response = await axiosInstance.delete(`/req/deleteReq/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting requirement:", error);
    throw error;
  }
};

/**
 * Get all requirements
 * @returns Array of requirements
 */
export const getAllRequirements = async () => {
  try {
    const response = await axiosInstance.get("/req/getAllReq");
    return response.data;
  } catch (error) {
    console.error("Error fetching requirements:", error);
    throw error;
  }
};

/**
 * Create a new department requirement
 * @param data - The requirement data to create
 * @returns The created requirement data
 */
export const createRequirement = async (data: CreateRequirementPayload) => {
  try {
    const response = await axiosInstance.post("/req/addReq", data);
    return response.data;
  } catch (error) {
    console.error("Error creating requirement:", error);
    throw error;
  }
};
