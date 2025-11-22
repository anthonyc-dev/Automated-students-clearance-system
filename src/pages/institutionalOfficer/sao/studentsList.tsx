import { useState, useMemo, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Search,
  Filter,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  UserCheck,
  UserX,
  Users,
  CheckCircle2,
  Undo2,
  Phone,
  Mail,
  Building,
  Calendar,
  Loader2,
  AlertTriangle,
  CalendarX,
  Clock,
  Info,
} from "lucide-react";
import axiosInstance, { API_URL } from "@/api/axios";
import { useAuth } from "@/authentication/useAuth";
import { type StudentRequirement } from "@/services/studentReqInstitutionalService";
import { message } from "antd";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TooltipDemo from "@/components/HoverToolip";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  createBulkStudentRequirementsIns,
  createStudentRequirementIns,
  findExistingStudentRequirementIns,
  getAllStudentRequirementsIns,
  updateStudentRequirementIns,
  bulkUpdateToMissingStatusIns,
} from "@/services/studentReqInstitutionalService";
import {
  getCurrentClearance,
  type ClearanceStatus,
  getEffectiveDeadline,
} from "@/services/clearanceService";
import {
  shouldAutoUpdateToMissing,
  logDeadlineStatus,
  notifyDeadlineStatus,
  hasDeadlinePassed,
} from "@/services/deadlineService";

// API response interface matching the backend data structure
interface ApiStudent {
  id: string;
  schoolId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  yearLevel: string;
  department: string;
}

// Internal interface for UI state management
interface Student {
  id: string;
  schoolId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  yearLevel: string;
  status: "Signed" | "Incomplete" | "Missing";
  studentRequirementId?: string;
}

