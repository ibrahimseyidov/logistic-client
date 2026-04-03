import React from "react";
import { Navigate, useLocation } from "react-router-dom";

function getTokenFromCookie() {
  const cookieToken = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="))
    ?.split("=")[1];
  return cookieToken || null;
}

export default function RequireAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  const location = useLocation();
  const token = getTokenFromCookie();
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}
