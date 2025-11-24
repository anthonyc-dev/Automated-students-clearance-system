// src/routes/index.tsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "../pages/auth/Login";
import { ViewClearance } from "../pages/clearing-officer/ViewClearance";
import Unauthorized from "../pages/Unauthorized";
import Dashboard from "../pages/clearing-officer/Dashboard";
import Clearance from "../pages/clearing-officer/Clearance";
import StudentRecord from "../pages/clearing-officer/StudentRecord";
import Events from "@/pages/clearing-officer/Events";
import AccountSettings from "@/pages/clearing-officer/AccountSettings";
import AdminDashboard from "@/pages/admin-side/Dashboard";
import AdminLayout from "@/layouts/AdminLayout";
import AddStudents from "@/pages/admin-side/AddStudents";
import AddClearingOfficer from "@/pages/admin-side/AddClearingOfficer";
import AdminSettings from "@/pages/admin-side/AccountSettings";
import Layout from "@/layouts/Layout";
import ViewQrCodePermit from "@/pages/ViewQrCodePermit";
import ProtectedRoute from "@/components/ProtectedRoute";
import Register from "@/pages/auth/Register";
import GuestRoute from "@/components/GuestRoute";
import RootPages from "@/pages/landingPage/RootPages";
import ClearingOfficerLayout from "@/layouts/ClearingOfficerLayout";
import SampleQrCode from "@/pages/SampleQrCode";
import ViewPermit from "@/pages/TestingQrCodePermit";

import EnrollmentLogin from "@/pages/enrollmentSide/EnrollmentLogin";
import ViewCourses from "@/pages/clearing-officer/ViewCourses";
import { SaoOfficer } from "@/pages/institutionalOfficer/sao/studentsList";
import Requirements from "@/pages/institutionalOfficer/sao/Requirements";
import { ClearanceStart } from "@/pages/admin-side/ClearanceStart";
import TermsPolicy from "@/pages/landingPage/_components/TermsPolicy";
import DeanRequirements from "@/pages/institutionalOfficer/dean/Requirements";
import DeanStudentList from "@/pages/institutionalOfficer/dean/StudnetList";

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/**Route for Home*/}
      <Route path="/" element={<Layout />}>
        <Route index element={<RootPages />} />
        <Route path="*" element={<Unauthorized />} />
      </Route>

      {/**Route for admin */}
      <Route
        path="/admin-side"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="addStudents" element={<AddStudents />} />
        <Route path="addClearingOfficer" element={<AddClearingOfficer />} />
        <Route path="adminSettings" element={<AdminSettings />} />
        <Route path="adminClearance" element={<ClearanceStart />} />

        <Route path="*" element={<Unauthorized />} />
      </Route>
      {/**Route for clearing officer */}
      <Route
        path="/clearing-officer"
        element={
          <ProtectedRoute
            allowedRoles={[
              "clearingOfficer",
              "sao",
              "umsa",
              "sgo",
              "kahayag",
              "registrar",
              "cashier",
              "laboratory",
              "library",
              "tailoring",
              "guidance",
              "dean",
            ]}
          >
            <ClearingOfficerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route
          path="clearance"
          element={
            <ProtectedRoute allowedRoles={["clearingOfficer", "dean"]}>
              <Clearance />
            </ProtectedRoute>
          }
        />
        <Route
          path="student-records/:courseCode/:reqId"
          element={
            <ProtectedRoute allowedRoles={["clearingOfficer"]}>
              <StudentRecord />
            </ProtectedRoute>
          }
        />
        <Route path="events" element={<Events />} />
        <Route path="accountSettings" element={<AccountSettings />} />
        <Route path="viewClearance" element={<ViewClearance />} />
        <Route
          path="viewCourses"
          element={
            <ProtectedRoute allowedRoles={["clearingOfficer", "sao"]}>
              <ViewCourses />
            </ProtectedRoute>
          }
        />

        {/* sao */}
        <Route
          path="sao/requirements"
          element={
            <ProtectedRoute
              allowedRoles={[
                "clearingOfficer",
                "sao",
                "umsa",
                "sgo",
                "kahayag",
                "registrar",
                "cashier",
                "laboratory",
                "library",
                "tailoring",
                "guidance",
                "dean",
              ]}
            >
              <Requirements />
            </ProtectedRoute>
          }
        />
        <Route
          path="sao/students/:reqId"
          element={
            <ProtectedRoute
              allowedRoles={[
                "sao",
                "umsa",
                "sgo",
                "kahayag",
                "registrar",
                "cashier",
                "laboratory",
                "library",
                "tailoring",
                "guidance",
                "dean",
              ]}
            >
              <SaoOfficer />
            </ProtectedRoute>
          }
        />

        <Route
          path="dean/requirements"
          element={
            <ProtectedRoute allowedRoles={["dean"]}>
              <DeanRequirements />
            </ProtectedRoute>
          }
        />
        <Route
          path="dean/students/:reqId/:departmentParams"
          element={
            <ProtectedRoute allowedRoles={["dean"]}>
              <DeanStudentList />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Unauthorized />} />
      </Route>
      {/**General Route */}
      <Route path="permit" element={<ViewQrCodePermit />} />
      <Route path="sampleQrCode" element={<SampleQrCode />} />
      <Route path="viewPermit" element={<ViewPermit />} />
      <Route path="TermsPolicy" element={<TermsPolicy />} />

      <Route path="enrollmentLogin" element={<EnrollmentLogin />} />
      <Route
        path="login"
        element={
          <GuestRoute>
            <Login />
          </GuestRoute>
        }
      />
      <Route
        path="register"
        element={
          <GuestRoute>
            <Register />
          </GuestRoute>
        }
      />

      <Route path="unauthorized" element={<Unauthorized />} />
    </Routes>
  );
};

export default AppRoutes;
