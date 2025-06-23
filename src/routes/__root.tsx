import {
  createRootRoute,
  createRootRouteWithContext,
  Outlet,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { AppTemplate } from "../components";

export const Route = createRootRoute({
  component: () => (
    <AppTemplate>
      <Outlet />
      <TanStackRouterDevtools />
    </AppTemplate>
  ),
});
