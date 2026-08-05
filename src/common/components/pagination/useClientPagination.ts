import { useEffect, useMemo, useState } from "react";
import { DEFAULT_PAGE_SIZE } from "./constants";
import { getVisiblePages as buildVisiblePages } from "./getVisiblePages";

export function useClientPagination<T>(
  rows: T[],
  defaultPageSize: number = DEFAULT_PAGE_SIZE,
) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(defaultPageSize);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(rows.length / pageSize)),
    [rows.length, pageSize],
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const setPageSize = (size: number) => {
    setPageSizeState(size);
    setCurrentPage(1);
  };

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [currentPage, pageSize, rows]);

  const getVisiblePages = () => buildVisiblePages(currentPage, totalPages);

  return {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    paginatedRows,
    getVisiblePages,
  };
}
