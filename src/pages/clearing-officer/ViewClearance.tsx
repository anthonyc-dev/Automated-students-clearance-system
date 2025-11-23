import { Card, CardHeader, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  IdCard,
  ArrowLeft,
  Printer,
  GraduationCap,
  Calendar,
  CalendarCheck2,
  FileChartLine,
  AlertCircle,
  Loader2,
  User,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getStudentRequirementsBySchoolId } from "@/services/studentRequirementService";
import { getStudentRequirementsByStudentIdIns } from "@/services/studentReqInstitutionalService";
import { getAllStudents } from "@/services/studentService";
import {
  getCurrentClearance,
  type ClearanceStatus,
} from "@/services/clearanceService";

// Local student interface extracted from requirements API response
interface StudentData {
  _id: string;
  schoolId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  program: string;
  yearLevel: string;
}

// Status mapping from API to UI
type RequirementStatus = "signed" | "incomplete" | "missing";
type DisplayStatus = "Cleared" | "Pending" | "Missing";

interface ClearanceItem {
  id: string;
  department: string;
  courseCode?: string;
  instructor?: string;
  status: DisplayStatus;
  requirements: string;
  description?: string;
  clearedBy: string;
  clearedAt: string;
}

export const ViewClearance = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // State management
  const [student, setStudent] = useState<StudentData | null>(null);
  const [deptClearance, setDeptClearance] = useState<ClearanceItem[]>([]);
  const [instClearance, setInstClearance] = useState<ClearanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clearanceInfo, setClearanceInfo] = useState<ClearanceStatus | null>(
    null
  );

  console.log("mga students", student);

  // Get schoolId from URL query parameter
  const schoolId = searchParams.get("schoolId");

  // Map API status to display status
  const mapStatus = (status: RequirementStatus): DisplayStatus => {
    switch (status) {
      case "signed":
        return "Cleared";
      case "incomplete":
        return "Pending";
      case "missing":
        return "Missing";
      default:
        return "Pending";
    }
  };

  // Get status color for badges
  const getStatusColor = (status: DisplayStatus) => {
    switch (status) {
      case "Cleared":
        return "text-green-600 border-green-600";
      case "Pending":
        return "text-yellow-600 border-yellow-600";
      case "Missing":
        return "text-red-600 border-red-600";
      default:
        return "text-gray-600 border-gray-600";
    }
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "-";
    }
  };

  // Calculate overall clearance status
  const calculateOverallStatus = (): {
    status: "complete" | "incomplete";
    label: string;
  } => {
    const allClearances = [...deptClearance, ...instClearance];
    const hasIncomplete = allClearances.some(
      (item) => item.status !== "Cleared"
    );

    if (allClearances.length === 0) {
      return { status: "incomplete", label: "No Requirements" };
    }

    if (hasIncomplete) {
      return { status: "incomplete", label: "Incomplete" };
    }

    return { status: "complete", label: "Complete" };
  };

  // Fetch data on component mount
  useEffect(() => {
    const fetchClearanceData = async () => {
      if (!schoolId) {
        setError("No student ID provided. Please select a student.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log("📤 Fetching clearance data for schoolId:", schoolId);

        // Fetch current clearance info (school year and semester)
        try {
          const currentClearance = await getCurrentClearance();
          setClearanceInfo(currentClearance);
          console.log("✅ Current clearance info fetched:", currentClearance);
        } catch (clearanceError) {
          console.warn(
            "⚠️ Could not fetch current clearance info:",
            clearanceError
          );
          // Continue without clearance info - use fallback
        }

        // Fetch department requirements by schoolId
        // This endpoint returns student requirements with populated student data
        const deptRequirements = await getStudentRequirementsBySchoolId(
          schoolId
        );

        console.log("✅ Department requirements received:", deptRequirements);

        // Check if we have any requirements
        if (deptRequirements.length === 0) {
          setError(
            "No clearance data found for this student. Please contact the administrator."
          );
          setLoading(false);
          return;
        }

        // Extract student information from the first requirement response
        // The API should populate student data in the response
        const firstReq = deptRequirements[0];

        // Check if student data is available in the response
        // Adjust this based on your actual API response structure
        let studentInfo: StudentData | null = null;

        if (firstReq && typeof firstReq === "object" && "student" in firstReq) {
          // If student data is populated in the requirement
          const studentData = firstReq.student as {
            _id?: string;
            id?: string;
            schoolId?: string;
            firstName?: string;
            lastName?: string;
            email?: string;
            phoneNumber?: string;
            program?: string;
            yearLevel?: string;
          };
          studentInfo = {
            _id: studentData._id || studentData.id || "",
            schoolId: studentData.schoolId || schoolId,
            firstName: studentData.firstName || "",
            lastName: studentData.lastName || "",
            email: studentData.email || "",
            phoneNumber: studentData.phoneNumber || "",
            program: studentData.program || "",
            yearLevel: studentData.yearLevel || "",
          };
        } else {
          // Fallback: Fetch all students and find by schoolId
          console.log(
            "⚠️ Student data not populated in requirement response, fetching all students..."
          );
          try {
            const allStudents = await getAllStudents();
            console.log(
              "✅ All students fetched, searching for schoolId:",
              schoolId
            );

            const foundStudent = allStudents.find(
              (s) => s.schoolId === schoolId
            );

            if (foundStudent) {
              console.log("✅ Student found:", foundStudent);
              studentInfo = {
                _id: foundStudent._id || "",
                schoolId: foundStudent.schoolId || schoolId,
                firstName: foundStudent.firstName || "",
                lastName: foundStudent.lastName || "",
                email: foundStudent.email || "",
                phoneNumber: foundStudent.phoneNumber || "",
                program: foundStudent.program || "",
                yearLevel: foundStudent.yearLevel || "",
              };
            } else {
              console.warn("⚠️ Student not found in all students list");
              // Last resort fallback
              studentInfo = {
                _id: firstReq.studentId || "",
                schoolId: schoolId,
                firstName: "Student",
                lastName: schoolId,
                email: "N/A",
                phoneNumber: "N/A",
                program: "N/A",
                yearLevel: "N/A",
              };
            }
          } catch (studentFetchError) {
            console.error("❌ Error fetching all students:", studentFetchError);
            // Last resort fallback
            studentInfo = {
              _id: firstReq.studentId || "",
              schoolId: schoolId,
              firstName: "Student",
              lastName: schoolId,
              email: "N/A",
              phoneNumber: "N/A",
              program: "N/A",
              yearLevel: "N/A",
            };
          }
        }

        setStudent(studentInfo);
        console.log("✅ Student data extracted:", studentInfo);

        // Log the raw requirement data to see its structure
        console.log("🔍 First department requirement structure:", firstReq);
        console.log("🔍 Requirement object:", firstReq.requirement);
        console.log("🔍 Clearing Officer object:", firstReq.clearingOfficer);

        // Transform department requirements to ClearanceItem format
        const transformedDept: ClearanceItem[] = deptRequirements.map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (req: any) => {
            // Use officerRequirement field (your API's actual field name)
            const requirement = req.officerRequirement || req.requirement;

            // Detailed logging for debugging
            console.log("🔍 Processing department requirement:", {
              id: req._id || req.id,
              hasRequirement: !!req.requirement,
              hasOfficerRequirement: !!req.officerRequirement,
              hasClearingOfficer: !!req.clearingOfficer,
              status: req.status,
              requirement: requirement,
              courseCode: requirement?.courseCode,
              courseName: requirement?.courseName,
              requirements: requirement?.requirements,
              description: requirement?.description,
              department: requirement?.department,
            });

            return {
              id: req._id || req.id || "",
              department: requirement?.department || "Unknown Department",
              courseCode:
                requirement?.courseCode || requirement?.courseName || "",
              instructor: req.clearingOfficer
                ? `${req.clearingOfficer.firstName} ${req.clearingOfficer.lastName}`
                : "-",
              status: mapStatus(req.status as RequirementStatus),
              requirements:
                requirement?.requirements?.join(", ") || "No requirements",
              description: requirement?.description || "",
              clearedBy: req.clearingOfficer
                ? `${req.clearingOfficer.firstName} ${req.clearingOfficer.lastName}`
                : "-",
              clearedAt: formatDate(req.updatedAt),
            };
          }
        );

        setDeptClearance(transformedDept);
        console.log("✅ Department clearance transformed:", transformedDept);

        // Fetch institutional requirements by schoolId
        // The API endpoint actually uses schoolId, not database _id
        if (schoolId) {
          console.log(
            "📤 Fetching institutional requirements for schoolId:",
            schoolId
          );
          try {
            const instRequirements = await getStudentRequirementsByStudentIdIns(
              schoolId
            );

            console.log(
              "✅ Institutional requirements received:",
              instRequirements
            );

            // Transform institutional requirements to ClearanceItem format
            const transformedInst: ClearanceItem[] = instRequirements.map(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (req: any) => {
                // Use institutionalRequirement field (different from department requirements!)
                const requirement =
                  req.institutionalRequirement ||
                  req.officerRequirement ||
                  req.requirement;

                // Detailed logging for debugging
                console.log("🔍 Processing institutional requirement:", {
                  id: req._id || req.id,
                  hasRequirement: !!req.requirement,
                  hasOfficerRequirement: !!req.officerRequirement,
                  hasInstitutionalRequirement: !!req.institutionalRequirement,
                  hasClearingOfficer: !!req.clearingOfficer,
                  status: req.status,
                  requirement: requirement,
                  institutionalName: requirement?.institutionalName,
                  requirements: requirement?.requirements,
                  description: requirement?.description,
                  department: requirement?.department,
                });

                return {
                  id: req._id || req.id || "",
                  department:
                    requirement?.department ||
                    requirement?.institutionalName ||
                    "Unknown Department",
                  courseCode: requirement?.institutionalName || "",
                  instructor: req.clearingOfficer
                    ? `${req.clearingOfficer.firstName} ${req.clearingOfficer.lastName}`
                    : "-",
                  status: mapStatus(req.status as RequirementStatus),
                  requirements:
                    requirement?.requirements?.join(", ") || "No requirements",
                  description: requirement?.description || "",
                  clearedBy: req.clearingOfficer
                    ? `${req.clearingOfficer.firstName} ${req.clearingOfficer.lastName}`
                    : "-",
                  clearedAt: formatDate(req.updatedAt),
                };
              }
            );

            setInstClearance(transformedInst);
            console.log(
              "✅ Institutional clearance transformed:",
              transformedInst
            );
          } catch (instError) {
            console.warn(
              "⚠️ Could not fetch institutional requirements:",
              instError
            );
            // Continue without institutional requirements
            setInstClearance([]);
          }
        } else {
          console.warn(
            "⚠️ No student ID found, skipping institutional requirements"
          );
          setInstClearance([]);
        }
      } catch (err) {
        console.error("❌ Error fetching clearance data:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load clearance data. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchClearanceData();
  }, [schoolId]);

  const handleBack = () => {
    navigate(-1);
  };

  // Format school year and semester from API data
  const schoolYear = clearanceInfo
    ? `${clearanceInfo.academicYear} ${clearanceInfo.semesterType}`
    : "2024-2025 2nd Semester"; // Fallback

  const overallStatus = calculateOverallStatus();

  // Loading state
  if (loading) {
    return (
      <div className="mx-auto p-4 md:px-10 lg:px-30 space-y-6 bg-slate-100">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-500" />
            <p className="text-gray-600">Loading clearance data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="mx-auto p-4 md:px-10 lg:px-30 space-y-6 bg-slate-100">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={handleBack} className="bg-blue-500 text-white">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  // No student found
  if (!student) {
    return (
      <div className="mx-auto p-4 md:px-10 lg:px-30 space-y-6 bg-slate-100">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Student not found. Please check the student ID and try again.
          </AlertDescription>
        </Alert>
        <Button onClick={handleBack} className="bg-blue-500 text-white">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          /* Hide navigation elements */
          .no-print {
            display: none !important;
          }

          /* Remove background colors */
          body, .mx-auto {
            background: white !important;
          }

          /* Optimize page layout */
          .mx-auto {
            padding: 0 !important;
            max-width: 100% !important;
          }

          /* Ensure cards print properly */
          .shadow-md {
            box-shadow: none !important;
            border: 1px solid #e5e7eb !important;
          }

          /* Page breaks */
          .page-break-before {
            page-break-before: always;
          }

          .page-break-inside-avoid {
            page-break-inside: avoid;
          }

          /* Print title */
          .print-title {
            display: block !important;
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #000;
          }

          /* Ensure two-column layout prints side by side */
          @page {
            size: A4;
            margin: 1cm;
          }
        }

        /* Hide print title on screen */
        @media screen {
          .print-title {
            display: none !important;
          }
        }
      `}</style>

      <div className="mx-auto p-4 md:px-10 space-y-6 bg-slate-100">
        {/* Print Title - Only visible when printing */}
        <div className="print-title">Student Clearance Report</div>

        {/* Header */}
        <div className="no-print flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <Button
              onClick={handleBack}
              className="flex items-center gap-2 bg-blue-500 text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Records
            </Button>

            <h1 className="text-xl md:text-2xl font-bold">Student Clearance</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* <Button className="flex items-center gap-2 bg-blue-500 text-white">
              <Download className="w-4 h-4" />
              Download
            </Button> */}
            <Button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-blue-500 text-white"
            >
              <Printer className="w-4 h-4" />
              Print
            </Button>
          </div>
        </div>

        {/* Student Info */}
        <Card className="page-break-inside-avoid border-none bg-white shadow-md">
          <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
            <h2 className="text-lg md:text-xl font-semibold">
              Student Information
            </h2>
            <div className="flex items-center gap-2">
              <CalendarCheck2 className="w-5 h-5 text-blue-500" />
              <span className="font-medium">{schoolYear}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="w-24 h-24 rounded-full border border-gray-300 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                {student.firstName.charAt(0)}
                {student.lastName.charAt(0)}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                {/* Left Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <IdCard className="w-5 h-5 text-blue-500" />
                    <span className="text-gray-600">ID Number:</span>
                    <span className="font-medium">{student.schoolId}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-500" />
                    <span className="text-gray-600 ">Name:</span>
                    <span className="font-medium">
                      {student.firstName} {student.lastName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-blue-500" />
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{student.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-5 h-5 text-blue-500" />
                    <span className="text-gray-600">Contact:</span>
                    <span className="font-medium">{student.phoneNumber}</span>
                  </div>
                </div>

                {/* Right Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-blue-500" />
                    <span className="text-gray-600">Course:</span>
                    <p className="font-medium">{student.program}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    <span className="text-gray-600">Year Level:</span>
                    <p className="font-medium">{student.yearLevel}</p>
                  </div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="flex items-center gap-2"
                  >
                    <FileChartLine className="w-5 h-5 text-blue-500" />
                    <span className="text-gray-600">Clearance Status:</span>
                    <div
                      className={`flex justify-center items-center gap-2 px-5 py-2 rounded-2xl ${
                        overallStatus.status === "complete"
                          ? "bg-green-100 border border-green-300 text-green-800"
                          : "bg-orange-100 border border-orange-300 text-orange-800"
                      }`}
                    >
                      {overallStatus.status === "complete" ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-orange-600" />
                      )}
                      <p className="text-sm font-semibold">
                        {overallStatus.label}
                      </p>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clearance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Department Clearance */}
          <Card className="page-break-inside-avoid border-none bg-white shadow-md">
            <CardHeader>
              <h2 className="text-lg md:text-xl font-semibold">
                Department Clearance
              </h2>
            </CardHeader>
            <CardContent className="space-y-4">
              {deptClearance.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No department clearance requirements found.</p>
                </div>
              ) : (
                deptClearance.map((item, index) => (
                  <div key={item.id}>
                    <div className="flex flex-col md:flex-row justify-between py-2 gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 flex-shrink-0">
                          {item.status === "Cleared" ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : item.status === "Missing" ? (
                            <XCircle className="w-5 h-5 text-red-600" />
                          ) : (
                            <div className="w-3 h-3 rounded-full bg-yellow-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {item.courseCode && (
                              <Badge
                                variant="secondary"
                                className="text-xs bg-blue-100 text-blue-800"
                              >
                                {item.courseCode}
                              </Badge>
                            )}
                          </div>
                          {item.instructor && item.instructor !== "-" && (
                            <p className="text-sm text-gray-600 mb-1">
                              <span className="font-medium">Instructor:</span>{" "}
                              {item.instructor}
                            </p>
                          )}
                          <p className="text-sm text-gray-500 mb-1">
                            <span className="font-medium">Requirements:</span>{" "}
                            {item.requirements}
                          </p>
                          {item.description && (
                            <p className="text-sm text-gray-500 mb-1">
                              <span className="font-medium">Description:</span>{" "}
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right space-y-1 flex-shrink-0">
                        <Badge
                          variant="outline"
                          className={getStatusColor(item.status)}
                        >
                          {item.status}
                        </Badge>
                        {item.clearedBy !== "-" && (
                          <p className="text-sm text-gray-500">
                            Cleared by: {item.clearedBy}
                          </p>
                        )}
                        {item.clearedAt !== "-" && (
                          <p className="text-sm text-gray-500">
                            {item.clearedAt}
                          </p>
                        )}
                      </div>
                    </div>
                    {index < deptClearance.length - 1 && (
                      <hr className="my-3 border-t border-gray-300" />
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Institution Clearance */}
          <Card className="page-break-inside-avoid border-none bg-white shadow-md">
            <CardHeader>
              <h2 className="text-lg md:text-xl font-semibold">
                Institution Clearance
              </h2>
            </CardHeader>
            <CardContent className="space-y-4">
              {instClearance.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No institutional clearance requirements found.</p>
                </div>
              ) : (
                instClearance.map((item, index) => (
                  <div key={item.id}>
                    <div className="flex flex-col md:flex-row justify-between py-2 gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 flex-shrink-0">
                          {item.status === "Cleared" ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : item.status === "Missing" ? (
                            <XCircle className="w-5 h-5 text-red-600" />
                          ) : (
                            <div className="w-3 h-3 rounded-full bg-yellow-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {item.courseCode && (
                              <Badge
                                variant="secondary"
                                className="text-xs bg-blue-100 text-blue-800"
                              >
                                {item.courseCode}
                              </Badge>
                            )}
                          </div>
                          {item.instructor && item.instructor !== "-" && (
                            <p className="text-sm text-gray-600 mb-1">
                              <span className="font-medium">Instructor:</span>{" "}
                              {item.instructor}
                            </p>
                          )}
                          <p className="text-sm text-gray-500 mb-1">
                            <span className="font-medium">Requirements:</span>{" "}
                            {item.requirements}
                          </p>
                          {item.description && (
                            <p className="text-sm text-gray-500 mb-1">
                              <span className="font-medium">Description:</span>{" "}
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right space-y-1 flex-shrink-0">
                        <Badge
                          variant="outline"
                          className={getStatusColor(item.status)}
                        >
                          {item.status}
                        </Badge>
                        {item.clearedBy !== "-" && (
                          <p className="text-sm text-gray-500">
                            Cleared by: {item.clearedBy}
                          </p>
                        )}
                        {item.clearedAt !== "-" && (
                          <p className="text-sm text-gray-500">
                            {item.clearedAt}
                          </p>
                        )}
                      </div>
                    </div>
                    {index < instClearance.length - 1 && (
                      <hr className="my-3 border-t border-gray-300" />
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default ViewClearance;
