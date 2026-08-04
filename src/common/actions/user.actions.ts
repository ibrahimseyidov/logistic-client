import axios from "axios";
import { buildApiUrl } from "../../common/utils/fetch.utils";
import { UserRow } from "../../pages/ayarlar/types/user.types";

function getAuthToken() {
  return localStorage.getItem("token") || "";
}

export async function fetchUsersAction(): Promise<UserRow[]> {
  const token = getAuthToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  try {
    const res = await axios.get(buildApiUrl("/api/user"), { headers });
    return Array.isArray(res.data) ? res.data : [];
  } catch (err: any) {
    // Köhnə admin-only cavab və ya şəbəkə xətası — directory fallback
    if (err?.response?.status === 403 || err?.response?.status === 401) {
      return fetchUserDirectoryAction() as Promise<UserRow[]>;
    }
    throw err;
  }
}

/** Active users for task assignment (available to all authenticated users). */
export async function fetchUserDirectoryAction(): Promise<
  Array<{ id: number; name: string; email: string; role: string }>
> {
  const token = getAuthToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  try {
    const res = await axios.get(buildApiUrl("/api/user/directory"), { headers });
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.error("Error fetching user directory", err);
    return [];
  }
}

export async function createUserAction(fields: any): Promise<UserRow> {
  const token = getAuthToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await axios.post(buildApiUrl("/api/user"), fields, { headers });
  return res.data;
}

export async function updateUserAction(id: number, fields: any): Promise<UserRow> {
  const token = getAuthToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await axios.put(buildApiUrl(`/api/user/${id}`), fields, { headers });
  return res.data;
}

export async function deleteUserAction(id: number): Promise<void> {
  const token = getAuthToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  await axios.delete(buildApiUrl(`/api/user/${id}`), { headers });
}
