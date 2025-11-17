import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../authentication/useAuth";

interface Props {
  children: React.ReactNode;
}

const GuestRoute: React.FC<Props> = ({ children }) => {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  // Redirect authenticated users to their respective dashboards
  if (isAuthenticated) {
    // On the login page, let the page handle showing success modal and navigation
    if (location.pathname === "/login") {
      return <>{children}</>;
    }
    if (role === "admin") {
      return <Navigate to="/admin-side" replace />;
    }
    if (
      role === "clearingOfficer" ||
      role === "sao" ||
      role === "registrar" ||
      role === "cashier" ||
      role === "laboratory" ||
      role === "library" ||
      role === "tailoring" ||
      role === "guidance" ||
      role === "dean"
    ) {
      return <Navigate to="/clearing-officer" replace />;
    }
    // For other roles (e.g., student), allow staying on the page so the Login screen
    // can handle showing an info/error modal instead of redirecting away immediately.
    return <>{children}</>;
  }

  return <>{children}</>;
};

export default GuestRoute;
