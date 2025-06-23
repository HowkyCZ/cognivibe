import React from "react";
import { HeroUIProvider, ToastProvider } from "@heroui/react";
import "../../App.css";
interface AppTemplateProps {
  children: React.ReactNode;
}

const AppTemplate: React.FC<AppTemplateProps> = ({ children }) => {
  return (
    <HeroUIProvider>
      <div className="dark text-foreground bg-background">
        {children}
        <ToastProvider placement="top-center" toastOffset={40} />
      </div>
    </HeroUIProvider>
  );
};

export default AppTemplate;
