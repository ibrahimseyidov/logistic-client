import { calcCargoMetrics } from "./cargoCalculations";

export interface CargoPackagingRow {
  id: string;
  packagingType: string;
  packagingExtra: string;
  packagingCount: string;
  lengthM: string;
  widthM: string;
  heightM: string;
  volumeM3: string;
}

export interface CargoItemForm {
  id: string;
  name: string;
  weight: string;
  volumeM3: string;
  ldm: string;
  transportType: string;
  cargoValue: string;
  currency: string;
  packagingRows: CargoPackagingRow[];
  incompleteLoad: boolean;
  additionalInfo: string;
}

export function parseDimensionsFromExtra(extra: string): {
  lengthM?: string;
  widthM?: string;
  heightM?: string;
} {
  const match = extra.trim().match(
    /(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)/i,
  );
  if (!match) return {};
  return {
    lengthM: match[1].replace(",", "."),
    widthM: match[2].replace(",", "."),
    heightM: match[3].replace(",", "."),
  };
}

export function createPackagingRow(): CargoPackagingRow {
  return {
    id: crypto.randomUUID(),
    packagingType: "",
    packagingExtra: "",
    packagingCount: "1",
    lengthM: "",
    widthM: "",
    heightM: "",
    volumeM3: "",
  };
}

export function createCargoItem(): CargoItemForm {
  return {
    id: crypto.randomUUID(),
    name: "",
    weight: "",
    volumeM3: "",
    ldm: "",
    transportType: "",
    cargoValue: "",
    currency: "",
    packagingRows: [createPackagingRow()],
    incompleteLoad: false,
    additionalInfo: "",
  };
}

export function normalizePackagingRow(
  row: Partial<CargoPackagingRow> & { id?: string },
): CargoPackagingRow {
  const hasDims =
    Boolean(row.lengthM?.trim()) ||
    Boolean(row.widthM?.trim()) ||
    Boolean(row.heightM?.trim());
  const parsedDims =
    !hasDims && row.packagingExtra
      ? parseDimensionsFromExtra(row.packagingExtra)
      : {};

  return {
    id: row.id || crypto.randomUUID(),
    packagingType: row.packagingType ?? "",
    packagingExtra: row.packagingExtra ?? "",
    packagingCount: row.packagingCount ?? "1",
    lengthM: row.lengthM?.trim() || parsedDims.lengthM || "",
    widthM: row.widthM?.trim() || parsedDims.widthM || "",
    heightM: row.heightM?.trim() || parsedDims.heightM || "",
    volumeM3: row.volumeM3 ?? "",
  };
}

export function applyCargoMetrics(cargo: CargoItemForm): CargoItemForm {
  const metrics = calcCargoMetrics({
    weight: cargo.weight,
    packagingRows: cargo.packagingRows.map(normalizePackagingRow),
  });
  return {
    ...cargo,
    packagingRows: metrics.packagingRows as CargoPackagingRow[],
    volumeM3: metrics.totalVolumeM3,
    ldm: metrics.ldm,
  };
}

export function normalizeCargoItem(cargo: CargoItemForm): CargoItemForm {
  return applyCargoMetrics({
    ...cargo,
    id: cargo.id || crypto.randomUUID(),
    packagingRows: cargo.packagingRows.map(normalizePackagingRow),
  });
}

export function normalizeLoadedCargoItem(item: Partial<CargoItemForm>): CargoItemForm {
  const packagingRows =
    item.packagingRows && item.packagingRows.length > 0
      ? item.packagingRows.map((row) => normalizePackagingRow(row))
      : [createPackagingRow()];

  return normalizeCargoItem({
    ...createCargoItem(),
    ...item,
    id: item.id || crypto.randomUUID(),
    packagingRows,
  });
}

export function resolveCargoItemsFromInitialValues(
  data: Record<string, unknown>,
): CargoItemForm[] {
  if (Array.isArray(data.cargoItems) && data.cargoItems.length > 0) {
    return data.cargoItems.map((item) =>
      normalizeLoadedCargoItem(item as Partial<CargoItemForm>),
    );
  }

  if (typeof data.cargoItemsJson === "string" && data.cargoItemsJson.trim()) {
    try {
      const parsed = JSON.parse(data.cargoItemsJson);
      const items = Array.isArray(parsed) ? parsed : [createCargoItem()];
      return items.map((item: Partial<CargoItemForm>) =>
        normalizeLoadedCargoItem(item),
      );
    } catch {
      return [normalizeCargoItem(createCargoItem())];
    }
  }

  return [normalizeCargoItem(createCargoItem())];
}

export function getCargoInitialValuesKey(data?: Record<string, unknown> | null): string {
  if (!data) return "new";
  if (data.id != null) return `id:${data.id}`;
  if (typeof data.cargoItemsJson === "string" && data.cargoItemsJson.trim()) {
    return `json:${data.cargoItemsJson}`;
  }
  return "new";
}
