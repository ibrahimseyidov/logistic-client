"use client";

import { useCallback, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { isAdminUser } from "../utils/auth.utils";
import {
  can as canPerm,
  parseUserPermissions,
  type CrudAction,
  type UserPermissions,
} from "../../pages/ayarlar/lib/permissions.utils";

/**
 * Cari istifadəçinin icazələri.
 * Admin → tam giriş. Digərləri → saxlanmış permissions JSON.
 * Açıq = görünür + istifadə olunur; bağlı = gizlidir + istifadə olunmur.
 */
export function usePermissions() {
  const { user, authReady } = useAuth();
  const isAdmin = isAdminUser(user);

  const perms: UserPermissions = useMemo(
    () => parseUserPermissions(user?.permissions),
    [user?.permissions],
  );

  const can = useCallback(
    (moduleId: string, action: CrudAction = "view", childId?: string) => {
      if (!user) return false;
      if (isAdmin) return true;
      return canPerm(perms, moduleId, action, childId);
    },
    [user, isAdmin, perms],
  );

  const canView = useCallback(
    (moduleId: string, childId?: string) => can(moduleId, "view", childId),
    [can],
  );
  const canCreate = useCallback(
    (moduleId: string, childId?: string) => can(moduleId, "create", childId),
    [can],
  );
  const canEdit = useCallback(
    (moduleId: string, childId?: string) => can(moduleId, "edit", childId),
    [can],
  );
  const canDelete = useCallback(
    (moduleId: string, childId?: string) => can(moduleId, "delete", childId),
    [can],
  );

  return {
    authReady,
    isAdmin,
    perms,
    can,
    canView,
    canCreate,
    canEdit,
    canDelete,
  };
}
