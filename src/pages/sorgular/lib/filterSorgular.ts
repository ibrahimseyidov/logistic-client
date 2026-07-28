import type {
  FilterFormState,
  LogisticQueryRow,
  SorguSubTab,
} from "../types/sorgu.types";

/** Local YYYY-MM-DD — UTC ilə gün sürüşməsinin qarşısını alır */
function dayOnly(iso: string | null | undefined): string {
  if (!iso) return "";
  const raw = String(iso).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function inRange(value: string, from: string, to: string): boolean {
  if (!from && !to) return true;
  if (!value) return false;
  const v = value.slice(0, 10);
  if (from && v < from) return false;
  if (to && v > to) return false;
  return true;
}

function includesText(
  haystack: string | null | undefined,
  needle: string | null | undefined,
): boolean {
  const n = String(needle || "").trim().toLowerCase();
  if (!n) return true;
  return String(haystack || "")
    .toLowerCase()
    .includes(n);
}

export function filterByTab(
  rows: LogisticQueryRow[],
  tab: SorguSubTab,
): LogisticQueryRow[] {
  if (tab === "active") {
    return rows.filter((r) => r.status === "pending");
  }
  if (tab === "archive") {
    return rows.filter(
      (r) =>
        r.status === "cancelled" ||
        r.status === "completed" ||
        r.status === "approved",
    );
  }
  if (tab === "offers") {
    const offerRows: LogisticQueryRow[] = [];
    rows.forEach((r) => {
      const items = (r as any).priceOfferItems;
      if (Array.isArray(items) && items.length > 0) {
        items.forEach((off: any, idx: number) => {
          offerRows.push({
            ...r,
            id: `${r.id}-off-${idx}`,
            priceOffers: `${off.carrierName}: ${off.price} ${off.currency}`,
            originalId: r.id,
            offerItem: off,
          } as any);
        });
      }
    });
    return offerRows;
  }
  return rows;
}

export function applyFilters(
  rows: LogisticQueryRow[],
  f: FilterFormState,
): LogisticQueryRow[] {
  return rows.filter((r) => {
    if (!includesText(r.number, f.queryNumber)) return false;
    if (!includesText(r.customerOrderRef, f.customerOrderRef)) return false;
    if (f.company && String(r.company || "") !== f.company) return false;
    if (!includesText(r.customer, f.customerName)) return false;
    if (!includesText(r.loadPlace, f.loadPlace)) return false;
    if (!includesText(r.unloadPlace, f.unloadPlace)) return false;

    if (!inRange(dayOnly(r.createdAt), f.queryDateFrom, f.queryDateTo)) {
      return false;
    }
    if (!inRange(dayOnly(r.loadDate), f.loadDateFrom, f.loadDateTo)) {
      return false;
    }
    if (!inRange(dayOnly(r.unloadDate), f.unloadDateFrom, f.unloadDateTo)) {
      return false;
    }
    if (
      !inRange(
        dayOnly(r.statusAssignedAt),
        f.statusDateFrom,
        f.statusDateTo,
      )
    ) {
      return false;
    }
    return true;
  });
}
