import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus,
  User,
  Mail,
  Phone,
  Edit,
  Trash2,
  Loader2,
  IdCard,
  Search,
  X,
  Shield,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  getAllClearingOfficers,
  createClearingOfficer,
  updateClearingOfficer,
  deleteClearingOfficer,
} from "@/services/clearingOfficerService";
import type {
  ClearingOfficer,
  CreateClearingOfficerPayload,
  UpdateClearingOfficerPayload,
  ClearingOfficerRole,
} from "@/services/clearingOfficerService";

/**
 * Form data interface for the clearing officer form
 */
interface OfficerFormData {
  schoolId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: ClearingOfficerRole;
}

/**
 * Initial empty form state
 */
const initialFormData: OfficerFormData = {
  schoolId: "",
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  password: "",
  role: "clearingOfficer",
};

/**
 * Modal modes
 */
type ModalMode = "add" | "edit";

const AddClearingOfficer = () => {
  // State management
  const [officers, setOfficers] = useState<ClearingOfficer[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<ModalMode>("add");
  const [editingOfficer, setEditingOfficer] = useState<ClearingOfficer | null>(
    null
  );
  const [formData, setFormData] = useState<OfficerFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof OfficerFormData, string>>
  >({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [officerToDelete, setOfficerToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);

  const { toast } = useToast();

  /**
   * Fetch all clearing officers on component mount
   */
  const fetchOfficers = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getAllClearingOfficers();
      console.log("Fetched officers:", data); // Debug log
      console.log("First officer sample:", data[0]); // Check structure
      setOfficers(data);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      toast({
        title: "Error",
        description: `Failed to load clearing officers: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchOfficers();
  }, [fetchOfficers]);

  /**
   * Filter officers based on search query
   */
  const filteredOfficers = useMemo(() => {
    if (!searchQuery.trim()) {
      return officers;
    }

    const query = searchQuery.toLowerCase().trim();
    return officers.filter(
      (officer) =>
        officer.schoolId.toLowerCase().includes(query) ||
        officer.firstName.toLowerCase().includes(query) ||
        officer.lastName.toLowerCase().includes(query) ||
        `${officer.firstName} ${officer.lastName}`
          .toLowerCase()
          .includes(query) ||
        officer.email.toLowerCase().includes(query) ||
        (officer.phoneNumber && officer.phoneNumber.includes(query))
    );
  }, [officers, searchQuery]);

  /**
   * Handle search query change
   */
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page when searching
  }, []);

  /**
   * Clear search query
   */
  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    setCurrentPage(1); // Reset to first page when clearing search
  }, []);

  /**
   * Pagination calculations
   */
  const totalPages = Math.ceil(filteredOfficers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOfficers = useMemo(
    () => filteredOfficers.slice(startIndex, endIndex),
    [filteredOfficers, startIndex, endIndex]
  );

  /**
   * Handle page change
   */
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  /**
   * Go to first page
   */
  const handleFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  /**
   * Go to last page
   */
  const handleLastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  /**
   * Validate form fields
   */
  const validateForm = useCallback((): boolean => {
    const errors: Partial<Record<keyof OfficerFormData, string>> = {};

    // School ID validation
    if (!formData.schoolId.trim()) {
      errors.schoolId = "School ID is required";
    }

    // First name validation
    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required";
    } else if (formData.firstName.trim().length < 2) {
      errors.firstName = "First name must be at least 2 characters";
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required";
    } else if (formData.lastName.trim().length < 2) {
      errors.lastName = "Last name must be at least 2 characters";
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      errors.email = "Invalid email format";
    }

    // Phone number validation
    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = "Phone number is required";
    } else if (!/^\d{10,15}$/.test(formData.phoneNumber.replace(/\s/g, ""))) {
      errors.phoneNumber = "Invalid phone number (10-15 digits)";
    }

    // Password validation (only for add mode)
    if (modalMode === "add") {
      if (!formData.password) {
        errors.password = "Password is required";
      } else if (formData.password.length < 6) {
        errors.password = "Password must be at least 6 characters";
      }
    }

    // Role validation
    if (!formData.role) {
      errors.role = "Role is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, modalMode]);

  /**
   * Handle opening modal for adding new officer
   */
  const handleOpenAddModal = useCallback(() => {
    setModalMode("add");
    setFormData(initialFormData);
    setFormErrors({});
    setEditingOfficer(null);
    setIsModalOpen(true);
  }, []);

  /**
   * Handle opening modal for editing officer
   */
  const handleOpenEditModal = useCallback(
    (officer: ClearingOfficer) => {
      // Validate that officer has an ID
      if (!officer._id) {
        console.error("Officer object missing _id:", officer);
        toast({
          title: "Error",
          description: "Cannot edit officer: Missing ID",
          variant: "destructive",
        });
        return;
      }

      console.log("Editing officer:", officer); // Debug log
      setModalMode("edit");
      setFormData({
        schoolId: officer.schoolId,
        firstName: officer.firstName,
        lastName: officer.lastName,
        email: officer.email,
        phoneNumber: officer.phoneNumber,
        password: "", // Password not needed for edit
        role: officer.role,
      });
      setFormErrors({});
      setEditingOfficer(officer);
      setIsModalOpen(true);
    },
    [toast]
  );

  /**
   * Handle closing modal
   */
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setFormData(initialFormData);
    setFormErrors({});
    setEditingOfficer(null);
  }, []);

  /**
   * Handle form field changes
   */
  const handleInputChange = useCallback(
    (field: keyof OfficerFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      // Clear error for this field when user starts typing
      if (formErrors[field]) {
        setFormErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [formErrors]
  );

  /**
   * Handle form submission for add/edit
   */
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      if (modalMode === "add") {
        // Create new officer
        const payload: CreateClearingOfficerPayload = {
          schoolId: formData.schoolId.trim(),
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim().toLowerCase(),
          phoneNumber: formData.phoneNumber.trim(),
          password: formData.password,
          role: formData.role,
        };

        console.log("Submitting create payload:", payload); // Debug log
        await createClearingOfficer(payload);
        toast({
          title: "Success",
          description: `${
            formData.role === "clearingOfficer"
              ? "Clearing officer"
              : formData.role === "sao"
              ? "SAO"
              : formData.role === "registrar"
              ? "Registrar"
              : "Officer"
          } created successfully`,
        });
      } else {
        // Update existing officer
        if (!editingOfficer) {
          toast({
            title: "Error",
            description: "No officer selected for editing",
            variant: "destructive",
          });
          return;
        }

        if (!editingOfficer._id) {
          console.error("Editing officer missing _id:", editingOfficer);
          toast({
            title: "Error",
            description: "Cannot update officer: Missing ID",
            variant: "destructive",
          });
          return;
        }

        console.log("Updating officer with ID:", editingOfficer._id); // Debug log

        const payload: UpdateClearingOfficerPayload = {
          schoolId: formData.schoolId.trim(),
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim().toLowerCase(),
          phoneNumber: formData.phoneNumber.trim(),
          role: formData.role,
        };

        await updateClearingOfficer(editingOfficer._id, payload);
        toast({
          title: "Success",
          description: "Clearing officer updated successfully",
        });
      }

      // Refresh the list
      await fetchOfficers();
      handleCloseModal();
    } catch (error: unknown) {
      console.error("Submit error:", error); // Debug log

      let errorMessage = "Unknown error occurred";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === "object" && "response" in error) {
        // Handle axios error
        const axiosError = error as {
          response?: {
            data?: {
              message?: string;
              error?: string;
              errors?: Record<string, string[]>;
            };
          };
        };
        const responseData = axiosError.response?.data;

        // Check for validation errors object
        if (responseData?.errors) {
          const validationErrors = Object.entries(responseData.errors)
            .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
            .join("; ");
          errorMessage = validationErrors;
        } else {
          errorMessage =
            responseData?.message ||
            responseData?.error ||
            "Unknown error occurred";
        }
      }

      toast({
        title: "Error",
        description: `Failed to ${
          modalMode === "add" ? "create" : "update"
        } clearing officer: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    validateForm,
    modalMode,
    formData,
    editingOfficer,
    toast,
    fetchOfficers,
    handleCloseModal,
  ]);

  /**
   * Handle opening delete confirmation dialog
   */
  const handleOpenDeleteDialog = useCallback((id: string, name: string) => {
    setOfficerToDelete({ id, name });
    setDeleteDialogOpen(true);
  }, []);

  /**
   * Handle closing delete confirmation dialog
   */
  const handleCloseDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(false);
    setOfficerToDelete(null);
  }, []);

  /**
   * Handle confirming deletion
   */
  const handleConfirmDelete = useCallback(async () => {
    if (!officerToDelete) return;

    try {
      setIsDeleting(officerToDelete.id);
      await deleteClearingOfficer(officerToDelete.id);
      toast({
        title: "Success",
        description: "Clearing officer deleted successfully",
      });
      await fetchOfficers();
      handleCloseDeleteDialog();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      toast({
        title: "Error",
        description: `Failed to delete clearing officer: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  }, [officerToDelete, toast, fetchOfficers, handleCloseDeleteDialog]);

  /**
   * Memoized table rows for performance
   */
  const tableRows = useMemo(
    () =>
      paginatedOfficers.map((officer) => (
        <TableRow key={officer._id}>
          <TableCell className="font-medium">
            <div className="flex items-center gap-2">
              <IdCard className="h-4 w-4 text-blue-500" />
              <span className="hidden sm:inline">{officer.schoolId}</span>
              <span className="sm:hidden text-xs">{officer.schoolId}</span>
            </div>
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-green-500" />
              <div className="flex flex-col">
                <span className="font-medium">
                  {officer.firstName} {officer.lastName}
                </span>
              </div>
            </div>
          </TableCell>
          <TableCell className="hidden md:table-cell">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-purple-500" />
              <span className="text-sm">{officer.email}</span>
            </div>
          </TableCell>
          <TableCell className="hidden lg:table-cell">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-orange-500" />
              <span className="text-sm">
                {officer.phoneNumber || "Not provided"}
              </span>
            </div>
          </TableCell>
          <TableCell className="hidden xl:table-cell">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-indigo-500" />
              <span
                className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                  officer.role === "admin"
                    ? "bg-red-100 text-red-800"
                    : officer.role === "sao"
                    ? "bg-purple-100 text-purple-800"
                    : officer.role === "registrar"
                    ? "bg-blue-100 text-blue-800"
                    : officer.role === "dean"
                    ? "bg-orange-100 text-orange-800"
                    : officer.role === "cashier"
                    ? "bg-yellow-100 text-yellow-800"
                    : officer.role === "laboratory"
                    ? "bg-green-100 text-green-800"
                    : officer.role === "library"
                    ? "bg-indigo-100 text-indigo-800"
                    : officer.role === "tailoring"
                    ? "bg-pink-100 text-pink-800"
                    : officer.role === "guidance"
                    ? "bg-gray-100 text-gray-800"
                    : "bg-lime-100 text-lime-800"
                }`}
              >
                {officer.role === "clearingOfficer"
                  ? "Clearing Officer"
                  : officer.role === "sao"
                  ? "SAO"
                  : officer.role === "registrar"
                  ? "Registrar"
                  : officer.role === "admin"
                  ? "Admin"
                  : officer.role === "dean"
                  ? "Dean"
                  : officer.role === "cashier"
                  ? "Cashier"
                  : officer.role === "laboratory"
                  ? "Laboratory"
                  : officer.role === "library"
                  ? "Library"
                  : officer.role === "tailoring"
                  ? "Tailoring"
                  : officer.role === "guidance"
                  ? "Guidance"
                  : "Other"}
              </span>
            </div>
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenEditModal(officer)}
                disabled={isSubmitting || isDeleting !== null}
              >
                <Edit className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Edit</span>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() =>
                  handleOpenDeleteDialog(
                    officer._id,
                    `${officer.firstName} ${officer.lastName}`
                  )
                }
                disabled={isSubmitting || isDeleting !== null}
              >
                {isDeleting === officer._id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span className="hidden sm:inline ml-1">Delete</span>
              </Button>
            </div>
          </TableCell>
        </TableRow>
      )),
    [
      paginatedOfficers,
      isSubmitting,
      isDeleting,
      handleOpenEditModal,
      handleOpenDeleteDialog,
    ]
  );

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-2">
            Clearing Officers Management
          </h1>
          <p className="text-slate-600 mt-1">
            Manage clearing officers in the system
          </p>
        </div>
        <Button
          onClick={handleOpenAddModal}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Officer
        </Button>
      </div>

      {/* Table Section */}
      <Card className="p-6">
        {/* Search Section */}
        <div className="flex items-center gap-2 mb-5">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name, school ID, email, or phone..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-10"
              disabled={isLoading}
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {searchQuery && (
            <div className="text-sm text-slate-600">
              Found {filteredOfficers.length} of {officers.length} officers
            </div>
          )}
        </div>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="ml-3 text-slate-600">
                Loading clearing officers...
              </span>
            </div>
          ) : filteredOfficers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <User className="h-16 w-16 mb-4 opacity-30" />
              {officers.length === 0 ? (
                <>
                  <p className="text-lg font-medium">
                    No clearing officers found
                  </p>
                  <p className="text-sm mt-1">
                    Click "Add New Officer" to create one
                  </p>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium">
                    No officers match your search
                  </p>
                  <p className="text-sm mt-1">
                    Try adjusting your search query
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearSearch}
                    className="mt-4"
                  >
                    Clear Search
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[140px]">School ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Email
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Phone
                      </TableHead>
                      <TableHead className="hidden xl:table-cell">
                        Role
                      </TableHead>
                      <TableHead className="w-[200px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>{tableRows}</TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Pagination Controls */}
          {!isLoading && filteredOfficers.length > 0 && (
            <div className="flex items-center justify-between px-4 py-4 border-t">
              <div className="text-sm text-slate-600">
                Showing {startIndex + 1} to{" "}
                {Math.min(endIndex, filteredOfficers.length)} of{" "}
                {filteredOfficers.length} officers
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFirstPage}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      // Show first page, last page, current page, and pages around current
                      return (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      );
                    })
                    .map((page, index, array) => {
                      // Add ellipsis
                      const prevPage = array[index - 1];
                      const showEllipsisBefore =
                        prevPage && page - prevPage > 1;

                      return (
                        <div key={page} className="flex items-center gap-1">
                          {showEllipsisBefore && (
                            <span className="px-2 text-slate-400">...</span>
                          )}
                          <Button
                            variant={
                              currentPage === page ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => handlePageChange(page)}
                            className="min-w-[2.5rem]"
                          >
                            {page}
                          </Button>
                        </div>
                      );
                    })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLastPage}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {modalMode === "add"
                ? "Add New Clearing Officer"
                : "Edit Clearing Officer"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "add"
                ? "Fill in the details to create a new clearing officer account."
                : "Update the clearing officer information below."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* School ID */}
            <div className="space-y-2">
              <Label htmlFor="schoolId">
                School ID <span className="text-red-500">*</span>
              </Label>
              <Input
                id="schoolId"
                placeholder="e.g., CO-2024-001"
                value={formData.schoolId}
                onChange={(e) => handleInputChange("schoolId", e.target.value)}
                disabled={isSubmitting}
              />
              {formErrors.schoolId && (
                <p className="text-sm text-red-500">{formErrors.schoolId}</p>
              )}
            </div>

            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="firstName">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="firstName"
                placeholder="Enter first name"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                disabled={isSubmitting}
              />
              {formErrors.firstName && (
                <p className="text-sm text-red-500">{formErrors.firstName}</p>
              )}
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="lastName">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lastName"
                placeholder="Enter last name"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                disabled={isSubmitting}
              />
              {formErrors.lastName && (
                <p className="text-sm text-red-500">{formErrors.lastName}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="officer@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                disabled={isSubmitting}
              />
              {formErrors.email && (
                <p className="text-sm text-red-500">{formErrors.email}</p>
              )}
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="1234567890"
                value={formData.phoneNumber}
                onChange={(e) =>
                  handleInputChange("phoneNumber", e.target.value)
                }
                disabled={isSubmitting}
              />
              {formErrors.phoneNumber && (
                <p className="text-sm text-red-500">{formErrors.phoneNumber}</p>
              )}
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role">
                Role <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  handleInputChange("role", value as ClearingOfficerRole)
                }
                disabled={isSubmitting}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clearingOfficer">
                    Clearing Officer
                  </SelectItem>
                  <SelectItem value="sao">
                    SAO (Student Affairs Officer)
                  </SelectItem>
                  <SelectItem value="registrar">Registrar</SelectItem>
                  <SelectItem value="cashier">Cashier</SelectItem>
                  <SelectItem value="laboratory">Computer Laboratory</SelectItem>
                  <SelectItem value="guidance">Guidance</SelectItem>
                  <SelectItem value="library">Library</SelectItem>
                  <SelectItem value="tailoring">Tailoring</SelectItem>
                  <SelectItem value="dean">Dean</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              {formErrors.role && (
                <p className="text-sm text-red-500">{formErrors.role}</p>
              )}
            </div>

            {/* Password (only for add mode) */}
            {modalMode === "add" && (
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  disabled={isSubmitting}
                />
                {formErrors.password && (
                  <p className="text-sm text-red-500">{formErrors.password}</p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseModal}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {modalMode === "add" ? "Creating..." : "Updating..."}
                </>
              ) : (
                <>{modalMode === "add" ? "Create Officer" : "Update Officer"}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-semibold text-slate-900">
                {officerToDelete?.name}
              </span>
              . This action cannot be undone and will remove all associated data
              from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCloseDeleteDialog}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting !== null}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting === officerToDelete?.id ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete Officer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AddClearingOfficer;
