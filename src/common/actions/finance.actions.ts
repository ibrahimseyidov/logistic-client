import axios from "axios";
import { buildApiUrl } from "../../common/utils/fetch.utils";

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

export async function fetchFinanceTransactionsAction(params: any = {}): Promise<any[]> {
  const token = getAuthToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const query = new URLSearchParams(params).toString();
  const url = query ? `/api/finance?${query}` : `/api/finance`;
  const res = await axios.get(buildApiUrl(url), { headers }).catch(() => ({ data: [] }));
  return res.data;
}

export async function createFinanceTransactionAction(data: any): Promise<any> {
  const token = getAuthToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await axios.post(buildApiUrl("/api/finance"), data, { headers });
  return res.data;
}

export async function updateFinanceTransactionAction(id: number, data: any): Promise<any> {
  const token = getAuthToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await axios.put(buildApiUrl(`/api/finance/${id}`), data, { headers });
  return res.data;
}

export async function deleteFinanceTransactionAction(id: number): Promise<any> {
  const token = getAuthToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await axios.delete(buildApiUrl(`/api/finance/${id}`), { headers });
  return res.data;
}

export async function fetchInvoicesAction(): Promise<any[]> {
  const token = getAuthToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await axios.get(buildApiUrl("/api/invoices"), { headers }).catch(() => ({ data: [] }));
  return res.data;
}
