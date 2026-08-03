import { buildApiUrl } from "../utils/fetch.utils";
import { getStoredAuthToken } from "../utils/auth.utils";

interface LoginResponse {
  token: string;
  refreshToken: string;
  user?: {
    id: number;
    email: string;
    name: string;
    role?: string;
  };
}

interface RefreshResponse {
  token: string;
  refreshToken: string;
}

export interface AuthBranch {
  id: number;
  name: string;
  companyId: number;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  companyId: number;
  role: string;
  /** active | deactive */
  status?: string;
  /** @deprecated Prefer `role` from API */
  roleId?: number;
  /** JSON string və ya parse olunmuş icazələr */
  permissions?: string | null;
}

export class AccountDeactivatedError extends Error {
  code = "ACCOUNT_DEACTIVATED" as const;
  constructor(message = "Hesab deaktiv edilib") {
    super(message);
    this.name = "AccountDeactivatedError";
  }
}

export function isAccountDeactivatedError(err: unknown): boolean {
  if (err instanceof AccountDeactivatedError) return true;
  if (!err || typeof err !== "object") return false;
  const anyErr = err as { code?: string; message?: string };
  return (
    anyErr.code === "ACCOUNT_DEACTIVATED" ||
    /deaktiv/i.test(String(anyErr.message || ""))
  );
}

export interface AuthBootstrapData {
  user: AuthUser;
  companyName: string | null;
  branches: AuthBranch[];
}

const LOCAL_ACCESS_TOKEN = "local-demo-token";
const LOCAL_REFRESH_TOKEN = "local-demo-refresh-token";
const DEMO_EMAIL = "ibrahim@gmail.com";
const DEMO_PASSWORD = "1234";

const LOCAL_AUTH_BOOTSTRAP: AuthBootstrapData = {
  user: {
    id: "1",
    name: "Ibrahim",
    email: DEMO_EMAIL,
    companyId: 1,
    role: "admin",
    roleId: 1,
    permissions: null,
  },
  companyName: "Ziyalog",
  branches: [
    {
      id: 1,
      name: "Baş ofis",
      companyId: 1,
    },
  ],
};

function mapMeResponseToBootstrap(data: {
  id: number;
  name: string;
  email: string;
  role?: string;
  status?: string;
  permissions?: string | null;
}): AuthBootstrapData {
  return {
    user: {
      id: String(data.id),
      name: data.name,
      email: data.email,
      companyId: 1,
      role: data.role || "operator",
      status: data.status || "active",
      permissions:
        typeof data.permissions === "string"
          ? data.permissions
          : data.permissions != null
            ? JSON.stringify(data.permissions)
            : null,
    },
    companyName: null,
    branches: [],
  };
}

export async function refreshTokenAction(refreshToken: string) {
  if (refreshToken !== LOCAL_REFRESH_TOKEN) {
    throw new Error("Token yenileme başarısız");
  }

  return {
    token: LOCAL_ACCESS_TOKEN,
    refreshToken: LOCAL_REFRESH_TOKEN,
  } satisfies RefreshResponse;
}

export async function fetchAuthBootstrap(): Promise<AuthBootstrapData> {
  const token = getStoredAuthToken();
  if (!token || token === LOCAL_ACCESS_TOKEN) {
    return LOCAL_AUTH_BOOTSTRAP;
  }

  const response = await fetch(buildApiUrl("/api/user/me"), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (
      errorData?.code === "ACCOUNT_DEACTIVATED" ||
      /deaktiv/i.test(String(errorData?.message || ""))
    ) {
      throw new AccountDeactivatedError(
        errorData?.message || "Hesab deaktiv edilib",
      );
    }
    throw new Error(errorData?.message || "İstifadəçi məlumatları yüklənmədi");
  }

  const data = await response.json();
  if (String(data?.status || "").trim().toLowerCase() === "deactive") {
    throw new AccountDeactivatedError("Hesab deaktiv edilib");
  }
  return mapMeResponseToBootstrap(data);
}

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
    return {
      token: LOCAL_ACCESS_TOKEN,
      refreshToken: LOCAL_REFRESH_TOKEN,
    } satisfies LoginResponse;
  }

  const url = buildApiUrl("/api/auth/login");
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (
      errorData?.code === "ACCOUNT_DEACTIVATED" ||
      /deaktiv/i.test(String(errorData?.message || ""))
    ) {
      throw new AccountDeactivatedError(
        errorData?.message || "Hesabınız deaktiv edilib. Giriş mümkün deyil.",
      );
    }
    throw new Error(errorData.message || "Login failed");
  }
  return (await response.json()) as LoginResponse;
}
