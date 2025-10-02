import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@ant-design/v5-patch-for-react-19";
import "../src/global.css";
import "./index.css";
import "react-toastify/dist/ReactToastify.css";
import App from "./App.tsx";
import { ConfigProvider } from "antd";
import { AuthProvider } from "./authentication/AuthContext.tsx";
import { Provider } from "react-redux";
import { store } from "./store";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <ConfigProvider>
        <Provider store={store}>
          <App />
        </Provider>
      </ConfigProvider>
    </AuthProvider>
  </StrictMode>
);
