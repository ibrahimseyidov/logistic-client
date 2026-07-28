import type { SifarisFilterFormState, SifarisOrderRow } from "../types/sifaris.types";
import { includesText, inDateRange, toDateIso } from "./formatDate";

function yesNoMatch(
  flag: boolean | undefined,
  expected: string,
): boolean {
  if (!expected) return true;
  if (expected === "yes" || expected === "received") return !!flag;
  if (expected === "no" || expected === "not_received") return !flag;
  return true;
}

function collectRouteText(r: SifarisOrderRow): string {
  const voyages = (r as any).voyages as Array<{ loading?: string; unloading?: string }> | undefined;
  const fromVoyages = (voyages || [])
    .map((v) => `${v.loading || ""} ${v.unloading || ""}`)
    .join(" ");
  return `${r.route || ""} ${fromVoyages}`.toLowerCase();
}

function collectTransportText(r: SifarisOrderRow): string {
  const voyages = (r as any).voyages as Array<{ vehicleInfo?: string; transportMode?: string }> | undefined;
  const cargoTypes = (r.cargoItems || [])
    .map((c) => String(c.transportType || ""))
    .join(" ");
  const fromVoyages = (voyages || [])
    .map((v) => `${v.vehicleInfo || ""} ${v.transportMode || ""}`)
    .join(" ");
  return `${cargoTypes} ${fromVoyages}`.toLowerCase();
}

function compareSort(
  a: SifarisOrderRow,
  b: SifarisOrderRow,
  sortBy: string,
  sortOrder: string,
): number {
  const dir = sortOrder === "asc" ? 1 : -1;
  if (sortBy === "date") {
    const av = toDateIso(a.orderDateIso || a.orderDate) || "";
    const bv = toDateIso(b.orderDateIso || b.orderDate) || "";
    return av.localeCompare(bv) * dir;
  }
  if (sortBy === "customer") {
    return String(a.customer || "").localeCompare(String(b.customer || ""), "az") * dir;
  }
  // default: nr
  return String(a.orderNumber || "").localeCompare(String(b.orderNumber || ""), "az") * dir;
}

export function applySifarisFilters(
  rows: SifarisOrderRow[],
  f: SifarisFilterFormState,
): SifarisOrderRow[] {
  const filtered = rows.filter((r) => {
    if (!includesText(r.orderNumber, f.orderNumber)) return false;

    if (f.status === "planned" && r.statusKind !== "planned") return false;
    if (f.status === "progress" && r.statusKind !== "progress") return false;
    if (f.status === "completed" && r.statusKind !== "completed") return false;
    if (f.status === "finance_closed" && r.statusKind !== "finance_closed") return false;
    if (f.status === "cancelled" && r.statusKind !== "cancelled") return false;

    if (f.company && String(r.company || "") !== f.company) return false;
    if (!includesText(r.customerOrderRef, f.customerOrderRef)) return false;
    if (!includesText(r.tags || r.documents, f.tags)) return false;
    if (!includesText(r.customer || r.customerName, f.customerName)) return false;
    if (!includesText(r.carriers, f.carrier)) return false;

    // Müştəri tipi — API-də varsa
    const customerType = String((r as any).customerType || "").toLowerCase();
    if (
      f.customerType &&
      customerType &&
      !customerType.includes(f.customerType.toLowerCase())
    ) {
      return false;
    }

    // Ölkə — marşrut / voyage loading-unloading mətnində
    const routeText = collectRouteText(r);
    if (f.loadCountry.trim() && !routeText.includes(f.loadCountry.trim().toLowerCase())) {
      return false;
    }
    if (f.unloadCountry.trim() && !routeText.includes(f.unloadCountry.trim().toLowerCase())) {
      return false;
    }

    // İstifadəçilər — real ad ilə substring
    if (!includesText(r.manager, f.manager)) return false;
    if (!includesText(r.expeditor, f.voyageExpeditor)) return false;
    if (!includesText(r.extraManagers, f.extraManagers)) return false;
    if (f.orderForwarder.trim() && !includesText(r.expeditor, f.orderForwarder)) {
      return false;
    }
    if (f.department.trim()) {
      const dep = f.department.trim().toLowerCase();
      const blob = `${r.tags || ""} ${r.extraInfo || ""} ${r.manager || ""}`.toLowerCase();
      if (!blob.includes(dep)) return false;
    }

    // Sənədlər
    if (!yesNoMatch(r.hasReceivedInvoice, f.receivedInvoices)) return false;
    if (!yesNoMatch(r.hasSentInvoice, f.paidWithSentInvoice)) return false;
    if (!yesNoMatch(r.hasReceivedInvoice, f.paidWithReceivedInvoice)) return false;
    if (!yesNoMatch(r.hasHandoverAct, f.hasAct)) return false;
    if (!yesNoMatch(r.hasTransportDoc, f.cmrBase)) return false;
    if (f.invoiceNumber.trim()) {
      const invText = JSON.stringify((r as any).invoices || []).toLowerCase();
      if (!invText.includes(f.invoiceNumber.trim().toLowerCase())) return false;
    }
    if (!includesText(r.customerOrderRef || r.customerRefs, f.ourReferenceNumber)) {
      return false;
    }
    if (!includesText(r.documents || r.tags, f.cmrNumber)) return false;

    // Nəqliyyat əlavələri
    if (f.carrierSystemNumber.trim()) {
      const voyages = (r as any).voyages || [];
      const sys = voyages
        .map((v: any) => String(v.tripRef || v.id || ""))
        .join(" ")
        .toLowerCase();
      if (!sys.includes(f.carrierSystemNumber.trim().toLowerCase())) return false;
    }
    const transportText = collectTransportText(r);
    if (f.transportType.trim()) {
      const t = f.transportType.trim().toLowerCase();
      const aliases: Record<string, string[]> = {
        truck: ["truck", "tir", "auto", "yol", "fırın", "fura"],
        rail: ["rail", "qatar", "train"],
        vessel: ["vessel", "gəmi", "gemi", "sea", "dəniz"],
      };
      const keys = aliases[t] || [t];
      if (!keys.some((k) => transportText.includes(k))) return false;
    }
    if (f.transportPlate.trim() && !transportText.includes(f.transportPlate.trim().toLowerCase())) {
      return false;
    }
    if (!includesText((r as any).driver, f.driver)) return false;

    // Digər
    if (f.currency.trim() && !includesText(r.currency, f.currency)) return false;
    if (f.incoterms.trim() && !includesText(r.incoterms, f.incoterms)) return false;
    if (f.terms.trim() && !includesText(r.paymentTerms, f.terms)) return false;
    if (f.billOfLading.trim() && !includesText(r.documents, f.billOfLading)) return false;
    if (f.orderExpenses.trim() && !includesText(r.extraCosts, f.orderExpenses)) return false;

    // Tarixlər — yalnız ISO / parseable
    if (!inDateRange(r.orderDateIso || r.orderDate, f.orderDateFrom, f.orderDateTo)) {
      return false;
    }
    if (!inDateRange(r.actCreatedAt, f.actCreatedFrom, f.actCreatedTo)) return false;
    if (!inDateRange(r.actDate, f.actDateFrom, f.actDateTo)) return false;
    if (!inDateRange(r.cmrUnloadDate, f.cmrUnloadFrom, f.cmrUnloadTo)) return false;
    if (!inDateRange(r.invoicedDate, f.invoicedFrom, f.invoicedTo)) return false;

    return true;
  });

  if (!f.sortBy) return filtered;
  return [...filtered].sort((a, b) =>
    compareSort(a, b, f.sortBy || "nr", f.sortOrder || "desc"),
  );
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
