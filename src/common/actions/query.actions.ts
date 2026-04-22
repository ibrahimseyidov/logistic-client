import axios from "axios";
import { buildApiUrl } from "../../common/utils/fetch.utils";
import type { LogisticQueryRow } from "../sorgular/types/sorgu.types";

export async function fetchQueryDetailAction(
  id: string | number,
): Promise<any> {
  const res = await axios.get(buildApiUrl(`/api/query/${id}`));
  return res.data;
}

export async function fetchQueriesAction(): Promise<LogisticQueryRow[]> {
  const res = await axios.get(buildApiUrl("/api/query"));
  if (Array.isArray(res.data)) {
    return res.data;
  } else if (res.data && Array.isArray(res.data.data)) {
    return res.data.data;
  } else {
    return [];
  }
}

export async function createQueryAction(
  fields: Record<string, string | boolean>,
): Promise<LogisticQueryRow> {
  const res = await axios.post(buildApiUrl("/api/query"), fields);
  return res.data;
}

export async function updateQueryAction(
  id: string | number,
  fields: Partial<Record<string, string | boolean>>,
): Promise<LogisticQueryRow> {
  const res = await axios.put(buildApiUrl(`/api/query/${id}`), fields);
  return res.data;
}

export async function deleteQueryAction(id: string | number): Promise<void> {
  await axios.delete(buildApiUrl(`/api/query/${id}`));
}
