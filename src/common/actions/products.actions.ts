"use server";

import { ENDPOINTS } from "../../services/EndpointResources.g";
import {
  buildApiUrl,
  fetchNoCache,
  handleApiResponse,
} from "../utils/fetch.utils";

export interface ProductRecord {
  id: number;
  name: string;
  barcode: string;
  stockQuantity: number;
  branchStockQuantity?: number | null;
  companyStockQuantity?: number | null;
  stockUnit: string;
  description?: string | null;
  salePrice: number;
  purchasePrice?: number | null;
  imageUrl?: string | null;
  isActive: boolean;
  parentCategoryId: number;
  subCategoryId?: number | null;
}

export async function fetchProducts(companyId: number) {
  const response = await fetchNoCache(
    buildApiUrl(ENDPOINTS.PRODUCTS.BASE, { companyId }),
  );
  const data = await handleApiResponse<{ products?: ProductRecord[] }>(
    response,
    "Ürünler Getirilemedi",
  );
  return data.products || [];
}

export async function searchProducts(
  companyId: number,
  filters: { id?: number; name?: string; barcode?: string },
) {
  const params = new URLSearchParams({ companyId: String(companyId) });

  if (filters.id !== undefined) {
    params.set("id", String(filters.id));
  }

  if (filters.name?.trim()) {
    params.set("name", filters.name.trim());
  }

  if (filters.barcode?.trim()) {
    params.set("barcode", filters.barcode.trim());
  }

  const response = await fetchNoCache(
    buildApiUrl(ENDPOINTS.PRODUCTS.SEARCH, Object.fromEntries(params)),
  );
  const data = await handleApiResponse<{ products?: ProductRecord[] }>(
    response,
    "Urun arama basarisiz",
  );

  return data.products || [];
}

export interface ProductPayload {
  name: string;
  companyId: number;
  parentCategoryId: number;
  subCategoryId: number | null;
  barcode: string;
  stockQuantity: number;
  branchStockQuantity?: number;
  companyStockQuantity?: number;
  stockUnit: string;
  salePrice: number;
  purchasePrice: number | null;
  imageUrl: string | null;
  isActive: boolean;
  description: string | null;
}

export async function createProduct(payload: ProductPayload) {
  const response = await fetch(buildApiUrl(ENDPOINTS.PRODUCTS.BASE), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await handleApiResponse<{ product: ProductRecord }>(
    response,
    "Ürün Oluşturulamadı",
  );
  return data.product;
}

export async function updateProduct(id: number, payload: ProductPayload) {
  const response = await fetch(buildApiUrl(ENDPOINTS.PRODUCTS.BY_ID(id)), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await handleApiResponse<{ product: ProductRecord }>(
    response,
    "Ürün Güncellenemedi",
  );
  return data.product;
}

export async function deleteProduct(id: number, companyId: number) {
  const response = await fetch(
    buildApiUrl(ENDPOINTS.PRODUCTS.BY_ID(id), { companyId }),
    {
      method: "DELETE",
    },
  );
  return handleApiResponse(response, "Ürün Silinemedi");
}

export async function generateUniqueBarcode(
  companyId: number,
): Promise<string> {
  const response = await fetchNoCache(
    buildApiUrl("/api/products/generate-barcode"),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId }),
    },
  );
  const data = await handleApiResponse<{ barcode: string }>(
    response,
    "Barkod üretilemedi",
  );
  return data.barcode;
}
