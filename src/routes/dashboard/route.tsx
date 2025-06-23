import { createFileRoute, redirect } from "@tanstack/react-router";
import App from "../../components/Dasboard";
import { createSupabaseClient } from "../../utils/createSupabaseClient";

// @ts-ignore
export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  beforeLoad: async () => {
    const supabase = createSupabaseClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (!session || error) {
      console.log("No session found, redirecting to login");
      throw redirect({
        to: "/auth/login",
      });
    } else {
      console.log("Dashboard route loaded with session:", session.user?.email);
    }
  },
});

function Dashboard() {
  return <App />;
}
