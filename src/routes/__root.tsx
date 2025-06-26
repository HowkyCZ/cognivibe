import { createRootRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppTemplate } from "../components";
import { setupDeepLinkHandler } from "../utils/deepLinkHandler";

export const Route = createRootRoute({
  component: () => {
    const navigate = useNavigate();
    useEffect(() => {
      setupDeepLinkHandler(navigate);
    }, [navigate]);

    return (
      <AppTemplate>
        <Outlet />
        {/* <TanStackRouterDevtools /> */}
      </AppTemplate>
    );
  },
});
