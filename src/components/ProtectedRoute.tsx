import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../authentication/useAuth";
import ScreenLoading from "./ScreenLoading";

interface Props {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<Props> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, role, loading } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication
  if (loading) {
    return <ScreenLoading />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Check role-based access
  if (allowedRoles && !allowedRoles.includes(role || "")) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
