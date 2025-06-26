import WavyBackground from "../layout/WavyBackground";

import React from "react";
import { Button, Input, Link, Form, Divider, addToast } from "@heroui/react";
import { Icon } from "@iconify/react";
import logotypeSvg from "../../assets/logotype.svg";
import { createSupabaseClient } from "../../utils/createSupabaseClient";
import { ROUTES } from "../../utils/constants";

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
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `cognivibe://localhost/${ROUTES.CALLBACK}`,
        },
      });
      if (error) {
        throw error;
      }

      // Show success toast
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

  const handleOAuthLogin = async (provider: "google" | "github") => {
    try {
      // Simulate OAuth login
      await new Promise((resolve) => setTimeout(resolve, 1500));
      // Redirect to main app on success
      window.location.href = "/";
    } catch (error) {
      console.error(`${provider} login failed:`, error);
    }
  };

  return (
    <WavyBackground
      containerClassName="bg-black"
      colors={["#a07cef", "#ff709b", "#5c6dfd", "#a07cef"]}
      backgroundFill="#14181b"
    >
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-large bg-content1 px-8 pb-10 pt-6 shadow-small">
        <div className="flex flex-col items-center gap-2">
          <img
            src={logotypeSvg}
            alt="CogniVibe Logo"
            className="h-12 mb-2 object-contain"
          />{" "}
          <h1 className="text-large font-medium">Welcome to CogniVibe</h1>
          <p className="text-small text-default-500 text-center">
            Sign in or create an account to start monitoring your cognitive
            performance
          </p>{" "}
        </div>

        <div className="flex flex-col gap-2">
          <Button
            startContent={<Icon icon="flat-color-icons:google" width={24} />}
            variant="bordered"
            onPress={() => handleOAuthLogin("google")}
            // isDisabled={isLoading}
            isDisabled
          >
            Continue with Google
          </Button>
          <Button
            startContent={
              <Icon className="text-default-500" icon="fe:github" width={24} />
            }
            variant="bordered"
            onPress={() => handleOAuthLogin("github")}
            // isDisabled={isLoading}
            isDisabled
          >
            Continue with Github
          </Button>
        </div>
        <div className="flex items-center gap-4 py-2">
          <Divider className="flex-1" />
          <p className="shrink-0 text-tiny text-default-500">OR</p>
          <Divider className="flex-1" />
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
          <p className="text-center text-tiny text-default-500">
            By continuing, you agree to our{" "}
            <Link
              href="https://cognivibe.com/terms"
              className="text-primary text-tiny"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="https://cognivibe.com/privacy"
              className="text-primary text-tiny"
            >
              Privacy Policy
            </Link>{" "}
          </p>
        </Form>
      </div>
    </WavyBackground>
  );
};

export default LoginPage;
