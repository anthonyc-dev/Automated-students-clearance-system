import { Modal, Descriptions, Tag, Divider, List, Badge, Grid } from "antd";
import {
  BookOutlined,
  TeamOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

import type { RequirementData } from "./RequirementsTable";

const { useBreakpoint } = Grid;

interface ViewRequirementsModalProps {
  visible: boolean;
  requirement: RequirementData | null;
  onClose: () => void;
}

const ViewRequirementsModal: React.FC<ViewRequirementsModalProps> = ({
  visible,
  requirement,
  onClose,
}) => {
  const screens = useBreakpoint();
  if (!requirement) return null;

  // const isOverdue = new Date(requirement.dueDate) < new Date();
  // const formattedDueDate = format(
  //   new Date(requirement.dueDate),
  //   "MMMM dd, yyyy"
  // );

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-base sm:text-lg">
          <FileTextOutlined className="text-blue-500" />
          <span>Requirement Details</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      centered
      width={screens.xs ? "90%" : screens.sm ? 600 : 800}
      styles={{
        body: {
          maxHeight: "70vh",
          overflowY: "auto",
          padding: screens.xs ? "12px" : "20px",
        },
      }}
    >
      <div className="space-y-4 text-sm sm:text-base">
        {/* Course Information */}
        <div>
          <Divider orientation="left" className="text-sm font-semibold">
            <BookOutlined className="mr-2" />
            Course Information
          </Divider>
          <Descriptions bordered size="small" column={screens.xs ? 1 : 2}>
            <Descriptions.Item label="Course Code">
              <Tag color="blue">{requirement.courseCode}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Course Name">
              <span className="font-medium">{requirement.courseName}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Year Level">
              <Tag color="green">{requirement.yearLevel}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Semester">
              <Tag color="purple">{requirement.semester}</Tag>
            </Descriptions.Item>
          </Descriptions>
        </div>

        {/* Description */}
        {requirement.description && (
          <div>
            <Divider orientation="left" className="text-sm font-semibold">
              <FileTextOutlined className="mr-2" />
              Description
            </Divider>
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
              <p className="text-gray-700 leading-relaxed text-justify">
                {requirement.description}
              </p>
            </div>
          </div>
        )}

        {/* Requirements List */}
        <div>
          <Divider orientation="left" className="text-sm font-semibold">
            <FileTextOutlined className="mr-2" />
            Requirements
            <Badge
              count={requirement.requirements?.length || 0}
              className="ml-3"
              showZero
              style={{ backgroundColor: "#52c41a" }}
            />
          </Divider>
          {requirement.requirements && requirement.requirements.length > 0 ? (
            <List
              size="small"
              bordered
              dataSource={requirement.requirements}
              renderItem={(item, index) => (
                <List.Item className="hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-2 w-full text-sm sm:text-base">
                    <span className="text-orange-500 mt-1">{index + 1}.</span>
                    <span className="flex-1 text-gray-700">{item}</span>
                  </div>
                </List.Item>
              )}
              className="bg-white"
            />
          ) : (
            <div className="text-center py-6 text-gray-400 text-sm">
              No requirements specified
            </div>
          )}
        </div>

        {/* Status & Metrics */}
        <div>
          <Divider orientation="left" className="text-sm font-semibold">
            <CheckCircleOutlined className="mr-2" />
            Status & Metrics
          </Divider>
          <Descriptions bordered size="small" column={screens.xs ? 1 : 2}>
            <Descriptions.Item
              label={
                <span>
                  <TeamOutlined className="mr-2" />
                  Students
                </span>
              }
            >
              <Badge
                count={requirement.students || 0}
                showZero
                style={{ backgroundColor: "#1890ff" }}
              />
            </Descriptions.Item>
          </Descriptions>
        </div>
      </div>
    </Modal>
  );
};

export default ViewRequirementsModal;
