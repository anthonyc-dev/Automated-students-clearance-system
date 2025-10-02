import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../authentication/useAuth";

interface Props {
  children: React.ReactNode;
}

const GuestRoute: React.FC<Props> = ({ children }) => {
  const { isAuthenticated, role } = useAuth();

  // Redirect authenticated users to their respective dashboards
  if (isAuthenticated) {
    if (role === "admin") {
      return <Navigate to="/admin-side" replace />;
    } else if (role === "clearingOfficer") {
      return <Navigate to="/clearing-officer" replace />;
    }
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default GuestRoute;
