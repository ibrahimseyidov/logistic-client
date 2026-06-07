import type { LookupOptionRow } from "../types/lookup.types";

const STORAGE_KEYS = {
  "cargo-specs": "logistic_settings_cargo_specs",
  incoterms: "logistic_settings_incoterms",
  "transport-types": "logistic_settings_transport_types",
} as const;

export type LookupStorageKey = keyof typeof STORAGE_KEYS;

function readRows(key: LookupStorageKey): LookupOptionRow[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS[key]);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LookupOptionRow[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRows(key: LookupStorageKey, rows: LookupOptionRow[]) {
  localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(rows));
}

export function fetchLookupOptions(
  key: LookupStorageKey,
  seed: Omit<LookupOptionRow, "id">[],
): LookupOptionRow[] {
  const existing = readRows(key);
  if (existing.length > 0) return existing;

  const seeded = seed.map((row, index) => ({
    id: index + 1,
    ...row,
  }));
  writeRows(key, seeded);
  return seeded;
}

export function createLookupOption(
  key: LookupStorageKey,
  fields: { value: string; label: string },
): LookupOptionRow {
  const rows = readRows(key);
  const nextId = rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
  const created: LookupOptionRow = { id: nextId, ...fields };
  writeRows(key, [created, ...rows]);
  return created;
}

export function updateLookupOption(
  key: LookupStorageKey,
  id: number,
  fields: { value: string; label: string },
): LookupOptionRow {
  const rows = readRows(key);
  const updated = rows.map((row) =>
    row.id === id ? { ...row, ...fields } : row,
  );
  writeRows(key, updated);
  const row = updated.find((item) => item.id === id);
  if (!row) throw new Error("Option not found");
  return row;
}

export function deleteLookupOption(key: LookupStorageKey, id: number): void {
  writeRows(
    key,
    readRows(key).filter((row) => row.id !== id),
  );
}
