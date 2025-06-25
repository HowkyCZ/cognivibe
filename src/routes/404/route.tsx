import { createFileRoute } from "@tanstack/react-router";
import ErrorPage from "../../components/layout/ErrorPage";

export const Route = createFileRoute("/404")({
  component: ErrorPage,
});
