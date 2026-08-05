import { useClientPagination } from "../../../common/components/pagination";
import { YUK_ITEMS_PER_PAGE } from "../constants/yuk.constants";
import type { YukLoadRow } from "../types/yuk.types";

export function useYukPagination(rows: YukLoadRow[]) {
  return useClientPagination(rows, YUK_ITEMS_PER_PAGE);
}
