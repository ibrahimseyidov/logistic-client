import type {
  FilterFormState,
  LogisticQueryRow,
  SorguSubTab,
  SorguStatus,
} from "../types/sorgu.types";

function dayOnly(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function inRange(value: string, from: string, to: string): boolean {
  if (!from && !to) return true;
  const v = value.slice(0, 10);
  if (from && v < from) return false;
  if (to && v > to) return false;
  return true;
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
      (r) => r.status === "cancelled" || r.status === "completed",
    );
  }
  if (tab === "offers") {
    const offerRows: LogisticQueryRow[] = [];
    rows.forEach((r) => {
      const items = (r as any).priceOfferItems;
      if (Array.isArray(items) && items.length > 0) {
        items.forEach((off, idx) => {
          offerRows.push({
            ...r,
            // Virtual ID to avoid duplicate keys in table
            id: `${r.id}-off-${idx}`,
            // Override priceOffers to show specific offer info
            priceOffers: `${off.carrierName}: ${off.price} ${off.currency}`,
            // Store original ID and offer item for specialized table
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
    if (
      f.queryNumber.trim() &&
      !r.number.toLowerCase().includes(f.queryNumber.trim().toLowerCase())
    ) {
      return false;
    }
    if (
      f.customerOrderRef.trim() &&
      !r.customerOrderRef
        .toLowerCase()
        .includes(f.customerOrderRef.trim().toLowerCase())
    ) {
      return false;
    }
    if (f.company && r.company !== f.company) return false;
    if (
      f.customerName.trim() &&
      !r.customer.toLowerCase().includes(f.customerName.trim().toLowerCase())
    ) {
      return false;
    }
    if (
      f.loadPlace.trim() &&
      !r.loadPlace.toLowerCase().includes(f.loadPlace.trim().toLowerCase())
    ) {
      return false;
    }
    if (
      f.unloadPlace.trim() &&
      !r.unloadPlace.toLowerCase().includes(f.unloadPlace.trim().toLowerCase())
    ) {
      return false;
    }
    const created = dayOnly(r.createdAt);
    if (!inRange(created, f.queryDateFrom, f.queryDateTo)) return false;
    return true;
  });
}
