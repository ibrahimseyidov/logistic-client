export function formatDateOnly(value: string | null | undefined): string {
  if (!value) return "—";

  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleDateString("az-AZ", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  const datePart = value.split("T")[0]?.trim();
  if (!datePart) return "—";

  const fallback = new Date(datePart);
  if (!Number.isNaN(fallback.getTime())) {
    return fallback.toLocaleDateString("az-AZ", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  return datePart;
}

/** Local calendar day as YYYY-MM-DD (UTC shift olmadan). */
export function toDateIso(value: string | null | undefined): string {
  if (!value) return "";
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    return raw.slice(0, 10);
  }
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function inDateRange(
  value: string | null | undefined,
  from: string,
  to: string,
): boolean {
  if (!from && !to) return true;
  const v = toDateIso(value);
  if (!v) return false;
  if (from && v < from) return false;
  if (to && v > to) return false;
  return true;
}

export function includesText(
  haystack: string | null | undefined,
  needle: string | null | undefined,
): boolean {
  const n = String(needle || "").trim().toLowerCase();
  if (!n) return true;
  return String(haystack || "")
    .toLowerCase()
    .includes(n);
}
