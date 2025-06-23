import React from "react";
import ReactDOM from "react-dom/client";
import { AppTemplate, ErrorPage } from "../../components";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AppTemplate>
      <ErrorPage />
    </AppTemplate>
  </React.StrictMode>
);
