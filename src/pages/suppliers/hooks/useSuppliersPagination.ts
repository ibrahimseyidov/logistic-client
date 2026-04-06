import { useMemo, useState } from "react";
import { ITEMS_PER_PAGE } from "../constants/suppliers.constants";
import type { Supplier } from "../types/supplier.types";

export const useSuppliersPagination = (suppliers: Supplier[]) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(suppliers.length / ITEMS_PER_PAGE)),
    [suppliers.length],
  );

  const paginatedSuppliers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return suppliers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, suppliers]);

  const getVisiblePages = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
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

    return [
      1,
      -1,
      currentPage - 1,
      currentPage,
      currentPage + 1,
      -1,
      totalPages,
    ];
  };

  return {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedSuppliers,
    getVisiblePages,
  };
};
