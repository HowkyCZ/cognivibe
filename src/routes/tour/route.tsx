import { TourPage } from "../../components";
import { createFileRoute } from "@tanstack/react-router";
import { ROUTES } from "../../utils/constants";

export const Route = createFileRoute(ROUTES.TOUR)({
  component: Tour,
});

function Tour() {
  return <TourPage />;
}
