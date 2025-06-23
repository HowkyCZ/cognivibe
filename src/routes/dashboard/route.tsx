import { createFileRoute, redirect } from "@tanstack/react-router";
import App from "../../components/Dasboard";

// @ts-ignore
export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  beforeLoad: ({ context }) => {
    if (!context.authSession.session) {
      throw redirect({
        to: "/auth/login",
      });
    } else {
      console.log("Dashboard route loaded with session:", context.authSession);
    }
  },
});

function Dashboard() {
  return <App />;
}
