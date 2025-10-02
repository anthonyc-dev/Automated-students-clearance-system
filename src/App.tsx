import React from "react";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes";
import { ToastContainer } from "react-toastify";
import { useRedirectService } from "./authentication/useRedirectService";

// Component to initialize redirect service inside Router context
const AppWithRedirectService: React.FC = () => {
  useRedirectService(); // Initialize redirect service with navigate function

  return (
    <>
      <AppRoutes />
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        style={{ zIndex: 9999 }}
      />
    </>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppWithRedirectService />
    </BrowserRouter>
  );
};

export default App;
