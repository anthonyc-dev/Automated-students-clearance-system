import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Search, FolderOpen } from "lucide-react";

import ReqDialogForm from "./_components/ReqDialogForm";
import RequirementCard from "./_components/RequirementCard";

import { useSelector, useDispatch } from "react-redux";
import { type RootState, type AppDispatch } from "@/store";
import {
  setSearch,
  setSelectedCategory,
  setIsDialogOpen,
  // addRequirement,
  setNewRequirement,
} from "@/store/slices/clearingOfficer/clearanceSlice";

// interface Course {
//   title: string;
//   description: string;
//   dueDate: string;
//   completed: boolean;
//   students: number;
//   department: string;
// }

// const requirements: Course[] = [
//   {
//     title: "CC107",
//     description: "Advanced topics in data structures and algorithms. ",
//     dueDate: "May 15, 2025",
//     completed: true,
//     students: 45,
//     department: "BS-Computer Science",
//   },
//   {
//     title: "SE102 ",
//     description: "Principles of software design and architecture.",
//     dueDate: "April 28, 2025",
//     completed: false,
//     students: 38,
//     department: "BS-Education",
//   },
//   {
//     title: "IS301",
//     description: "In-depth study of database management systems.",
//     dueDate: "June 5, 2025",
//     completed: false,
//     students: 52,
//     department: "BS-Administration",
//   },
//   {
//     title: "CS404 ",
//     description: "Exploring the fundamentals of AI and machine learning.",
//     dueDate: "May 20, 2025",
//     completed: true,
//     students: 30,
//     department: "BS-Accounting",
//   },
// ];

const Clearance = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    search,
    selectedCategory,
    isDialogOpen,
    newRequirement,
    requirements,
  } = useSelector((state: RootState) => state.clearance);

  const categories = [
    "all",
    "BS-Computer Science",
    "BS-Education",
    "BS-Administration",
    "BS-Accounting",
  ];

  const filteredRequirements = requirements.filter(
    (req) =>
      (req.title.toLowerCase().includes(search.toLowerCase()) ||
        req.description.toLowerCase().includes(search.toLowerCase())) &&
      (selectedCategory === "all" || req.department === selectedCategory)
  );

  const handleCreateRequirement = () => {
    // Handle form submission logic here
    console.log("Creating requirement:", newRequirement);
    dispatch(setIsDialogOpen(false));
    // Reset form
    dispatch(
      setNewRequirement({
        title: "",
        description: "",
        dueDate: "",
        department: "",
        requirements: [],
      })
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Clearance</h1>
              <p className="text-gray-500 mt-1">
                Manage and track all available requirements.
              </p>
            </div>
          </div>
          <ReqDialogForm
            isDialogOpen={isDialogOpen}
            setIsDialogOpen={(value) => dispatch(setIsDialogOpen(value))}
            newRequirement={newRequirement}
            setNewRequirement={(value) => dispatch(setNewRequirement(value))}
            handleCreateRequirement={handleCreateRequirement}
            categories={categories}
          />
        </header>

        <Card className="flex flex-col sm:flex-row items-center gap-4 px-5 shadow-gray-100">
          <div className="relative flex-1 w-full sm:w-auto ">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search"
              value={search}
              onChange={(e) => dispatch(setSearch(e.target.value))}
              className="pl-10 w-full  md:w-[200px] lg:w-[300px]"
            />
          </div>
          <Select
            value={selectedCategory}
            onValueChange={(value) => dispatch(setSelectedCategory(value))}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>

        {filteredRequirements.length === 0 ? (
          <div className="text-center py-16">
            <FolderOpen className="mx-auto h-16 w-16 text-gray-400" />
            <h2 className="mt-4 text-xl font-semibold text-gray-700">
              No Requirements Found
            </h2>
            <p className="mt-2 text-gray-500">
              Adjust your search or filter to find what you are looking for.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-5">
            {filteredRequirements.map((req, index) => (
              <RequirementCard
                index={index}
                title={req.title}
                department={req.department}
                completed={req.completed}
                description={req.description}
                dueDate={req.dueDate}
                students={req.students}
                requirements={req.requirements}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Clearance;
