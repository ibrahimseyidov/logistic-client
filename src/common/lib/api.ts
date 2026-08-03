import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Auth token utility
export const getAuthToken = () => {
  if (typeof window === "undefined") return null;
  
  // Try localStorage first
  const localToken = localStorage.getItem("token");
  if (localToken) return localToken;

  // Fallback to cookies
  const cookieToken = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="))
    ?.split("=")[1];
  
  return cookieToken || null;
};

// Request Interceptor: Add Authorization Header
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Global Errors (like 401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const code = error.response?.data?.code;
      const deactivated = code === "ACCOUNT_DEACTIVATED";
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("auth_bootstrap_v1");
      } catch {
        /* ignore */
      }
      document.cookie = "token=; path=/; max-age=0";
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = deactivated
          ? "/login?reason=deactivated"
          : "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
