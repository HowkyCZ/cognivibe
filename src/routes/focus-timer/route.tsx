import FocusTimerPage from "../../components/pages/FocusTimerPage";
import { createFileRoute } from "@tanstack/react-router";
import { ROUTES } from "../../utils/constants";

export const Route = createFileRoute(ROUTES.FOCUS_TIMER)({
  component: FocusTimer,
});

function FocusTimer() {
  return <FocusTimerPage />;
}
