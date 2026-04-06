import type { SifarisFilterFormState, SifarisOrderRow } from "../types/sifaris.types";

function inRange(value: string, from: string, to: string): boolean {
  if (!from && !to) return true;
  const v = value.slice(0, 10);
  if (from && v < from) return false;
  if (to && v > to) return false;
  return true;
}

export function applySifarisFilters(
  rows: SifarisOrderRow[],
  f: SifarisFilterFormState,
): SifarisOrderRow[] {
  return rows.filter((r) => {
    if (f.orderNumber.trim() && !r.orderNumber.toLowerCase().includes(f.orderNumber.trim().toLowerCase())) {
      return false;
    }
    if (f.status === "planned" && r.statusKind !== "planned") return false;
    if (f.status === "progress" && r.statusKind !== "progress") return false;
    if (f.status === "completed" && r.statusKind !== "completed") return false;
    if (f.company && r.company !== f.company) return false;
    if (
      f.customerOrderRef.trim() &&
      !r.customerOrderRef.toLowerCase().includes(f.customerOrderRef.trim().toLowerCase())
    ) {
      return false;
    }
    if (f.tags.trim() && !r.documents.toLowerCase().includes(f.tags.trim().toLowerCase())) {
      return false;
    }
    if (
      f.customerName.trim() &&
      !r.customer.toLowerCase().includes(f.customerName.trim().toLowerCase())
    ) {
      return false;
    }
    if (!inRange(r.orderDate, f.orderDateFrom, f.orderDateTo)) return false;
    if (!inRange(r.actCreatedAt, f.actCreatedFrom, f.actCreatedTo)) return false;
    if (!inRange(r.actDate, f.actDateFrom, f.actDateTo)) return false;
    if (!inRange(r.cmrUnloadDate, f.cmrUnloadFrom, f.cmrUnloadTo)) return false;
    if (!inRange(r.invoicedDate, f.invoicedFrom, f.invoicedTo)) return false;
    return true;
  });
}

export function aggregateSifarisStats(rows: SifarisOrderRow[]) {
  const orders = rows.length;
  const loads = rows.reduce((s, r) => s + Math.ceil(r.weightKg / 5000), 0);
  const voyages = new Set(rows.map((r) => r.voyageNumber)).size;
  const weight = rows.reduce((s, r) => s + r.weightKg, 0);
  const volume = rows.reduce((s, r) => s + r.volumeM3, 0);
  const ldm = rows.reduce((s, r) => s + r.ldm, 0);
  const freightAzn = rows.reduce((s, r) => s + r.freightAzn, 0);
  const profitAzn = rows.reduce((s, r) => s + r.profitAzn, 0);
  return { orders, loads, voyages, weight, volume, ldm, freightAzn, profitAzn };
}
