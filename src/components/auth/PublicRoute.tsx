import React, { useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";

interface PublicRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

const PublicRoute: React.FC<PublicRouteProps> = ({
  children,
  redirectTo = "/",
}) => {
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading && session) {
      console.log("User already authenticated, redirecting to main app");
      window.location.href = redirectTo;
    }
  }, [session, loading, redirectTo]);

  // Don't render anything while loading or if user is authenticated
  if (loading || session) {
    return null;
  }

  return <>{children}</>;
};

export default PublicRoute;
