import { LoginPage } from "../../../components";
import { createFileRoute } from "@tanstack/react-router";
import { redirectIfAuthenticated } from "../../../utils/userService";
import { ROUTES } from "../../../utils/constants";

export const Route = createFileRoute(ROUTES.LOGIN)({
  component: Login,
  beforeLoad: async () => {
    await redirectIfAuthenticated();
  },
});

function Login() {
  return <LoginPage />;
}
