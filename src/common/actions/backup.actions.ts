import axios from "axios";
import { buildApiUrl } from "../utils/fetch.utils";

function getAuthToken() {
  return localStorage.getItem("token") || "";
}

function getHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function downloadBackupZipAction(fileName: string): Promise<void> {
  const res = await axios.get(buildApiUrl("/api/backup/export"), {
    headers: getHeaders(),
    responseType: "blob",
  });

  const blob = new Blob([res.data], { type: "application/zip" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
