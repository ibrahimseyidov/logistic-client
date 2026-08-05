import { useClientPagination } from "../../../common/components/pagination";
import { ITEMS_PER_PAGE } from "../constants/sorgular.constants";
import type { LogisticQueryRow } from "../types/sorgu.types";

export function useSorgularPagination(rows: LogisticQueryRow[]) {
  return useClientPagination(rows, ITEMS_PER_PAGE);
}
