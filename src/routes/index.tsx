import { createFileRoute } from "@tanstack/react-router";
import { redirectByAuthStatus } from "../utils/userService";
import { SpinnerPage } from "../components";
import { ROUTES } from "../utils/constants";

export const Route = createFileRoute(ROUTES.HOME)({
  component: Main,
  beforeLoad: async () => {
    await redirectByAuthStatus();
  },
});

function Main() {
  return <SpinnerPage />;
}
