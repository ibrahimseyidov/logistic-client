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

export async function fetchCustomersAction(): Promise<any[]> {
  const token = getAuthToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await axios.get(buildApiUrl("/api/customer"), { headers });
  return res.data;
}

export async function fetchCustomerDetailAction(id: string | number): Promise<any> {
  const token = getAuthToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await axios.get(buildApiUrl(`/api/customer/${id}`), { headers });
  return res.data;
}

export async function createCustomerAction(data: any): Promise<any> {
  const token = getAuthToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await axios.post(buildApiUrl("/api/customer"), data, { headers });
  return res.data;
}

export async function updateCustomerAction(id: number | string, data: any): Promise<any> {
  const token = getAuthToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await axios.put(buildApiUrl(`/api/customer/${id}`), data, { headers });
  return res.data;
}

export async function deleteCustomerAction(id: number | string): Promise<void> {
  const token = getAuthToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  await axios.delete(buildApiUrl(`/api/customer/${id}`), { headers });
}
