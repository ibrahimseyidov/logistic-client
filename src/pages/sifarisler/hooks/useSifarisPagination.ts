import { useClientPagination } from "../../../common/components/pagination";
import { ITEMS_PER_PAGE } from "../constants/sifaris.constants";
import type { SifarisOrderRow } from "../types/sifaris.types";

export function useSifarisPagination(rows: SifarisOrderRow[]) {
  return useClientPagination(rows, ITEMS_PER_PAGE);
}