export const SaoOfficer = () => {
  const { reqId } = useParams<{ reqId: string }>();
  const { user } = useAuth();

  const [students, setStudents] = useState<Student[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allStudentRequirements, setAllStudentRequirements] = useState<
    StudentRequirement[]
  >([]);

  // State for unsign warning modal
  const [showUnsignDialog, setShowUnsignDialog] = useState(false);
  const [unsignTarget, setUnsignTarget] = useState<{
    type: "single" | "bulk";
    studentId?: string;
  } | null>(null);

  // State for clearance status and deadline checking
  const [clearanceStatus, setClearanceStatus] =
    useState<ClearanceStatus | null>(null);
  const [clearanceLoading, setClearanceLoading] = useState(true);

  // Fetch current clearance status
  useEffect(() => {
    const fetchClearanceStatus = async () => {
      setClearanceLoading(true);
      try {
        const status = await getCurrentClearance();
        console.log("✅ [Institutional] Clearance status:", status);
        setClearanceStatus(status);

        // Log and display deadline status information
        logDeadlineStatus(status);
        notifyDeadlineStatus(status);
      } catch (error) {
        console.error(
          "❌ [Institutional] Error fetching clearance status:",
          error
        );
        setClearanceStatus(null);
      } finally {
        setClearanceLoading(false);
      }
    };

    fetchClearanceStatus();
  }, []);

  // Automatic deadline check and missing status update for institutional requirements
  // This effect runs when clearance status and student requirements are loaded
  useEffect(() => {
    const handleAutomaticMissingStatusUpdate = async () => {
      // Early exit if data is still loading
      if (isLoading || clearanceLoading) {
        return;
      }

      // Check if we should proceed with automatic update
      if (!shouldAutoUpdateToMissing(clearanceStatus)) {
        console.log(
          "⏭️ [Institutional] Skipping automatic missing status update"
        );
        return;
      }

      console.log(
        "🔄 [Institutional] Deadline has passed - initiating automatic missing status update"
      );

      try {
        // Use the already-loaded allStudentRequirements state
        if (allStudentRequirements.length === 0) {
          console.log(
            "ℹ️ [Institutional] No student requirements found to update"
          );
          return;
        }

        // Filter to only requirements for the current reqId if provided
        const relevantStudentReqs = reqId
          ? allStudentRequirements.filter((req) => req.requirementId === reqId)
          : allStudentRequirements;

        if (relevantStudentReqs.length === 0) {
          console.log(
            "ℹ️ [Institutional] No student requirements match the current requirement"
          );
          return;
        }

        console.log(
          `📊 [Institutional] Found ${relevantStudentReqs.length} student requirement(s) to check for automatic missing status`
        );

        // Perform bulk update to missing status
        const result = await bulkUpdateToMissingStatusIns(relevantStudentReqs);

        if (result.updated > 0) {
          console.log(
            `✅ [Institutional] Successfully updated ${result.updated} student requirements to missing status`
          );

          // Update local state to reflect the changes
          setStudents((prev) =>
            prev.map((student) => {
              // Check if this student's requirement was updated
              const wasUpdated = relevantStudentReqs.some(
                (req) =>
                  req.studentId === student.schoolId && req.status !== "missing"
              );
              if (wasUpdated) {
                return { ...student, status: "Missing" };
              }
              return student;
            })
          );

          // Also update the allStudentRequirements state
          setAllStudentRequirements((prev) =>
            prev.map((req) => {
              const wasUpdated = relevantStudentReqs.some(
                (r) =>
                  (r._id === req._id || r.id === req.id) &&
                  r.status !== "missing"
              );
              if (wasUpdated) {
                return { ...req, status: "missing" };
              }
              return req;
            })
          );
        }
      } catch (error) {
        console.error(
          "❌ [Institutional] Error during automatic missing status update:",
          error
        );
        // Fail silently - don't interrupt user experience
      }
    };

    handleAutomaticMissingStatusUpdate();
  }, [
    clearanceStatus,
    allStudentRequirements,
    isLoading,
    clearanceLoading,
    reqId,
  ]);

  // Fetch students data from API
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await axiosInstance.get(
          `${API_URL}/intigration/getAllStudentComparedByIds`
        );

        console.log("API Response:", response.data); // Debug log

        // Handle different response structures
        let studentsData: ApiStudent[] = [];

        if (Array.isArray(response.data)) {
          studentsData = response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
          studentsData = response.data.data;
        } else if (response.data && Array.isArray(response.data.students)) {
          studentsData = response.data.students;
        } else {
          throw new Error(
            "Invalid response format: expected an array of students"
          );
        }

        // Transform API data to match Student interface with default status
        const transformedStudents: Student[] = studentsData.map(
          (apiStudent) => ({
            id: apiStudent.id,
            schoolId: apiStudent.schoolId,
            firstName: apiStudent.firstName,
            lastName: apiStudent.lastName,
            email: apiStudent.email,
            phone: apiStudent.phone,
            department: apiStudent.department,
            yearLevel: apiStudent.yearLevel,
            status: "Incomplete",
          })
        );

        // Fetch all student requirements to check for existing signed students
        try {
          console.log(
            "🔍 Fetching student requirements to check for signed students..."
          );
          const allRequirements = await getAllStudentRequirementsIns();
          console.log(
            `✅ Fetched ${allRequirements.length} student requirements`
          );

          // Store all requirements in state for later use when signing
          setAllStudentRequirements(allRequirements);

          // Filter requirements that match the current requirement ID (if provided)
          if (reqId) {
            const relevantRequirements = allRequirements.filter(
              (req) => req.requirementId === reqId
            );
            console.log(
              `📋 Found ${relevantRequirements.length} requirements for current requirement ID: ${reqId}`
            );

            // Create a map of studentId -> requirement for quick lookup
            const requirementMap = new Map(
              relevantRequirements.map((req) => [req.studentId, req])
            );

            // Merge student requirements with student data
            const studentsWithRequirements = transformedStudents.map(
              (student) => {
                const requirement = requirementMap.get(student.schoolId);
                if (requirement) {
                  const reqId = requirement._id || requirement.id;
                  console.log(
                    `✓ Student ${student.schoolId} has requirement with status: ${requirement.status}, _id: ${reqId}`
                  );
                  return {
                    ...student,
                    status:
                      requirement.status === "signed"
                        ? "Signed"
                        : requirement.status === "incomplete"
                        ? "Incomplete"
                        : requirement.status === "missing"
                        ? "Missing"
                        : "Incomplete",
                    studentRequirementId: reqId,
                  } as Student;
                }
                return student;
              }
            );

            setStudents(studentsWithRequirements);
            console.log(
              "✅ Students merged with requirements:",
              studentsWithRequirements
            );
          } else {
            // No reqId provided, just use transformed students
            setStudents(transformedStudents);
          }
        } catch (reqError) {
          console.warn("⚠️ Could not fetch student requirements:", reqError);
          // If fetching requirements fails, just use the transformed students without requirements
          setStudents(transformedStudents);
        }
      } catch (err) {
        setError("Failed to fetch students data. Please try again later.");
        console.error("Error fetching students:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, [reqId]);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const fullName = `${student.firstName} ${student.lastName}`;
      const matchesSearch =
        fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.schoolId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ||
        student.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [students, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  useEffect(() => {
    // Reset page when filter/search changes
    setCurrentPage(1);
  }, [searchQuery, statusFilter, itemsPerPage]);

  const stats = useMemo(() => {
    return {
      total: filteredStudents.length,
      signed: filteredStudents.filter((s) => s.status === "Signed").length,
      incomplete: filteredStudents.filter((s) => s.status === "Incomplete")
        .length,
      missing: filteredStudents.filter((s) => s.status === "Missing").length,
    };
  }, [filteredStudents]);

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedStudents.map((s) => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  // Perform the actual unsigning logic
  const performUnsign = async (id: string) => {
    const student = students.find((s) => s.id === id);

    if (!student) {
      message.error("Student not found");
      return;
    }

    try {
      console.log(
        "🔄 Attempting to undo signature for student:",
        student.firstName,
        student.lastName
      );

      // Check if student has a studentRequirementId to update
      if (student.studentRequirementId) {
        const hideLoading = message.loading("Undoing signature...", 0);

        console.log(
          "📤 Sending update request with ID:",
          student.studentRequirementId
        );

        // Update the student requirement status to "incomplete"
        const result = await updateStudentRequirementIns(
          student.studentRequirementId,
          "incomplete",
          student.schoolId,
          user?.id,
          reqId
        );

        console.log("📥 Update result:", result);

        hideLoading();

        if (result) {
          // Update allStudentRequirements state
          setAllStudentRequirements((prev) =>
            prev.map((req) =>
              req._id === student.studentRequirementId ||
              req.id === student.studentRequirementId
                ? { ...req, status: "incomplete" }
                : req
            )
          );
          console.log(
            "✅ Updated requirement in state with status: incomplete"
          );

          // Update local state
          setStudents((prev) =>
            prev.map((s) =>
              s.id === id
                ? {
                    ...s,
                    status: "Incomplete",
                    studentRequirementId: student.studentRequirementId,
                  }
                : s
            )
          );
          console.log("✅ Local state updated successfully");
          message.success(
            `${student.firstName} ${student.lastName} signature removed`
          );
        } else {
          console.error("❌ Update returned null");
          message.error("Failed to undo signature");
        }
      } else {
        console.warn(
          "⚠️ No student requirement ID found for student:",
          student.firstName,
          student.lastName
        );

        // No student requirement ID found, just update local state
        setStudents((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status: "Incomplete" } : s))
        );
        message.warning("No database record found. Updated locally only.");
      }
    } catch (error) {
      console.error("❌ Error undoing signature:", error);
      message.error("An error occurred while undoing the signature");
    }
  };

  const handleSign = async (id: string) => {
    const student = students.find((s) => s.id === id);

    if (!student) {
      message.error("Student not found");
      return;
    }

    if (student?.status === "Signed") {
      // Show confirmation dialog before unsigning
      setUnsignTarget({ type: "single", studentId: id });
      setShowUnsignDialog(true);
    } else {
      // Sign the student and save to database
      try {
        // Validate required data
        if (!user?.id) {
          message.error("Clearing officer ID not found");
          return;
        }
        if (!reqId) {
          message.error("Requirement ID not found");
          return;
        }
        if (!student.schoolId) {
          message.error("Student ID not found");
          return;
        }

        // Check if student requirement already exists
        const existingRequirement = findExistingStudentRequirementIns(
          allStudentRequirements,
          student.schoolId,
          user.id,
          reqId
        );

        const hideLoading = message.loading("Signing student...", 0);

        let result: StudentRequirement | null = null;
        let storedId: string | undefined;

        if (existingRequirement) {
          // Update existing requirement
          const existingId = existingRequirement._id || existingRequirement.id;
          console.log(
            "♻️ Requirement exists! Updating status to 'signed' for ID:",
            existingId
          );

          result = await updateStudentRequirementIns(
            existingId!,
            "signed",
            student.schoolId,
            user.id,
            reqId
          );

          storedId = existingId;

          // Update the requirement in allStudentRequirements state
          if (result) {
            setAllStudentRequirements((prev) =>
              prev.map((req) =>
                req._id === existingId || req.id === existingId
                  ? { ...req, status: "signed" }
                  : req
              )
            );
            console.log("✅ Updated requirement in state with status: signed");
          }
        } else {
          // Create new student requirement
          console.log("➕ No existing requirement found. Creating new one...");

          const requirementData = {
            studentId: student.schoolId,
            coId: user.id,
            requirementId: reqId,
            signedBy: user.role,
            status: "signed" as const,
          };

          console.log("📦 Prepared requirement data:", requirementData);

          result = await createStudentRequirementIns(requirementData);
          storedId = result?._id || result?.id;

          console.log("📦 Full API response:", result);
          console.log("🔑 Extracted _id:", result?._id);
          console.log("🔑 Extracted id:", result?.id);
          console.log("✅ Will store student requirement ID:", storedId);

          // Add new requirement to state
          if (result) {
            setAllStudentRequirements((prev) => [
              ...prev,
              result as StudentRequirement,
            ]);
          }
        }

        hideLoading();

        if (result) {
          // Update local state to reflect the signed status and store the student requirement ID
          setStudents((prev) =>
            prev.map((s) =>
              s.id === id
                ? {
                    ...s,
                    status: "Signed",
                    studentRequirementId: storedId,
                  }
                : s
            )
          );
          message.success(
            `${student.firstName} ${student.lastName} signed successfully`
          );
        } else {
          message.error("Failed to sign student");
        }
      } catch (error) {
        console.error("Error signing student:", error);
        message.error("An error occurred while signing the student");
      }
    }
  };

  // Handle unsign confirmation
  const handleConfirmUnsign = async () => {
    if (!unsignTarget) return;

    if (unsignTarget.type === "single" && unsignTarget.studentId) {
      // Single student unsign
      await performUnsign(unsignTarget.studentId);
    } else if (unsignTarget.type === "bulk") {
      // Bulk unsign
      await performBulkUnsign();
    }

    // Close dialog and reset target
    setShowUnsignDialog(false);
    setUnsignTarget(null);
  };

  // Perform bulk unsigning logic
  const performBulkUnsign = async () => {
    const selectedStudentsData = students.filter((student) =>
      selectedIds.includes(student.id)
    );

    // Filter students that have requirement IDs
    const studentsWithReqIds = selectedStudentsData.filter(
      (s) => s.studentRequirementId
    );

    if (studentsWithReqIds.length > 0) {
      const hideLoading = message.loading(
        `Undoing ${studentsWithReqIds.length} signature(s)...`,
        0
      );

      // Update all student requirements in parallel
      const updatePromises = studentsWithReqIds.map((student) =>
        updateStudentRequirementIns(
          student.studentRequirementId!,
          "incomplete",
          student.schoolId,
          user?.id,
          reqId
        )
      );

      const results = await Promise.allSettled(updatePromises);

      hideLoading();

      const successCount = results.filter(
        (r) => r.status === "fulfilled" && r.value !== null
      ).length;
      const failedCount = results.length - successCount;

      // Update allStudentRequirements state for successfully updated students
      const successfulReqIds = studentsWithReqIds
        .filter((_, index) => results[index].status === "fulfilled")
        .map((s) => s.studentRequirementId);

      setAllStudentRequirements((prev) =>
        prev.map((req) =>
          successfulReqIds.includes(req._id || req.id)
            ? { ...req, status: "incomplete" }
            : req
        )
      );
      console.log("✅ Updated requirements in state with status: incomplete");

      // Update local state for all selected students
      setStudents((prev) =>
        prev.map((student) =>
          selectedIds.includes(student.id)
            ? {
                ...student,
                status: "Incomplete",
                studentRequirementId: student.studentRequirementId,
              }
            : student
        )
      );

      if (failedCount > 0) {
        message.warning(
          `Updated ${successCount} signature(s). ${failedCount} failed.`
        );
      } else {
        message.success(`Successfully undone ${successCount} signature(s)`);
      }
    } else {
      // No requirement IDs found, just update local state
      setStudents((prev) =>
        prev.map((student) =>
          selectedIds.includes(student.id)
            ? { ...student, status: "Incomplete" }
            : student
        )
      );
      message.success("Status updated locally");
    }

    setSelectedIds([]);
  };

  const handleBulkSign = async (sign: boolean) => {
    // Get all selected students
    const selectedStudentsData = students.filter((student) =>
      selectedIds.includes(student.id)
    );
    const selectedSchoolIds = selectedStudentsData.map(
      (student) => student.schoolId
    );

    console.log(
      `${sign ? "Signing" : "Undoing"} ${
        selectedStudentsData.length
      } selected students`
    );
    console.log("Selected Student School IDs:", selectedSchoolIds);
    console.log("Clearing Officer ID:", user?.id);
    console.log("Requirement ID:", reqId);

    // Validate required data
    if (!user?.id) {
      message.error("Clearing officer ID not found");
      return;
    }
    if (!reqId) {
      message.error("Requirement ID not found");
      return;
    }
    if (selectedStudentsData.length === 0) {
      message.error("No students selected");
      return;
    }

    try {
      if (sign) {
        // SIGNING STUDENTS
        // Show loading message
        const hideLoading = message.loading(
          `Signing ${selectedStudentsData.length} student(s)...`,
          0
        );

        console.log("🔍 Checking for existing requirements in bulk sign...");

        // Separate students into those with existing requirements and those without
        const studentsToUpdate: Array<{
          student: (typeof selectedStudentsData)[0];
          existingReqId: string;
        }> = [];
        const studentsToCreate: typeof selectedStudentsData = [];

        selectedStudentsData.forEach((student) => {
          const existingRequirement = findExistingStudentRequirementIns(
            allStudentRequirements,
            student.schoolId,
            user.id,
            reqId
          );

          if (existingRequirement) {
            const existingId =
              existingRequirement._id || existingRequirement.id;
            console.log(
              `♻️ Student ${student.schoolId} has existing requirement: ${existingId}`
            );
            studentsToUpdate.push({ student, existingReqId: existingId! });
          } else {
            console.log(`➕ Student ${student.schoolId} needs new requirement`);
            studentsToCreate.push(student);
          }
        });

        console.log(
          `📊 Summary: ${studentsToUpdate.length} to update, ${studentsToCreate.length} to create`
        );

        const studentReqIdMap = new Map<string, string>();

        // Update existing requirements
        if (studentsToUpdate.length > 0) {
          console.log("🔄 Updating existing requirements...");
          const updatePromises = studentsToUpdate.map(
            ({ student, existingReqId }) =>
              updateStudentRequirementIns(
                existingReqId,
                "signed",
                student.schoolId,
                user.id,
                reqId
              ).then((result) => ({ student, result, existingReqId }))
          );

          const updateResults = await Promise.allSettled(updatePromises);
          const successfulUpdateIds: string[] = [];

          updateResults.forEach((promiseResult) => {
            if (promiseResult.status === "fulfilled") {
              const { student, existingReqId } = promiseResult.value;
              studentReqIdMap.set(student.schoolId, existingReqId);
              successfulUpdateIds.push(existingReqId);
              console.log(`✅ Updated ${student.schoolId} -> ${existingReqId}`);
            }
          });

          // Update allStudentRequirements state for successfully updated requirements
          if (successfulUpdateIds.length > 0) {
            setAllStudentRequirements((prev) =>
              prev.map((req) =>
                successfulUpdateIds.includes(req._id || req.id || "")
                  ? { ...req, status: "signed" }
                  : req
              )
            );
            console.log(
              `✅ Updated ${successfulUpdateIds.length} requirements in state with status: signed`
            );
          }
        }

        // Create new requirements
        let createResults: StudentRequirement[] = [];
        if (studentsToCreate.length > 0) {
          console.log("➕ Creating new requirements...");
          const bulkRequirements = studentsToCreate.map((student) => ({
            studentId: student.schoolId,
            coId: user.id,
            requirementId: reqId,
            signedBy: user.role,
            status: "signed" as const,
          }));

          createResults = await createBulkStudentRequirementsIns(
            bulkRequirements
          );

          if (createResults && createResults.length > 0) {
            console.log("📦 Bulk create results:", createResults);

            createResults.forEach((result, index) => {
              const studentSchoolId = bulkRequirements[index].studentId;
              const storedId = result._id || result.id || "";
              console.log(`✅ Created ${studentSchoolId} -> ${storedId}`);
              studentReqIdMap.set(studentSchoolId, storedId);
            });

            // Add new requirements to state
            setAllStudentRequirements((prev) => [...prev, ...createResults]);
          }
        }

        hideLoading();

        const totalProcessed = studentsToUpdate.length + createResults.length;

        if (totalProcessed > 0) {
          // Update local state to reflect the signed status and store student requirement IDs
          setStudents((prev) =>
            prev.map((student) =>
              selectedIds.includes(student.id)
                ? {
                    ...student,
                    status: "Signed",
                    studentRequirementId: studentReqIdMap.get(student.schoolId),
                  }
                : student
            )
          );
          setSelectedIds([]);
          console.log(
            "✅ Stored student requirement IDs:",
            Array.from(studentReqIdMap.entries())
          );
          message.success(`Successfully signed ${totalProcessed} student(s)`);
        } else {
          message.error("Failed to sign students");
        }
      } else {
        // UNDOING SIGNATURES - Show confirmation dialog
        setUnsignTarget({ type: "bulk" });
        setShowUnsignDialog(true);
      }
    } catch (error) {
      console.error(
        `Error ${sign ? "signing" : "undoing"} selected students:`,
        error
      );

      message.error(
        `An error occurred while ${
          sign ? "signing" : "undoing signatures for"
        } students`
      );
    }
  };

  const getStatusBadge = (status: Student["status"]) => {
    switch (status) {
      case "Signed":
        return (
          <Badge className="bg-green-500/10 text-green-700 border-green-500/20 hover:bg-green-500/20">
            <UserCheck className="mr-1 h-3 w-3" /> Signed
          </Badge>
        );
      case "Incomplete":
        return (
          <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20 hover:bg-yellow-500/20">
            <Filter className="mr-1 h-3 w-3" /> Incomplete
          </Badge>
        );
      case "Missing":
        return (
          <Badge className="bg-red-500/10 text-red-700 border-red-500/20 hover:bg-red-500/20">
            <UserX className="mr-1 h-3 w-3" /> Missing
          </Badge>
        );
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student List </h1>
          <p className="text-muted-foreground mt-1">
            Manage and view all students in the system
          </p>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 " />
            <span className="text-sm">1st Semester AY 2023–2024</span>
          </div>
        </div>
        <Button className="w-fit">
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </Button>
      </div>

      {/* Clearance Deadline Notice */}
      {!clearanceLoading && clearanceStatus && (
        <>
          {/* If clearance is not active anymore */}
          {!clearanceStatus.isActive && (
            <Card className="border-orange-500/50 bg-orange-50/50 dark:bg-orange-950/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/50">
                    <CalendarX className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-100 mb-1">
                      Clearance Period Has Ended
                    </h3>
                    <p className="text-sm text-orange-700 dark:text-orange-300 mb-2">
                      The clearance period for{" "}
                      <span className="font-medium">
                        {clearanceStatus.semesterType}{" "}
                        {clearanceStatus.academicYear}
                      </span>{" "}
                      has been stopped and is no longer active.
                    </p>
                    <div className="flex items-center gap-4 text-sm text-orange-600 dark:text-orange-400">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>
                          Ended on:{" "}
                          {new Date(
                            getEffectiveDeadline(clearanceStatus)
                          ).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* If clearance is active but deadline has passed */}
          {clearanceStatus.isActive && hasDeadlinePassed(clearanceStatus) && (
            <Card className="border-red-500/50 bg-red-50/50 dark:bg-red-950/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
                    <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-1">
                      Clearance Deadline Has Passed
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                      {clearanceStatus.extendedDeadline ? (
                        <>
                          The extended deadline for clearance has passed on{" "}
                          <span className="font-medium">
                            {new Date(
                              clearanceStatus.extendedDeadline
                            ).toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                          . All incomplete requirements have been automatically
                          marked as missing.
                        </>
                      ) : (
                        <>
                          The clearance deadline has passed on{" "}
                          <span className="font-medium">
                            {new Date(
                              clearanceStatus.deadline
                            ).toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                          . All incomplete requirements have been automatically
                          marked as missing.
                        </>
                      )}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-red-600 dark:text-red-400">
                      <div className="flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        <span>
                          {clearanceStatus.extendedDeadline
                            ? "Extended deadline was used"
                            : "Original deadline"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>
                          {Math.floor(
                            (new Date().getTime() -
                              new Date(
                                getEffectiveDeadline(clearanceStatus)
                              ).getTime()) /
                              (1000 * 60 * 60 * 24)
                          )}{" "}
                          day(s) overdue
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Students</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              {stats.total}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Signed</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-green-600" />
              {stats.signed}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Incomplete</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Filter className="h-5 w-5 text-yellow-600" />
              {stats.incomplete}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Missing</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <UserX className="h-5 w-5 text-red-600" />
              {stats.missing}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Students</CardTitle>
              <CardDescription>
                A comprehensive list of all registered students
              </CardDescription>
            </div>
            <div className="flex flex-col md:flex-row gap-3 md:items-center">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v)}
              >
                <SelectTrigger className="w-full md:w-40">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="signed">Signed</SelectItem>
                  <SelectItem value="incomplete">Incomplete</SelectItem>
                  <SelectItem value="missing">Missing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedIds.length > 0 && (
            <div className="mt-4 flex items-center justify-between bg-muted/50 p-3 rounded-md">
              <span className="text-sm text-muted-foreground">
                {selectedIds.length} selected
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleBulkSign(true)}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Sign All
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleBulkSign(false)}
                >
                  <Undo2 className="h-4 w-4 mr-1" /> Undo All
                </Button>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">
                Loading students...
              </span>
            </div>
          ) : error ? (
            /* Error State */
            <div className="flex flex-col items-center justify-center py-16">
              <UserX className="h-12 w-12 text-destructive mb-4" />
              <p className="text-destructive font-medium">{error}</p>
              <Button className="mt-4" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          ) : (
            /* Table Content */
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[40px] text-center">
                        <TooltipDemo
                          isSelected={
                            selectedIds.length === paginatedStudents.length &&
                            paginatedStudents.length > 0
                          }
                        >
                          <Checkbox
                            className="border border-blue-600 hover:border-blue-700 hover:border-2"
                            checked={
                              selectedIds.length === paginatedStudents.length &&
                              paginatedStudents.length > 0
                            }
                            onCheckedChange={(checked) =>
                              toggleSelectAll(checked as boolean)
                            }
                          />
                        </TooltipDemo>
                      </TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Contact
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Department / Year level
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {paginatedStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          No students found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedStudents.map((student) => (
                        <TableRow key={student.id} className="group">
                          <TableCell className="text-center">
                            <Checkbox
                              className="border border-blue-600 hover:border-blue-700 hover:border-2"
                              checked={selectedIds.includes(student.id)}
                              onCheckedChange={() => toggleSelect(student.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold ring-2 ring-background">
                                {student.firstName.charAt(0)}
                                {student.lastName.charAt(0)}
                              </div>
                              <div className="flex flex-col justify-center ">
                                <span>
                                  {student.firstName} {student.lastName}
                                </span>
                                <span className="text-muted-foreground">
                                  {student.schoolId}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground hidden lg:table-cell">
                            <div className="flex flex-col justify-center gap-1">
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                <span className="text-sm">{student.email}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                <span className="text-sm">{student.phone}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground hidden lg:table-cell">
                            <div className="flex flex-col justify-center gap-1">
                              <div className="flex items-center gap-2">
                                <Building className="h-4 w-4" />
                                <span className="text-sm">
                                  {student.department}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span className="text-sm">
                                  {student.yearLevel}
                                </span>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            {getStatusBadge(student.status)}
                          </TableCell>
                          <TableCell>
                            <div className="flex  gap-2">
                              <Button
                                className="w-[100px]"
                                size="sm"
                                variant={
                                  student.status === "Signed"
                                    ? "destructive"
                                    : "default"
                                }
                                onClick={() => handleSign(student.id)}
                              >
                                {student.status === "Signed" ? (
                                  <>
                                    <Undo2 className="h-4 w-4 mr-1" /> Cancel
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="h-4 w-4 mr-1" />{" "}
                                    Sign
                                  </>
                                )}
                              </Button>
                              <Button
                                className="bg-yellow-500 hover:bg-yellow-600"
                                size="sm"
                              >
                                <Eye className="h-4 w-4" />
                                View
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-4">
                <div className="text-sm text-muted-foreground">
                  Showing <span className="font-medium">{startIndex + 1}</span>–
                  <span className="font-medium">
                    {Math.min(endIndex, filteredStudents.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium">{filteredStudents.length}</span>{" "}
                  students
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <span className="text-sm font-medium">
                    Page {currentPage} of {totalPages || 1}
                  </span>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>

                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(v) => {
                      setItemsPerPage(Number(v));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[90px]">
                      <SelectValue placeholder="Rows" />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 10, 20, 50].map((size) => (
                        <SelectItem key={size} value={size.toString()}>
                          {size}/page
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      <div className="fixed bottom-6 right-6 z-50">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to={"/clearing-officer/sao/requirements"}>
                <Button
                  size="icon"
                  className="h-12 w-12 rounded-full shadow-lg bg-blue-600"
                >
                  <ChevronRight className="h-6 w-6" />
                  <span className="sr-only">Back to requirements</span>
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="left" align="center">
              Back to requirements
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Unsign Warning Dialog */}
      <Dialog open={showUnsignDialog} onOpenChange={setShowUnsignDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <DialogTitle className="text-xl">Confirm Unsign</DialogTitle>
            </div>
            <DialogDescription className="pt-3 text-base">
              {unsignTarget?.type === "single" ? (
                <>
                  Are you sure you want to remove the signature for this
                  student? This action will mark their requirement as incomplete
                  and cannot be undone.
                </>
              ) : (
                <>
                  Are you sure you want to remove signatures for{" "}
                  <span className="font-semibold text-foreground">
                    {selectedIds.length} selected student(s)
                  </span>
                  ? This action will mark their requirements as incomplete and
                  cannot be undone.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowUnsignDialog(false);
                setUnsignTarget(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmUnsign}>
              <Undo2 className="mr-2 h-4 w-4" />
              Yes, Unsign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
