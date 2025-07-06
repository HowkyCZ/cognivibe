import { createRootRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppTemplate } from "../components";
import { setupDeepLinkHandler } from "../utils/deepLinkHandler";
import { isInDevelopment } from "../utils/constants";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export const Route = createRootRoute({
  component: () => {
    const navigate = useNavigate();
    useEffect(() => {
      setupDeepLinkHandler(navigate);
    }, []);

    return (
      <AppTemplate>
        <Outlet />
        {isInDevelopment && <TanStackRouterDevtools />}
      </AppTemplate>
    );
  },
});
