import React, { useEffect, useState } from "react";
import App from "./index/App";
import { ErrorPage } from "../components/layout";
import { isValidRoute, getCurrentPath } from "../utils/navigation";

const Router: React.FC = () => {
  const [currentPath, setCurrentPath] = useState(getCurrentPath());

  useEffect(() => {
    // Listen for navigation changes (e.g., browser back/forward)
    const handlePopState = () => {
      setCurrentPath(getCurrentPath());
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Check if current route is valid
  if (isValidRoute(currentPath)) {
    return <App />;
  }

  // For any other route, show error page
  return <ErrorPage />;
};

export default Router;
