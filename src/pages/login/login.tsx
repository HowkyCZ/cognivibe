import React from "react";
import ReactDOM from "react-dom/client";
import { AppTemplate, LoginPage, PublicRoute } from "../../components";

ReactDOM.createRoot(document.getElementById("login-root")!).render(
  <React.StrictMode>
    <AppTemplate>
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    </AppTemplate>
  </React.StrictMode>
);
