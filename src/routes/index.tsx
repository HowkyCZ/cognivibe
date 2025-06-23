import { Spinner } from "@heroui/react";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Main,
  // beforeLoad: ({ context }) => {
  //   if (!context.authSession.session) {
  //     throw redirect({
  //       to: "/auth/login",
  //     });
  //   } else if (context.authSession.session) {
  //     throw redirect({
  //       to: "/dashboard",
  //     });
  //   }
  // },
});

function Main() {
  return (
    <div className="flex items-center justify-center h-screen">
      <Spinner size="lg" />
    </div>
  );
}
