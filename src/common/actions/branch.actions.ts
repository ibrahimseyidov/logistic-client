import { ENDPOINTS } from "../../services/EndpointResources.g";
import {
  buildApiUrl,
  fetchNoCache,
  handleApiResponse,
} from "../utils/fetch.utils";

export interface Branch {
  id: number;
  name: string;
  companyId: number;
}

export interface Warehouse {
  id: number;
  name: string;
  branchId: number;
  companyId: number;
}

export async function fetchBranches(companyId: number): Promise<Branch[]> {
  const response = await fetchNoCache(
    buildApiUrl(ENDPOINTS.BRANCHES.BY_COMPANY(companyId)),
  );
  const data = await handleApiResponse<{ branches?: Branch[] }>(
    response,
    "Filiallar getirilemedi",
  );
  return data.branches || [];
}

export async function fetchWarehousesByBranch(
  branchId: number,
  companyId: number,
): Promise<Warehouse[]> {
  const response = await fetchNoCache(
    buildApiUrl(ENDPOINTS.BRANCHES.WAREHOUSES_BY_BRANCH(branchId), {
      companyId,
    }),
  );

  const data = await handleApiResponse<{ warehouses?: Warehouse[] }>(
    response,
    "Anbarlar getirilemedi",
  );

  return data.warehouses || [];
}
