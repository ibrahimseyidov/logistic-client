export const ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    ME: "/api/auth/me",
    REFRESH: "/api/auth/refresh",
  },
  CATEGORIES: {
    BASE: "/api/categories",
    BY_ID: (id: number) => `/api/categories/${id}`,
  },
  PRODUCTS: {
    BASE: "/api/products",
    SEARCH: "/api/products/search",
    BY_ID: (id: number) => `/api/products/${id}`,
  },
} as const;
