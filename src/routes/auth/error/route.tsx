import { createFileRoute, useSearch, useRouter } from "@tanstack/react-router";
import { IconLogin } from "@tabler/icons-react";
import ErrorPage from "../../../components/pages/ErrorPage";
import { ROUTES } from "../../../utils/constants";

type ErrorSearch = {
  error?: string;
  error_code?: string;
  error_description?: string;
};

export const Route = createFileRoute(ROUTES.ERROR)({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>): ErrorSearch => {
    return {
      error: search.error as string,
      error_code: search.error_code as string,
      error_description: search.error_description as string,
    };
  },
});

function RouteComponent() {
  const router = useRouter();
  const { error, error_code, error_description } = useSearch({
    from: ROUTES.ERROR,
  });

  const getErrorMessage = () => {
    if (error === "access_denied" && error_code === "otp_expired") {
      return "Email link has expired. Please request a new login link.";
    }

    if (error_description) {
      return decodeURIComponent(error_description.replace(/\+/g, " "));
    }

    return "An error occurred during authentication. Please try again.";
  };

  return (
    <ErrorPage
      title="Authentication error"
      description={getErrorMessage()}
      buttonText="Go back to login"
      buttonIcon={<IconLogin size={20} />}
      onButtonPress={() => {
        router.navigate({ to: ROUTES.LOGIN });
      }}
    />
  );
}
