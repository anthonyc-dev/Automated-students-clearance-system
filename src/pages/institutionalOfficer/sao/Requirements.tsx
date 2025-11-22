import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Input,
  Select,
  Modal,
  Space,
  Tag,
  message,
  Popover,
  Dropdown,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  BankOutlined,
  EyeOutlined,
  EditOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import TextArea from "antd/es/input/TextArea";
import {
  createInstitutionalRequirement,
  getAllInstitutionalRequirements,
  updateInstitutionalRequirement,
  deleteInstitutionalRequirement,
} from "@/services/institutionalRequirementsService";
import { useAuth } from "@/authentication/useAuth";
import {
  getCurrentClearance,
  type ClearanceStatus,
} from "@/services/clearanceService";
import { Building } from "lucide-react";
import axiosInstance, { API_URL } from "@/api/axios";
import { createBulkStudentRequirementsIns } from "@/services/studentReqInstitutionalService";
import {
  fetchClearingOfficerDashboardStats,
  type ClearingOfficerDashboardStats,
} from "@/services/clearingOfficerDashboardService";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/config/firebaseConfig";
import { sendBulkSms } from "@/services/sendSms";

interface Requirement {
  _id?: string;
  id?: string;
  institutionalName: string;
  requirements: string[];
  description: string;
  deadline: Date | string;
  department: string;
  semester: string;
  postedBy: string;
}

const departments = [
  "Bachelor of Science in Hospitality Management",
  "Electrical Engineering and Computer Science",
  "Bachelor of Science in Electrical Engineering",
  "Bachelor of Science in Criminology",
  "Bachelor of Science in Social Work",
  "Bachelor of Science in Accountancy",
  "PARAMED",
  "Bachelor of Science in Midwifery",
  "Bachelor of Science in Medical Technology",
  "Bachelor of Science in Nursing",
  "Bachelor of Science in Business Administration",
  "Bachelor of Elementary Education",
  "Bachelor of Arts in Political Science",
  "CEDCAS",
  "Bachelor in Secondary Education Major in Mathematics",
  "Bachelor in Secondary Education Major in Science",
  "Bachelor in Secondary Education Major in English",
  "All Departments",
];

const semesters = ["1st Semester", "2nd Semester"];

// Utility: truncate with ellipsis
const ellipsize = (text: string, limit = 120) =>
  text && text.length > limit ? `${text.slice(0, limit)}…` : text;

