import type { AuthUser } from "../actions/auth.actions";

export function getStoredAuthToken(): string {
  if (typeof document !== "undefined") {
    const cookieToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];
    if (cookieToken) return cookieToken;
  }

  try {
    return localStorage.getItem("token") || "";
  } catch {
    return "";
  }
}

export function isAdminUser(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  const role = String(user.role ?? "").toLowerCase();
  if (role === "admin") return true;
  return Number(user.roleId) === 1;
}
