import { useEffect, useMemo, useState } from "react";
import { YUK_ITEMS_PER_PAGE } from "../constants/yuk.constants";
import type { YukLoadRow } from "../types/yuk.types";

export function useYukPagination(rows: YukLoadRow[]) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(rows.length / YUK_ITEMS_PER_PAGE)),
    [rows.length],
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * YUK_ITEMS_PER_PAGE;
    return rows.slice(start, start + YUK_ITEMS_PER_PAGE);
  }, [currentPage, rows]);

  const getVisiblePages = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, -1, totalPages];
    }
    if (currentPage >= totalPages - 3) {
      return [
        1,
        -1,
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }
    return [1, -1, currentPage - 1, currentPage, currentPage + 1, -1, totalPages];
  };

  return {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedRows,
    getVisiblePages,
  };
}