const Requirements = () => {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [clearanceStatus, setClearanceStatus] =
    useState<ClearanceStatus | null>(null);
  const [clearanceLoading, setClearanceLoading] = useState(true);

  // Add form state
  const [nameTags, setNameTags] = useState<string[]>([]);
  const [newRequirement, setNewRequirement] = useState<{
    courseCode: string;
    description: string;
    isOptional: boolean;
    department: string;
    semester: string;
    deadline?: Date;
  }>({
    courseCode: "",
    description: "",
    isOptional: false,
    department: "",
    semester: "",
  });

  // View/Edit modals state
  const [viewItem, setViewItem] = useState<Requirement | null>(null);
  const [editItem, setEditItem] = useState<Requirement | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<{
    courseCode: string;
    department: string;
    semester: string;
    names: string[];
    description: string;
    deadline?: Date;
  }>({
    courseCode: "",
    department: "",
    semester: "",
    names: [],
    description: "",
    deadline: undefined,
  });
  const [stats, setStats] = useState<ClearingOfficerDashboardStats | null>(
    null
  );

  const normalizedNames = nameTags
    .map((n) => (n || "").trim())
    .filter((n) => n.length > 0);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const data = await fetchClearingOfficerDashboardStats();
        setStats(data);

        console.log(data);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      }
    };

    loadDashboardData();
  }, []);

  // Calculate derived metrics
  // const daysUntilDeadline = stats
  //   ? getDaysUntilDeadline(stats.activeClearance)
  //   : 0;

  // Get and format deadline date
  const deadlineDate = stats?.activeClearance
    ? stats.activeClearance.extendedDeadline || stats.activeClearance.deadline
    : null;

  const formattedDeadlineDate = deadlineDate
    ? new Date(deadlineDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  // Fetch current clearance status
  useEffect(() => {
    const fetchClearanceStatus = async () => {
      setClearanceLoading(true);
      try {
        const status = await getCurrentClearance();
        console.log("✅ Clearance status:", status);
        setClearanceStatus(status);
      } catch (error) {
        console.error("❌ Error fetching clearance status:", error);
        // Set to null if there's an error, will show "not started" message
        setClearanceStatus(null);
      } finally {
        setClearanceLoading(false);
      }
    };

    fetchClearanceStatus();
  }, []);

  const fetchRequirements = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAllInstitutionalRequirements();
      console.log("Full response:", response);

      // Handle different response structures
      let requirementsData = [];

      if (Array.isArray(response)) {
        requirementsData = response;
      } else if (response.data && Array.isArray(response.data)) {
        requirementsData = response.data;
      } else if (
        response.requirements &&
        Array.isArray(response.requirements)
      ) {
        requirementsData = response.requirements;
      }

      console.log("Requirements data:", requirementsData);

      // Map API response to local state format
      const mappedRequirements = requirementsData.map(
        (req: Record<string, unknown>) => ({
          id: req.id as string,
          institutionalName: req.institutionalName as string,
          requirements: req.requirements as string[],
          description: req.description as string,
          deadline: req.deadline as string,
          department: req.department as string,
          semester: req.semester as string,
          postedBy: req.postedBy as string,
        })
      );

      // Filter requirements to only show those posted by the current user
      const filteredRequirements = mappedRequirements.filter(
        (req: Requirement) => req.postedBy === user?.id
      );

      console.log("Mapped requirements:", mappedRequirements);
      console.log(
        "Filtered requirements (posted by current user):",
        filteredRequirements
      );
      setRequirements(filteredRequirements);
    } catch (error) {
      console.error("Error fetching requirements:", error);
      message.error("Failed to load requirements.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Fetch requirements on component mount
  useEffect(() => {
    fetchRequirements();
  }, [fetchRequirements]);

  const handleAddRequirement = async () => {
    if (!user) {
      message.error("User not authenticated. Please log in again.");
      return;
    }

    const hasRequiredFields =
      newRequirement.department &&
      newRequirement.semester &&
      normalizedNames.length > 0 &&
      newRequirement.courseCode.trim().length > 0;

    if (!hasRequiredFields) {
      message.warning("Please complete all required fields.");
      return;
    }

    setAddLoading(true);
    try {
      // Call API to create institutional requirement
      const payload = {
        institutionalName: newRequirement.courseCode.trim(),
        requirements: normalizedNames,
        department: newRequirement.department,
        description: newRequirement.description || "",
        semester: newRequirement.semester,
        postedBy: user.id,
      };

      const response = await createInstitutionalRequirement(payload);

      // Extract the requirement ID from the response (handle various response structures)
      const requirementId =
        response?.data?.id ||
        response?.data?._id ||
        response?.id ||
        response?._id ||
        (typeof response === "object" && response !== null && "id" in response
          ? (response as { id: string }).id
          : null) ||
        (typeof response === "object" && response !== null && "_id" in response
          ? (response as { _id: string })._id
          : null);

      if (!requirementId) {
        console.error("Failed to get requirement ID from response:", response);
        message.error("Requirement created but failed to get requirement ID.");
        await fetchRequirements();
        return;
      }

      console.log(
        "✅ Institutional requirement created with ID:",
        requirementId
      );

      // Fetch all enrolled students
      message.loading(
        "Creating student requirements for all enrolled students...",
        0
      );

      try {
        const studentsResponse = await axiosInstance.get(
          `${API_URL}/intigration/getAllStudentComparedByIds`
        );

        // Handle different response structures
        let studentsData: Array<{
          id: string;
          schoolId: string;
          phone: string;
        }> = [];

        if (Array.isArray(studentsResponse.data)) {
          studentsData = studentsResponse.data;
        } else if (
          studentsResponse.data &&
          Array.isArray(studentsResponse.data.data)
        ) {
          studentsData = studentsResponse.data.data;
        } else if (
          studentsResponse.data &&
          Array.isArray(studentsResponse.data.students)
        ) {
          studentsData = studentsResponse.data.students;
        }

        console.log(`📚 Found ${studentsData.length} enrolled students`);

        console.log("student req", studentsData);

        if (studentsData.length > 0) {
          // Create student requirements for all students
          const studentRequirements = studentsData.map((student) => ({
            studentId: student.schoolId,
            coId: user.id,
            requirementId: requirementId,
            signedBy: user.role || "sao",
            status: "incomplete" as const,
          }));

          console.log("Reqqqqqqq", studentRequirements);

          console.log(
            `📝 Creating ${studentRequirements.length} student requirements...`
          );

          const createdRequirements = await createBulkStudentRequirementsIns(
            studentRequirements
          );

          message.destroy();

          if (createdRequirements.length > 0) {
            message.success(
              `Requirement created successfully! Student requirements created for ${createdRequirements.length} students.`
            );
          } else {
            message.warning(
              "Requirement created, but failed to create student requirements."
            );
          }

          //notification
          await addDoc(collection(db, "notifications"), {
            userId: user?.id,
            title: "Requirement Created",
            message: `A new requirement for ${newRequirement?.courseCode} has been added.`,
            isRead: false,
            createdAt: serverTimestamp(),
          });

          const phoneNumbers = studentsData.map((student) => student.phone);

          //sms
          await sendBulkSms(
            phoneNumbers,
            `The ${role} Clearing Officer has posted new institutional requirements for your clearance. Please log in to your student portal to review and complete them as soon as possible.`
          );
        } else {
          message.destroy();
          message.success(
            "Requirement created successfully! No enrolled students found."
          );
        }
      } catch (studentReqError) {
        message.destroy();
        console.error("Error creating student requirements:", studentReqError);
        message.warning(
          "Requirement created successfully, but failed to create student requirements for all students."
        );
      }

      // Refresh the requirements list
      await fetchRequirements();

      // reset
      setNameTags([]);
      setNewRequirement({
        courseCode: "",
        description: "",
        isOptional: false,
        department: "",
        semester: "",
      });
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error creating requirement:", error);
      message.error("Failed to create requirement. Please try again.");
    } finally {
      setAddLoading(false);
      message.destroy();
    }
  };

  const handleDeleteRequirement = (id: string, institutionalName: string) => {
    Modal.confirm({
      title: "Delete Requirement",
      content: `Are you sure you want to delete "${institutionalName}"? This action cannot be undone.`,
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          console.log("Attempting to delete requirement with ID:", id);
          await deleteInstitutionalRequirement(id);
          message.success("Requirement deleted successfully!");

          // Refresh the requirements list
          await fetchRequirements();
        } catch (error: unknown) {
          console.error("Error deleting requirement:", error);
          const errorMessage =
            error && typeof error === "object" && "response" in error
              ? (error.response as { data?: { message?: string } })?.data
                  ?.message || "Failed to delete requirement. Please try again."
              : "Failed to delete requirement. Please try again.";
          message.error(errorMessage);
        }
      },
    });
  };

  const openViewModal = (record: Requirement) => {
    setViewItem(record);
  };

  const openEditModal = (record: Requirement) => {
    setEditItem(record);
    setEditForm({
      courseCode: record.institutionalName,
      department: record.department,
      semester: record.semester,
      names: [...record.requirements],
      description: record.description,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (
      !editForm.courseCode.trim() ||
      !editForm.department ||
      !editForm.semester ||
      (editForm.names || []).filter((n) => n.trim()).length === 0
    ) {
      message.warning("Please complete all required fields in the edit form.");
      return;
    }

    if (!editItem?.id) {
      message.error("Invalid requirement ID.");
      return;
    }

    setUpdateLoading(true);
    try {
      const payload = {
        institutionalName: editForm.courseCode.trim(),
        requirements: editForm.names.map((n) => n.trim()).filter((n) => n),
        department: editForm.department,
        semester: editForm.semester,
        description: editForm.description,
      };

      console.log("Updating requirement with payload:", payload);
      await updateInstitutionalRequirement(editItem.id, payload);
      message.success("Requirement updated successfully!");

      // Refresh the requirements list
      await fetchRequirements();

      setIsEditModalOpen(false);
      setEditItem(null);
    } catch (error: unknown) {
      console.error("Error updating requirement:", error);
      const errorMessage =
        error && typeof error === "object" && "response" in error
          ? (error.response as { data?: { message?: string } })?.data
              ?.message || "Failed to update requirement. Please try again."
          : "Failed to update requirement. Please try again.";
      message.error(errorMessage);
    } finally {
      setUpdateLoading(false);
    }
  };

  const MAX_VISIBLE_TAGS = 3;
  const DESCRIPTION_LIMIT = 120;

  // Check if clearance is not active or if deadline has passed
  const isClearanceInactive =
    !clearanceLoading &&
    (() => {
      if (!clearanceStatus) return true;
      if (!clearanceStatus.isActive) return true;

      // Check if current date has passed the effective deadline
      const effectiveDeadline =
        clearanceStatus.extendedDeadline || clearanceStatus.deadline;
      const now = new Date();
      const deadlineDate = new Date(effectiveDeadline);

      return now > deadlineDate;
    })();

  // Get effective deadline (use extended deadline if available)
  // const effectiveDeadline =
  //   clearanceStatus?.extendedDeadline || clearanceStatus?.deadline;

  // // Function to disable dates outside clearance period
  // const disabledDate = (current: Dayjs) => {
  //   if (!clearanceStatus || !clearanceStatus.isActive) {
  //     // Disable all dates if clearance is not active
  //     return true;
  //   }

  //   const startDate = dayjs(clearanceStatus.startDate);
  //   const endDate = dayjs(effectiveDeadline);

  //   // Disable dates before start date or after deadline
  //   return (
  //     current.isBefore(startDate, "day") || current.isAfter(endDate, "day")
  //   );
  // };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className=" mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-slate-800 bg-clip-text  mb-2">
                Clearance Requirements
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                Manage your institutional clearance requirements
              </p>
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-none h-12 px-8 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              disabled={requirements.length > 0 || isClearanceInactive}
              title={
                isClearanceInactive
                  ? "Clearance period is not active"
                  : requirements.length > 0
                  ? "You have already set a requirement"
                  : "Set a new requirement"
              }
            >
              {isClearanceInactive
                ? "Clearance Period Not Active"
                : requirements.length > 0
                ? "Requirement Already Set"
                : "Create New Requirement"}
            </Button>
          </div>
        </div>

        {/* Show message when clearance is not active */}
        {isClearanceInactive && (
          <Card className="mb-6 border-0 shadow-xl bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
            <div className="p-8 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                    Clearance Period Not Active
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
                    {!clearanceStatus
                      ? "No clearance period has been set up yet."
                      : !clearanceStatus.isActive
                      ? "The clearance period has been stopped by the administrator."
                      : "The clearance deadline has passed."}{" "}
                    You cannot create or modify requirements at this time.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Requirements Card Display */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                Loading requirements...
              </p>
            </div>
          </div>
        ) : requirements.length === 0 ? (
          <Card className="border-0 shadow-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
            <div className="p-12 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <BankOutlined className="text-5xl text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
                No Requirements Set
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
                You haven't created any clearance requirements yet. Click the
                button above to create your first requirement.
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-6">
            {requirements.map((requirement) => (
              <Card
                key={requirement.id}
                className="border-0 shadow-md bg-white dark:bg-gray-800 overflow-hidden hover:shadow-3xl transition-all duration-300"
              >
                {/* Card Header with Gradient */}
                <div className="bg-gradient-to-r rounded-md from-blue-600 via-purple-600 to-pink-600 p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                        <Building className="text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-1">
                          {requirement.institutionalName}
                        </h2>
                        <div className="flex items-center gap-2">
                          <Tag
                            color="blue"
                            className="text-sm font-medium border-0"
                          >
                            {requirement.semester}
                          </Tag>
                        </div>
                      </div>
                    </div>
                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <Tooltip title="View Students">
                        <Button
                          icon={<TeamOutlined />}
                          onClick={() =>
                            navigate(
                              `/clearing-officer/sao/students/${requirement.id}`
                            )
                          }
                          disabled={isClearanceInactive}
                          className="bg-white/20 hover:bg-white/30 border-white/40 text-white backdrop-blur-sm h-10"
                        >
                          Students
                        </Button>
                      </Tooltip>
                      <Tooltip title="View Details">
                        <Button
                          icon={<EyeOutlined />}
                          onClick={() => openViewModal(requirement)}
                          className="bg-white/20 hover:bg-white/30 border-white/40 text-white backdrop-blur-sm h-10"
                        >
                          View
                        </Button>
                      </Tooltip>
                      <Tooltip
                        title={
                          isClearanceInactive
                            ? "Clearance period is not active"
                            : "Edit"
                        }
                      >
                        <Button
                          icon={<EditOutlined />}
                          onClick={() => openEditModal(requirement)}
                          disabled={isClearanceInactive}
                          className="bg-white/20 hover:bg-white/30 border-white/40 text-white backdrop-blur-sm h-10"
                        >
                          Edit
                        </Button>
                      </Tooltip>
                      <Tooltip
                        title={
                          isClearanceInactive
                            ? "Clearance period is not active"
                            : "Delete"
                        }
                      >
                        <Button
                          icon={<DeleteOutlined />}
                          danger
                          onClick={() =>
                            requirement.id &&
                            handleDeleteRequirement(
                              requirement.id,
                              requirement.institutionalName
                            )
                          }
                          disabled={isClearanceInactive}
                          className="h-10"
                        >
                          Delete
                        </Button>
                      </Tooltip>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-2 mb-3">
                          <BankOutlined className="text-blue-500" />
                          Department
                        </label>
                        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <span className="text-gray-800 dark:text-gray-200 font-medium">
                            {requirement.department}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 block">
                          Requirements List
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {requirement.requirements
                            .slice(0, MAX_VISIBLE_TAGS)
                            .map((req, idx) => (
                              <Tag
                                key={idx}
                                color="blue"
                                className="text-sm font-medium px-3 py-1.5 rounded-lg"
                              >
                                {req}
                              </Tag>
                            ))}
                          {requirement.requirements.length >
                            MAX_VISIBLE_TAGS && (
                            <Dropdown
                              menu={{
                                items: requirement.requirements
                                  .slice(MAX_VISIBLE_TAGS)
                                  .map((req, idx) => ({
                                    key: `${idx}`,
                                    label: (
                                      <Tag color="blue" className="mr-2">
                                        {req}
                                      </Tag>
                                    ),
                                  })),
                              }}
                              trigger={["click"]}
                            >
                              <Tag
                                color="blue"
                                className="cursor-pointer text-sm font-medium px-3 py-1.5"
                              >
                                +
                                {requirement.requirements.length -
                                  MAX_VISIBLE_TAGS}{" "}
                                more
                              </Tag>
                            </Dropdown>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 block">
                          Description
                        </label>
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          {requirement.description ? (
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                              {requirement.description.length >
                              DESCRIPTION_LIMIT ? (
                                <>
                                  {ellipsize(
                                    requirement.description,
                                    DESCRIPTION_LIMIT
                                  )}{" "}
                                  <Popover
                                    content={
                                      <div className="max-w-[420px] whitespace-pre-wrap break-words leading-relaxed text-gray-700">
                                        {requirement.description}
                                      </div>
                                    }
                                    title="Full Description"
                                    trigger="click"
                                  >
                                    <Button
                                      type="link"
                                      size="small"
                                      className="p-0"
                                    >
                                      See more
                                    </Button>
                                  </Popover>
                                </>
                              ) : (
                                requirement.description
                              )}
                            </p>
                          ) : (
                            <p className="text-gray-400 dark:text-gray-500 italic">
                              No description provided
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 block">
                          Deadline
                        </label>
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <span className="text-gray-800 dark:text-gray-200 font-medium">
                            {formattedDeadlineDate}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      <Modal
        title={
          <span className="text-xl font-bold">Create New Requirement</span>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleAddRequirement}
        okText="Save Requirement"
        confirmLoading={addLoading}
        width={700}
      >
        <Space direction="vertical" className="w-full" size="large">
          <div>
            <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-300">
              Institutional name
            </label>
            <Input
              value={newRequirement.courseCode}
              onChange={(e) =>
                setNewRequirement({
                  ...newRequirement,
                  courseCode: e.target.value,
                })
              }
              placeholder="Enter Institutional name"
              size="large"
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-300">
              Requirement Names
            </label>
            <Select
              mode="tags"
              value={nameTags}
              onChange={(vals) =>
                setNameTags(
                  (vals as string[]).map((v) => v.trim()).filter((v) => v)
                )
              }
              tokenSeparators={[",", "\n"]}
              placeholder="Type a name and press Enter…"
              className="w-full"
              open={false}
              size="large"
            />
            <div className="mt-2 text-xs text-gray-500">
              Tip: Press Enter, space or type a comma to create a tag. Click the
              "x" to remove.
            </div>
          </div>

          <div>
            <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-300">
              Department
            </label>
            <Select
              className="w-full"
              value={newRequirement.department}
              onChange={(value) =>
                setNewRequirement({ ...newRequirement, department: value })
              }
              placeholder="Select department"
              options={departments.map((d) => ({ label: d, value: d }))}
              size="large"
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-300">
              Semester
            </label>
            <Select
              className="w-full"
              value={newRequirement.semester}
              onChange={(value) =>
                setNewRequirement({ ...newRequirement, semester: value })
              }
              placeholder="Select semester"
              options={semesters.map((s) => ({ label: s, value: s }))}
              size="large"
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-300">
              Description
            </label>
            <TextArea
              rows={4}
              value={newRequirement.description}
              onChange={(e) =>
                setNewRequirement({
                  ...newRequirement,
                  description: e.target.value,
                })
              }
              placeholder="Enter requirement description"
            />
          </div>

          {/* <div>
            <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-300">
              Deadline
            </label>
            <DatePicker
              className="w-full"
              onChange={(date) =>
                setNewRequirement({
                  ...newRequirement,
                  deadline: date?.toDate(),
                })
              }
              disabledDate={disabledDate}
              disabled={isClearanceInactive}
              placeholder={
                isClearanceInactive
                  ? "Clearance period not active"
                  : "Select deadline"
              }
              size="large"
            />
            {clearanceStatus?.isActive && (
              <div className="mt-2 text-xs text-gray-500">
                Date must be between{" "}
                {dayjs(clearanceStatus.startDate).format("MMM D, YYYY")} and{" "}
                {dayjs(
                  clearanceStatus.extendedDeadline || clearanceStatus.deadline
                ).format("MMM D, YYYY")}
              </div>
            )}
          </div> */}
        </Space>
      </Modal>

      {/* View Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <EyeOutlined className="text-white text-xl" />
            </div>
            <span className="text-xl font-bold">Requirement Details</span>
          </div>
        }
        open={!!viewItem}
        onCancel={() => setViewItem(null)}
        footer={[
          <Button
            key="close"
            type="primary"
            onClick={() => setViewItem(null)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 border-none"
          >
            Close
          </Button>,
        ]}
        width={700}
      >
        {viewItem && (
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">
                Institutional Name
              </label>
              <p className="text-xl font-bold text-gray-800 dark:text-white">
                {viewItem.institutionalName}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">
                  Department
                </label>
                <div className="flex items-center gap-2">
                  <BankOutlined className="text-blue-500" />
                  <p className="text-base font-medium text-gray-800 dark:text-white">
                    {viewItem.department}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">
                  Semester
                </label>
                <Tag color="green" className="text-sm font-medium px-3 py-1">
                  {viewItem.semester}
                </Tag>
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-3">
                Requirements List
              </label>
              <Space size={[8, 8]} wrap>
                {viewItem.requirements.map((n, i) => (
                  <Tag
                    key={i}
                    color="blue"
                    className="text-sm font-medium px-3 py-1.5"
                  >
                    {n}
                  </Tag>
                ))}
              </Space>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">
                Description
              </label>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {viewItem.description || (
                  <span className="italic text-gray-400">
                    No description provided
                  </span>
                )}
              </p>
            </div>

            {/* <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">
                Deadline
              </label>
              <p className="text-base font-semibold text-gray-800 dark:text-white">
                {format(
                  typeof viewItem.deadline === "string"
                    ? new Date(viewItem.deadline)
                    : viewItem.deadline,
                  "MMMM dd, yyyy"
                )}
              </p>
            </div> */}
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <EditOutlined className="text-white text-xl" />
            </div>
            <span className="text-xl font-bold">Edit Requirement</span>
          </div>
        }
        open={isEditModalOpen}
        onCancel={() => {
          setIsEditModalOpen(false);
          setEditItem(null);
        }}
        onOk={handleSaveEdit}
        okText="Save Changes"
        confirmLoading={updateLoading}
        width={700}
      >
        <Space direction="vertical" className="w-full" size="large">
          <div>
            <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-300">
              Institutional name
            </label>
            <Input
              value={editForm.courseCode}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, courseCode: e.target.value }))
              }
              placeholder="Enter Institutional name"
              size="large"
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-300">
              Requirement Names
            </label>
            <Select
              mode="tags"
              value={editForm.names}
              onChange={(vals) =>
                setEditForm((prev) => ({
                  ...prev,
                  names: (vals as string[])
                    .map((v) => v.trim())
                    .filter((v) => v),
                }))
              }
              tokenSeparators={[",", "\n", " "]}
              placeholder="Type a name and press Enter…"
              className="w-full"
              open={false}
              size="large"
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-300">
              Department
            </label>
            <Select
              className="w-full"
              value={editForm.department}
              onChange={(value) =>
                setEditForm((prev) => ({ ...prev, department: value }))
              }
              placeholder="Select department"
              options={departments.map((d) => ({ label: d, value: d }))}
              size="large"
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-300">
              Semester
            </label>
            <Select
              className="w-full"
              value={editForm.semester}
              onChange={(value) =>
                setEditForm((prev) => ({ ...prev, semester: value }))
              }
              placeholder="Select semester"
              options={semesters.map((s) => ({ label: s, value: s }))}
              size="large"
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-300">
              Description
            </label>
            <TextArea
              rows={4}
              value={editForm.description}
              onChange={(e) =>
                setEditForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Enter requirement description"
            />
          </div>

          {/* <div>
            <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-300">
              Deadline
            </label>
            <DatePicker
              className="w-full"
              value={editForm.deadline ? dayjs(editForm.deadline) : undefined}
              onChange={(date: Dayjs | null) =>
                setEditForm((prev) => ({
                  ...prev,
                  deadline: date ? date.toDate() : undefined,
                }))
              }
              disabledDate={disabledDate}
              disabled={isClearanceInactive}
              placeholder={
                isClearanceInactive
                  ? "Clearance period not active"
                  : "Select deadline"
              }
              size="large"
            />
            {clearanceStatus?.isActive && (
              <div className="mt-2 text-xs text-gray-500">
                Date must be between{" "}
                {dayjs(clearanceStatus.startDate).format("MMM D, YYYY")} and{" "}
                {dayjs(
                  clearanceStatus.extendedDeadline || clearanceStatus.deadline
                ).format("MMM D, YYYY")}
              </div>
            )}
          </div> */}
        </Space>
      </Modal>
    </div>
  );
};

export default Requirements;
