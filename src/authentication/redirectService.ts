import type { NavigateFunction } from "react-router-dom";
import { toast } from "react-toastify";

/**
 * Centralized redirect service for authentication failures
 * Uses React Router navigation instead of window.location for seamless redirects
 */
class RedirectService {
  private navigate: NavigateFunction | null = null;

  /**
   * Set the navigate function from useNavigate hook
   */
  setNavigate(navigateFunction: NavigateFunction) {
    this.navigate = navigateFunction;
  }

  /**
   * Redirect to login page with optional message
   */
  redirectToLogin(message?: string, showToast: boolean = true) {
    console.log("🔄 Redirecting to login:", message);

    if (showToast && message) {
      toast.error(message, {
        autoClose: 3000,
        position: "top-center",
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }

    // Add delay to show toast message before redirecting
    const redirectDelay = showToast && message ? 1500 : 100; // 1.5s if showing toast, 100ms otherwise

    setTimeout(() => {
      if (this.navigate) {
        console.log("✅ Using React Router for redirect");
        this.navigate("/login", { replace: true });
      } else {
        // Fallback to window.location if navigate is not available
        console.warn(
          "Navigate function not available, using window.location fallback"
        );
        window.location.href = "/login";
      }
    }, redirectDelay);
  }

  /**
   * Redirect to home page
   */
  redirectToHome() {
    if (this.navigate) {
      this.navigate("/", { replace: true });
    } else {
      window.location.href = "/";
    }
  }

  /**
   * Redirect based on user role
   */
  redirectToDashboard(role: string) {
    let path = "/";

    switch (role) {
      case "admin":
        path = "/admin-side";
        break;
      case "clearingOfficer":
        path = "/clearing-officer";
        break;
      default:
        path = "/unauthorized";
        break;
    }

    if (this.navigate) {
      this.navigate(path, { replace: true });
    } else {
      window.location.href = path;
    }
  }

  /**
   * Handle session timeout with automatic redirect
   */
  handleSessionTimeout() {
    this.redirectToLogin("Your session has timed out. Please log in again.");
  }

  /**
   * Handle unauthorized access
   */
  handleUnauthorizedAccess() {
    this.redirectToLogin("You are not authorized to access this page.");
  }
}

export const redirectService = new RedirectService();
