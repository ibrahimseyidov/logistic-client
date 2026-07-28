import type { ReysFilterFormState, ReysRow, ReysTransportMode } from "../types/reys.types";
import { includesText, inDateRange } from "./formatDate";

export function filterByTransport(rows: ReysRow[], mode: ReysTransportMode): ReysRow[] {
  if (mode === "all") return rows;
  return rows.filter((r) => r.transportMode === mode);
}

export function applyReysFilters(rows: ReysRow[], f: ReysFilterFormState): ReysRow[] {
  return rows.filter((r) => {
    if (f.tripNumber.trim()) {
      const q = f.tripNumber.trim().toLowerCase();
      const label = (r.id ? `R-${r.id}` : r.tripRef || "").toLowerCase();
      if (!label.includes(q) && !includesText(r.tripRef, f.tripNumber)) {
        return false;
      }
    }
    if (f.company && String(r.company || "") !== f.company) return false;
    if (!inDateRange(r.orderDateIso, f.orderDateFrom, f.orderDateTo)) return false;
    if (!inDateRange(r.tripDateIso, f.tripDateFrom, f.tripDateTo)) return false;
    return true;
  });
}

export function aggregateReysStats(rows: ReysRow[]) {
  const count = rows.length;
  const totalValueAzn = rows.reduce((s, r) => s + (Number(r.valueAzn) || 0), 0);
  return { count, totalValueAzn };
}
