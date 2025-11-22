import { useState, useEffect, useCallback } from "react";
import { message, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { format } from "date-fns";
import {
  PlayCircle,
  PauseCircle,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  CalendarDays,
  TrendingUp,
  AlertCircle,
  Settings,
  GraduationCap,
  Trash2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { AxiosError } from "axios";
import axiosInstance from "@/api/axios";
import { db } from "@/config/firebaseConfig";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/authentication/useAuth";

interface ClearanceStatus {
  id?: string;
  isActive: boolean;
  startDate: Date | null;
  deadline: Date | null;
  extendedDeadline: Date | null;
  semester?: string;
  academicYear?: string;
  semesterType?: string;
  createdAt?: string;
  updatedAt?: string;
}

// API Response interface
interface ClearanceApiResponse {
  id: string;
  isActive: boolean;
  startDate: string | null;
  deadline: string;
  extendedDeadline: string | null;
  semester?: string;
  academicYear: string;
  semesterType: string;
  createdAt: string;
  updatedAt: string;
}

export const ClearanceStart = () => {
  // State management
  const [status, setStatus] = useState<ClearanceStatus | null>(null);
  const [allClearances, setAllClearances] = useState<ClearanceStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [extendLoading, setExtendLoading] = useState(false);
  const [newDeadline, setNewDeadline] = useState<Date | undefined>(undefined);
  const [isExtendDialogOpen, setIsExtendDialogOpen] = useState(false);
  const [isSetupDialogOpen, setIsSetupDialogOpen] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Form state for setup
  const [semesterType, setSemesterType] = useState<string>("");
  const [academicYear, setAcademicYear] = useState<string>("");
  const [deadlineDate, setDeadlineDate] = useState<Date | undefined>(undefined);

  console.log(status);

  const { user } = useAuth();

  console.log("admin id", user);

  // Helper function to transform API response to component state
  const transformApiResponse = useCallback(
    (apiData: ClearanceApiResponse): ClearanceStatus => {
      return {
        id: apiData.id,
        isActive: apiData.isActive,
        startDate: apiData.startDate ? new Date(apiData.startDate) : null,
        deadline: apiData.deadline ? new Date(apiData.deadline) : null,
        extendedDeadline: apiData.extendedDeadline
          ? new Date(apiData.extendedDeadline)
          : null,
        semester: apiData.semester,
        academicYear: apiData.academicYear,
        semesterType: apiData.semesterType,
        createdAt: apiData.createdAt,
        updatedAt: apiData.updatedAt,
      };
    },
    []
  );

  // Fetch current clearance status from database
  const fetchClearanceStatus = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get<ClearanceApiResponse[]>(
        "/clearance/getAllClearance"
      );

      // Get the most recent clearance (assuming the API returns array)
      if (response.data && response.data.length > 0) {
        // Sort by createdAt to get the most recent one
        const sortedData = response.data.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        // Transform all clearances for the table
        const allTransformed = sortedData.map(transformApiResponse);
        setAllClearances(allTransformed);

        // Prioritize active clearance for display in the status card
        // If there's an active clearance, show it; otherwise show the most recent
        const activeClearance = allTransformed.find((c) => c.isActive);
        const displayClearance = activeClearance || allTransformed[0];
        setStatus(displayClearance);
      } else {
        // No clearance found - set to null to show setup prompt
        setStatus(null);
        setAllClearances([]);
      }
    } catch (error) {
      console.error("Error fetching clearance status:", error);
      const axiosError = error as AxiosError<{ message?: string }>;
      message.error(
        axiosError?.response?.data?.message ||
          "Failed to fetch clearance status"
      );
      setStatus(null);
      setAllClearances([]);
    } finally {
      setLoading(false);
    }
  }, [transformApiResponse]);

  useEffect(() => {
    fetchClearanceStatus();
  }, [fetchClearanceStatus]);

  const handleSetupClearance = async () => {
    if (!semesterType || !academicYear || !deadlineDate) {
      message.error("Please fill in all fields");
      return;
    }

    try {
      setSetupLoading(true);

      // Format the deadline date as YYYY-MM-DD for the API
      const formattedDeadline = format(deadlineDate, "yyyy-MM-dd");

      // Log the data being sent to debug semester type issue
      console.log("Setup Clearance Data:", {
        semesterType,
        academicYear,
        deadline: formattedDeadline,
      });

      // POST request to setup clearance
      await axiosInstance.post<ClearanceApiResponse>("/clearance/setup", {
        semesterType,
        academicYear,
        deadline: formattedDeadline,
      });

      message.success(
        "Clearance setup completed! You can now start clearance."
      );

      setIsSetupDialogOpen(false);

      // Reset form
      setSemesterType("");
      setAcademicYear("");
      setDeadlineDate(undefined);

      // Refetch clearance status to ensure we have complete data with ID
      await fetchClearanceStatus();
    } catch (error) {
      console.error("Error setting up clearance:", error);
      const axiosError = error as AxiosError<{ message?: string }>;
      message.error(
        axiosError?.response?.data?.message || "Failed to setup clearance"
      );
    } finally {
      setSetupLoading(false);
    }
  };

  const handleStartClearance = async (clearanceRecord?: ClearanceStatus) => {
    const targetClearance = clearanceRecord || status;

    if (!targetClearance || !targetClearance.deadline) {
      message.warning(
        "Please setup clearance first (semester, year, and deadline)"
      );
      setIsSetupDialogOpen(true);
      return;
    }

    if (!targetClearance.id) {
      message.error("Clearance ID not found. Please refresh the page.");
      return;
    }

    console.log(targetClearance.id);

    try {
      setLoading(true);

      // PUT request to start clearance
      const response = await axiosInstance.put<ClearanceApiResponse>(
        `/clearance/start/${targetClearance.id}`
      );

      // Transform and update state
      const updatedStatus = transformApiResponse(response.data);
      setStatus(updatedStatus);

      console.log(response);

      // Update the allClearances array to reflect changes in table
      setAllClearances((prevClearances) =>
        prevClearances.map((clearance) =>
          clearance.id === updatedStatus.id ? updatedStatus : clearance
        )
      );

      message.success("Clearance started successfully!");

      const formatDatePH = (value: string | Date | null | undefined) => {
        if (!value) return "N/A"; // fallback if missing

        const date = value instanceof Date ? value : new Date(value);

        return date.toLocaleDateString("en-PH", {
          year: "numeric",
          month: "short",
          day: "numeric",
          timeZone: "Asia/Manila",
        });
      };

      const startDate = formatDatePH(status?.startDate);
      const deadline = formatDatePH(status?.deadline);

      await addDoc(collection(db, "notifications"), {
        userId: user?.id,
        title: "Clearance Started",
        message: `The clearance process has officially started for the ${status?.semesterType}, Academic Year ${status?.academicYear}. Start Date: ${startDate}. Deadline: ${deadline}. `,
        isRead: false,
        createdAt: serverTimestamp(),
      });

      // Ensure UI reflects the latest server state immediately
      await fetchClearanceStatus();
    } catch (error) {
      console.error("Error starting clearance:", error);
      const axiosError = error as AxiosError<{ message?: string }>;
      message.error(
        axiosError?.response?.data?.message || "Failed to start clearance"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStopClearance = async (clearanceRecord?: ClearanceStatus) => {
    const targetClearance = clearanceRecord || status;

    if (!targetClearance || !targetClearance.id) {
      message.error("Clearance ID not found. Please refresh the page.");
      return;
    }

    try {
      setLoading(true);

      // PUT request to stop clearance
      const response = await axiosInstance.put<ClearanceApiResponse>(
        `/clearance/stop/${targetClearance.id}`
      );

      // Transform and update state
      const updatedStatus = transformApiResponse(response.data);
      setStatus(updatedStatus);

      // Update the allClearances array to reflect changes in table
      setAllClearances((prevClearances) =>
        prevClearances.map((clearance) =>
          clearance.id === updatedStatus.id ? updatedStatus : clearance
        )
      );

      message.success("Clearance stopped successfully!");

      await addDoc(collection(db, "notifications"), {
        userId: user?.id,
        title: "Clearance Stopped",
        message: `The clearance process for the ${status?.semesterType}, Academic Year ${status?.academicYear} has been stopped. Please wait for further instructions from the administration.`,
        isRead: false,
        createdAt: serverTimestamp(),
      });

      // Ensure UI reflects the latest server state immediately
      await fetchClearanceStatus();
    } catch (error) {
      console.error("Error stopping clearance:", error);
      const axiosError = error as AxiosError<{ message?: string }>;
      message.error(
        axiosError?.response?.data?.message || "Failed to stop clearance"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleExtendDeadline = async () => {
    if (!newDeadline) {
      message.error("Please select a new deadline date");
      return;
    }

    if (!status || !status.id) {
      message.error("Clearance ID not found. Please refresh the page.");
      return;
    }

    const currentDeadline = status.extendedDeadline || status.deadline;
    if (currentDeadline && newDeadline <= currentDeadline) {
      message.error("New deadline must be after the current deadline");
      return;
    }

    try {
      setExtendLoading(true);

      // Format the new deadline date as YYYY-MM-DD for the API
      const formattedNewDeadline = format(newDeadline, "yyyy-MM-dd");

      // PUT request to extend deadline
      const response = await axiosInstance.put<ClearanceApiResponse>(
        `/clearance/extend/${status.id}`,
        {
          newDeadline: formattedNewDeadline,
        }
      );

      // Transform and update state
      const updatedStatus = transformApiResponse(response.data);
      setStatus(updatedStatus);

      // Update the allClearances array to reflect changes in table
      setAllClearances((prevClearances) =>
        prevClearances.map((clearance) =>
          clearance.id === updatedStatus.id ? updatedStatus : clearance
        )
      );

      message.success(`Deadline extended to ${format(newDeadline, "PPP")}`);

      const formatDatePH = (value: string | Date | null | undefined) => {
        if (!value) return "N/A"; // fallback if missing

        const date = value instanceof Date ? value : new Date(value);

        return date.toLocaleDateString("en-PH", {
          year: "numeric",
          month: "short",
          day: "numeric",
          timeZone: "Asia/Manila",
        });
      };

      const extendedDeadline = formatDatePH(status?.extendedDeadline);

      await addDoc(collection(db, "notifications"), {
        userId: user?.id,
        title: "Clearance Deadline Extended",
        message: `The clearance deadline for the ${status?.semesterType}, Academic Year ${status?.academicYear} has been extended. Your new deadline is ${extendedDeadline}.`,
        isRead: false,
        createdAt: serverTimestamp(),
      });

      setIsExtendDialogOpen(false);
      setNewDeadline(undefined);
      // Ensure UI reflects the latest server state immediately
      await fetchClearanceStatus();
    } catch (error) {
      console.error("Error extending deadline:", error);
      const axiosError = error as AxiosError<{ message?: string }>;
      message.error(
        axiosError?.response?.data?.message || "Failed to extend deadline"
      );
    } finally {
      setExtendLoading(false);
    }
  };

  const handleDeleteClearance = async () => {
    if (!status || !status.id) {
      message.error("Clearance ID not found. Please refresh the page.");
      return;
    }

    const deletedId = status.id;

    try {
      setDeleteLoading(true);

      // DELETE request to delete clearance
      await axiosInstance.delete(`/clearance/deleteClearance/${deletedId}`);

      message.success("Clearance deleted successfully!");
      setIsDeleteDialogOpen(false);

      // Remove from allClearances array
      const updatedClearances = allClearances.filter(
        (clearance) => clearance.id !== deletedId
      );
      setAllClearances(updatedClearances);

      // If deleted clearance was the current status, set new status to most recent
      if (updatedClearances.length > 0) {
        setStatus(updatedClearances[0]);
      } else {
        setStatus(null);
      }
    } catch (error) {
      console.error("Error deleting clearance:", error);
      const axiosError = error as AxiosError<{ message?: string }>;
      message.error(
        axiosError?.response?.data?.message || "Failed to delete clearance"
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const currentDeadline = status?.extendedDeadline || status?.deadline;
  const daysRemaining = currentDeadline
    ? Math.ceil(
        (currentDeadline.getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  // Filter out current/active clearance from history table - only show old/inactive clearances
  // The current status (displayed in the main card) should not appear in history
  const historyClearances = allClearances.filter(
    (clearance) => clearance.id !== status?.id && !clearance.isActive
  );

  // Table columns for clearance history
  const columns: ColumnsType<ClearanceStatus> = [
    {
      title: "Academic Year",
      dataIndex: "academicYear",
      key: "academicYear",
      width: 150,
    },
    {
      title: "Semester",
      dataIndex: "semesterType",
      key: "semesterType",
      width: 150,
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      width: 120,
      render: () => (
        <Badge
          variant="secondary"
          className="text-xs bg-blue-200 text-blue-700"
        >
          Done
        </Badge>
      ),
    },
    {
      title: "Start Date",
      dataIndex: "startDate",
      key: "startDate",
      width: 150,
      render: (date: Date | null) =>
        date ? format(date, "MMM dd, yyyy") : "Not started",
    },
    {
      title: "Deadline",
      dataIndex: "deadline",
      key: "deadline",
      width: 150,
      render: (date: Date | null) =>
        date ? format(date, "MMM dd, yyyy") : "N/A",
    },
    {
      title: "Extended Deadline",
      dataIndex: "extendedDeadline",
      key: "extendedDeadline",
      width: 170,
      render: (date: Date | null) =>
        date ? format(date, "MMM dd, yyyy") : "-",
    },
    {
      title: "Actions",
      key: "actions",
      width: 250,
      render: (_: unknown, record: ClearanceStatus) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setStatus(record);
              setIsDeleteDialogOpen(true);
            }}
            className="text-xs text-red-600 border-red-300 hover:bg-red-50"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            Setup Clearance
          </h1>
          <p className="text-gray-500 mt-1">
            Start, stop, and manage clearance deadlines
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Control Card */}
        <Card className="lg:col-span-2 border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Clearance Status</CardTitle>
                <CardDescription className="mt-1">
                  Control the clearance system activation
                </CardDescription>
              </div>
              <Badge
                variant={status?.isActive ? "default" : "secondary"}
                className={cn(
                  "text-sm px-4 py-1.5",
                  status?.isActive
                    ? "bg-green-500 hover:bg-green-600 text-white"
                    : "bg-gray-200 text-gray-700"
                )}
              >
                {status?.isActive ? (
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <XCircle className="h-4 w-4" />
                    Inactive
                  </span>
                )}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-blue-700 mb-2">
                  <Calendar className="h-5 w-5" />
                  <span className="text-sm font-medium">Start Date</span>
                </div>
                <p className="text-lg font-semibold text-blue-900">
                  {status?.startDate
                    ? format(status.startDate, "PPP")
                    : "Not started"}
                </p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 text-purple-700 mb-2">
                  <Clock className="h-5 w-5" />
                  <span className="text-sm font-medium">Current Deadline</span>
                </div>
                <p className="text-lg font-semibold text-purple-900">
                  {currentDeadline ? format(currentDeadline, "PPP") : "Not set"}
                </p>
                {status?.extendedDeadline && (
                  <Badge variant="outline" className="mt-2 text-xs">
                    Extended
                  </Badge>
                )}
              </div>
            </div>

            {/* Semester & Year Info */}
            {(status?.semesterType || status?.academicYear) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 text-green-700 mb-2">
                    <GraduationCap className="h-5 w-5" />
                    <span className="text-sm font-medium">Semester</span>
                  </div>
                  <p className="text-lg font-semibold text-green-900">
                    {status?.semesterType || "Not set"}
                  </p>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-2 text-orange-700 mb-2">
                    <CalendarDays className="h-5 w-5" />
                    <span className="text-sm font-medium">Academic Year</span>
                  </div>
                  <p className="text-lg font-semibold text-orange-900">
                    {status?.academicYear || "Not set"}
                  </p>
                </div>
              </div>
            )}

            {/* Days Remaining Alert */}
            {currentDeadline && daysRemaining !== null && (
              <div
                className={cn(
                  "p-4 rounded-lg border flex items-center gap-3",
                  daysRemaining <= 7
                    ? "bg-red-50 border-red-200"
                    : daysRemaining <= 30
                    ? "bg-yellow-50 border-yellow-200"
                    : "bg-green-50 border-green-200"
                )}
              >
                {daysRemaining <= 7 ? (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                ) : (
                  <TrendingUp className="h-5 w-5 text-green-600" />
                )}
                <div>
                  <p className="font-semibold text-gray-900">
                    {daysRemaining > 0
                      ? `${daysRemaining} day${
                          daysRemaining !== 1 ? "s" : ""
                        } remaining`
                      : "Deadline has passed"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {daysRemaining <= 7
                      ? "Consider extending the deadline"
                      : "Deadline is approaching"}
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Dialog
                open={isSetupDialogOpen}
                onOpenChange={setIsSetupDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1 sm:flex-none"
                    disabled={status?.isActive}
                  >
                    <Settings className="h-5 w-5 mr-2" />
                    Setup Clearance
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Setup Clearance</DialogTitle>
                    <DialogDescription>
                      Configure semester, academic year, and deadline before
                      starting clearance.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="semester-type">Semester Type</Label>
                      <Select
                        value={semesterType}
                        onValueChange={setSemesterType}
                      >
                        <SelectTrigger id="semester-type" className="w-full">
                          <SelectValue placeholder="Select semester type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1st Semester">
                            1st Semester
                          </SelectItem>
                          <SelectItem value="2nd Semester">
                            2nd Semester
                          </SelectItem>
                          <SelectItem value="Summer">Summer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="academic-year">Academic Year</Label>
                      <Input
                        id="academic-year"
                        placeholder="e.g., 2024-2025"
                        value={academicYear}
                        onChange={(e) => setAcademicYear(e.target.value)}
                      />
                      <p className="text-xs text-gray-500">
                        Format: YYYY-YYYY (e.g., 2024-2025)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="deadline">Clearance Deadline</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="deadline"
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !deadlineDate && "text-muted-foreground"
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {deadlineDate ? (
                              format(deadlineDate, "PPP")
                            ) : (
                              <span>Pick a deadline date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={deadlineDate}
                            onSelect={setDeadlineDate}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsSetupDialogOpen(false);
                        setSemesterType("");
                        setAcademicYear("");
                        setDeadlineDate(undefined);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSetupClearance}
                      disabled={
                        setupLoading ||
                        !semesterType ||
                        !academicYear ||
                        !deadlineDate
                      }
                    >
                      {setupLoading ? "Setting up..." : "Setup Clearance"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {status?.isActive ? (
                <Button
                  onClick={() => handleStopClearance()}
                  disabled={loading}
                  variant="destructive"
                  size="lg"
                  className="flex-1 sm:flex-none"
                >
                  <PauseCircle className="h-5 w-5 mr-2" />
                  {loading ? "Stopping..." : "Stop Clearance"}
                </Button>
              ) : (
                <Button
                  onClick={() => handleStartClearance()}
                  disabled={loading || !status?.deadline}
                  size="lg"
                  className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700"
                >
                  <PlayCircle className="h-5 w-5 mr-2" />
                  {loading ? "Starting..." : "Start Clearance"}
                </Button>
              )}

              <Dialog
                open={isExtendDialogOpen}
                onOpenChange={setIsExtendDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1 sm:flex-none"
                    disabled={!status?.isActive || !currentDeadline}
                  >
                    <CalendarDays className="h-5 w-5 mr-2" />
                    Extend Deadline
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Extend Clearance Deadline</DialogTitle>
                    <DialogDescription>
                      Select a new deadline date. The new deadline must be after
                      the current deadline.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {currentDeadline && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-700 font-medium">
                          Current Deadline:
                        </p>
                        <p className="text-blue-900 font-semibold">
                          {format(currentDeadline, "PPP")}
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="new-deadline">New Deadline</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="new-deadline"
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !newDeadline && "text-muted-foreground"
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {newDeadline ? (
                              format(newDeadline, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={newDeadline}
                            onSelect={setNewDeadline}
                            disabled={(date) => {
                              if (!currentDeadline) return false;
                              return date <= currentDeadline;
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsExtendDialogOpen(false);
                        setNewDeadline(undefined);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleExtendDeadline}
                      disabled={extendLoading || !newDeadline}
                    >
                      {extendLoading ? "Extending..." : "Extend Deadline"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Delete Clearance Button */}
              {status && (
                <Dialog
                  open={isDeleteDialogOpen}
                  onOpenChange={setIsDeleteDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="lg"
                      className="flex-1 sm:flex-none border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-5 w-5 mr-2" />
                      Delete Setup
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle className="text-red-600">
                        Delete Clearance Setup
                      </DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete this clearance setup?
                        This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-sm text-red-800 font-medium mb-2">
                          Warning: This will permanently delete:
                        </p>
                        <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                          <li>
                            Clearance configuration for {status?.academicYear}
                          </li>
                          <li>{status?.semesterType}</li>
                          <li>All associated deadlines and settings</li>
                        </ul>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsDeleteDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteClearance}
                        disabled={deleteLoading}
                      >
                        {deleteLoading ? "Deleting..." : "Delete Clearance"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              Quick Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-700 mb-1">
                  Setup Clearance
                </p>
                <p className="text-xs text-blue-600">
                  First step: Configure semester type, academic year, and
                  deadline. This must be done before starting clearance.
                </p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Starting Clearance
                </p>
                <p className="text-xs text-gray-600">
                  Activates the clearance system for all students. Students can
                  begin submitting their clearance documents.
                </p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Stopping Clearance
                </p>
                <p className="text-xs text-gray-600">
                  Deactivates the clearance system. Students will no longer be
                  able to submit new documents.
                </p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Extending Deadline
                </p>
                <p className="text-xs text-gray-600">
                  Allows you to extend the clearance deadline beyond the
                  original date. Useful when students need more time.
                </p>
              </div>

              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm font-medium text-red-700 mb-1">
                  Delete Setup
                </p>
                <p className="text-xs text-red-600">
                  Permanently removes the clearance setup. Use this to reset and
                  create a new clearance configuration. This action cannot be
                  undone.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clearance History Table */}
      {historyClearances.length > 0 && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-2xl">Clearance History</CardTitle>
            <CardDescription>
              View past clearance configurations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table
              columns={columns}
              dataSource={historyClearances}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) =>
                  `Total ${total} completed clearance setups`,
              }}
              scroll={{ x: 1200 }}
              className="border rounded-lg"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};
