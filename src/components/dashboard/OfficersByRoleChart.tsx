import { Card } from "antd";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface OfficersByRoleChartProps {
  data: {
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

const COLORS = [
  "#1890ff", // blue - clearing officer
  "#52c41a", // green - sao
  "#722ed1", // purple - registrar
  "#fa8c16", // orange - admin
  "#eb2f96", // pink - guidance
  "#13c2c2", // cyan - dean
  "#faad14", // gold - library
  "#2f54eb", // geekblue - laboratory
  "#f5222d", // red - cashier
  "#a0d911", // lime - tailoring
];

const ROLE_LABELS = {
  clearingOfficer: "Clearing Officers",
  sao: "SAO",
  registrar: "Registrars",
  admin: "Admins",
  guidance: "Guidance",
  dean: "Dean",
  library: "Library",
  laboratory: "Laboratory",
  cashier: "Cashier",
  tailoring: "Tailoring",
};

const OfficersByRoleChart = ({ data }: OfficersByRoleChartProps) => {
  // Transform data for recharts
  const chartData = Object.entries(data)
    .map(([role, count]) => ({
      name: ROLE_LABELS[role as keyof typeof ROLE_LABELS],
      value: count,
    }))
    .filter((item) => item.value > 0); // Only show roles with officers

  return (
    <Card title="Clearing Officers by Role" style={{ height: "100%" }}>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) =>
              `${name}: ${(percent * 100).toFixed(0)}%`
            }
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((_entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default OfficersByRoleChart;
