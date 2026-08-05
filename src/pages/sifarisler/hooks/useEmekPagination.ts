import { useClientPagination } from "../../../common/components/pagination";
import { EMEK_ITEMS_PER_PAGE } from "../constants/emek.constants";
import type { EmekRow } from "../types/emek.types";

export function useEmekPagination(rows: EmekRow[]) {
  return useClientPagination(rows, EMEK_ITEMS_PER_PAGE);
}
