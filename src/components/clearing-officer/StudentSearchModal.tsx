import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Loader2, User, Phone, GraduationCap } from "lucide-react";
import { searchStudents, type Student } from "@/services/studentService";
import { cn } from "@/lib/utils";

interface StudentSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StudentSearchModal({
  open,
  onOpenChange,
}: StudentSearchModalProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Reset search when modal opens
  useEffect(() => {
    if (open) {
      // Clear search when modal opens so user can start fresh
      setSearchQuery("");
      setStudents([]);
      setError(null);
    }
  }, [open]);

  // Focus search input when modal opens
  useEffect(() => {
    if (open && searchInputRef.current) {
      // Small delay to ensure modal is fully rendered
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  // Debounced search function
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setStudents([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await searchStudents(query);
      setStudents(results);
    } catch (err) {
      console.error("Error searching students:", err);
      setError("Failed to search students. Please try again.");
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce search with 300ms delay
  useEffect(() => {
    if (!open || !searchQuery.trim()) {
      setStudents([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, open, performSearch]);

  const handleStudentClick = (student: Student) => {
    // Navigate to student details or clearance page
    // Adjust the route based on your application structure
    navigate(`/clearing-officer/viewClearance?schoolId=${student.schoolId}`);
    onOpenChange(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Students
          </DialogTitle>
          <DialogDescription>
            Search by name, school ID, email, or phone number
          </DialogDescription>
        </DialogHeader>

        {/* Search Input inside Modal */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search students..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full rounded-lg bg-gray-50 border border-gray-200 pl-10 pr-4 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="flex-1 overflow-y-auto mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="ml-3 text-gray-600">Searching...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-red-500">{error}</p>
            </div>
          ) : students.length === 0 && searchQuery.trim() ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-500">
                No students found matching your search.
              </p>
            </div>
          ) : students.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-500">
                Start typing to search for students...
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {students.map((student) => (
                <button
                  key={student._id}
                  onClick={() => handleStudentClick(student)}
                  className={cn(
                    "w-full text-left p-4 rounded-lg border",
                    "hover:bg-blue-50 hover:border-blue-300",
                    "transition-all duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {student.firstName} {student.lastName}
                      </h3>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-gray-400" />
                          <span className="truncate">{student.schoolId}</span>
                        </div>
                        {student.phoneNumber && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span>{student.phoneNumber}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {student.department} • {student.yearLevel}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
