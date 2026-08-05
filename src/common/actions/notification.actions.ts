import axios from "axios";
import { buildApiUrl } from "../../common/utils/fetch.utils";

function getAuthToken() {
  return localStorage.getItem("token") || "";
}

function getHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export type AppNotification = {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  taskId: number | null;
  link: string | null;
  read: boolean;
  createdAt: string;
  task?: { id: number; title: string; status: string } | null;
};

export async function fetchNotificationsAction(
  unreadOnly = false,
): Promise<AppNotification[]> {
  try {
    const res = await axios.get(buildApiUrl("/api/notifications"), {
      headers: getHeaders(),
      params: unreadOnly ? { unreadOnly: true } : undefined,
    });
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.error("Error fetching notifications", err);
    return [];
  }
}

export async function fetchUnreadNotificationCountAction(): Promise<number> {
  try {
    const res = await axios.get(buildApiUrl("/api/notifications/unread-count"), {
      headers: getHeaders(),
    });
    return Number(res.data?.count || 0);
  } catch (err) {
    console.error("Error fetching unread count", err);
    return 0;
  }
}

export async function markNotificationReadAction(id: number): Promise<void> {
  await axios.put(buildApiUrl(`/api/notifications/${id}/read`), {}, {
    headers: getHeaders(),
  });
}

export async function markAllNotificationsReadAction(): Promise<void> {
  await axios.put(buildApiUrl("/api/notifications/read-all"), {}, {
    headers: getHeaders(),
  });
}

export async function clearAllNotificationsAction(): Promise<void> {
  await axios.delete(buildApiUrl("/api/notifications/clear"), {
    headers: getHeaders(),
  });
}

export type NotificationDigestSettings = {
  enabled: boolean;
  time: string;
  timezone?: string;
  lastSentAt?: string | null;
};

export async function fetchNotificationSettingsAction(): Promise<NotificationDigestSettings> {
  const res = await axios.get(buildApiUrl("/api/notifications/settings"), {
    headers: getHeaders(),
  });
  return {
    enabled: Boolean(res.data?.enabled),
    time: String(res.data?.time || "09:00"),
    timezone: String(res.data?.timezone || "Asia/Baku"),
    lastSentAt: res.data?.lastSentAt || null,
  };
}

export async function updateNotificationSettingsAction(payload: {
  enabled: boolean;
  time: string;
}): Promise<NotificationDigestSettings> {
  const res = await axios.put(
    buildApiUrl("/api/notifications/settings"),
    payload,
    { headers: getHeaders() },
  );
  return {
    enabled: Boolean(res.data?.enabled),
    time: String(res.data?.time || "09:00"),
    timezone: String(res.data?.timezone || "Asia/Baku"),
    lastSentAt: res.data?.lastSentAt || null,
  };
}
