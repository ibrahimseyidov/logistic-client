export type NotificationInputType =
  | "error"
  | "info"
  | "success"
  | "added"
  | "updated"
  | "deleted";

export type NotificationKind =
  | "error"
  | "info"
  | "success"
  | "added"
  | "updated"
  | "deleted";

export interface NotificationTheme {
  title: string;
  toneClass: string;
}

const ADDED_PATTERN = /yaradıldı|əlavə|yükləndi|saxlanıldı|qeydiyyat/i;
const UPDATED_PATTERN = /yeniləndi|yenilənib|redaktə|dəyişdirildi|dəyişildi|statusu yeniləndi/i;
const DELETED_PATTERN = /silindi|silinib|silmək/i;

export function resolveNotificationKind(
  type: NotificationInputType,
  message: string,
): NotificationKind {
  if (type === "added" || type === "updated" || type === "deleted" || type === "error" || type === "info") {
    return type;
  }

  const lower = message.toLowerCase();

  if (DELETED_PATTERN.test(lower)) return "deleted";
  if (UPDATED_PATTERN.test(lower)) return "updated";
  if (ADDED_PATTERN.test(lower)) return "added";

  return "success";
}

export function getNotificationTheme(kind: NotificationKind): NotificationTheme {
  switch (kind) {
    case "added":
      return { title: "Əlavə edildi", toneClass: "added" };
    case "updated":
      return { title: "Yeniləndi", toneClass: "updated" };
    case "deleted":
      return { title: "Silindi", toneClass: "deleted" };
    case "error":
      return { title: "Xəta", toneClass: "error" };
    case "info":
      return { title: "Məlumat", toneClass: "info" };
    default:
      return { title: "Uğurlu", toneClass: "success" };
  }
}
