/** Həcm (m³) → LDM ekvivalenti üçün əmsal */
export const VOLUME_TO_LDM_FACTOR = 167;

export interface CargoPackagingDimensions {
  lengthM: string;
  widthM: string;
  heightM: string;
  packagingCount: string;
  volumeM3: string;
}

export interface CargoMetricsInput {
  weight: string;
  packagingRows: CargoPackagingDimensions[];
}

export interface CargoMetricsResult {
  packagingRows: CargoPackagingDimensions[];
  totalVolumeM3: string;
  ldm: string;
}

function parseNumber(value: string): number {
  const normalized = value.replace(",", ".").trim();
  if (!normalized) return 0;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** 1.068777 → 1.069 */
export function roundVolumeM3(value: number): number {
  if (value <= 0) return 0;
  return Math.round(value * 1000) / 1000;
}

/** 254.2 → 255 */
export function roundWeightKg(value: number): number {
  if (value <= 0) return 0;
  return Math.round(value);
}

function formatVolumeM3(value: number): string {
  if (value <= 0) return "";
  return roundVolumeM3(value).toFixed(3);
}

function formatLdm(value: number): string {
  if (value <= 0) return "";
  const rounded = Math.round(value * 1000) / 1000;
  if (Math.abs(rounded - Math.round(rounded)) < 1e-9) {
    return String(Math.round(rounded));
  }
  return rounded.toFixed(3).replace(/\.?0+$/, "");
}

/** Tək qablaşdırma: uzunluq × en × hündürlük × say */
export function calcPackagingRowVolumeM3(row: CargoPackagingDimensions): number {
  const length = parseNumber(row.lengthM);
  const width = parseNumber(row.widthM);
  const height = parseNumber(row.heightM);
  const count = parseNumber(row.packagingCount) || 1;
  if (length <= 0 || width <= 0 || height <= 0) return 0;
  return length * width * height * count;
}

export function calcCargoMetrics<T extends CargoMetricsInput>(
  cargo: T,
): T & CargoMetricsResult {
  let totalVolumeRaw = 0;

  const packagingRows = cargo.packagingRows.map((row) => {
    const rowVolumeRaw = calcPackagingRowVolumeM3(row);
    totalVolumeRaw += rowVolumeRaw;
    const rowVolumeRounded = roundVolumeM3(rowVolumeRaw);
    return {
      ...row,
      volumeM3:
        rowVolumeRounded > 0 ? formatVolumeM3(rowVolumeRounded) : "",
    };
  });

  const totalVolumeRounded = roundVolumeM3(totalVolumeRaw);
  const weightKg = parseNumber(cargo.weight);
  const weightForLdm = roundWeightKg(weightKg);
  const volumeLdmEquivalent = totalVolumeRounded * VOLUME_TO_LDM_FACTOR;
  const ldmValue = Math.max(weightForLdm, volumeLdmEquivalent);

  return {
    ...cargo,
    packagingRows,
    totalVolumeM3:
      totalVolumeRounded > 0 ? formatVolumeM3(totalVolumeRounded) : "",
    ldm: ldmValue > 0 ? formatLdm(ldmValue) : "",
  };
}
