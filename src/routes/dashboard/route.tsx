import { createFileRoute } from "@tanstack/react-router";
import DashboardPage from "../../components/pages/DashboardPage";
import { requireAuthentication } from "../../utils/userService";
import { ROUTES } from "../../utils/constants";

export const Route = createFileRoute(ROUTES.DASHBOARD)({
  component: Dashboard,
  beforeLoad: async () => {
    await requireAuthentication();
  },
});

function Dashboard() {
  return <DashboardPage />;
}
