import axios from "axios";
import { buildApiUrl } from "./fetch.utils";

export type CurrencyCode = "AZN" | "USD" | "EUR" | "TRY" | string;

export interface CurrencyRatesResponse {
  date: string;
  source: "cbar" | "fallback";
  rates: Record<string, number>;
}

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

export function convertToAznWithRates(
  amount: number,
  currency: CurrencyCode,
  rates: Record<string, number>,
): number {
  if (!Number.isFinite(amount)) return 0;
  const code = (currency || "AZN").toUpperCase();
  if (code === "AZN") return amount;
  const rate = rates[code];
  if (!rate) return amount;
  return amount * rate;
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
