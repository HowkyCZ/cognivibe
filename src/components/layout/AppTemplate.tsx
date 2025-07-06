import React from "react";
import { HeroUIProvider, ToastProvider } from "@heroui/react";
import "../../App.css";
interface AppTemplateProps {
  children: React.ReactNode;
}
import type { NavigateOptions, ToOptions } from "@tanstack/react-router";
import { useRouter } from "@tanstack/react-router";

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: Omit<NavigateOptions, keyof ToOptions>;
  }
}

const AppTemplate: React.FC<AppTemplateProps> = ({ children }) => {
  let router = useRouter();

  return (
    <HeroUIProvider
      navigate={(to, options) => router.navigate({ to, ...options })}
    >
      {children}
      <ToastProvider placement="top-center" toastOffset={40} />
    </HeroUIProvider>
  );
};

export default AppTemplate;
