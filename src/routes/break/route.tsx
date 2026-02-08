import BreakPage from "../../components/pages/BreakPage";
import { createFileRoute } from "@tanstack/react-router";
import { ROUTES } from "../../utils/constants";

export const Route = createFileRoute(ROUTES.BREAK)({
  component: Break,
});

function Break() {
  return <BreakPage />;
}
