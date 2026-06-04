import axios from "axios";
import { buildApiUrl } from "../../common/utils/fetch.utils";

function getAuthToken() {
  return localStorage.getItem("token") || "";
}

export interface LookupRow {
  id: string | number;
  value: string;
  label?: string; // Optional depending on how you use it
}

export async function fetchLookupAction(type: string): Promise<LookupRow[]> {
  const token = getAuthToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  try {
    const res = await axios.get(buildApiUrl(`/api/lookup/${type}`), { headers });
    return res.data;
  } catch (err) {
    console.error(`Error fetching lookup for type: ${type}`, err);
    return [];
  }
}

export async function createLookupAction(type: string, data: Partial<LookupRow>): Promise<LookupRow> {
  const token = getAuthToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await axios.post(buildApiUrl(`/api/lookup/${type}`), data, { headers });
  return res.data;
}

export async function updateLookupAction(type: string, id: string | number, data: Partial<LookupRow>): Promise<LookupRow> {
  const token = getAuthToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await axios.put(buildApiUrl(`/api/lookup/${id}?type=${type}`), data, { headers });
  return res.data;
}

export async function deleteLookupAction(type: string, id: string | number): Promise<void> {
  const token = getAuthToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  await axios.delete(buildApiUrl(`/api/lookup/${id}?type=${type}`), { headers });
}
