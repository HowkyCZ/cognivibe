import BreakWarningPage from "../../components/pages/BreakWarningPage";
import { createFileRoute } from "@tanstack/react-router";
import { ROUTES } from "../../utils/constants";

export const Route = createFileRoute(ROUTES.BREAK_WARNING)({
  component: BreakWarning,
});

function BreakWarning() {
  return <BreakWarningPage />;
}
