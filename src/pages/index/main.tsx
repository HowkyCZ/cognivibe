import React from "react";
import ReactDOM from "react-dom/client";
import { AppTemplate, ProtectedRoute } from "../../components";
import Router from "../../pages/Router";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AppTemplate>
      <ProtectedRoute>
        <Router />
      </ProtectedRoute>
    </AppTemplate>
  </React.StrictMode>
);
