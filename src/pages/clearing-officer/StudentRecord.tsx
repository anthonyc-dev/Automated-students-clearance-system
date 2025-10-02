import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Mail,
  CheckCircle,
  Undo,
  Phone,
  User,
  Book,
  PackageX,
  ChevronLeft,
  XCircle,
  Clock,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { useSelector, useDispatch } from "react-redux";
import { type RootState, type AppDispatch } from "@/store";
import {
  setSearch,
  setSelectedStatus,
  setSelectedStudents,
  setCurrentPage,
  setConfirmDialog,
  updateStudentStatus,
  toggleStudentStatus,
  // Student,
} from "@/store/slices/clearingOfficer/studentSlice";

// interface Student {
//   id: number;
//   id_no: string;
//   name: string;
//   email: string;
//   cp_no: string;
//   profilePic: string;
//   status: "Signed" | "Incomplete" | "Missing";
// }

// interface ConfirmDialog {
//   isOpen: boolean;
//   type: "single" | "multiple";
//   studentId?: number;
//   studentName?: string;
//   onConfirm?: () => void;
// }

// const students: Student[] = [
//   {
//     id: 1,
//     id_no: "24-0334",
//     name: "John Doe",
//     email: "johndoe@example.com",
//     cp_no: "09123456789",
//     profilePic: "https://randomuser.me/api/portraits/men/1.jpg",
//     status: "Signed",
//   },
//   {
//     id: 2,
//     id_no: "20-0842",
//     name: "Jane Smith",
//     email: "janesmith@example.com",
//     cp_no: "09123456789",
//     profilePic: "https://randomuser.me/api/portraits/women/2.jpg",
//     status: "Incomplete",
//   },
//   {
//     id: 3,
//     id_no: "24-0334",
//     name: "Alice Johnson",
//     email: "alicejohnson@example.com",
//     cp_no: "09123456789",
//     profilePic: "https://randomuser.me/api/portraits/women/3.jpg",
//     status: "Signed",
//   },
//   {
//     id: 4,
//     id_no: "24-0334",
//     name: "Bob Brown",
//     email: "bobbrown@example.com",
//     cp_no: "09123456789",
//     profilePic: "https://randomuser.me/api/portraits/men/4.jpg",
//     status: "Missing",
//   },
//   {
//     id: 5,
//     id_no: "24-0334",
//     name: "Jane Smith",
//     email: "janesmith@example.com",
//     cp_no: "09123456789",
//     profilePic: "https://randomuser.me/api/portraits/women/2.jpg",
//     status: "Signed",
//   },
//   {
//     id: 6,
//     id_no: "24-0334",
//     name: "Alice Johnson",
//     email: "alicejohnson@example.com",
//     cp_no: "09123456789",
//     profilePic: "https://randomuser.me/api/portraits/women/3.jpg",
//     status: "Signed",
//   },
//   {
//     id: 7,
//     id_no: "24-0334",
//     name: "Bob Brown",
//     email: "bobbrown@example.com",
//     cp_no: "09123456789",
//     profilePic: "https://randomuser.me/api/portraits/men/4.jpg",
//     status: "Incomplete",
//   },
//   {
//     id: 8,
//     id_no: "24-0334",
//     name: "Jane Smith",
//     email: "janesmith@example.com",
//     cp_no: "09123456789",
//     profilePic: "https://randomuser.me/api/portraits/women/2.jpg",
//     status: "Missing",
//   },
//   {
//     id: 9,
//     id_no: "21-0882",
//     name: "Alice Johnson",
//     email: "alicejohnson@example.com",
//     cp_no: "09123456789",
//     profilePic: "https://randomuser.me/api/portraits/women/3.jpg",
//     status: "Signed",
//   },
//   {
//     id: 10,
//     id_no: "24-0334",
//     name: "Bob Brown",
//     email: "bobbrown@example.com",
//     cp_no: "09123456789",
//     profilePic: "https://randomuser.me/api/portraits/men/4.jpg",
//     status: "Missing",
//   },
//   {
//     id: 11,
//     id_no: "24-0334",
//     name: "Bob Brown",
//     email: "bobbrown@example.com",
//     cp_no: "09123456789",
//     profilePic: "https://randomuser.me/api/portraits/men/4.jpg",
//     status: "Missing",
//   },
// ];

