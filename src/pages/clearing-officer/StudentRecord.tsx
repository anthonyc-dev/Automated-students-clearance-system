import React, { useMemo, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Search,
  Mail,
  CheckCircle,
  Undo,
  Phone,
  Book,
  PackageX,
  ChevronLeft,
  XCircle,
  Clock,
  Building,
  Calendar,
  User,
} from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TooltipDemo from "@/components/HoverToolip";
import PaginationComponent from "./_components/PaginationComponent";
import { Spin, message, Modal } from "antd";
import {
  getAllStudentSpecificSubject,
  getMultipleStudentsBySchoolIds,
} from "@/services/intigration.services";
import { useAuth } from "@/authentication/useAuth";
import {
  createStudentRequirement,
  createBulkStudentRequirements,
  updateStudentRequirement,
  getAllStudentRequirements,
  findExistingStudentRequirement,
  type StudentRequirement,
} from "@/services/studentRequirementService";
import {
  revokeStudentPermit,
  checkStudentPermit,
} from "@/services/permitService";

interface ApiStudentData {
  id?: string;
  schoolId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  phone?: string;
  courseCode?: string;
  yearLevel?: string;
  department?: string;
  profilePic?: string;
}

interface Student {
  id: string;
  schoolId: string;
  name: string;
  email: string;
  id_no: string;
  cp_no: string;
  profilePic: string;
  status: "Signed" | "Incomplete" | "Missing" | "Cleared";
  initials: string;
  yearLevel: string;
  department: string;
  studentRequirementId?: string;
}

interface ConfirmDialog {
  isOpen: boolean;
  type?: "single" | "multiple";
  studentId?: string;
  studentName?: string;
  onConfirm?: () => void;
}

