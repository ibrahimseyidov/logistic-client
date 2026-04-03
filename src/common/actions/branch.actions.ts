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

export async function fetchBranches(companyId: number): Promise<Branch[]> {
  const response = await fetchNoCache(buildApiUrl(`/branches`, { companyId }));
  const data = await handleApiResponse<{ branches?: Branch[] }>(
    response,
    "Şirket şubeleri getirilemedi",
  );
  return data.branches || [];
}
