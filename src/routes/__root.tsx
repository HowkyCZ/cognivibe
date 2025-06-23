import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { AppTemplate } from "../components";
import { Session } from "@supabase/supabase-js";

interface RootRouteContext {
  authSession: Session | null;
}

export const Route = createRootRouteWithContext<RootRouteContext>()({
  component: () => (
    <AppTemplate>
      <Outlet />
      <TanStackRouterDevtools />
    </AppTemplate>
  ),
});
