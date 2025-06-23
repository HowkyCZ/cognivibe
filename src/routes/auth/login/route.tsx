import { LoginPage } from "../../../components";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { createSupabaseClient } from "../../../utils/createSupabaseClient";

// @ts-ignore
export const Route = createFileRoute("/auth/login")({
  component: Login,
  beforeLoad: ({ context }) => {
    if (context.authSession.session) {
      throw redirect({
        to: "/",
      });
    }
  },
});

function Login() {
  console.log("Login component rendered");
  const supabase = createSupabaseClient();
  console.log(async () => await supabase.auth.getSession());
  return <LoginPage />;
}
