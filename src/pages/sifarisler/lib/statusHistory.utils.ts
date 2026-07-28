/** Format order status-history date + updater for UI. */

export type StatusHistoryLike = {
  status?: string;
  date?: string | Date | null;
  changedBy?: string | null;
};

function formatDateTime(value: unknown): string {
  if (value == null || value === "") return "—";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toLocaleString("az-AZ", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  }

  const text = String(value).trim();
  if (!text) return "—";

  // Already human-readable local string without ISO T/Z
  if (
    !/^\d{4}-\d{2}-\d{2}T/.test(text) &&
    !/Z$/i.test(text) &&
    !/tərəfindən/i.test(text)
  ) {
    return text;
  }

  const d = new Date(text);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleString("az-AZ", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  }
  return text;
}

/**
 * Returns e.g. `28.07.2026, 12:39:17 (tərəfindən: Elmir Admin2)`.
 * Never invents a fake updater name.
 */
export function formatStatusHistoryMeta(item: StatusHistoryLike): string {
  const rawDate = item.date;
  let by = String(item.changedBy ?? "").trim();
  let datePart = "";

  if (typeof rawDate === "string" && /tərəfindən/i.test(rawDate)) {
    const m = rawDate.match(/^(.*?)\s*\(\s*tərəfindən\s*:\s*(.+?)\s*\)\s*$/i);
    if (m) {
      datePart = formatDateTime(m[1].trim());
      if (!by) by = m[2].trim();
    } else {
      datePart = formatDateTime(rawDate);
    }
  } else {
    datePart = formatDateTime(rawDate);
  }

  if (by) return `${datePart} (tərəfindən: ${by})`;
  return datePart;
}
