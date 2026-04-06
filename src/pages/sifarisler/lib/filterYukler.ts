import type { YukFilterFormState, YukLoadRow } from "../types/yuk.types";

const userValueToLabel: Record<string, string> = {
  ulvi: "Ulvi Adilzadə",
  nargiz: "Nərgiz K.",
  elchin: "Elçin Məmmədov",
};

export function applyYukFilters(rows: YukLoadRow[], f: YukFilterFormState): YukLoadRow[] {
  return rows.filter((r) => {
    if (f.userId) {
      const label = userValueToLabel[f.userId];
      if (label && r.userLabel !== label) return false;
    }
    if (f.company.trim() && !r.company.toLowerCase().includes(f.company.trim().toLowerCase())) {
      return false;
    }
    return true;
  });
}

export function aggregateYukStats(rows: YukLoadRow[]) {
  const count = rows.length;
  const ldm = rows.reduce((s, r) => s + r.ldm, 0);
  const weight = rows.reduce((s, r) => s + r.weightKg, 0);
  const volume = rows.reduce((s, r) => s + r.volumeM3, 0);
  return { count, ldm, weight, volume };
}
