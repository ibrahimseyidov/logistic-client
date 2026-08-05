import { useClientPagination } from "../../../common/components/pagination";
import { REYS_ITEMS_PER_PAGE } from "../constants/reys.constants";
import type { ReysRow } from "../types/reys.types";

export function useReysPagination(rows: ReysRow[]) {
  return useClientPagination(rows, REYS_ITEMS_PER_PAGE);
}
