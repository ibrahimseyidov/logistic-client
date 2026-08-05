import axios from "axios";
import { buildApiUrl } from "../utils/fetch.utils";

function getAuthToken() {
  return localStorage.getItem("token") || "";
}

function getHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export type BackupItem = {
  fileName: string;
  size: number;
  createdAt: string;
};

async function throwIfBlobError(res: { data: Blob; status: number }) {
  if (res.status >= 400) {
    let message = "Backup əməliyyatı uğursuz oldu.";
    try {
      const text = await res.data.text();
      const parsed = JSON.parse(text);
      if (parsed?.message) message = String(parsed.message);
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
}

function triggerBlobDownload(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function fetchBackupListAction(): Promise<BackupItem[]> {
  const res = await axios.get(buildApiUrl("/api/backup"), {
    headers: getHeaders(),
  });
  return Array.isArray(res.data?.items) ? res.data.items : [];
}

export async function createBackupAction(): Promise<{
  item: BackupItem;
  items: BackupItem[];
}> {
  const res = await axios.post(
    buildApiUrl("/api/backup/create"),
    {},
    { headers: getHeaders() },
  );
  return {
    item: res.data?.item,
    items: Array.isArray(res.data?.items) ? res.data.items : [],
  };
}

export async function downloadBackupFileAction(fileName: string): Promise<void> {
  const res = await axios.get(
    buildApiUrl(`/api/backup/download/${encodeURIComponent(fileName)}`),
    {
      headers: getHeaders(),
      responseType: "blob",
      validateStatus: () => true,
    },
  );
  await throwIfBlobError(res);
  triggerBlobDownload(
    new Blob([res.data], { type: "application/zip" }),
    fileName,
  );
}

export async function createAndDownloadBackupAction(): Promise<BackupItem[]> {
  const created = await createBackupAction();
  if (created.item?.fileName) {
    await downloadBackupFileAction(created.item.fileName);
  }
  return created.items;
}
