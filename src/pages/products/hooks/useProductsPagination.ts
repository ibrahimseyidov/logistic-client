import { useMemo, useState } from "react";
import { ITEMS_PER_PAGE } from "../constants/product.constants";
import type { Product } from "../types/product.types";

export const useProductsPagination = (products: Product[]) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(products.length / ITEMS_PER_PAGE)),
    [products.length],
  );

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return products.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, products]);

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
    paginatedProducts,
    getVisiblePages,
  };
};
