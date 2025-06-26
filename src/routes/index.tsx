import { createFileRoute } from "@tanstack/react-router";
import { redirectByAuthStatus } from "../utils/userService";
import { SpinnerPage } from "../components";

export const Route = createFileRoute("/")({
  component: Main,
  beforeLoad: async () => {
    await redirectByAuthStatus();
  },
});

function Main() {
  return <SpinnerPage />;
}
