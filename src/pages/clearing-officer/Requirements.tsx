import { useState } from "react";
import {
  Card,
  Button,
  Input,
  Select,
  Table,
  Modal,
  DatePicker,
  Checkbox,
  Space,
} from "antd";
import {
  PlusOutlined,
  FileTextOutlined,
  DeleteOutlined,
  BankOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { format } from "date-fns";

interface Requirement {
  id: number;
  name: string;
  description: string;
  deadline: Date;
  isOptional: boolean;
  department: string;
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

const Requirements = () => {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRequirement, setNewRequirement] = useState<Partial<Requirement>>({
    name: "",
    description: "",
    isOptional: false,
    department: "",
  });

  const handleAddRequirement = () => {
    if (
      newRequirement.name &&
      newRequirement.deadline &&
      newRequirement.department
    ) {
      setRequirements([
        ...requirements,
        {
          id: Date.now(),
          name: newRequirement.name,
          description: newRequirement.description || "",
          deadline: newRequirement.deadline,
          isOptional: newRequirement.isOptional || false,
          department: newRequirement.department,
        },
      ]);
      setNewRequirement({
        name: "",
        description: "",
        isOptional: false,
        department: "",
      });
      setIsModalOpen(false);
    }
  };

  const handleDeleteRequirement = (id: number) => {
    setRequirements(requirements.filter((req) => req.id !== id));
  };

  const columns = [
    {
      title: <span className="font-semibold">Requirement</span>,
      dataIndex: "name",
      key: "name",
      render: (name: string) => (
        <span className="font-medium text-gray-800 dark:text-white">
          {name}
        </span>
      ),
    },
    {
      title: <span className="font-semibold">Department</span>,
      dataIndex: "department",
      key: "department",
      render: (department: string) => (
        <div className="flex items-center">
          <BankOutlined className="text-blue-500 mr-2" />
          <span className="text-gray-700 dark:text-gray-300">{department}</span>
        </div>
      ),
    },
    {
      title: <span className="font-semibold">Description</span>,
      dataIndex: "description",
      key: "description",
      render: (description: string) => (
        <span className="text-gray-600 dark:text-gray-400">
          {description || "No description"}
        </span>
      ),
    },
    {
      title: <span className="font-semibold">Deadline</span>,
      dataIndex: "deadline",
      key: "deadline",
      render: (deadline: Date) => (
        <div className="flex items-center">
          <CalendarOutlined className="text-blue-500 mr-2" />
          <span className="text-gray-700 dark:text-gray-300">
            {format(deadline, "MMM dd, yyyy")}
          </span>
        </div>
      ),
    },
    {
      title: <span className="font-semibold">Type</span>,
      dataIndex: "isOptional",
      key: "isOptional",
      render: (isOptional: boolean) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isOptional
              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
          }`}
        >
          {isOptional ? "Optional" : "Mandatory"}
        </span>
      ),
    },
    {
      title: <span className="font-semibold">Actions</span>,
      key: "actions",
      render: (_: unknown, record: Requirement) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteRequirement(record.id)}
          className="hover:bg-red-50 dark:hover:bg-red-900/20"
        />
      ),
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Clearance Requirements
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage department clearance requirements
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            type="default"
            icon={<FileTextOutlined />}
            className="bg-white dark:bg-gray-800"
          >
            Export Requirements
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Add New Requirement
          </Button>
        </div>
      </div>

      <Modal
        title="Add New Requirement"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleAddRequirement}
        okText="Add Requirement"
      >
        <Space direction="vertical" className="w-full">
          <div>
            <label className="block mb-2">Requirement Name</label>
            <Input
              value={newRequirement.name}
              onChange={(e) =>
                setNewRequirement({
                  ...newRequirement,
                  name: e.target.value,
                })
              }
              placeholder="Enter requirement name"
            />
          </div>
          <div>
            <label className="block mb-2">Department</label>
            <Select
              className="w-full"
              value={newRequirement.department}
              onChange={(value) =>
                setNewRequirement({ ...newRequirement, department: value })
              }
              placeholder="Select department"
            >
              {departments.map((dept) => (
                <Select.Option key={dept} value={dept}>
                  <Space>
                    <BankOutlined className="text-blue-500" />
                    {dept}
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block mb-2">Description</label>
            <Input
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
          <div>
            <label className="block mb-2">Deadline</label>
            <DatePicker
              className="w-full"
              onChange={(date) =>
                setNewRequirement({
                  ...newRequirement,
                  deadline: date?.toDate(),
                })
              }
            />
          </div>
          <div>
            <Checkbox
              checked={newRequirement.isOptional}
              onChange={(e) =>
                setNewRequirement({
                  ...newRequirement,
                  isOptional: e.target.checked,
                })
              }
            >
              Optional Requirement
            </Checkbox>
          </div>
        </Space>
      </Modal>

      <Card className="shadow-lg border border-gray-200 dark:border-gray-700">
        <Table
          columns={columns}
          dataSource={requirements}
          rowKey="id"
          className="rounded-lg overflow-hidden"
          rowClassName="hover:bg-gray-50 dark:hover:bg-gray-800/50"
        />
      </Card>
    </div>
  );
};

export default Requirements;
