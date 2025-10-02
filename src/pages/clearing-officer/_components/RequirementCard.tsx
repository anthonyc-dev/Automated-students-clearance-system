import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ClipboardList,
  Users,
  Calendar,
  Trash2,
  Edit,
  Check,
  CircleAlert,
} from "lucide-react";
import { Link } from "react-router-dom";

interface RequirementsCardProps {
  index: number;
  title: string;
  department: string;
  completed: boolean;
  description: string;
  dueDate: string;
  students: number;
  requirements: string[];
}

const RequirementCard: React.FC<RequirementsCardProps> = ({
  index,
  title,
  department,
  completed,
  description,
  dueDate,
  students,
  requirements,
}) => {
  return (
    <div className="h-full">
      <Card
        key={index}
        className="flex flex-col h-full hover:shadow-lg transition-shadow duration-300"
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <ClipboardList className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-slate-700">
                  {title}
                </CardTitle>
                <CardDescription>{department}</CardDescription>
              </div>
            </div>
            <Badge
              variant={completed ? "default" : "secondary"}
              className={
                completed
                  ? "bg-green-100 border border-green-300 text-green-600"
                  : "bg-yellow-100 border border-yellow-300 text-yellow-600"
              }
            >
              {completed ? "Completed" : "In Progress"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1">
          {requirements.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600 font-medium mb-1">
                <ClipboardList className="h-4 w-4 mr-2" />
                <span>Requirements</span>
              </div>
              {requirements.map((requirement) => (
                <div
                  key={requirement}
                  className="flex items-center text-sm text-gray-500"
                >
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  <span>{requirement}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2 text-gray-500 text-sm mt-4">
            <CircleAlert className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
            <p className="flex-1">{description}</p>
          </div>
          <div className="flex items-center text-sm text-gray-500 mt-4">
            <Calendar className="h-4 w-4 mr-2" />
            <span>Due: {dueDate}</span>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Users className="h-4 w-4 mr-2" />
            <span>{students} students enrolled</span>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2 items-center">
          <Link to="/clearing-officer/student-records" className="flex-1">
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              View Records
            </Button>
          </Link>
          <Link to="">
            <Button size="icon" className=" bg-blue-100 hover:bg-blue-300">
              <Edit className="h-4 w-4 text-blue-600" />
            </Button>
          </Link>
          <Link to="">
            <Button size="icon" className="  bg-red-100 hover:bg-red-300">
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default RequirementCard;
