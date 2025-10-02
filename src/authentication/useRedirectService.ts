import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { redirectService } from "./redirectService";

/**
 * Hook to initialize the redirect service with React Router's navigate function
 * This should be used at the app level to ensure navigation is available
 */
export const useRedirectService = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Set the navigate function in the redirect service
    redirectService.setNavigate(navigate);
  }, [navigate]);
};
