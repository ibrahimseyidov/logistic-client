
import axios from "axios";
import { buildApiUrl } from "../../common/utils/fetch.utils";
import type { LogisticQueryRow } from "../sorgular/types/sorgu.types";

function getAuthToken() {
  let token = "";
  try {
    token = localStorage.getItem("token") || "";
  } catch {}
  if (!token && typeof document !== "undefined") {
    const cookieToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];
    if (cookieToken) token = cookieToken;
  }
  return token;
}

export async function fetchQueryDetailAction(
  id: string | number,
): Promise<any> {
  const token = getAuthToken();
  const res = await axios.get(buildApiUrl(`/api/query/${id}`), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.data;
}

export async function fetchQueriesAction(): Promise<LogisticQueryRow[]> {
  const token = getAuthToken();
  const res = await axios.get(buildApiUrl("/api/query"), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
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
  const token = getAuthToken();
  const res = await axios.post(buildApiUrl("/api/query"), fields, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.data;
}

export async function updateQueryAction(
  id: string | number,
  fields: Partial<Record<string, string | boolean>>,
): Promise<LogisticQueryRow> {
  const token = getAuthToken();
  const res = await axios.put(buildApiUrl(`/api/query/${id}`), fields, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.data;
}

export async function deleteQueryAction(id: string | number): Promise<void> {
  const token = getAuthToken();
  await axios.delete(buildApiUrl(`/api/query/${id}`), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}
