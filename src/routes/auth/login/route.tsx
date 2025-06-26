import { LoginPage } from "../../../components";
import { createFileRoute } from "@tanstack/react-router";
import { redirectIfAuthenticated } from "../../../utils/userService";

// @ts-ignore
export const Route = createFileRoute("/auth/login")({
  component: Login,
  beforeLoad: async () => {
    await redirectIfAuthenticated();
  },
});

function Login() {
  return <LoginPage />;
}
