export const formatPrice = (value?: number | null) => {
  if (value === null || value === undefined) return "-";
  if (!Number.isFinite(value)) return "-";
  return value.toFixed(2);
};

export const formatStock = (quantity?: number | null) => {
  if (quantity === null || quantity === undefined) return "-";
  if (!Number.isFinite(quantity)) return "-";
  return String(quantity);
};

export const formatStockUnit = (unit?: string | null) => {
  if (!unit) return "adet";
  return unit;
};
