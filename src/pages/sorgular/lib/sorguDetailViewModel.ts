import {
  CARGO_TRANSPORT_OPTIONS,
  COUNTRY_OPTIONS,
  PACKAGING_TYPE_OPTIONS,
} from "../constants/options.constants";
import type { LogisticQueryRow } from "../types/sorgu.types";

export type SorguDetailTabId =
  | "main"
  | "comments"
  | "offers"
  | "documents"
  | "tasks";

export interface SorguDetailCargoItem {
  name: string;
  weight: string;
  ldm: string;
  volumeM3: string;
  transportType: string;
  cargoValue: string;
  currency: string;
  additionalInfo: string;
  incompleteLoad: boolean;
}

export interface SorguDetailViewModel {
  row: LogisticQueryRow;
  customerName: string;
  managerName: string;
  logistName: string;
  seller: string;
  direction: string;
  summaryAddress: string;
  contacts: string;
  quantityTotal: number;
  ldmTotal: number;
  weightTotal: number;
  volumeLabel: string;
  incoterms: string;
  cargoSpecs: string;
  source: string;
  fromCountry: string;
  fromCity: string;
  fromAddress: string;
  fromCompany: string;
  toCountry: string;
  toCity: string;
  toAddress: string;
  toCompany: string;
  cargoTitle: string;
  transportTypeLabel: string;
  cargoItems: SorguDetailCargoItem[];
  cargoBoxLines: string[];
  inquiryDateLabel: string;
  commentsCount: number;
  offersCount: number;
  documentsCount: number;
  tasksCount: number;
  priceOfferItems: any[];
}

function toText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function displayOrDash(value: unknown): string {
  const text = toText(value);
  return text || "—";
}

function resolveOptionLabel(
  value: string,
  options: { value: string; label: string }[],
): string {
  const text = toText(value);
  if (!text) return "";
  const matched = options.find(
    (opt) => opt.value.toLowerCase() === text.toLowerCase(),
  );
  return matched?.label || text;
}

function parsePlace(place: string): { country: string; city: string } {
  const parts = place
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    return { country: parts[0], city: parts.slice(1).join(", ") };
  }
  return { country: place || "", city: "" };
}

