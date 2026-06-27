import type { LookupRow } from "../actions/lookup.actions";
import type { SelectOption } from "../components/select/Select";

export const CONTACT_POSITIONS_LOOKUP_TYPE = "contact-positions";

export function lookupRowsToPositionOptions(rows: LookupRow[]): SelectOption[] {
  return rows
    .map((row) => {
      const label = (row.label || row.value || "").trim();
      if (!label) return null;
      return { value: label, label };
    })
    .filter((option): option is SelectOption => option !== null);
}

export function withCustomPositionOption(
  options: SelectOption[],
  current: string,
): SelectOption[] {
  const trimmed = current.trim();
  if (trimmed && !options.some((option) => option.value === trimmed)) {
    return [...options, { value: trimmed, label: trimmed }];
  }
  return options;
}

export function mapLookupRowsToOptionRows(rows: LookupRow[]) {
  return rows.map((row) => ({
    id: Number(row.id),
    value: row.value,
    label: row.label || row.value,
  }));
}
