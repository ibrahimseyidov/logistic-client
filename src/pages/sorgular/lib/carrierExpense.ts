import type { LookupRow } from "../../actions/lookup.actions";

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function resolveCarrierTypePercentage(
  carrierType: string | undefined | null,
  carrierTypes: LookupRow[],
): number {
  const normalizedType = normalizeText(carrierType);
  if (!normalizedType) return 0;

  const match = carrierTypes.find((item) => {
    const value = normalizeText(item.value);
    const label = normalizeText(item.label);
    return normalizedType === value || normalizedType === label;
  });

  const percentage = Number(match?.percentage);
  return Number.isFinite(percentage) && percentage > 0 ? percentage : 0;
}

export function calcExpenseFromPurchasePrice(
  purchasePrice: string,
  percentage: number,
): string {
  const normalized = purchasePrice.replace(",", ".").trim();
  if (!normalized || percentage <= 0) return "";

  const price = Number.parseFloat(normalized);
  if (!Number.isFinite(price) || price <= 0) return "";

  return ((price * percentage) / 100).toFixed(2);
}

export function getCarrierDisplayName(carrier: {
  name?: string;
  company?: string;
}): string {
  return (carrier.name || carrier.company || "").trim();
}
