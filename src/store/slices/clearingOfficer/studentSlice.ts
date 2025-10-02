import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type Status = "Signed" | "Incomplete" | "Missing";

export interface Student {
  id: number;
  id_no: string;
  name: string;
  email: string;
  cp_no: string;
  profilePic: string;
  status: Status;
}

interface ConfirmDialog {
  isOpen: boolean;
  type: "single" | "multiple";
  studentId?: number;
  studentName?: string;
  onConfirm?: () => void;
}

interface StudentState {
  studentList: Student[];
  search: string;
  selectedStudents: number[];
  selectedStatus: string;
  currentPage: number;
  confirmDialog: ConfirmDialog;
}

const initialStudents: Student[] = [
  {
    id: 1,
    id_no: "24-0334",
    name: "John Doe",
    email: "johndoe@example.com",
    cp_no: "09123456789",
    profilePic: "https://randomuser.me/api/portraits/men/1.jpg",
    status: "Signed",
  },
  {
    id: 2,
    id_no: "20-0842",
    name: "Jane Smith",
    email: "janesmith@example.com",
    cp_no: "09123456789",
    profilePic: "https://randomuser.me/api/portraits/women/2.jpg",
    status: "Incomplete",
  },
  {
    id: 3,
    id_no: "24-0334",
    name: "Alice Johnson",
    email: "alicejohnson@example.com",
    cp_no: "09123456789",
    profilePic: "https://randomuser.me/api/portraits/women/3.jpg",
    status: "Signed",
  },
  {
    id: 4,
    id_no: "24-0334",
    name: "Bob Brown",
    email: "bobbrown@example.com",
    cp_no: "09123456789",
    profilePic: "https://randomuser.me/api/portraits/men/4.jpg",
    status: "Missing",
  },
  {
    id: 5,
    id_no: "24-0334",
    name: "Jane Smith",
    email: "janesmith@example.com",
    cp_no: "09123456789",
    profilePic: "https://randomuser.me/api/portraits/women/2.jpg",
    status: "Signed",
  },
  {
    id: 6,
    id_no: "24-0334",
    name: "Alice Johnson",
    email: "alicejohnson@example.com",
    cp_no: "09123456789",
    profilePic: "https://randomuser.me/api/portraits/women/3.jpg",
    status: "Signed",
  },
  {
    id: 7,
    id_no: "24-0334",
    name: "Bob Brown",
    email: "bobbrown@example.com",
    cp_no: "09123456789",
    profilePic: "https://randomuser.me/api/portraits/men/4.jpg",
    status: "Incomplete",
  },
  {
    id: 8,
    id_no: "24-0334",
    name: "Jane Smith",
    email: "janesmith@example.com",
    cp_no: "09123456789",
    profilePic: "https://randomuser.me/api/portraits/women/2.jpg",
    status: "Missing",
  },
  {
    id: 9,
    id_no: "21-0882",
    name: "Alice Johnson",
    email: "alicejohnson@example.com",
    cp_no: "09123456789",
    profilePic: "https://randomuser.me/api/portraits/women/3.jpg",
    status: "Signed",
  },
  {
    id: 10,
    id_no: "24-0334",
    name: "Bob Brown",
    email: "bobbrown@example.com",
    cp_no: "09123456789",
    profilePic: "https://randomuser.me/api/portraits/men/4.jpg",
    status: "Missing",
  },
  {
    id: 11,
    id_no: "24-0334",
    name: "Bob Brown",
    email: "bobbrown@example.com",
    cp_no: "09123456789",
    profilePic: "https://randomuser.me/api/portraits/men/4.jpg",
    status: "Missing",
  },
];

const initialState: StudentState = {
  studentList: initialStudents,
  search: "",
  selectedStudents: [],
  selectedStatus: "all",
  currentPage: 1,
  confirmDialog: { isOpen: false, type: "single" },
};

const studentSlice = createSlice({
  name: "student",
  initialState,
  reducers: {
    setSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
      state.currentPage = 1; // reset page on search
    },
    setSelectedStatus(state, action: PayloadAction<string>) {
      state.selectedStatus = action.payload;
      state.currentPage = 1; // reset page on filter
    },
    setSelectedStudents(state, action: PayloadAction<number[]>) {
      state.selectedStudents = action.payload;
    },
    setCurrentPage(state, action: PayloadAction<number>) {
      state.currentPage = action.payload;
    },
    setConfirmDialog(state, action: PayloadAction<ConfirmDialog>) {
      state.confirmDialog = action.payload;
    },
    updateStudentStatus(
      state,
      action: PayloadAction<{ studentIds: number[]; status: Status }>
    ) {
      state.studentList = state.studentList.map((student) =>
        action.payload.studentIds.includes(student.id)
          ? { ...student, status: action.payload.status }
          : student
      );
      state.selectedStudents = [];
    },
    toggleStudentStatus(state, action: PayloadAction<number>) {
      state.studentList = state.studentList.map((student) =>
        student.id === action.payload
          ? {
              ...student,
              status: student.status === "Signed" ? "Incomplete" : "Signed",
            }
          : student
      );
    },
  },
});

export const {
  setSearch,
  setSelectedStatus,
  setSelectedStudents,
  setCurrentPage,
  setConfirmDialog,
  updateStudentStatus,
  toggleStudentStatus,
} = studentSlice.actions;

export default studentSlice.reducer;
