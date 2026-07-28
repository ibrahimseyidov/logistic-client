import type { EmekFilterFormState, EmekRow } from "../types/emek.types";
import { includesText, inDateRange } from "./formatDate";

export function applyEmekFilters(rows: EmekRow[], f: EmekFilterFormState): EmekRow[] {
  return rows.filter((r) => {
    if (f.company && String(r.company || "") !== f.company) return false;
    if (!includesText(r.orderNumber, f.orderNumber)) return false;
    if (f.tip === "order" && r.kind !== "order") return false;
    if (f.tip === "voyage" && r.kind !== "voyage") return false;

    if (f.status === "progress") {
      const s = String(r.orderStatus || "").toLowerCase();
      if (
        r.orderStatus !== "Davam edir" &&
        !s.includes("progress") &&
        !s.includes("davam")
      ) {
        return false;
      }
    }
    if (f.status === "completed") {
      const s = String(r.orderStatus || "").toLowerCase();
      if (
        r.orderStatus !== "Tamamlandı" &&
        !s.includes("completed") &&
        !s.includes("tamam")
      ) {
        return false;
      }
    }

    if (!includesText(r.tripNumber, f.tripNumber)) return false;
    if (f.customer && String(r.customer || "") !== f.customer) return false;
    if (f.carrier && String(r.carrier || "") !== f.carrier) return false;

    const customerType = String((r as any).customerType || "").toLowerCase();
    if (
      f.customerType &&
      customerType &&
      !customerType.includes(f.customerType.toLowerCase())
    ) {
      return false;
    }

    if (!inDateRange(r.orderDateIso || r.orderDate, f.orderDateFrom, f.orderDateTo)) {
      return false;
    }
    if (
      !inDateRange(
        (r as any).actCreatedAt,
        f.actCreatedFrom,
        f.actCreatedTo,
      )
    ) {
      return false;
    }
    if (!inDateRange((r as any).actDate, f.actDateFrom, f.actDateTo)) return false;
    if (!inDateRange((r as any).loadDate, f.loadDateFrom, f.loadDateTo)) return false;
    if (!inDateRange((r as any).unloadDate, f.unloadDateFrom, f.unloadDateTo)) {
      return false;
    }
    if (
      !inDateRange(
        r.paymentDate,
        f.invoicePaymentFrom,
        f.invoicePaymentTo,
      )
    ) {
      return false;
    }

    return true;
  });
}

export function aggregateEmekStats(rows: EmekRow[]) {
  const profit = rows.reduce((s, r) => s + (Number(r.profitAzn) || 0), 0);
  const bonus = rows.reduce((s, r) => s + (Number(r.totalBonusAzn) || 0), 0);
  const reward = rows.reduce((s, r) => s + (Number(r.rewardAmount) || 0), 0);
  return { profit, bonus, reward };
}
