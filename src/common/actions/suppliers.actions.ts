import { ENDPOINTS } from "../../services/EndpointResources.g";
import { Supplier } from "../../pages/suppliers/types/supplier.types";
import {
  buildApiUrl,
  fetchNoCache,
  handleApiResponse,
} from "../utils/fetch.utils";

const inFlightSupplierRequests = new Map<string, Promise<Supplier[]>>();

export async function fetchSuppliers(companyId: number) {
  const url = buildApiUrl(ENDPOINTS.SUPPLIERS.BASE, { companyId });
  const inFlight = inFlightSupplierRequests.get(url);

  if (inFlight) {
    return inFlight;
  }

  const request = fetchNoCache(url)
    .then((response) =>
      handleApiResponse<{ suppliers?: Supplier[] }>(
        response,
        "Tedarikçiler getirilemedi",
      ),
    )
    .then((data) => data.suppliers || [])
    .finally(() => {
      inFlightSupplierRequests.delete(url);
    });

  inFlightSupplierRequests.set(url, request);
  return request;
}

export async function createSupplier(
  data: Omit<Supplier, "id" | "createdAt" | "updatedAt"> & {
    companyId: number;
  },
) {
  const response = await fetchNoCache(buildApiUrl(ENDPOINTS.SUPPLIERS.BASE), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const result = await handleApiResponse<{ supplier: Supplier }>(
    response,
    "Tedarikçi oluşturulamadı",
  );
  return result.supplier;
}

export async function updateSupplier(
  id: number,
  data: Partial<Supplier> & { companyId: number },
) {
  const response = await fetchNoCache(
    buildApiUrl(ENDPOINTS.SUPPLIERS.BY_ID(id)),
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  );
  const result = await handleApiResponse<{ supplier: Supplier }>(
    response,
    "Tedarikçi güncellenemedi",
  );
  return result.supplier;
}

export async function deleteSupplier(id: number, companyId: number) {
  const response = await fetchNoCache(
    buildApiUrl(ENDPOINTS.SUPPLIERS.BY_ID(id), { companyId }),
    { method: "DELETE" },
  );
  return handleApiResponse(response, "Tedarikçi silinemedi");
}

export async function addSupplierPayment(
  id: number,
  amount: number,
  companyId: number,
  branchId: number,
  tillId: number,
) {
  const response = await fetchNoCache(
    buildApiUrl(ENDPOINTS.SUPPLIERS.PAYMENT_BY_ID(id)),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, companyId, branchId, tillId }),
    },
  );
  const result = await handleApiResponse<{ supplier: Supplier }>(
    response,
    "Ödeme eklenemedi",
  );
  return result.supplier;
}
