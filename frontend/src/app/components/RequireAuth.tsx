import React from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useUser } from "../../hooks/auth/useAuth";
import { isLoggedIn } from "../../storage/auth/auth.storage";

export default function RequireAuth({
  children,
}: {
  children?: React.ReactNode;
}) {
  const location = useLocation();
  const { isLoading, isError, data: user } = useUser();

  if (!isLoggedIn()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isLoading) {
    return <div style={{ padding: 24 }}>Cargando…</div>;
  }

  if (isError || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ?? <Outlet />;
}
