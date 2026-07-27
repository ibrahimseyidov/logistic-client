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
  /** @deprecated Prefer `role` from API */
  roleId?: number;
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
}): AuthBootstrapData {
  return {
    user: {
      id: String(data.id),
      name: data.name,
      email: data.email,
      companyId: 1,
      role: data.role || "operator",
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
    throw new Error("İstifadəçi məlumatları yüklənmədi");
  }

  const data = await response.json();
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
    throw new Error(errorData.message || "Login failed");
  }
  return (await response.json()) as LoginResponse;
}
