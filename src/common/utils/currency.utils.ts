import axios from "axios";
import { buildApiUrl } from "./fetch.utils";

export type CurrencyCode = "AZN" | "USD" | "EUR" | "TRY" | string;

export interface CurrencyRatesResponse {
  date: string;
  source: "cbar" | "fallback";
  rates: Record<string, number>;
}

/** CBAR / backend ilə eyni fallback — 1:1 heç vaxt USD/EUR üçün istifadə olunmur */
export const FALLBACK_AZN_RATES: Record<string, number> = {
  AZN: 1,
  USD: 1.7,
  EUR: 1.9324,
  TRY: 0.0364,
  GBP: 2.15,
  RUB: 0.019,
  CHF: 1.95,
  CNY: 0.24,
};

const clientCache = new Map<string, CurrencyRatesResponse>();

function getAuthToken() {
  let token = "";
  try {
    token = localStorage.getItem("token") || "";
  } catch {}
  if (!token && typeof document !== "undefined") {
    const cookieToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];
    if (cookieToken) token = cookieToken;
  }
  return token;
}

/** Valyuta → AZN məzənnəsi (rates → fallback). AZN = 1. */
export function getAznRate(
  currency: CurrencyCode,
  rates?: Record<string, number> | null,
): number {
  const code = (currency || "AZN").toUpperCase();
  if (code === "AZN") return 1;
  const fromRates = rates?.[code];
  if (typeof fromRates === "number" && fromRates > 0) return fromRates;
  const fallback = FALLBACK_AZN_RATES[code];
  if (typeof fallback === "number" && fallback > 0) return fallback;
  return 0;
}

export function convertToAznWithRates(
  amount: number,
  currency: CurrencyCode,
  rates: Record<string, number>,
): number {
  if (!Number.isFinite(amount) || !(amount > 0)) return 0;
  const code = (currency || "AZN").toUpperCase();
  if (code === "AZN") return amount;
  const rate = getAznRate(code, rates);
  // Naməlum valyuta — 1:1 qaytarma (səhv AZN yaratmasın)
  if (!(rate > 0)) return 0;
  return amount * rate;
}

export function formatMoneyWithAzn(
  amount: number,
  currency: CurrencyCode,
  rates?: Record<string, number> | null,
): string {
  if (!(amount > 0)) return "—";
  const code = (currency || "AZN").toUpperCase();
  if (code === "AZN") return `${amount} AZN`;
  const azn = convertToAznWithRates(amount, code, rates || {});
  if (!(azn > 0)) return `${amount} ${code}`;
  return `${amount} ${code} (${azn.toFixed(2)} AZN)`;
}

export async function fetchCurrencyRates(date?: string): Promise<CurrencyRatesResponse> {
  const cacheKey = date || "latest";
  const cached = clientCache.get(cacheKey);
  if (cached) return cached;

  const token = getAuthToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const query = date ? `?date=${encodeURIComponent(date)}` : "";
  const res = await axios.get(buildApiUrl(`/api/currency/rates${query}`), { headers });
  clientCache.set(cacheKey, res.data);
  if (res.data?.date) clientCache.set(res.data.date, res.data);
  return res.data;
}

export async function convertCurrencyToAzn(
  amount: number,
  currency: CurrencyCode,
  date?: string,
): Promise<{ azn: number; rate: number; rateDate: string }> {
  const token = getAuthToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const params = new URLSearchParams({
    amount: String(amount),
    from: (currency || "AZN").toUpperCase(),
  });
  if (date) params.set("date", date);
  const res = await axios.get(buildApiUrl(`/api/currency/convert?${params.toString()}`), { headers });
  return {
    azn: res.data.azn,
    rate: res.data.rate,
    rateDate: res.data.rateDate,
  };
}

export function formatAzn(amount: number, fractionDigits = 2): string {
  return `${amount.toLocaleString("az-AZ", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })} AZN`;
}

export function formatRateLine(currency: string, rate: number): string {
  if (!currency || currency.toUpperCase() === "AZN") return "1 AZN = 1 AZN";
  return `1 ${currency.toUpperCase()} = ${rate.toFixed(4)} AZN`;
}

export function parseStoredAzn(value?: string | number | null): number | null {
  const parsed = parseFloat(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseAznFromTripPrice(tripPrice?: string | null): number | null {
  if (!tripPrice) return null;
  const match = tripPrice.match(/\(([0-9][0-9.,]*)\s*AZN/i);
  if (!match) return null;
  return parseStoredAzn(match[1]);
}

export function resolveFinanceExpenseAzn(
  tx: {
    mesarifPrice?: string;
    mesarifCurrency?: string;
    mesarifAzn?: string;
    edvliMesarifPrice?: string;
    edvliMesarifCurrency?: string;
    edvliMesarifAzn?: string;
  },
  rates?: Record<string, number> | null,
): number {
  const price =
    parseFloat(tx.mesarifPrice || tx.edvliMesarifPrice || "0") || 0;
  const currency = (
    tx.mesarifCurrency ||
    tx.edvliMesarifCurrency ||
    "AZN"
  ).toUpperCase();
  const stored =
    parseStoredAzn(tx.mesarifAzn) ??
    parseStoredAzn(tx.edvliMesarifAzn);

  if (currency === "AZN") {
    return stored !== null ? stored : price;
  }
  // 1:1 saxlanmış AZN səhvdir — CBAR/fallback ilə yenidən hesabla
  if (
    stored !== null &&
    price > 0 &&
    Math.abs(stored - price) > 0.001
  ) {
    return stored;
  }
  if (price > 0) {
    return convertToAznWithRates(price, currency, rates || FALLBACK_AZN_RATES);
  }
  return stored !== null ? stored : 0;
}

export function resolveFinanceRevenueAzn(
  tx: {
    tarifPrice?: string;
    tarifCurrency?: string;
    tarifAzn?: string;
    edvliTarifPrice?: string;
    edvliTarifCurrency?: string;
    edvliTarifAzn?: string;
  },
  rates?: Record<string, number> | null,
): number {
  const price =
    parseFloat(tx.tarifPrice || tx.edvliTarifPrice || "0") || 0;
  const currency = (
    tx.tarifCurrency ||
    tx.edvliTarifCurrency ||
    "AZN"
  ).toUpperCase();
  const stored =
    parseStoredAzn(tx.tarifAzn) ??
    parseStoredAzn(tx.edvliTarifAzn);

  if (currency === "AZN") {
    return stored !== null ? stored : price;
  }
  if (
    stored !== null &&
    price > 0 &&
    Math.abs(stored - price) > 0.001
  ) {
    return stored;
  }
  if (price > 0) {
    return convertToAznWithRates(price, currency, rates || FALLBACK_AZN_RATES);
  }
  return stored !== null ? stored : 0;
}

export function resolveVoyageExpenseAzn(voyage: {
  valueAzn?: number | null;
  price?: string;
  tripPrice?: string;
}): number {
  if (typeof voyage.valueAzn === "number" && Number.isFinite(voyage.valueAzn)) {
    return voyage.valueAzn;
  }
  return parseAznFromTripPrice(voyage.price || voyage.tripPrice) ?? 0;
}
