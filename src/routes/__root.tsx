import { createRootRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppTemplate } from "../components";
import { setupDeepLinkHandler } from "../utils/deepLinkHandler";
import { isDevMode } from "../utils/constants";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { useMacOSPermissions } from "../hooks";

export const Route = createRootRoute({
  component: () => {
    const navigate = useNavigate();

    useEffect(() => {
      setupDeepLinkHandler(navigate);
    }, []);

    useMacOSPermissions();

    return (
      <AppTemplate>
        <Outlet />
        {isDevMode && <TanStackRouterDevtools />}
      </AppTemplate>
    );
  },
});
