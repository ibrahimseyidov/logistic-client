export const TONE_HEX: Record<string, string> = {
  amber: "#d97706",
  emerald: "#059669",
  rose: "#e11d48",
  sky: "#0284c7",
  violet: "#7c3aed",
  slate: "#64748b",
  cyan: "#0891b2",
  blue: "#2563eb",
  indigo: "#4f46e5",
  teal: "#0d9488",
};

export type ChartSlice = { label: string; value: number; color: string };
export type HBarItem = { label: string; value: number; color?: string };
export type BarSeries = { name: string; color: string; values: number[] };

export function parseRowDate(value: unknown): Date | null {
  if (value == null || value === "") return null;
  const d = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  if (!y || !m) return key;
  return new Date(y, m - 1, 1).toLocaleDateString("az-AZ", {
    month: "short",
    ...(m === 1 ? { year: "2-digit" } : {}),
  });
}

export function lastMonthKeys(count: number, now = new Date()): string[] {
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    keys.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)));
  }
  return keys;
}

export function pickRowDate(row: any, fields: string[]): Date | null {
  for (const field of fields) {
    const d = parseRowDate(row?.[field]);
    if (d) return d;
  }
  return null;
}

export function addToBucket(
  buckets: Record<string, number>,
  key: string,
  amount: number,
) {
  if (!key || !Number.isFinite(amount)) return;
  buckets[key] = (buckets[key] || 0) + amount;
}

export function seriesFromBuckets(
  keys: string[],
  buckets: Record<string, number>,
): number[] {
  return keys.map((k) => buckets[k] || 0);
}

export function topN(
  map: Record<string, number>,
  n: number,
): HBarItem[] {
  return Object.entries(map)
    .filter(([label, value]) => label && label !== "—" && value)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([label, value]) => ({ label, value }));
}
