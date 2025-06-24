import { createFileRoute, useSearch, useRouter } from "@tanstack/react-router";
import { Button, Image } from "@heroui/react";
import WavyBackground from "../../../components/ui/WavyBackground";
import logotypeSvg from "../../../assets/logotype.svg";
import detectiveEmoji from "../../../assets/emojis/animated/detective.png";
import { IconLogin } from "@tabler/icons-react";

type ErrorSearch = {
  error?: string;
  error_code?: string;
  error_description?: string;
};

export const Route = createFileRoute("/auth/error" as any)({
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
    from: "/auth/error" as any,
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
    <WavyBackground
      containerClassName="bg-black"
      colors={["#a07cef", "#ff709b", "#5c6dfd", "#a07cef"]}
      backgroundFill="#14181b"
    >
      <div className="flex w-full max-w-md flex-col gap-6 rounded-large bg-content1 px-8 pb-10 pt-6 shadow-small text-center">
        <div className="flex flex-col items-center gap-4">
          <img
            src={logotypeSvg}
            alt="CogniVibe Logo"
            className="h-12 mb-2 object-contain"
          />

          <div className="flex flex-col items-center gap-2">
            <Image
              src={detectiveEmoji}
              alt="Detective Emoji"
              width={64}
              height={64}
            />
            <h2 className="text-xl font-medium text-default-700">
              Authentication error
            </h2>
          </div>

          <p className="text-small text-default-500 text-center max-w-sm">
            {getErrorMessage()}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            className="w-full"
            color="primary"
            size="lg"
            startContent={<IconLogin size={20} />}
            onPress={() => {
              router.navigate({ to: "/auth/login" as any });
            }}
          >
            Go back to login
          </Button>
        </div>
      </div>
    </WavyBackground>
  );
}
