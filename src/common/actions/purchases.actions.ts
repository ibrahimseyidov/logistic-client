import { ENDPOINTS } from "../../services/EndpointResources.g";
import {
  buildApiUrl,
  fetchNoCache,
  handleApiResponse,
} from "../utils/fetch.utils";

export interface PurchaseVoucherLinePayload {
  productId: number;
  quantity: number;
  unitPrice: number;
}

export interface PurchaseVoucherPayload {
  serialNo: string;
  type: "alis" | "iade";
  branchName: string;
  warehouseName: string;
  supplierId: number;
  companyId: number;
  voucherDate: string;
  note?: string;
  status?: string;
  lines: PurchaseVoucherLinePayload[];
}

export interface PurchaseVoucherRecord {
  id: number;
  serialNo: string;
  type: "alis" | "iade";
  branchName: string;
  warehouseName: string;
  supplierId: number;
  supplier?: {
    name: string;
  };
  companyId: number;
  voucherDate: string;
  note?: string | null;
  status: string;
  totalAmount: number;
  lines: Array<{
    id: number;
    voucherId: number;
    productId: number;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
}

export interface PurchaseVoucherPageData {
  data: PurchaseVoucherRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PurchaseModalSupplier {
  id: number;
  name: string;
  status: string;
  totalPurchase: number;
}

export interface PurchaseModalProduct {
  id: number;
  name: string;
  barcode: string;
  stockQuantity: number;
  companyStockQuantity?: number | null;
  stockUnit: string;
  purchasePrice?: number | null;
  parentCategory?: { name?: string | null } | null;
}

export interface PurchaseModalWarehouse {
  id: number;
  name: string;
  branchId: number;
  companyId: number;
  branch: {
    name: string;
  };
}

export interface PurchaseModalData {
  suppliers: {
    data: PurchaseModalSupplier[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  products: {
    data: PurchaseModalProduct[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  productCategories: Array<{
    name: string;
    count: number;
  }>;
  supplierCategories: Array<{
    name: string;
    count: number;
  }>;
  warehouses: PurchaseModalWarehouse[];
}

const purchaseVoucherRequests = new Map<
  string,
  Promise<PurchaseVoucherPageData>
>();
const purchaseModalDataRequests = new Map<string, Promise<PurchaseModalData>>();

export async function fetchPurchaseModalData(
  companyId: number,
  params?: {
    productPage?: number;
    productLimit?: number;
    productSearch?: string;
    productCategory?: string;
    supplierPage?: number;
    supplierLimit?: number;
    supplierSearch?: string;
    supplierCategory?: string;
  },
): Promise<PurchaseModalData> {
  const requestKey = JSON.stringify({ companyId, ...params });
  const existingRequest = purchaseModalDataRequests.get(requestKey);
  if (existingRequest) {
    return existingRequest;
  }

  const request = (async () => {
    const response = await fetchNoCache(
      buildApiUrl(ENDPOINTS.PURCHASES.MODAL_DATA, {
        companyId,
        ...(params?.productPage ? { productPage: params.productPage } : {}),
        ...(params?.productLimit ? { productLimit: params.productLimit } : {}),
        ...(params?.productSearch?.trim()
          ? { productSearch: params.productSearch.trim() }
          : {}),
        ...(params?.productCategory && params.productCategory !== "Hamisi"
          ? { productCategory: params.productCategory }
          : {}),
        ...(params?.supplierPage ? { supplierPage: params.supplierPage } : {}),
        ...(params?.supplierLimit
          ? { supplierLimit: params.supplierLimit }
          : {}),
        ...(params?.supplierSearch?.trim()
          ? { supplierSearch: params.supplierSearch.trim() }
          : {}),
        ...(params?.supplierCategory && params.supplierCategory !== "Hamisi"
          ? { supplierCategory: params.supplierCategory }
          : {}),
      }),
    );
    return handleApiResponse<PurchaseModalData>(
      response,
      "Sened modal verileri getirilemedi",
    );
  })();

  purchaseModalDataRequests.set(requestKey, request);

  try {
    return await request;
  } finally {
    purchaseModalDataRequests.delete(requestKey);
  }
}

export async function fetchPurchaseVouchers(
  companyId: number,
  page: number,
  limit: number,
  search?: string,
) {
  const requestKey = JSON.stringify({
    companyId,
    page,
    limit,
    search: search || "",
  });
  const existingRequest = purchaseVoucherRequests.get(requestKey);
  if (existingRequest) {
    return existingRequest;
  }

  const request = (async () => {
    const response = await fetchNoCache(
      buildApiUrl(ENDPOINTS.PURCHASES.BASE, {
        companyId,
        page,
        limit,
        ...(search?.trim() ? { search: search.trim() } : {}),
      }),
    );
    return handleApiResponse<PurchaseVoucherPageData>(
      response,
      "Senedler getirilemedi",
    );
  })();

  purchaseVoucherRequests.set(requestKey, request);

  try {
    return await request;
  } finally {
    purchaseVoucherRequests.delete(requestKey);
  }
}

export async function createPurchaseVoucher(payload: PurchaseVoucherPayload) {
  const response = await fetchNoCache(buildApiUrl(ENDPOINTS.PURCHASES.BASE), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await handleApiResponse<{ voucher: PurchaseVoucherRecord }>(
    response,
    "Sened olusturulamadi",
  );

  return data.voucher;
}

export async function updatePurchaseVoucher(
  id: number,
  payload: PurchaseVoucherPayload,
) {
  const response = await fetchNoCache(
    buildApiUrl(ENDPOINTS.PURCHASES.BY_ID(id)),
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  const data = await handleApiResponse<{ voucher: PurchaseVoucherRecord }>(
    response,
    "Sened guncellenemedi",
  );

  return data.voucher;
}

export async function deletePurchaseVoucher(id: number, companyId: number) {
  const response = await fetchNoCache(
    buildApiUrl(ENDPOINTS.PURCHASES.BY_ID(id), { companyId }),
    { method: "DELETE" },
  );
  return handleApiResponse(response, "Sened silinemedi");
}
