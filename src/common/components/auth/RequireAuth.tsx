import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { usePermissions } from "../../hooks/usePermissions";
import { routeToPermission } from "../../../pages/ayarlar/lib/permissions.utils";

function getTokenFromCookie() {
  const cookieToken = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="))
    ?.split("=")[1];
  return cookieToken || null;
}

/**
 * Token + səhifə icazəsi (view).
 * Bağlı view → səhifə açılmır, ana səhifəyə yönləndirilir.
 */
export default function RequireAuth({
  children,
  moduleId,
  childId,
  action = "view",
  skipPermission = false,
}: {
  children: React.ReactNode;
  moduleId?: string;
  childId?: string;
  action?: "view" | "create" | "edit" | "delete";
  /** / və /no-access kimi xüsusi səhifələr */
  skipPermission?: boolean;
}) {
  const location = useLocation();
  const { authReady } = useAuth();
  const { can } = usePermissions();
  const token = getTokenFromCookie();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!authReady) {
    return null;
  }

  if (!skipPermission) {
    let mod = moduleId;
    let child = childId;
    if (!mod) {
      const mapped = routeToPermission(location.pathname, location.search);
      if (mapped) {
        mod = mapped.moduleId;
        child = mapped.childId;
      }
    }

    if (mod && !can(mod, action, child)) {
      return <Navigate to="/no-access" replace />;
    }
  }

  return <>{children}</>;
}
