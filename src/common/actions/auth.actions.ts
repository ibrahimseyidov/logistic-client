import { buildApiUrl } from "../utils/fetch.utils";

interface LoginResponse {
  token: string;
  refreshToken: string;
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
  roleId: number;
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
    id: "local-user-1",
    name: "Ibrahim",
    email: DEMO_EMAIL,
    companyId: 1,
    roleId: 1,
  },
  companyName: "Logistra",
  branches: [
    {
      id: 1,
      name: "Baş ofis",
      companyId: 1,
    },
  ],
};

export async function refreshTokenAction(refreshToken: string) {
  if (refreshToken !== LOCAL_REFRESH_TOKEN) {
    throw new Error("Token yenileme başarısız");
  }

  return {
    token: LOCAL_ACCESS_TOKEN,
    refreshToken: LOCAL_REFRESH_TOKEN,
  } satisfies RefreshResponse;
}

export async function fetchAuthBootstrap() {
  return LOCAL_AUTH_BOOTSTRAP;
}

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  try {
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
  } catch (err: any) {
    throw new Error(err.message || "Login failed");
  }
}
