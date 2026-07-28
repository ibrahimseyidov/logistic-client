import type { YukFilterFormState, YukLoadRow } from "../types/yuk.types";
import { includesText } from "./formatDate";

export function applyYukFilters(rows: YukLoadRow[], f: YukFilterFormState): YukLoadRow[] {
  return rows.filter((r) => {
    if (f.userId) {
      // userId həm id, həm də ad ola bilər — userLabel ilə müqayisə
      const selected = f.userId.trim().toLowerCase();
      const label = String(r.userLabel || "").trim().toLowerCase();
      if (!label || (label !== selected && !label.includes(selected))) {
        return false;
      }
    }
    if (!includesText(r.company, f.company)) return false;
    return true;
  });
}

export function aggregateYukStats(rows: YukLoadRow[]) {
  const count = rows.length;
  const ldm = rows.reduce((s, r) => s + (Number(r.ldm) || 0), 0);
  const weight = rows.reduce((s, r) => s + (Number(r.weightKg) || 0), 0);
  const volume = rows.reduce((s, r) => s + (Number(r.volumeM3) || 0), 0);
  return { count, ldm, weight, volume };
}
