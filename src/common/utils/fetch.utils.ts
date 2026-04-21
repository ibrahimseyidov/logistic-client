import { refreshTokenAction } from "../actions/auth.actions";

const getApiBaseUrl = (): string => {
  let url = "api.ziyalog.com";
  // Remove trailing slash for consistency
  if (url.endsWith("/")) url = url.slice(0, -1);
  return url;
};

export type BaseResponse<T> = T & {
  error?: unknown;
  message?: unknown;
};

const toErrorMessage = (value: unknown): string | null => {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object") {
    const objectValue = value as Record<string, unknown>;
    const nestedMessage = toErrorMessage(objectValue.message);
    if (nestedMessage) {
      return nestedMessage;
    }

    try {
      return JSON.stringify(value);
    } catch {
      return null;
    }
  }

  return null;
};

export const buildApiUrl = (
  path: string,
  params?: Record<string, string | number | boolean | null | undefined>,
) => {
  let baseUrl = getApiBaseUrl();
  // If env already ends with /api and path starts with /api, avoid double /api
  if (baseUrl.endsWith("/api") && path.startsWith("/api")) {
    path = path.replace(/^\/api/, "");
  }
  const url = new URL(`${baseUrl}${path.startsWith("/") ? path : "/" + path}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        return;
      }
      url.searchParams.set(key, String(value));
    });
  }

  return url.toString();
};

export const fetchNoCache = async (
  input: RequestInfo | URL,
  init?: RequestInit,
  retry = true,
): Promise<Response> => {
  let token = "";
  // Öncelik localStorage, yoksa cookie
  try {
    token = localStorage.getItem("token") || "";
  } catch {}
  if (!token && typeof document !== "undefined") {
    const cookieToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];
    if (cookieToken) token = cookieToken;
  }
  const headers = new Headers(init?.headers || {});
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  let response = await fetch(input, { ...init, headers, cache: "no-store" });
  if (response.status === 401 && retry) {
    // Refresh token ile yeni access token almayı dene
    let refreshToken = "";
    try {
      refreshToken = localStorage.getItem("refreshToken") || "";
    } catch {}
    if (!refreshToken && typeof document !== "undefined") {
      const cookieRefresh = document.cookie
        .split("; ")
        .find((row) => row.startsWith("refreshToken="))
        ?.split("=")[1];
      if (cookieRefresh) refreshToken = cookieRefresh;
    }
    if (refreshToken) {
      try {
        const data = await refreshTokenAction(refreshToken);
        localStorage.setItem("token", data.token);
        localStorage.setItem("refreshToken", data.refreshToken);
        // Tekrar dene (sonsuz döngü olmaması için retry=false)
        return fetchNoCache(input, init, false);
      } catch {
        // Refresh başarısızsa logout veya yönlendirme yapılabilir
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
      }
    } else {
      window.location.href = "/login";
    }
  }
  return response;
};

export const handleApiResponse = async <T>(
  response: Response,
  fallbackMessage: string,
): Promise<T> => {
  let data: BaseResponse<T> | null = null;

  try {
    data = (await response.json()) as BaseResponse<T>;
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      toErrorMessage(data?.error) ||
      toErrorMessage(data?.message) ||
      fallbackMessage;
    throw new Error(message);
  }

  return (data ?? ({} as T)) as T;
};
