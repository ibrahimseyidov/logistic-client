import axios from "axios";
import { buildApiUrl } from "../../common/utils/fetch.utils";
import type { LogisticQueryRow } from "../../pages/sorgular/types/sorgu.types";

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
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  console.log("[fetchQueryDetailAction] token:", token);
  console.log("[fetchQueryDetailAction] headers:", headers);
  const res = await axios.get(buildApiUrl(`/api/query/${id}`), {
    headers,
  });
  return res.data;
}

export async function fetchQueriesAction(
  tab?: string,
): Promise<LogisticQueryRow[]> {
  if (tab === "offers") {
    return [];
  }

  const token = getAuthToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  let url = "/api/query";
  if (tab === "active") {
    url = "/api/query?status=pending";
  } else if (tab === "archive") {
    url = "/api/query?status=cancelled,completed";
  }
  const res = await axios.get(buildApiUrl(url), { headers });
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
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  console.log("[createQueryAction] token:", token);
  console.log("[createQueryAction] headers:", headers);
  const res = await axios.post(buildApiUrl("/api/query"), fields, {
    headers,
  });
  return res.data;
}

export async function updateQueryAction(
  id: string | number,
  fields: Partial<Record<string, string | boolean>>,
): Promise<LogisticQueryRow> {
  const token = getAuthToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  console.log("[updateQueryAction] token:", token);
  console.log("[updateQueryAction] headers:", headers);
  const res = await axios.put(buildApiUrl(`/api/query/${id}`), fields, {
    headers,
  });
  return res.data;
}

export async function deleteQueryAction(id: string | number): Promise<void> {
  const token = getAuthToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  console.log("[deleteQueryAction] token:", token);
  console.log("[deleteQueryAction] headers:", headers);
  await axios.delete(buildApiUrl(`/api/query/${id}`), {
    headers,
  });
}
