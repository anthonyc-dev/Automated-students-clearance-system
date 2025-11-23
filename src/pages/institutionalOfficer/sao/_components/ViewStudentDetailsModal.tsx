import { useState, useEffect } from "react";
import { Modal, Descriptions, Divider, Badge, Grid, Spin } from "antd";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  BookOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { getStudentRequirementsBySchoolId } from "@/services/studentRequirementService";
import { getStudentRequirementsByStudentIdIns } from "@/services/studentReqInstitutionalService";
import {
  getCurrentClearance,
  type ClearanceStatus,
} from "@/services/clearanceService";
import { checkStudentPermit } from "@/services/permitService";
import type { Student } from "../studentsList";

const { useBreakpoint } = Grid;

interface ViewStudentDetailsModalProps {
  visible: boolean;
  student: Student | null;
  onClose: () => void;
}

interface ClearanceItem {
  id: string;
  department: string;
  courseCode?: string;
  instructor?: string;
  status: "Cleared" | "Signed" | "Incomplete" | "Missing";
  requirements: string;
  description?: string;
  clearedBy: string;
  clearedAt: string;
}

const ViewStudentDetailsModal: React.FC<ViewStudentDetailsModalProps> = ({
  visible,
  student,
  onClose,
}) => {
  const screens = useBreakpoint();
  const [loading, setLoading] = useState(false);
  const [deptClearance, setDeptClearance] = useState<ClearanceItem[]>([]);
  const [instClearance, setInstClearance] = useState<ClearanceItem[]>([]);
  const [clearanceInfo, setClearanceInfo] = useState<ClearanceStatus | null>(
    null
  );
  const [hasPermit, setHasPermit] = useState(false);

  useEffect(() => {
    const fetchClearanceData = async () => {
      if (!student || !visible) return;

      try {
        setLoading(true);

        // Fetch current clearance info
        try {
          const currentClearance = await getCurrentClearance();
          setClearanceInfo(currentClearance);
        } catch (error) {
          console.warn("Could not fetch clearance info:", error);
        }

        // Fetch department clearance
        try {
          const deptReqs = await getStudentRequirementsBySchoolId(
            student.schoolId
          );
          const transformed = deptReqs.map((req: any) => {
            const requirement = req.officerRequirement || req.requirement;
            return {
              id: req._id || req.id || "",
              department: requirement?.department || "Unknown Department",
              courseCode:
                requirement?.courseCode || requirement?.courseName || "",
              instructor: req.clearingOfficer
                ? `${req.clearingOfficer.firstName} ${req.clearingOfficer.lastName}`
                : "-",
              status:
                req.status === "signed"
                  ? "Signed"
                  : req.status === "incomplete"
                  ? "Incomplete"
                  : "Missing",
              requirements:
                requirement?.requirements?.join(", ") || "No requirements",
              description: requirement?.description || "",
              clearedBy: req.clearingOfficer
                ? `${req.clearingOfficer.firstName} ${req.clearingOfficer.lastName}`
                : "-",
              clearedAt: req.updatedAt
                ? new Date(req.updatedAt).toLocaleDateString()
                : "-",
            } as ClearanceItem;
          });
          setDeptClearance(transformed);
        } catch (error) {
          console.warn("Could not fetch department clearance:", error);
          setDeptClearance([]);
        }

        // Fetch institutional clearance
        try {
          const instReqs = await getStudentRequirementsByStudentIdIns(
            student.schoolId
          );
          const transformed = instReqs.map((req: any) => {
            const requirement =
              req.institutionalRequirement ||
              req.officerRequirement ||
              req.requirement;
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
              status:
                req.status === "signed"
                  ? "Signed"
                  : req.status === "incomplete"
                  ? "Incomplete"
                  : "Missing",
              requirements:
                requirement?.requirements?.join(", ") || "No requirements",
              description: requirement?.description || "",
              clearedBy: req.clearingOfficer
                ? `${req.clearingOfficer.firstName} ${req.clearingOfficer.lastName}`
                : "-",
              clearedAt: req.updatedAt
                ? new Date(req.updatedAt).toLocaleDateString()
                : "-",
            } as ClearanceItem;
          });
          setInstClearance(transformed);
        } catch (error) {
          console.warn("Could not fetch institutional clearance:", error);
          setInstClearance([]);
        }

        // Check for permit
        try {
          const permitData = await checkStudentPermit(student.schoolId);
          setHasPermit(permitData !== null);
        } catch (error) {
          console.warn("Could not check permit status:", error);
          setHasPermit(false);
        }
      } catch (error) {
        console.error("Error fetching clearance data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClearanceData();
  }, [student, visible]);

  if (!student) return null;

  const schoolYear = clearanceInfo
    ? `${clearanceInfo.academicYear} ${clearanceInfo.semesterType}`
    : "N/A";

  const allClearances = [...deptClearance, ...instClearance];
  const hasIncomplete = allClearances.some(
    (item) => item.status !== "Signed" && item.status !== "Cleared"
  );
  const overallStatus =
    allClearances.length === 0
      ? "No Requirements"
      : hasIncomplete
      ? "Incomplete"
      : "Complete";

  const getStatusTag = (status: ClearanceItem["status"]) => {
    switch (status) {
      case "Cleared":
        return (
          <Badge
            status="processing"
            text="Cleared"
            style={{ color: "#1890ff" }}
          />
        );
      case "Signed":
        return (
          <Badge status="success" text="Signed" style={{ color: "#52c41a" }} />
        );
      case "Incomplete":
        return (
          <Badge
            status="warning"
            text="Incomplete"
            style={{ color: "#faad14" }}
          />
        );
      case "Missing":
        return (
          <Badge status="error" text="Missing" style={{ color: "#ff4d4f" }} />
        );
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-base sm:text-lg">
          <UserOutlined className="text-blue-500" />
          <span>Student Clearance Details</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      centered
      width={screens.xs ? "95%" : screens.md ? 800 : 1000}
      styles={{
        body: {
          maxHeight: "80vh",
          overflowY: "auto",
          padding: screens.xs ? "12px" : "20px",
        },
      }}
    >
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spin size="large" />
        </div>
      ) : (
        <div className="space-y-4 text-sm sm:text-base">
          {/* Student Information */}
          <div>
            <Divider orientation="left" className="text-sm font-semibold">
              <UserOutlined className="mr-2" />
              Student Information
            </Divider>
            <Descriptions bordered size="small" column={screens.xs ? 1 : 2}>
              <Descriptions.Item label="Student ID">
                <span className="font-medium">{student.schoolId}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Name">
                <span className="font-medium">
                  {student.firstName} {student.lastName}
                </span>
              </Descriptions.Item>
              <Descriptions.Item
                label={
                  <>
                    <MailOutlined className="mr-1" />
                    Email
                  </>
                }
              >
                {student.email}
              </Descriptions.Item>
              <Descriptions.Item
                label={
                  <>
                    <PhoneOutlined className="mr-1" />
                    Phone
                  </>
                }
              >
                {student.phone}
              </Descriptions.Item>
              <Descriptions.Item
                label={
                  <>
                    <BookOutlined className="mr-1" />
                    Department
                  </>
                }
              >
                {student.department}
              </Descriptions.Item>
              <Descriptions.Item
                label={
                  <>
                    <CalendarOutlined className="mr-1" />
                    Year Level
                  </>
                }
              >
                {student.yearLevel}
              </Descriptions.Item>
              <Descriptions.Item label="School Year" span={screens.xs ? 1 : 2}>
                <span className="font-medium">{schoolYear}</span>
              </Descriptions.Item>
            </Descriptions>
          </div>

          {/* Overall Status */}
          <div>
            <Divider orientation="left" className="text-sm font-semibold">
              <CheckCircleOutlined className="mr-2" />
              Overall Clearance Status
            </Divider>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium">Status:</span>
                <span
                  className={`text-lg font-semibold ${
                    overallStatus === "Complete"
                      ? "text-green-600"
                      : overallStatus === "Incomplete"
                      ? "text-yellow-600"
                      : "text-gray-600"
                  }`}
                >
                  {overallStatus === "Complete" && (
                    <CheckCircleOutlined className="mr-2" />
                  )}
                  {overallStatus === "Incomplete" && (
                    <ExclamationCircleOutlined className="mr-2" />
                  )}
                  {overallStatus}
                </span>
              </div>
              {hasPermit && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                  <span className="text-blue-700 font-medium">
                    <CheckCircleOutlined className="mr-2" />
                    Student has an active exam permit
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Department Clearance */}
          <div>
            <Divider orientation="left" className="text-sm font-semibold">
              <FileTextOutlined className="mr-2" />
              Department Clearance
              <Badge
                count={deptClearance.length}
                className="ml-3"
                showZero
                style={{ backgroundColor: "#1890ff" }}
              />
            </Divider>
            {deptClearance.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm bg-gray-50 rounded">
                No department clearance requirements found
              </div>
            ) : (
              <div className="space-y-3">
                {deptClearance.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="font-medium text-blue-600">
                          {item.courseCode}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.department}
                        </div>
                      </div>
                      {getStatusTag(item.status)}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Requirements:</span>{" "}
                      {item.requirements}
                    </div>
                    {item.description && (
                      <div className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Description:</span>{" "}
                        {item.description}
                      </div>
                    )}
                    {item.clearedBy !== "-" && (
                      <div className="text-xs text-gray-500">
                        Cleared by: {item.clearedBy} on {item.clearedAt}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Institutional Clearance */}
          <div>
            <Divider orientation="left" className="text-sm font-semibold">
              <FileTextOutlined className="mr-2" />
              Institutional Clearance
              <Badge
                count={instClearance.length}
                className="ml-3"
                showZero
                style={{ backgroundColor: "#52c41a" }}
              />
            </Divider>
            {instClearance.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm bg-gray-50 rounded">
                No institutional clearance requirements found
              </div>
            ) : (
              <div className="space-y-3">
                {instClearance.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="font-medium text-green-600">
                          {item.courseCode}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.department}
                        </div>
                      </div>
                      {getStatusTag(item.status)}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Requirements:</span>{" "}
                      {item.requirements}
                    </div>
                    {item.description && (
                      <div className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Description:</span>{" "}
                        {item.description}
                      </div>
                    )}
                    {item.clearedBy !== "-" && (
                      <div className="text-xs text-gray-500">
                        Cleared by: {item.clearedBy} on {item.clearedAt}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ViewStudentDetailsModal;