const StudentRecord: React.FC = () => {
  const navigation = useNavigate();
  const { courseCode, reqId } = useParams<{
    courseCode: string;
    reqId: string;
  }>();
  const { user, role } = useAuth();

  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [studentList, setStudentList] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>({
    isOpen: false,
  });
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [allStudentRequirements, setAllStudentRequirements] = useState<
    StudentRequirement[]
  >([]);
  const [studentsWithPermits, setStudentsWithPermits] = useState<Set<string>>(
    new Set()
  );
  // Map of studentId -> permitId for revocation
  const [studentPermitIds, setStudentPermitIds] = useState<Map<string, string>>(
    new Map()
  );

  const statuses = ["all", "Cleared", "Signed", "Incomplete", "Missing"];
  const studentsPerPage = 10;

  useEffect(() => {
    const fetchStudents = async () => {
      if (!courseCode) {
        console.warn("No courseCode provided, skipping fetch");
        setIsLoadingStudents(false);
        return;
      }

      setIsLoadingStudents(true);
      setFetchError(null);

      try {
        console.log(`Fetching students enrolled in course: ${courseCode}`);
        const response = await getAllStudentSpecificSubject(courseCode);
        console.log("API Response:", response);

        let students: ApiStudentData[] = [];

        // Extract students array from response
        if (Array.isArray(response)) {
          students = response;
        } else if (response.data && Array.isArray(response.data)) {
          students = response.data;
        } else if (response.students && Array.isArray(response.students)) {
          students = response.students;
        }

        console.log("Extracted students:", students);

        // Get school IDs from the extracted students
        const schoolIds = students
          .map((s) => s.schoolId)
          .filter((id): id is string => !!id);

        console.log("School IDs to fetch:", schoolIds);

        // Fetch detailed student data by school IDs
        let detailedStudents: ApiStudentData[] = [];
        if (schoolIds.length > 0) {
          try {
            const detailedResponse = await getMultipleStudentsBySchoolIds(
              schoolIds
            );
            console.log("Detailed students response:", detailedResponse);

            if (
              Array.isArray(detailedResponse) &&
              detailedResponse.length > 0
            ) {
              detailedStudents = detailedResponse as ApiStudentData[];
            } else {
              detailedStudents = students;
            }
          } catch (detailError) {
            console.warn(
              "Could not fetch detailed student data, using basic data:",
              detailError
            );
            detailedStudents = students;
          }
        } else {
          detailedStudents = students;
        }

        // Transform API data to match the expected student format
        const transformedStudents = detailedStudents.map(
          (student: ApiStudentData) => {
            const fullName = `${student.firstName || ""} ${
              student.lastName || ""
            }`.trim();
            const initials = `${student.firstName?.charAt(0) || ""}${
              student.lastName?.charAt(0) || ""
            }`.toUpperCase();

            return {
              id: student.id || student.schoolId || "N/A",
              schoolId: student.schoolId ?? "N/A",
              name: fullName || "Unknown Student",
              email: student.email ?? "N/A",
              id_no: student.schoolId ?? "N/A",
              cp_no: student.phone ?? "N/A",
              profilePic: student.profilePic ?? "",
              department: student.department ?? "",
              yearLevel: student.yearLevel ?? "",
              status: "Incomplete" as const,
              initials: initials || "?",
            };
          }
        );
        console.log("My console", transformedStudents);

        console.log(
          `Fetched and transformed ${transformedStudents.length} students for course ${courseCode}`
        );

        // Fetch all student requirements to check for existing signed students
        try {
          console.log(
            "🔍 Fetching student requirements to check for signed students..."
          );
          const allRequirements = await getAllStudentRequirements();
          console.log(
            `✅ Fetched ${allRequirements.length} student requirements`
          );

          // Store all requirements in state for later use when signing
          setAllStudentRequirements(allRequirements);

          // Filter requirements that match the current requirement ID
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
              const requirement = requirementMap.get(student.id_no);
              if (requirement) {
                const reqId = requirement._id || requirement.id;
                console.log(
                  `✓ Student ${student.id_no} has requirement with status: ${requirement.status}, _id: ${reqId}`
                );
                return {
                  ...student,
                  status:
                    requirement.status === "signed"
                      ? ("Signed" as const)
                      : requirement.status === "incomplete"
                      ? ("Incomplete" as const)
                      : requirement.status === "missing"
                      ? ("Missing" as const)
                      : ("Incomplete" as const),
                  studentRequirementId: reqId,
                };
              }
              return student;
            }
          );

          // Check for students with active permits BEFORE setting state
          console.log("🔍 Checking for students with active permits...");
          const permitChecks = studentsWithRequirements.map(async (student) => {
            const permitData = await checkStudentPermit(student.id_no);
            const permitId = permitData?.permit?.id || null;

            if (permitData && permitId) {
              console.log(
                `📋 Student ${student.id_no} has permit ID: ${permitId}`
              );
            }

            return {
              schoolId: student.id_no,
              hasPermit: permitData !== null,
              permitId: permitId,
            };
          });

          const permitResults = await Promise.all(permitChecks);
          const studentsWithActivePermits = new Set(
            permitResults.filter((r) => r.hasPermit).map((r) => r.schoolId)
          );
          const permitIdMap = new Map(
            permitResults
              .filter((r) => r.hasPermit && r.permitId)
              .map((r) => [r.schoolId, r.permitId!])
          );

          console.log(
            `✅ Found ${studentsWithActivePermits.size} student(s) with active permits`
          );
          setStudentsWithPermits(studentsWithActivePermits);
          setStudentPermitIds(permitIdMap);

          // Update student status to "Cleared" if they have an active permit
          const studentsWithClearedStatus = studentsWithRequirements.map(
            (student) => {
              if (studentsWithActivePermits.has(student.id_no)) {
                console.log(
                  `✅ Setting student ${student.id_no} status to "Cleared"`
                );
                return {
                  ...student,
                  status: "Cleared" as const,
                };
              }
              return student;
            }
          );

          setStudentList(studentsWithClearedStatus);
          console.log(
            "✅ Students merged with requirements:",
            studentsWithRequirements
          );
        } catch (reqError) {
          console.warn("⚠️ Could not fetch student requirements:", reqError);
          // If fetching requirements fails, just use the transformed students without requirements
          setStudentList(transformedStudents);
        }

        const idNumbers = transformedStudents.map((user) => user.id_no);
        console.log("Student ID numbers:", idNumbers);
      } catch (error) {
        console.error("Error fetching students:", error);
        setStudentList([]);

        // Set user-friendly error message
        if (error && typeof error === "object" && "message" in error) {
          setFetchError(error.message as string);
        } else {
          setFetchError(`No students enrolled in ${courseCode}`);
        }
      } finally {
        setIsLoadingStudents(false);
      }
    };

    fetchStudents();
  }, [courseCode, reqId]);

  const filteredStudents = useMemo(
    () =>
      studentList
        .filter(
          (student) =>
            (student.name.toLowerCase().includes(search.toLowerCase()) ||
              student.email.toLowerCase().includes(search.toLowerCase()) ||
              student.id_no.toLowerCase().includes(search.toLowerCase())) &&
            (selectedStatus === "all" || student.status === selectedStatus)
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [studentList, search, selectedStatus]
  );

  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * studentsPerPage;
    const endIndex = startIndex + studentsPerPage;
    return filteredStudents.slice(startIndex, endIndex);
  }, [filteredStudents, currentPage, studentsPerPage]);

  const handleSelectAll = (checked: boolean) => {
    setSelectedStudents(checked ? filteredStudents.map((s) => s.id) : []);
  };

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    setSelectedStudents((prev) =>
      checked ? [...prev, studentId] : prev.filter((id) => id !== studentId)
    );
  };

  const handleSignSelected = async () => {
    // Get all selected students' id_no
    const selectedStudentsData = studentList.filter((student) =>
      selectedStudents.includes(student.id)
    );
    const selectedIdNumbers = selectedStudentsData.map(
      (student) => student.id_no
    );

    console.log(`Signing ${selectedStudentsData.length} selected students`);
    console.log("Selected Student ID Numbers:", selectedIdNumbers);
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
        const existingRequirement = findExistingStudentRequirement(
          allStudentRequirements,
          student.id_no,
          user.id,
          reqId
        );

        if (existingRequirement) {
          const existingId = existingRequirement._id || existingRequirement.id;
          console.log(
            `♻️ Student ${student.id_no} has existing requirement: ${existingId}`
          );
          studentsToUpdate.push({ student, existingReqId: existingId! });
        } else {
          console.log(`➕ Student ${student.id_no} needs new requirement`);
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
            updateStudentRequirement(
              existingReqId,
              "signed",
              student.id_no,
              user.id,
              reqId
            ).then((result) => ({ student, result, existingReqId }))
        );

        const updateResults = await Promise.allSettled(updatePromises);
        const successfulUpdateIds: string[] = [];

        updateResults.forEach((promiseResult) => {
          if (promiseResult.status === "fulfilled") {
            const { student, existingReqId } = promiseResult.value;
            if (existingReqId) {
              studentReqIdMap.set(student.id_no, existingReqId);
              successfulUpdateIds.push(existingReqId);
              console.log(`✅ Updated ${student.id_no} -> ${existingReqId}`);
            } else {
              console.error(`❌ No requirement ID for ${student.id_no}`);
            }
          } else {
            console.error(`❌ Failed to update:`, promiseResult.reason);
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
          studentId: student.id_no,
          coId: user.id,
          requirementId: reqId,
          signedBy: user.role,
          status: "signed" as const,
        }));

        createResults = await createBulkStudentRequirements(bulkRequirements);

        if (createResults && createResults.length > 0) {
          console.log("📦 Bulk create results (full response):", createResults);
          console.log("📦 First result structure:", createResults[0]);

          createResults.forEach((result, index) => {
            const studentIdNo = bulkRequirements[index].studentId;

            // Try multiple ways to extract the ID
            let storedId = result._id || result.id;

            // If no ID found, check if the result might be nested
            if (!storedId && typeof result === "object" && result !== null) {
              const resultObj = result as unknown as Record<string, unknown>;
              storedId = (resultObj["_id"] || resultObj["id"]) as
                | string
                | undefined;
            }

            console.log(`🔍 Checking result for ${studentIdNo}:`, {
              _id: result._id,
              id: result.id,
              fullResult: result,
              extractedId: storedId,
            });

            if (storedId) {
              console.log(`✅ Created ${studentIdNo} -> ${storedId}`);
              studentReqIdMap.set(studentIdNo, storedId);
            } else {
              console.error(
                `❌ No ID returned for ${studentIdNo}. Full result:`,
                JSON.stringify(result)
              );
            }
          });

          // Add new requirements to state
          setAllStudentRequirements((prev) => [...prev, ...createResults]);
        } else {
          console.error("❌ Bulk create returned empty or null results");
        }
      }

      hideLoading();

      const totalProcessed = studentsToUpdate.length + createResults.length;

      if (totalProcessed > 0) {
        // Log the requirement IDs before updating state
        console.log(
          "📋 Student Requirement ID Map:",
          Array.from(studentReqIdMap.entries())
        );

        // Update local state to reflect the signed status and store student requirement IDs
        setStudentList((prev) =>
          prev.map((student) => {
            if (selectedStudents.includes(student.id)) {
              const reqId = studentReqIdMap.get(student.id_no);
              console.log(
                `🔗 Mapping ${student.name} (${student.id_no}) -> Req ID: ${reqId}`
              );

              // If no requirement ID found, log a warning
              if (!reqId) {
                console.warn(
                  `⚠️ No requirement ID found for ${student.name} (${student.id_no})`
                );
              }

              return {
                ...student,
                status: "Signed",
                studentRequirementId: reqId,
              };
            }
            return student;
          })
        );

        setSelectedStudents([]);
        console.log(
          "✅ Stored student requirement IDs:",
          Array.from(studentReqIdMap.entries())
        );
        message.success(`Successfully signed ${totalProcessed} student(s)`);
      } else {
        message.error("Failed to sign students");
      }
    } catch (error) {
      console.error("Error signing selected students:", error);
      message.error("An error occurred while signing students");
    }
  };

  const handleUndoSelected = () => {
    // Check if any selected students have active permits
    const selectedStudentsData = studentList.filter((student) =>
      selectedStudents.includes(student.id)
    );
    const studentsWithActivePermits = selectedStudentsData.filter((student) =>
      studentsWithPermits.has(student.id_no)
    );

    if (studentsWithActivePermits.length > 0) {
      const studentNames = studentsWithActivePermits
        .map((s) => s.name)
        .join(", ");
      message.warning(
        `Cannot undo signature for ${studentsWithActivePermits.length} student(s) with active permits: ${studentNames}`
      );
      return;
    }

    setConfirmDialog({
      isOpen: true,
      type: "multiple",
      onConfirm: async () => {
        try {
          // Get selected students with their requirement IDs
          const selectedStudentsData = studentList.filter((student) =>
            selectedStudents.includes(student.id)
          );

          console.log(
            "🔍 Preparing to undo signatures for selected students..."
          );
          console.log("   - Total selected:", selectedStudentsData.length);

          // Try to find requirement IDs for students that don't have them
          const studentsWithReqIds = selectedStudentsData
            .map((student) => {
              if (student.studentRequirementId) {
                console.log(
                  `✓ ${student.name} has requirement ID: ${student.studentRequirementId}`
                );
                return student;
              }

              // Try to find the requirement ID from allStudentRequirements
              console.log(
                `⚠️ ${student.name} missing requirement ID, searching...`
              );
              const matchingReq = findExistingStudentRequirement(
                allStudentRequirements,
                student.id_no,
                user?.id || "",
                reqId || ""
              );

              if (matchingReq) {
                const foundId = matchingReq._id || matchingReq.id;
                console.log(
                  `✓ Found requirement ID for ${student.name}: ${foundId}`
                );
                return {
                  ...student,
                  studentRequirementId: foundId,
                };
              }

              console.warn(
                `❌ Could not find requirement ID for ${student.name}`
              );
              return student;
            })
            .filter((s) => s.studentRequirementId); // Only keep students with requirement IDs

          console.log(
            `📊 Found ${studentsWithReqIds.length} students with requirement IDs`
          );

          if (studentsWithReqIds.length > 0) {
            const hideLoading = message.loading(
              `Undoing ${studentsWithReqIds.length} signature(s)...`,
              0
            );

            // Update all student requirements in parallel
            const updatePromises = studentsWithReqIds.map((student) =>
              updateStudentRequirement(
                student.studentRequirementId!,
                "incomplete",
                student.id_no,
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
            console.log(
              "✅ Updated requirements in state with status: incomplete"
            );

            // Update local state for all selected students (including those with found IDs)
            setStudentList((prev) =>
              prev.map((student) => {
                if (selectedStudents.includes(student.id)) {
                  // Find if this student had their ID found
                  const studentWithId = studentsWithReqIds.find(
                    (s) => s.id === student.id
                  );
                  return {
                    ...student,
                    status: "Incomplete",
                    // Keep or update the studentRequirementId
                    studentRequirementId:
                      studentWithId?.studentRequirementId ||
                      student.studentRequirementId,
                  };
                }
                return student;
              })
            );

            if (failedCount > 0) {
              message.warning(
                `Updated ${successCount} signature(s). ${failedCount} failed.`
              );
            } else {
              message.success(
                `Successfully undone ${successCount} signature(s)`
              );
            }
          } else {
            // No requirement IDs found, just update local state
            console.warn(
              "⚠️ No requirement IDs found for any selected students"
            );
            setStudentList((prev) =>
              prev.map((student) =>
                selectedStudents.includes(student.id)
                  ? { ...student, status: "Incomplete" }
                  : student
              )
            );
            message.warning("No database records found. Updated locally only.");
          }

          setSelectedStudents([]);
        } catch (error) {
          console.error("Error undoing selected students:", error);
          message.error("An error occurred while undoing signatures");
        }
        setConfirmDialog({ isOpen: false });
      },
    });
  };

  const handleSignToggle = async (studentId: string) => {
    const student = studentList.find((s) => s.id === studentId);

    if (!student) {
      message.error("Student not found");
      return;
    }

    if (student?.status === "Signed") {
      // Check if student has active permit (QR code)
      if (studentsWithPermits.has(student.id_no)) {
        message.warning(
          `Cannot undo signature for ${student.name}. This student has an active clearance permit (QR code) and has completed all requirements.`
        );
        return;
      }

      // If student is already signed, show confirmation to undo
      setConfirmDialog({
        isOpen: true,
        type: "single",
        studentId,
        studentName: student.name,
        onConfirm: async () => {
          try {
            console.log(
              "🔄 Attempting to undo signature for student:",
              student.name
            );
            console.log("👤 Full student object:", student);
            console.log(
              "🔑 Student Requirement ID (_id to use in API):",
              student.studentRequirementId
            );
            console.log("📋 Student ID Number:", student.id_no);
            console.log("📊 Current Status:", student.status);

            // If no ID in student object, try to find it in allStudentRequirements
            if (!student.studentRequirementId) {
              console.log(
                "⚠️ No studentRequirementId in student object, searching allStudentRequirements..."
              );
              console.log(
                "   - Total requirements in state:",
                allStudentRequirements.length
              );
              console.log("   - Looking for:", {
                studentId: student.id_no,
                coId: user?.id,
                requirementId: reqId,
              });

              const matchingReq = findExistingStudentRequirement(
                allStudentRequirements,
                student.id_no,
                user?.id || "",
                reqId || ""
              );
              console.log(
                "   - Found in allStudentRequirements?",
                !!matchingReq
              );
              if (matchingReq) {
                const foundId = matchingReq._id || matchingReq.id;
                console.log("   - Found ID:", foundId);
                console.log("   - Matching requirement:", matchingReq);

                // Update the student requirement ID in the actual state
                student.studentRequirementId = foundId;

                // Also update the studentList state to persist this
                setStudentList((prev) =>
                  prev.map((s) =>
                    s.id === studentId
                      ? { ...s, studentRequirementId: foundId }
                      : s
                  )
                );
                console.log("✅ Updated studentRequirementId in state");
              } else {
                console.error(
                  "❌ Could not find matching requirement in allStudentRequirements"
                );
                console.log("   - All requirements:", allStudentRequirements);
              }
            }

            // Check if student has a studentRequirementId to update
            if (student.studentRequirementId) {
              const hideLoading = message.loading("Undoing signature...", 0);

              console.log(
                "📤 Sending update request with ID:",
                student.studentRequirementId
              );
              console.log("📤 Additional data - Student ID:", student.id_no);
              console.log("📤 Additional data - CO ID:", user?.id);
              console.log("📤 Additional data - Requirement ID:", reqId);

              // Update the student requirement status to "incomplete"
              const result = await updateStudentRequirement(
                student.studentRequirementId,
                "incomplete",
                student.id_no,
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
                setStudentList((prev) =>
                  prev.map((s) =>
                    s.id === studentId
                      ? {
                          ...s,
                          status: "Incomplete",
                          // Keep the studentRequirementId so we can re-sign later
                          studentRequirementId: student.studentRequirementId,
                        }
                      : s
                  )
                );
                console.log("✅ Local state updated successfully");
                message.success(`${student.name} signature removed`);
              } else {
                console.error("❌ Update returned null");
                message.error("Failed to undo signature");
              }
            } else {
              console.warn(
                "⚠️ No student requirement ID found for student:",
                student.name
              );
              console.log(
                "💡 This might mean the student was never signed in the database"
              );

              // No student requirement ID found, just update local state
              setStudentList((prev) =>
                prev.map((s) =>
                  s.id === studentId ? { ...s, status: "Incomplete" } : s
                )
              );
              message.warning(
                "No database record found. Updated locally only."
              );
            }
          } catch (error) {
            console.error("❌ Error undoing signature:", error);
            message.error("An error occurred while undoing the signature");
          }
          setConfirmDialog({ isOpen: false });
        },
      });
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
        if (!student.id_no) {
          message.error("Student ID not found");
          return;
        }

        // Check if student requirement already exists
        const existingRequirement = findExistingStudentRequirement(
          allStudentRequirements,
          student.id_no,
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

          result = await updateStudentRequirement(
            existingId!,
            "signed",
            student.id_no,
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
            studentId: student.id_no,
            coId: user.id,
            requirementId: reqId,
            signedBy: user.role,
            status: "signed" as const,
          };

          console.log("📦 Prepared requirement data:", requirementData);

          result = await createStudentRequirement(requirementData);
          storedId = result?._id || result?.id;

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
          setStudentList((prev) =>
            prev.map((s) =>
              s.id === studentId
                ? {
                    ...s,
                    status: "Signed",
                    studentRequirementId: storedId,
                  }
                : s
            )
          );
          message.success(`${student.name} signed successfully`);
        } else {
          message.error("Failed to sign student");
        }
      } catch (error) {
        console.error("Error signing student:", error);
        message.error("An error occurred while signing the student");
      }
    }
  };

  const handleDialogCancel = () => {
    setConfirmDialog({ isOpen: false });
  };

  const handleRevokePermit = async (studentId: string) => {
    const student = studentList.find((s) => s.id === studentId);
    if (!student) {
      message.error("Student not found");
      return;
    }

    const permitId = studentPermitIds.get(student.id_no);
    console.log(`🔍 Looking up permit ID for student ${student.id_no}`);
    console.log(`📋 Found permit ID: ${permitId}`);
    console.log(
      `📊 All permit IDs in map:`,
      Array.from(studentPermitIds.entries())
    );

    if (!permitId) {
      message.error("Permit ID not found for this student");
      return;
    }

    Modal.confirm({
      title: "Revoke Student Permit",
      content: `Are you sure you want to revoke the clearance permit for ${student.name}? This action cannot be undone and the student will need to clear requirements again.`,
      okText: "Revoke Permit",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          const hideLoading = message.loading("Revoking permit...", 0);

          await revokeStudentPermit(permitId);

          hideLoading();

          // Remove student from permits set and map
          setStudentsWithPermits((prev) => {
            const newSet = new Set(prev);
            newSet.delete(student.id_no);
            return newSet;
          });

          setStudentPermitIds((prev) => {
            const newMap = new Map(prev);
            newMap.delete(student.id_no);
            return newMap;
          });

          // Change student status from "Cleared" back to "Signed"
          setStudentList((prev) =>
            prev.map((s) =>
              s.id_no === student.id_no
                ? { ...s, status: "Signed" as const }
                : s
            )
          );

          message.success(
            `Successfully revoked permit for ${student.name}. Student status changed to "Signed".`
          );
        } catch (error) {
          console.error("Error revoking permit:", error);
          message.error("Failed to revoke permit. Please try again.");
        }
      },
    });
  };

  const isAllSelected =
    selectedStudents.length > 0 &&
    selectedStudents.length === filteredStudents.length;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <ChevronLeft
            className="w-6 h-6 text-slate-600 cursor-pointer hover:scale-110 transition-transform duration-200"
            onClick={() => navigation("/clearing-officer/clearance")}
          />
          <h1 className="text-3xl font-bold text-slate-800">Student Records</h1>
        </div>
        <div className="flex items-center gap-2 text-2xl text-muted-foreground">
          <Book className="w-5 h-5 text-primary " />
          <span>{courseCode}</span>
        </div>
      </div>

      <Card className="shadow-gray-100">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex w-full flex-col sm:flex-row items-center justify-between gap-2">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 w-full sm:w-[250px]"
                />
              </div>
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground ml-5">
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  Cleared:{" "}
                  {studentList.filter((s) => s.status === "Cleared").length}
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Signed:{" "}
                  {studentList.filter((s) => s.status === "Signed").length}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  Incomplete:{" "}
                  {studentList.filter((s) => s.status === "Incomplete").length}
                </span>
                <span className="flex items-center gap-1">
                  <XCircle className="w-4 h-4 text-red-600" />
                  Missing:{" "}
                  {studentList.filter((s) => s.status === "Missing").length}
                </span>
              </div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-[180px] sm:ml-auto">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!courseCode ? (
            <div className="flex flex-col items-center gap-3 py-20">
              <PackageX className="w-24 h-24 text-gray-300" />
              <div className="space-y-1 text-center">
                <p className="text-gray-400 text-2xl font-semibold">
                  No Course Code Provided
                </p>
                <p className="text-gray-400 text-sm">
                  Please navigate to this page from the Requirements table.
                </p>
                <Button
                  onClick={() => navigation("/clearing-officer/clearance")}
                  className="mt-4"
                >
                  Go to Clearance Page
                </Button>
              </div>
            </div>
          ) : isLoadingStudents ? (
            <div className="flex justify-center items-center py-20">
              <Spin size="large" />
              <span className="ml-3 text-gray-600">Loading students...</span>
            </div>
          ) : (
            <>
              {/* Fixed height container to prevent table shifting */}
              <div className="mb-4 min-h-[40px] flex items-center">
                {selectedStudents.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={handleSignSelected}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Sign Selected ({selectedStudents.length})
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleUndoSelected}
                    >
                      <Undo className="w-4 h-4 mr-2" />
                      Undo Selected ({selectedStudents.length})
                    </Button>
                  </div>
                )}
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <TooltipDemo isSelected={isAllSelected}>
                          <Checkbox
                            className="border border-blue-600 hover:border-blue-700 hover:border-2"
                            checked={isAllSelected}
                            onCheckedChange={handleSelectAll}
                            aria-label="Select all"
                          />
                        </TooltipDemo>
                      </TableHead>
                      <TableHead className="">Student</TableHead>
                      <TableHead className="hidden lg:table-cell ">
                        Contact
                      </TableHead>
                      <TableHead className="hidden lg:table-cell ">
                        Department / Year level
                      </TableHead>
                      <TableHead className="">Status</TableHead>
                      <TableHead className="">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedStudents.length > 0 ? (
                      paginatedStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>
                            <Checkbox
                              className="border border-blue-600 hover:border-blue-700 hover:border-2"
                              checked={selectedStudents.includes(student.id)}
                              onCheckedChange={(checked) =>
                                handleSelectStudent(student.id, !!checked)
                              }
                              aria-label={`Select ${student.name}`}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <User className="w-6 h-6 text-blue-700" />
                              <div className="flex flex-col justify-center ">
                                <span>{student.name}</span>
                                <span className="text-muted-foreground">
                                  {student.id_no}
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
                                <span className="text-sm">{student.cp_no}</span>
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
                            <Badge
                              className={`${
                                student.status === "Cleared"
                                  ? "bg-blue-100 border border-blue-300 text-blue-600"
                                  : student.status === "Signed"
                                  ? "bg-green-100 border border-green-300 text-green-600"
                                  : student.status === "Incomplete"
                                  ? "bg-yellow-100 border border-yellow-300 text-yellow-600"
                                  : "bg-red-100 border border-red-300 text-red-600"
                              }`}
                            >
                              {student.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="">
                            <div className="flex items-center gap-2">
                              {/* Revoke button - only visible for cashier role and students with Cleared status */}
                              {role === "cashier" &&
                                student.status === "Cleared" && (
                                  <Button
                                    className="w-20"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() =>
                                      handleRevokePermit(student.id)
                                    }
                                  >
                                    <XCircle className="w-4 h-4" />
                                    Revoke
                                  </Button>
                                )}

                              {/* Hide Sign/Undo button if student has Cleared status */}
                              {student.status !== "Cleared" && (
                                <Button
                                  className="w-20"
                                  variant={
                                    student.status === "Signed"
                                      ? "destructive"
                                      : "default"
                                  }
                                  size="sm"
                                  onClick={() => handleSignToggle(student.id)}
                                >
                                  {student.status === "Signed" ? (
                                    <Undo className="w-4 h-4" />
                                  ) : (
                                    <CheckCircle className="w-4 h-4" />
                                  )}
                                  {student.status === "Signed"
                                    ? "Undo"
                                    : "Sign"}
                                </Button>
                              )}
                              <Link
                                to={`/clearing-officer/viewClearance?schoolId=${student.schoolId}`}
                              >
                                <Button
                                  className="bg-yellow-500 hover:bg-yellow-400 w-20"
                                  size="sm"
                                >
                                  <Book className="w-4 h-4" />
                                  View
                                </Button>
                              </Link>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-64 text-center">
                          <div className="flex flex-col items-center gap-3 py-10">
                            <PackageX className="w-24 h-24 text-gray-300" />
                            <div className="space-y-1">
                              <p className="text-gray-400 text-2xl font-semibold">
                                {fetchError
                                  ? "No Students Enrolled"
                                  : "No students found"}
                              </p>
                              <p className="text-gray-400 text-sm">
                                {fetchError
                                  ? fetchError
                                  : "No students match your search criteria."}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              {filteredStudents.length > 0 && (
                <div className="flex items-center justify-between px-2 py-4">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-muted-foreground">
                      Showing{" "}
                      {Math.min(
                        (currentPage - 1) * studentsPerPage + 1,
                        filteredStudents.length
                      )}{" "}
                      to{" "}
                      {Math.min(
                        currentPage * studentsPerPage,
                        filteredStudents.length
                      )}{" "}
                      of {filteredStudents.length} students
                    </p>
                  </div>
                  <div>
                    <PaginationComponent
                      currentPage={currentPage}
                      totalPages={totalPages}
                      setCurrentPage={setCurrentPage}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.isOpen} onOpenChange={handleDialogCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Undo Action</DialogTitle>
            <DialogDescription>
              {confirmDialog.type === "single" && confirmDialog.studentName
                ? `Are you sure you want to undo the clearance for ${confirmDialog.studentName}? This action will change their status to "Incomplete".`
                : `Are you sure you want to undo the clearance for ${selectedStudents.length} selected student(s)? This action will change their status to "Incomplete".`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleDialogCancel}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDialog.onConfirm as () => void}
            >
              <Undo className="w-4 h-4 mr-2" />
              Undo Clearance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentRecord;
