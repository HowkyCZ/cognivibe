import { createFileRoute } from "@tanstack/react-router";
import ErrorPage from "pages/ErrorPage";

export const Route = createFileRoute("/404")({
  component: ErrorPage,
});
