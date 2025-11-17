import axiosInstance from "@/api/axios";
import type { Student } from "./studentService";
import type { ClearingOfficer } from "./clearingOfficerService";
import type { ClearanceStatus } from "./clearanceService";
import type { StudentRequirement } from "./studentRequirementService";

/**
 * Dashboard Analytics Interfaces
 */
export interface DashboardStats {
  totalStudents: number;
  totalClearingOfficers: number;
  activeClearance: ClearanceStatus | null;
  requirementStats: {
    signed: number;
    incomplete: number;
    missing: number;
    total: number;
  };
  studentsByYearLevel: {
    "1st Year": number;
    "2nd Year": number;
    "3rd Year": number;
    "4th Year": number;
  };
  officersByRole: {
    clearingOfficer: number;
    sao: number;
    registrar: number;
    admin: number;
    guidance: number;
    dean: number;
    library: number;
    laboratory: number;
    cashier: number;
    tailoring: number;
  };
}

/**
 * Fetch all dashboard analytics data
 * Aggregates data from multiple endpoints for admin dashboard
 */
export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  try {
    // Fetch all required data in parallel
    const [
      studentsResponse,
      officersResponse,
      clearanceResponse,
      requirementsResponse,
    ] = await Promise.all([
      axiosInstance.get<Student[]>("/student/getAllStudent"),
      axiosInstance.get<ClearingOfficer[]>("/auth/getAllClearingOfficers"),
      axiosInstance.get<ClearanceStatus>("/clearance/current"),
      axiosInstance.get<StudentRequirement[]>(
        "/studentReq/getAllStudentRequirements"
      ),
    ]);

    const students = studentsResponse.data;
    const officers = officersResponse.data;
    const clearance = clearanceResponse.data;

    // Handle nested response structure for requirements without using `any`
    const rawRequirements = requirementsResponse.data as unknown;

    const isStudentRequirementArray = (
      value: unknown
    ): value is StudentRequirement[] => Array.isArray(value);

    const hasDataStudentRequirementArray = (
      value: unknown
    ): value is { data: StudentRequirement[] } =>
      typeof value === "object" &&
      value !== null &&
      "data" in value &&
      Array.isArray((value as { data: unknown }).data);

    const requirements: StudentRequirement[] = isStudentRequirementArray(
      rawRequirements
    )
      ? rawRequirements
      : hasDataStudentRequirementArray(rawRequirements)
      ? rawRequirements.data
      : [];

    // Calculate students by year level
    const studentsByYearLevel = {
      "1st Year": students.filter((s: Student) => s.yearLevel === "1st Year")
        .length,
      "2nd Year": students.filter((s: Student) => s.yearLevel === "2nd Year")
        .length,
      "3rd Year": students.filter((s: Student) => s.yearLevel === "3rd Year")
        .length,
      "4th Year": students.filter((s: Student) => s.yearLevel === "4th Year")
        .length,
    };

    // Calculate officers by role
    const officersByRole = {
      clearingOfficer: officers.filter(
        (o: ClearingOfficer) => o.role === "clearingOfficer"
      ).length,
      sao: officers.filter((o: ClearingOfficer) => o.role === "sao").length,
      registrar: officers.filter((o: ClearingOfficer) => o.role === "registrar")
        .length,
      admin: officers.filter((o: ClearingOfficer) => o.role === "admin").length,
      guidance: officers.filter((o: ClearingOfficer) => o.role === "guidance")
        .length,
      dean: officers.filter((o: ClearingOfficer) => o.role === "dean").length,
      library: officers.filter((o: ClearingOfficer) => o.role === "library")
        .length,
      laboratory: officers.filter((o: ClearingOfficer) => o.role === "laboratory")
        .length,
      cashier: officers.filter((o: ClearingOfficer) => o.role === "cashier")
        .length,
      tailoring: officers.filter((o: ClearingOfficer) => o.role === "tailoring")
        .length,
    };

    // Calculate requirement statistics
    const requirementStats = {
      signed: requirements.filter(
        (r: StudentRequirement) => r.status === "signed"
      ).length,
      incomplete: requirements.filter(
        (r: StudentRequirement) => r.status === "incomplete"
      ).length,
      missing: requirements.filter(
        (r: StudentRequirement) => r.status === "missing"
      ).length,
      total: requirements.length,
    };

    return {
      totalStudents: students.length,
      totalClearingOfficers: officers.length,
      activeClearance: clearance || null,
      requirementStats,
      studentsByYearLevel,
      officersByRole,
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to fetch dashboard statistics";
    throw new Error(errorMessage);
  }
};

/**
 * Calculate days remaining until clearance deadline
 */
export const getDaysUntilDeadline = (
  clearance: ClearanceStatus | null
): number => {
  if (!clearance) return 0;

  const deadline = clearance.extendedDeadline || clearance.deadline;
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffTime = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : 0;
};

/**
 * Calculate clearance completion rate
 */
export const getCompletionRate = (stats: DashboardStats): number => {
  if (stats.requirementStats.total === 0) return 0;

  const completionRate =
    (stats.requirementStats.signed / stats.requirementStats.total) * 100;

  return Math.round(completionRate * 10) / 10; // Round to 1 decimal
};
