import React, { useEffect } from "react";
import { Spinner } from "@heroui/react";
import { useAuth } from "../../hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  redirectTo = "/auth/login",
}) => {
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading && !session && window.location.pathname !== redirectTo) {
      console.log("No session found, redirecting to login");
      window.location.href = redirectTo;
    }
  }, [session, loading, redirectTo]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  // If no session and we're not on the login page, don't render children
  // (redirect will happen in useEffect)
  if (!session && window.location.pathname !== redirectTo) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
