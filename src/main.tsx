import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";
import { ErrorPage } from "./components";

// Create a new router instance
const router = createRouter({
  routeTree,
  context: {
    // https://tanstack.com/router/latest/docs/framework/react/guide/authenticated-routes
    authSession: null!,
  },
  defaultNotFoundComponent: () => {
    return <ErrorPage />;
  },
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Render the app
const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  );
}
