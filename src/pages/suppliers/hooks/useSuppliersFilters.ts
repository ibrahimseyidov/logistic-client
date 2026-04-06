import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Supplier } from "../types/supplier.types";

interface UseSuppliersFiltersParams {
  allSuppliers: Supplier[];
  setSuppliers: Dispatch<SetStateAction<Supplier[]>>;
  setCurrentPage: Dispatch<SetStateAction<number>>;
}

export const useSuppliersFilters = ({
  allSuppliers,
  setSuppliers,
  setCurrentPage,
}: UseSuppliersFiltersParams) => {
  const [searchTerm, setSearchTerm] = useState("");

  const handleFilter = async () => {
    if (!allSuppliers.length) {
      setSuppliers([]);
      setCurrentPage(1);
      return;
    }

    const normalizedSearch = searchTerm.trim();

    if (!normalizedSearch) {
      setSuppliers(allSuppliers);
      setCurrentPage(1);
      return;
    }

    const filtered = allSuppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(normalizedSearch.toLowerCase()) ||
        s.phone.toLowerCase().includes(normalizedSearch.toLowerCase()) ||
        s.email.toLowerCase().includes(normalizedSearch.toLowerCase()),
    );
    setSuppliers(filtered);
    setCurrentPage(1);
  };

  return {
    searchTerm,
    setSearchTerm,
    handleFilter,
  };
};
