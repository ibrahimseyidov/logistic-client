const API = import.meta.env.VITE_API_URL?.replace(/\/$/, "");

export const ENDPOINTS = {
  AUTH: {
    LOGIN: `${API}/auth/login`,
    REGISTER: `${API}/auth/register`,
    ME: `${API}/auth/me`,
    BOOTSTRAP: `${API}/auth/bootstrap`,
    REFRESH: `${API}/auth/refresh`,
  },
  CATEGORIES: {
    BASE: `${API}/categories`,
    BY_ID: (id: number) => `${API}/categories/${id}`,
  },
  PRODUCTS: {
    BASE: `${API}/products`,
    SEARCH: `${API}/products/search`,
    BY_ID: (id: number) => `${API}/products/${id}`,
  },
  SUPPLIERS: {
    BASE: `${API}/suppliers`,
    BY_ID: (id: number) => `${API}/suppliers/${id}`,
    PURCHASE_BY_ID: (id: number) => `${API}/suppliers/${id}/purchase`,
    PAYMENT_BY_ID: (id: number) => `${API}/suppliers/${id}/payment`,
  },
  PURCHASES: {
    BASE: `${API}/purchases`,
    MODAL_DATA: `${API}/purchases/modal-data`,
    BY_ID: (id: number) => `${API}/purchases/${id}`,
  },
  TILLS: {
    BASE: `${API}/tills`,
    BY_BRANCH: (branchId: number) => `${API}/tills?branchId=${branchId}`,
    OVERVIEW: `${API}/tills/overview`,
    TRANSACTIONS: (tillId: number) => `${API}/tills/${tillId}/transactions`,
    TRANSFER: (tillId: number) => `${API}/tills/${tillId}/transfer`,
  },
  BRANCHES: {
    BY_COMPANY: (companyId: number) => `${API}/branches/company/${companyId}`,
    WAREHOUSES_BY_BRANCH: (branchId: number) =>
      `${API}/branches/${branchId}/warehouses`,
  },
} as const;
