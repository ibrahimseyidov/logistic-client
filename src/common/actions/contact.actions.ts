import axios from "axios";
import { buildApiUrl } from "../../common/utils/fetch.utils";

export type ContactEntityType = "customer" | "carrier";

export interface ContactPersonRow {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  position: string;
  company: string;
  entityType?: ContactEntityType;
  entityId?: number;
}

function getAuthToken() {
  return localStorage.getItem("token") || "";
}

function getHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchContactPersonsAction(params?: {
  entityType?: ContactEntityType;
  entityId?: string | number;
}): Promise<ContactPersonRow[]> {
  const query = new URLSearchParams();
  if (params?.entityType) query.set("entityType", params.entityType);
  if (params?.entityId !== undefined && params?.entityId !== "") {
    query.set("entityId", String(params.entityId));
  }
  const suffix = query.toString() ? `?${query.toString()}` : "";
  try {
    const res = await axios.get(buildApiUrl(`/api/contact-person${suffix}`), {
      headers: getHeaders(),
    });
    return res.data;
  } catch (err) {
    console.error("Error fetching contact persons", err);
    return [];
  }
}

export async function createContactPersonAction(
  data: Omit<ContactPersonRow, "id"> & {
    entityType: ContactEntityType;
    entityId?: string | number;
  },
): Promise<ContactPersonRow> {
  const res = await axios.post(buildApiUrl("/api/contact-person"), data, {
    headers: getHeaders(),
  });
  return res.data;
}

export async function updateContactPersonAction(
  id: string,
  data: Partial<ContactPersonRow>,
): Promise<ContactPersonRow> {
  const res = await axios.put(buildApiUrl(`/api/contact-person/${id}`), data, {
    headers: getHeaders(),
  });
  return res.data;
}

export async function deleteContactPersonAction(id: string): Promise<void> {
  await axios.delete(buildApiUrl(`/api/contact-person/${id}`), {
    headers: getHeaders(),
  });
}
