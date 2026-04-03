import { VALID_STOCK_UNITS } from "../constants/product.constants";

export const parseOptionalNumber = (value: string) => {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? NaN : parsed;
};

export const isValidStockUnit = (value: string) => {
  return VALID_STOCK_UNITS.includes(
    value as (typeof VALID_STOCK_UNITS)[number],
  );
};
