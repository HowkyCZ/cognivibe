import { createFileRoute } from "@tanstack/react-router";
import DashboardPage from "../../components/pages/DashboardPage";
import { requireAuthentication } from "../../utils/userService";

// @ts-ignore
export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  beforeLoad: async () => {
    await requireAuthentication();
  },
});

function Dashboard() {
  return <DashboardPage />;
}