function parseCargoItems(row: Record<string, unknown>): any[] {
  if (Array.isArray(row.cargoItems) && row.cargoItems.length > 0) {
    return row.cargoItems;
  }
  if (typeof row.cargoItemsJson === "string" && row.cargoItemsJson.trim()) {
    try {
      const parsed = JSON.parse(row.cargoItemsJson);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function parseNumber(value: unknown): number {
  const text = toText(value).replace(",", ".");
  if (!text) return 0;
  const parsed = Number.parseFloat(text);
  return Number.isFinite(parsed) ? parsed : 0;
}

function calcQuantityTotal(items: any[]): number {
  if (items.length === 0) return 0;

  let total = 0;
  for (const item of items) {
    if (Array.isArray(item.packagingRows) && item.packagingRows.length > 0) {
      for (const row of item.packagingRows) {
        total += parseNumber(row.packagingCount) || 1;
      }
    } else {
      total += 1;
    }
  }
  return total || items.length;
}

function sumCargoTotals(items: any[]) {
  let ldmTotal = 0;
  let weightTotal = 0;
  let volumeTotal = 0;

  for (const item of items) {
    ldmTotal += parseNumber(item.ldm);
    weightTotal += parseNumber(item.weight);
    volumeTotal +=
      parseNumber(item.volumeM3) ||
      parseNumber(item.volume) ||
      parseNumber(item.totalVolumeM3);
  }

  return { ldmTotal, weightTotal, volumeTotal };
}

function resolveCustomerName(
  row: Record<string, unknown>,
  customers?: any[],
): string {
  const raw = toText(row.customer);
  if (!raw) return "—";

  if (Array.isArray(customers)) {
    const found = customers.find((c) => c.id?.toString() === raw);
    if (found) {
      return (
        toText(found.name) ||
        toText(found.companyName) ||
        toText(found.company) ||
        toText(found.fullName) ||
        raw
      );
    }
  }

  return raw;
}

function resolveUserName(
  value: unknown,
  users?: any[],
): string {
  const raw = toText(value);
  if (!raw) return "—";

  if (Array.isArray(users)) {
    const found = users.find((u) => u.id?.toString() === raw);
    if (found) {
      return toText(found.name) || raw;
    }
  }

  return raw;
}

function mapCargoItems(items: any[]): SorguDetailCargoItem[] {
  return items.map((item) => ({
    name: displayOrDash(item.name),
    weight: item.weight ? `${item.weight} kq` : "—",
    ldm: displayOrDash(item.ldm),
    volumeM3: item.volumeM3
      ? `${item.volumeM3} m³`
      : item.volume
        ? `${item.volume} m³`
        : "—",
    transportType: resolveOptionLabel(
      toText(item.transportType),
      CARGO_TRANSPORT_OPTIONS,
    ) || "—",
    cargoValue: item.cargoValue
      ? `${item.cargoValue} ${toText(item.currency)}`.trim()
      : "—",
    currency: displayOrDash(item.currency),
    additionalInfo: displayOrDash(item.additionalInfo),
    incompleteLoad: item.incompleteLoad === true,
  }));
}

function buildCargoBoxLines(
  items: any[],
  row: Record<string, unknown>,
): string[] {
  const lines: string[] = [];

  for (const item of items) {
    const summaryParts = [
      toText(item.name),
      item.weight ? `${item.weight} kq` : "",
      item.ldm ? `LDM: ${item.ldm}` : "",
      item.volumeM3 ? `${item.volumeM3} m³` : "",
      resolveOptionLabel(toText(item.transportType), CARGO_TRANSPORT_OPTIONS),
      item.cargoValue
        ? `${item.cargoValue} ${toText(item.currency)}`.trim()
        : "",
      item.incompleteLoad ? "Natamam yük" : "",
    ].filter(Boolean);

    if (summaryParts.length > 0) {
      lines.push(summaryParts.join(" · "));
    }

    if (Array.isArray(item.packagingRows)) {
      for (const pkg of item.packagingRows) {
        const typeLabel = resolveOptionLabel(
          toText(pkg.packagingType),
          PACKAGING_TYPE_OPTIONS,
        );
        const dims = [pkg.lengthM, pkg.widthM, pkg.heightM]
          .map((v) => toText(v))
          .filter(Boolean);
        const count = toText(pkg.packagingCount) || "1";
        const pkgParts = [
          typeLabel || "Qablaşdırma",
          dims.length === 3 ? `${dims.join("×")} m` : "",
          count !== "1" ? `say: ${count}` : "",
          pkg.volumeM3 ? `${pkg.volumeM3} m³` : "",
          toText(pkg.packagingExtra),
        ].filter(Boolean);
        if (pkgParts.length > 0) {
          lines.push(pkgParts.join(" · "));
        }
      }
    }

    if (toText(item.additionalInfo)) {
      lines.push(toText(item.additionalInfo));
    }
  }

  const additionalInfo = toText(row.additionalInfo);
  if (additionalInfo && !lines.includes(additionalInfo)) {
    lines.push(additionalInfo);
  }

  const cargoInfo = toText(row.cargoInfo);
  if (lines.length === 0 && cargoInfo) {
    return cargoInfo.split("\n").map((line) => line.trim()).filter(Boolean);
  }

  return lines;
}

function formatDirection(
  load: { country: string; city: string },
  unload: { country: string; city: string },
): string {
  const from = [load.city, resolveOptionLabel(load.country, COUNTRY_OPTIONS)]
    .filter(Boolean)
    .join(", ");
  const to = [unload.city, resolveOptionLabel(unload.country, COUNTRY_OPTIONS)]
    .filter(Boolean)
    .join(", ");

  if (from && to) return `${from} → ${to}`;
  if (from) return from;
  if (to) return to;
  return "—";
}

export function buildSorguDetailView(
  row: LogisticQueryRow,
  customers?: any[],
  users?: any[],
): SorguDetailViewModel {
  const raw = row as Record<string, unknown>;
  const cargoItemsRaw = parseCargoItems(raw);
  const totals = sumCargoTotals(cargoItemsRaw);
  const quantityTotal = calcQuantityTotal(cargoItemsRaw);
  const cargoItems = mapCargoItems(cargoItemsRaw);

  const load = {
    country: resolveOptionLabel(
      toText(row.loadCountry) || parsePlace(row.loadPlace).country,
      COUNTRY_OPTIONS,
    ),
    city: toText(row.loadCity) || parsePlace(row.loadPlace).city,
    address:
      toText(row.loadAddress) ||
      toText(row.loadPlace) ||
      toText(row.sender),
    company: toText(row.loadPlaceCompany),
  };
  const unload = {
    country: resolveOptionLabel(
      toText(row.unloadCountry) || parsePlace(row.unloadPlace).country,
      COUNTRY_OPTIONS,
    ),
    city: toText(row.unloadCity) || parsePlace(row.unloadPlace).city,
    address:
      toText(row.unloadAddress) ||
      toText(row.unloadPlace) ||
      toText(row.recipient),
    company: toText(row.unloadPlaceCompany),
  };

  const inquiryDate = new Date(row.createdAt);
  const inquiryDateLabel = Number.isNaN(inquiryDate.getTime())
    ? "—"
    : inquiryDate.toLocaleDateString("az-AZ", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

  const priceOfferItems = Array.isArray(raw.priceOfferItems)
    ? raw.priceOfferItems
    : [];

  const rowTransport = toText(row.transportType);
  const itemTransport = toText(cargoItemsRaw[0]?.transportType);
  const transportTypeLabel =
    resolveOptionLabel(rowTransport || itemTransport, CARGO_TRANSPORT_OPTIONS) ||
    "—";

  const volumeLabel =
    totals.volumeTotal > 0
      ? `${totals.volumeTotal.toFixed(3).replace(/\.?0+$/, "")} m³`
      : "—";

  return {
    row,
    customerName: resolveCustomerName(raw, customers),
    managerName: resolveUserName(raw.manager, users),
    logistName: resolveUserName(raw.logist, users),
    seller: displayOrDash(row.seller),
    direction: formatDirection(load, unload),
    summaryAddress:
      [unload.city, unload.country].filter(Boolean).join(", ") || "—",
    contacts: displayOrDash(row.contactPerson),
    quantityTotal: quantityTotal || (cargoItemsRaw.length > 0 ? cargoItemsRaw.length : 0),
    ldmTotal: totals.ldmTotal,
    weightTotal: totals.weightTotal,
    volumeLabel,
    incoterms: displayOrDash(raw.incoterms),
    cargoSpecs: displayOrDash(raw.cargoSpecs),
    source: displayOrDash(raw.inquirySource) || "Sistem",
    fromCountry: load.country || "—",
    fromCity: load.city || "—",
    fromAddress: load.address || "—",
    fromCompany: load.company || "—",
    toCountry: unload.country || "—",
    toCity: unload.city || "—",
    toAddress: unload.address || "—",
    toCompany: unload.company || "—",
    cargoTitle:
      toText(raw.cargoComposition) ||
      toText(cargoItemsRaw[0]?.name) ||
      toText(row.cargoInfo) ||
      "Yük",
    transportTypeLabel,
    cargoItems,
    cargoBoxLines: buildCargoBoxLines(cargoItemsRaw, raw),
    inquiryDateLabel,
    commentsCount: Array.isArray(raw.comments) ? raw.comments.length : 0,
    offersCount: priceOfferItems.length,
    documentsCount: Array.isArray(raw.documents) ? raw.documents.length : 0,
    tasksCount: 0,
    priceOfferItems,
  };
}
