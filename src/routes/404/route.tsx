import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Button, Image } from "@heroui/react";
import WavyBackground from "../../components/ui/WavyBackground";
import logotypeSvg from "../../assets/logotype.svg";
import detectiveEmoji from "../../assets/emojis/animated/detective.png";
import { IconHomeFilled } from "@tabler/icons-react";

export const Route = createFileRoute("/404")({
  component: RouteComponent,
});

function RouteComponent() {
  const router = useRouter();

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
              Page Not Found
            </h2>
          </div>

          <p className="text-small text-default-500 text-center max-w-sm">
            Oops! The page you're looking for doesn't exist. It might have been
            moved, deleted, or you entered the wrong URL.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            className="w-full"
            color="primary"
            size="lg"
            startContent={<IconHomeFilled size={20} />}
            onPress={() => {
              router.navigate({ to: "/" as any });
            }}
          >
            Go Home
          </Button>
        </div>
      </div>
    </WavyBackground>
  );
}
