import React from "react";
import { Button, Input, Link, Form, addToast } from "@heroui/react";
import { Icon } from "@iconify/react";
import logotypeSvg from "../../assets/logotype.svg";
import { createSupabaseClient } from "../../utils/createSupabaseClient";
import { isDevMode, ROUTES } from "../../utils/constants";
import { openExternalUrl } from "../../utils/openExternalUrl";

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const supabase = createSupabaseClient();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      // Local Supabase is configured to allow redirects like `cognivibe://auth/callback`.
      // In production we keep the existing behavior unchanged.
      const emailRedirectTo = isDevMode
        ? "cognivibe://auth/callback"
        : `cognivibe://localhost${ROUTES.CALLBACK}`;

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo,
        },
      });
      if (error) {
        throw error;
      }

      addToast({
        title: "Magic link sent!",
        description:
          "Check your email and click the link to sign in to CogniVibe.",
        color: "success",
        timeout: 8000,
        variant: "flat",
      });
    } catch (error) {
      console.error("Error sending magic link:", error);
      addToast({
        title: "Error sending magic link",
        description:
          error instanceof Error ? error.message : "An unknown error occurred.",
        color: "danger",
        timeout: 5000,
        variant: "flat",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh w-full bg-background flex items-center justify-center p-6">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-large bg-content1 px-8 pb-10 pt-6 shadow-small">
        <div className="flex flex-col items-center gap-2">
          <img
            src={logotypeSvg}
            alt="CogniVibe Logo"
            className="h-12 mb-2 object-contain"
          />
          <h1 className="text-large font-medium text-foreground">
            Welcome to CogniVibe
          </h1>
          <p className="text-small text-foreground/60 text-center">
            Sign in or create an account to start monitoring your cognitive
            performance
          </p>
        </div>

        <Form
          className="flex flex-col gap-3"
          validationBehavior="native"
          onSubmit={handleSubmit}
        >
          <Input
            isRequired
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            variant="bordered"
            isDisabled={isLoading}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button
            className="w-full"
            color="primary"
            type="submit"
            startContent={
              !isLoading ? (
                <Icon icon="solar:letter-bold" width={20} />
              ) : undefined
            }
            isLoading={isLoading}
            isDisabled={isLoading || email.trim() === ""}
          >
            {isLoading ? "Sending magiclink" : "Send magic link"}
          </Button>
          <p className="text-center text-tiny text-foreground/60">
            By continuing, you agree to our{" "}
            <Link
              onPress={async () => await openExternalUrl("/terms")}
              className="text-primary text-tiny cursor-pointer"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              onPress={async () => await openExternalUrl("/privacy")}
              className="text-primary text-tiny cursor-pointer"
            >
              Privacy Policy
            </Link>
          </p>
        </Form>
      </div>
    </div>
  );
};

export default LoginPage;
