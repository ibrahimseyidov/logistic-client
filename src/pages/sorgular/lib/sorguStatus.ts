import { SorguStatus } from "../types/sorgu.types";
import {
  getStatusTone,
  type StatusTone,
} from "../../../common/components/StatusBadge";

/** Aktiv tab — arxivə düşməyənlər */
export const SORGU_ACTIVE_STATUSES: string[] = [
  SorguStatus.NewQuery,
  SorguStatus.WaitingOffer,
  SorguStatus.Evaluated,
  SorguStatus.Offered,
  // legacy
  "pending",
  "completed",
];

/** Arxiv — yalnız təsdiq və ləğv */
export const SORGU_ARCHIVE_STATUSES: string[] = [
  SorguStatus.Approved,
  SorguStatus.Cancelled,
];

export const SORGU_STATUS_OPTIONS: Array<{
  value: SorguStatus;
  label: string;
  tone: StatusTone;
}> = [
  { value: SorguStatus.NewQuery, label: "Yeni sorğu", tone: "rose" },
  {
    value: SorguStatus.WaitingOffer,
    label: "Təklif Gözlənilir",
    tone: "amber",
  },
  { value: SorguStatus.Evaluated, label: "Qiymətləndirildi", tone: "emerald" },
  { value: SorguStatus.Offered, label: "Təklif edildi", tone: "sky" },
  { value: SorguStatus.Approved, label: "Təsdiq", tone: "emerald" },
  { value: SorguStatus.Cancelled, label: "Ləğv", tone: "rose" },
];

/** Köhnə dəyərləri yeni statusa normallaşdır */
export function normalizeSorguStatus(value: string | null | undefined): string {
  const v = String(value || "")
    .trim()
    .toLowerCase();
  if (!v) return SorguStatus.NewQuery;
  if (v === "pending") return SorguStatus.NewQuery;
  if (v === "completed") return SorguStatus.Evaluated;
  return v;
}

export function isSorguActiveStatus(status: string | null | undefined): boolean {
  const n = normalizeSorguStatus(status);
  return (
    n === SorguStatus.NewQuery ||
    n === SorguStatus.WaitingOffer ||
    n === SorguStatus.Evaluated ||
    n === SorguStatus.Offered
  );
}

export function isSorguArchiveStatus(
  status: string | null | undefined,
): boolean {
  const n = normalizeSorguStatus(status);
  return n === SorguStatus.Approved || n === SorguStatus.Cancelled;
}

export function countSorguStatuses(
  rows: Array<{ status?: string | null }>,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const opt of SORGU_STATUS_OPTIONS) {
    counts[opt.value] = 0;
  }
  for (const row of rows) {
    const key = normalizeSorguStatus(row.status);
    if (key in counts) counts[key] += 1;
  }
  return counts;
}

const HISTORY_TONE_COLORS: Record<StatusTone, string> = {
  amber: "#d97706",
  cyan: "#0891b2",
  emerald: "#047857",
  rose: "#b91c1c",
  slate: "#475569",
  sky: "#0369a1",
  violet: "#6d28d9",
};

export function getSorguStatusHistoryColor(status: string): string {
  return HISTORY_TONE_COLORS[getStatusTone(status)] || "#1d4ed8";
}
