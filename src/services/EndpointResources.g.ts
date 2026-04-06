export const ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    ME: "/api/auth/me",
    BOOTSTRAP: "/api/auth/bootstrap",
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
  SUPPLIERS: {
    BASE: "/api/suppliers",
    BY_ID: (id: number) => `/api/suppliers/${id}`,
    PURCHASE_BY_ID: (id: number) => `/api/suppliers/${id}/purchase`,
    PAYMENT_BY_ID: (id: number) => `/api/suppliers/${id}/payment`,
  },
  PURCHASES: {
    BASE: "/api/purchases",
    MODAL_DATA: "/api/purchases/modal-data",
    BY_ID: (id: number) => `/api/purchases/${id}`,
  },
  TILLS: {
    BASE: "/api/tills",
    BY_BRANCH: (branchId: number) => `/api/tills?branchId=${branchId}`,
    OVERVIEW: "/api/tills/overview",
    TRANSACTIONS: (tillId: number) => `/api/tills/${tillId}/transactions`,
    TRANSFER: (tillId: number) => `/api/tills/${tillId}/transfer`,
  },
  BRANCHES: {
    BY_COMPANY: (companyId: number) => `/api/branches/company/${companyId}`,
    WAREHOUSES_BY_BRANCH: (branchId: number) =>
      `/api/branches/${branchId}/warehouses`,
  },
} as const;
