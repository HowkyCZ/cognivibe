import { Spinner } from "@heroui/react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { createSupabaseClient } from "../utils/createSupabaseClient";

// @ts-ignore
export const Route = createFileRoute("/")({
  component: Main,
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
      throw redirect({
        to: "/dashboard",
      });
    }
  },
});

function Main() {
  return (
    <div className="flex items-center justify-center h-screen">
      <Spinner size="lg" />
    </div>
  );
}
