import type { EmekFilterFormState, EmekRow } from "../types/emek.types";

function inRange(value: string, from: string, to: string): boolean {
  if (!from && !to) return true;
  if (from && value < from) return false;
  if (to && value > to) return false;
  return true;
}

export function applyEmekFilters(rows: EmekRow[], f: EmekFilterFormState): EmekRow[] {
  return rows.filter((r) => {
    if (f.company && r.company !== f.company) return false;
    if (f.orderNumber.trim() && !r.orderNumber.toLowerCase().includes(f.orderNumber.trim().toLowerCase())) {
      return false;
    }
    if (f.tip === "order" && r.kind !== "order") return false;
    if (f.tip === "voyage" && r.kind !== "voyage") return false;
    if (f.status === "progress" && r.orderStatus !== "Davam edir") return false;
    if (f.status === "completed" && r.orderStatus !== "Tamamlandı") return false;
    if (f.tripNumber.trim() && !r.tripNumber.toLowerCase().includes(f.tripNumber.trim().toLowerCase())) {
      return false;
    }
    if (f.customer && r.customer !== f.customer) return false;
    if (f.carrier && r.carrier !== f.carrier) return false;
    if (!inRange(r.orderDateIso, f.orderDateFrom, f.orderDateTo)) return false;
    return true;
  });
}

export function aggregateEmekStats(rows: EmekRow[]) {
  const profit = rows.reduce((s, r) => s + r.profitAzn, 0);
  const bonus = rows.reduce((s, r) => s + r.totalBonusAzn, 0);
  const reward = rows.reduce((s, r) => s + r.rewardAmount, 0);
  return { profit, bonus, reward };
}
