import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface Course {
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  students: number;
  department: string;
  requirements: string[];
}

interface ClearanceState {
  search: string;
  selectedCategory: string;
  isDialogOpen: boolean;
  newRequirement: {
    title: string;
    description: string;
    dueDate: string;
    department: string;
    requirements: string[];
  };
  requirements: Course[];
}

const initialRequirements: Course[] = [
  {
    title: "CC107",
    description: "Advanced topics in data structures and algorithms.",
    dueDate: "May 15, 2025",
    completed: true,
    students: 45,
    department: "BS-Computer Science",
    requirements: ["CC107"],
  },
  {
    title: "SE102",
    description: "Principles of software design and architecture.",
    dueDate: "April 28, 2025",
    completed: false,
    students: 38,
    department: "BS-Education",
    requirements: ["SE102", "SE103", "SE104"],
  },
  {
    title: "IS301",
    description: "In-depth study of database management systems.",
    dueDate: "June 5, 2025",
    completed: false,
    students: 52,
    department: "BS-Administration",
    requirements: ["IS301", "IS302"],
  },
  {
    title: "CS404",
    description: "Exploring the fundamentals of AI and machine learning.",
    dueDate: "May 20, 2025",
    completed: true,
    students: 30,
    department: "BS-Accounting",
    requirements: ["CS404", "CS405", "CS406"],
  },
];

const initialState: ClearanceState = {
  search: "",
  selectedCategory: "all",
  isDialogOpen: false,
  newRequirement: {
    title: "",
    requirements: [],
    description: "",
    dueDate: "",
    department: "",
  },
  requirements: initialRequirements,
};

const clearanceSlice = createSlice({
  name: "clearance",
  initialState,
  reducers: {
    setSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
    },
    setSelectedCategory(state, action: PayloadAction<string>) {
      state.selectedCategory = action.payload;
    },
    setIsDialogOpen(state, action: PayloadAction<boolean>) {
      state.isDialogOpen = action.payload;
    },
    setNewRequirement(
      state,
      action: PayloadAction<ClearanceState["newRequirement"]>
    ) {
      state.newRequirement = action.payload;
    },
    addRequirement(state, action: PayloadAction<Course>) {
      state.requirements.push(action.payload);
      state.newRequirement = initialState.newRequirement; // reset form
      state.isDialogOpen = false;
    },
  },
});

export const {
  setSearch,
  setSelectedCategory,
  setIsDialogOpen,
  setNewRequirement,
  addRequirement,
} = clearanceSlice.actions;
export default clearanceSlice.reducer;