const StudentRecord: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    search,
    selectedStatus,
    selectedStudents,
    currentPage,
    studentList,
    confirmDialog,
  } = useSelector((state: RootState) => state.student);

  const statuses = ["all", "Signed", "Incomplete", "Missing"];
  const studentsPerPage = 10;

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
  }, [filteredStudents, currentPage]);

  const handleSelectAll = (checked: boolean) => {
    dispatch(
      setSelectedStudents(checked ? filteredStudents.map((s) => s.id) : [])
    );
  };

  const handleSelectStudent = (studentId: number, checked: boolean) => {
    dispatch(
      setSelectedStudents(
        checked
          ? [...selectedStudents, studentId]
          : selectedStudents.filter((id) => id !== studentId)
      )
    );
  };

  const handleSignSelected = () => {
    dispatch(
      updateStudentStatus({ studentIds: selectedStudents, status: "Signed" })
    );
  };

  const handleUndoSelected = () => {
    dispatch(
      setConfirmDialog({
        isOpen: true,
        type: "multiple",
        onConfirm: () => {
          dispatch(
            updateStudentStatus({
              studentIds: selectedStudents,
              status: "Incomplete",
            })
          );
          dispatch(setConfirmDialog({ isOpen: false, type: "multiple" }));
        },
      })
    );
  };

  const handleSignToggle = (studentId: number) => {
    const student = studentList.find((s) => s.id === studentId);
    if (student?.status === "Signed") {
      dispatch(
        setConfirmDialog({
          isOpen: true,
          type: "single",
          studentId,
          studentName: student.name,
          onConfirm: () => {
            dispatch(toggleStudentStatus(studentId));
            dispatch(setConfirmDialog({ isOpen: false, type: "single" }));
          },
        })
      );
    } else {
      dispatch(toggleStudentStatus(studentId));
    }
  };

  const handleDialogCancel = () => {
    dispatch(setConfirmDialog({ ...confirmDialog, isOpen: false }));
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
            onClick={() => window.history.back()}
          />
          <h1 className="text-3xl font-bold text-slate-800">Student Records</h1>
        </div>
        <div className="flex items-center gap-2 text-md text-muted-foreground">
          <Book className="w-5 h-5 text-primary" />
          <span>Department of Computer Science</span>
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
                  onChange={(e) => dispatch(setSearch(e.target.value))}
                  className="pl-8 w-full sm:w-[250px]"
                />
              </div>
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground ml-5">
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
              <Select
                value={selectedStatus}
                onValueChange={(value) => dispatch(setSelectedStatus(value))}
              >
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
          {selectedStudents.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
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
          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="w-[50px]">
                    <TooltipDemo isSelected={isAllSelected}>
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                      />
                    </TooltipDemo>
                  </TableHead>
                  <TableHead className="font-semibold">Student</TableHead>
                  <TableHead className="hidden md:table-cell font-semibold">
                    ID Number
                  </TableHead>
                  <TableHead className="hidden lg:table-cell font-semibold">
                    Email
                  </TableHead>
                  <TableHead className="hidden md:table-cell font-semibold">
                    Phone
                  </TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedStudents.length > 0 ? (
                  paginatedStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedStudents.includes(student.id)}
                          onCheckedChange={(checked) =>
                            handleSelectStudent(student.id, !!checked)
                          }
                          aria-label={`Select ${student.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage
                              src={student.profilePic}
                              alt={student.name}
                            />
                            <AvatarFallback>
                              {student.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{student.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          {student.id_no}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          {student.email}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          {student.cp_no}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${
                            student.status === "Signed"
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
                        <div className="flex  items-center gap-2">
                          <Button
                            variant={
                              student.status === "Signed"
                                ? "destructive"
                                : "success"
                            }
                            size="sm"
                            onClick={() => handleSignToggle(student.id)}
                          >
                            {student.status === "Signed" ? (
                              <Undo className="w-4 h-4 mr-2" />
                            ) : (
                              <CheckCircle className="w-4 h-4 mr-2" />
                            )}
                            {student.status === "Signed" ? "Undo" : "Sign"}
                          </Button>
                          <Link to="/clearing-officer/viewClearance">
                            <Button
                              className="bg-yellow-500 hover:bg-yellow-400"
                              size="sm"
                            >
                              View
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <PackageX className="w-20 h-20 text-muted-foreground" />
                        <p className="text-muted-foreground text-2xl">
                          No students found.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
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
                setCurrentPage={(value) => dispatch(setCurrentPage(value))}
              />
            </div>
          </div>
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
