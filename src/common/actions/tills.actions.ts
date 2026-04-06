import { ENDPOINTS } from "../../services/EndpointResources.g";
import {
  buildApiUrl,
  fetchNoCache,
  handleApiResponse,
} from "../utils/fetch.utils";

export interface Till {
  id: number;
  name: string;
  branchId: number;
  balance: number;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface TillTransaction {
  id: number;
  tillId: number;
  type: "medaxil" | "mexaric" | "gider";
  amount: number;
  description?: string;
  counterpartyType?: "supplier" | "customer" | "till";
  counterpartyId?: number;
  counterpartyName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TillTransferResult {
  sourceTill: Till;
  targetTill: Till;
  sourceTransaction: TillTransaction;
  targetTransaction: TillTransaction;
}

export interface TillOverview {
  tills: Till[];
  transactions: TillTransaction[];
  selectedTillId: number | null;
}

interface FetchTillTransactionsParams {
  startDate?: string;
  endDate?: string;
}

interface FetchTillOverviewParams extends FetchTillTransactionsParams {
  branchId: number;
  companyId: number;
  tillId?: number;
}

const inFlightTillRequests = new Map<string, Promise<Till[]>>();
const inFlightTransactionRequests = new Map<
  string,
  Promise<TillTransaction[]>
>();
const inFlightOverviewRequests = new Map<string, Promise<TillOverview>>();

export async function fetchTills(branchId: number, companyId: number) {
  const url = buildApiUrl(ENDPOINTS.TILLS.BASE, { branchId, companyId });
  const inFlight = inFlightTillRequests.get(url);

  if (inFlight) {
    return inFlight;
  }

  const request = fetchNoCache(url)
    .then((response) =>
      handleApiResponse<{ tills?: Till[] }>(response, "Kasalar getirilemedi"),
    )
    .then((data) => data.tills || [])
    .finally(() => {
      inFlightTillRequests.delete(url);
    });

  inFlightTillRequests.set(url, request);
  return request;
}

export async function createTill(
  name: string,
  branchId: number,
  companyId: number,
) {
  const response = await fetchNoCache(buildApiUrl(ENDPOINTS.TILLS.BASE), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, branchId, companyId }),
  });
  const result = await handleApiResponse<{ till: Till }>(
    response,
    "Kassa oluşturulamadı",
  );
  return result.till;
}

export async function deleteTill(
  id: number,
  branchId: number,
  companyId: number,
) {
  const response = await fetchNoCache(
    buildApiUrl(`${ENDPOINTS.TILLS.BASE}/${id}/branch/${branchId}`, {
      companyId,
    }),
    { method: "DELETE" },
  );
  return handleApiResponse(response, "Kassa silinemedi");
}

export async function fetchTillTransactions(
  tillId: number,
  params?: FetchTillTransactionsParams,
) {
  const url = buildApiUrl(ENDPOINTS.TILLS.TRANSACTIONS(tillId), params);
  const inFlight = inFlightTransactionRequests.get(url);

  if (inFlight) {
    return inFlight;
  }

  const request = fetchNoCache(url)
    .then((response) =>
      handleApiResponse<{ transactions?: TillTransaction[] }>(
        response,
        "İşlemler getirilemedi",
      ),
    )
    .then((data) => data.transactions || [])
    .finally(() => {
      inFlightTransactionRequests.delete(url);
    });

  inFlightTransactionRequests.set(url, request);
  return request;
}

export async function fetchTillOverview(params: FetchTillOverviewParams) {
  const url = buildApiUrl(ENDPOINTS.TILLS.OVERVIEW, params);
  const inFlight = inFlightOverviewRequests.get(url);

  if (inFlight) {
    return inFlight;
  }

  const request = fetchNoCache(url)
    .then((response) =>
      handleApiResponse<TillOverview>(response, "Kassa görünümü getirilemedi"),
    )
    .finally(() => {
      inFlightOverviewRequests.delete(url);
    });

  inFlightOverviewRequests.set(url, request);
  return request;
}

export async function createTillTransaction(
  tillId: number,
  payload: {
    companyId: number;
    type: "medaxil" | "mexaric" | "gider";
    amount: number;
    description?: string;
    counterpartyType?: "supplier" | "customer" | "till";
    counterpartyId?: number;
    counterpartyName?: string;
  },
) {
  const response = await fetchNoCache(
    buildApiUrl(ENDPOINTS.TILLS.TRANSACTIONS(tillId)),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  const result = await handleApiResponse<{ transaction: TillTransaction }>(
    response,
    "İşlem kaydedilemedi",
  );
  return result.transaction;
}

export async function transferBetweenTills(
  sourceTillId: number,
  payload: {
    companyId: number;
    targetTillId: number;
    amount: number;
    description?: string;
  },
) {
  const response = await fetchNoCache(
    buildApiUrl(ENDPOINTS.TILLS.TRANSFER(sourceTillId)),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  const result = await handleApiResponse<TillTransferResult>(
    response,
    "Transfer kaydedilemedi",
  );
  return result;
}
