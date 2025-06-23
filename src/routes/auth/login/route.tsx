import { LoginPage } from "../../../components";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { createSupabaseClient } from "../../../utils/createSupabaseClient";

// @ts-ignore
export const Route = createFileRoute("/auth/login")({
  component: Login,
  beforeLoad: async () => {
    const supabase = createSupabaseClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (session && !error) {
      console.log("Session found, redirecting to dashboard");
      throw redirect({
        to: "/",
      });
    }
  },
});

function Login() {
  return <LoginPage />;
}
