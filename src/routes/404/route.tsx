import { createFileRoute } from "@tanstack/react-router";
import { ErrorPage } from "../../components";
import { ROUTES } from "../../utils/constants";

export const Route = createFileRoute(ROUTES.NOT_FOUND)({
  component: ErrorPage,
});
