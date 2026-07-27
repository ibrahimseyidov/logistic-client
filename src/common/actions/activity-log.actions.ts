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

export type ActivityLogRow = {
  id: number;
  userId: number | null;
  userName: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  summary: string;
  details: string | null;
  createdAt: string;
};

export async function fetchActivityLogsAction(params: {
  limit?: number;
  offset?: number;
  q?: string;
  entityType?: string;
} = {}): Promise<{ items: ActivityLogRow[]; total: number }> {
  const token = getAuthToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const query = new URLSearchParams();
  if (params.limit != null) query.set("limit", String(params.limit));
  if (params.offset != null) query.set("offset", String(params.offset));
  if (params.q) query.set("q", params.q);
  if (params.entityType) query.set("entityType", params.entityType);
  const qs = query.toString();
  const url = qs ? `/api/activity-logs?${qs}` : `/api/activity-logs`;
  const res = await axios.get(buildApiUrl(url), { headers });
  return res.data;
}
