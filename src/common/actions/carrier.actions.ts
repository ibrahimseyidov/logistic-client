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

export async function fetchCarriersAction(): Promise<any[]> {
  const token = getAuthToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await axios.get(buildApiUrl("/api/carrier"), { headers });
  return res.data;
}

export async function fetchCarrierDetailAction(id: string | number): Promise<any> {
  const token = getAuthToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await axios.get(buildApiUrl(`/api/carrier/${id}`), { headers });
  return res.data;
}

export async function createCarrierAction(data: any): Promise<any> {
  const token = getAuthToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await axios.post(buildApiUrl("/api/carrier"), data, { headers });
  return res.data;
}

export async function updateCarrierAction(id: number | string, data: any): Promise<any> {
  const token = getAuthToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await axios.put(buildApiUrl(`/api/carrier/${id}`), data, { headers });
  return res.data;
}

export async function deleteCarrierAction(id: number | string): Promise<void> {
  const token = getAuthToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  await axios.delete(buildApiUrl(`/api/carrier/${id}`), { headers });
}

export interface UploadedCarrierDocumentFile {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

export async function uploadCarrierDocumentFileAction(
  file: File,
): Promise<UploadedCarrierDocumentFile> {
  const token = getAuthToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const formData = new FormData();
  formData.append("file", file);
  const res = await axios.post(
    buildApiUrl("/api/carrier/documents/upload"),
    formData,
    {
      headers: { ...headers, "Content-Type": "multipart/form-data" },
    },
  );
  return res.data;
}
