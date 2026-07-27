import type { ReysFilterFormState, ReysRow, ReysTransportMode } from "../types/reys.types";

function inRange(value: string, from: string, to: string): boolean {
  if (!from && !to) return true;
  if (from && value < from) return false;
  if (to && value > to) return false;
  return true;
}

export function filterByTransport(rows: ReysRow[], mode: ReysTransportMode): ReysRow[] {
  if (mode === "all") return rows;
  return rows.filter((r) => r.transportMode === mode);
}

export function applyReysFilters(rows: ReysRow[], f: ReysFilterFormState): ReysRow[] {
  return rows.filter((r) => {
    if (f.tripNumber.trim()) {
      const q = f.tripNumber.trim().toLowerCase();
      const label = (r.id ? `R-${r.id}` : r.tripRef || "").toLowerCase();
      if (!label.includes(q) && !(r.tripRef || "").toLowerCase().includes(q)) {
        return false;
      }
    }
    if (f.company && r.company !== f.company) return false;
    if (!inRange(r.orderDateIso, f.orderDateFrom, f.orderDateTo)) return false;
    if (!inRange(r.tripDateIso, f.tripDateFrom, f.tripDateTo)) return false;
    return true;
  });
}

export function aggregateReysStats(rows: ReysRow[]) {
  const count = rows.length;
  const totalValueAzn = rows.reduce((s, r) => s + r.valueAzn, 0);
  return { count, totalValueAzn };
}
