"use server";

import { ENDPOINTS } from "../../services/EndpointResources.g";
import {
  buildApiUrl,
  fetchNoCache,
  handleApiResponse,
} from "../utils/fetch.utils";

export interface CategoryRecord {
  id: number;
  name: string;
  companyCategoryId?: number | null;
  parentId?: number | null;
}

export async function fetchAllCategories(companyId: number) {
  const response = await fetchNoCache(
    buildApiUrl(ENDPOINTS.CATEGORIES.BASE, { companyId }),
  );
  const data = await handleApiResponse<{ categories?: CategoryRecord[] }>(
    response,
    "Kategoriler getirilemedi",
  );
  return data.categories || [];
}

export async function fetchParentCategories(companyId: number) {
  const response = await fetchNoCache(
    buildApiUrl(`${ENDPOINTS.CATEGORIES.BASE}/parents`, { companyId }),
  );
  const data = await handleApiResponse<{ categories?: CategoryRecord[] }>(
    response,
    "Kategoriler getirilemedi",
  );
  return data.categories || [];
}

export async function fetchChildrenForParent(
  parentId: number,
  companyId: number,
) {
  const response = await fetchNoCache(
    buildApiUrl(`${ENDPOINTS.CATEGORIES.BY_ID(parentId)}/children`, {
      companyId,
    }),
  );
  const data = await handleApiResponse<{ categories?: CategoryRecord[] }>(
    response,
    "Alt kategoriler getirilemedi",
  );
  return data.categories || [];
}

interface CategoryPayload {
  name: string;
  companyId: number;
  parentId: number | null;
}

export async function createCategory(payload: CategoryPayload) {
  const response = await fetch(buildApiUrl(ENDPOINTS.CATEGORIES.BASE), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await handleApiResponse<{ category: CategoryRecord }>(
    response,
    "Kategori oluşturulamadı",
  );
  return data.category;
}

export async function updateCategory(id: number, payload: CategoryPayload) {
  const response = await fetch(buildApiUrl(ENDPOINTS.CATEGORIES.BY_ID(id)), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await handleApiResponse<{ category: CategoryRecord }>(
    response,
    "Kategori güncellenemedi",
  );
  return data.category;
}

export async function deleteCategory(id: number, companyId: number) {
  const response = await fetch(
    buildApiUrl(ENDPOINTS.CATEGORIES.BY_ID(id), { companyId }),
    {
      method: "DELETE",
    },
  );
  return handleApiResponse(response, "Kategori silinemedi");
}
