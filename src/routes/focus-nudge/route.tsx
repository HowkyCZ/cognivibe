import FocusNudgePage from "../../components/pages/FocusNudgePage";
import { createFileRoute } from "@tanstack/react-router";
import { ROUTES } from "../../utils/constants";

export const Route = createFileRoute(ROUTES.FOCUS_NUDGE)({
  component: FocusNudge,
});

function FocusNudge() {
  return <FocusNudgePage />;
}
