import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { searchProducts as searchProductsAction } from "../../../common/actions/products.actions";
import type { Product } from "../types/product.types";

interface UseProductsFiltersParams {
  companyId?: number;
  setProducts: Dispatch<SetStateAction<Product[]>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
  fetchProducts: () => Promise<void>;
  setCurrentPage: Dispatch<SetStateAction<number>>;
}

export const useProductsFilters = ({
  companyId,
  setProducts,
  setLoading,
  setError,
  fetchProducts,
  setCurrentPage,
}: UseProductsFiltersParams) => {
  const [codeSearchTerm, setCodeSearchTerm] = useState("");
  const [nameSearchTerm, setNameSearchTerm] = useState("");
  const [barcodeSearchTerm, setBarcodeSearchTerm] = useState("");

  const handleFilter = async () => {
    if (!companyId) return;

    const normalizedCode = codeSearchTerm.trim();
    const normalizedName = nameSearchTerm.trim();
    const normalizedBarcode = barcodeSearchTerm.trim();

    const hasAnyFilter =
      normalizedCode !== "" ||
      normalizedName !== "" ||
      normalizedBarcode !== "";

    if (!hasAnyFilter) {
      await fetchProducts();
      setCurrentPage(1);
      return;
    }

    if (normalizedCode !== "" && Number.isNaN(Number(normalizedCode))) {
      setError("Kod alanı sayısal olmalıdır");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const searchedProducts = await searchProductsAction(companyId, {
        id: normalizedCode === "" ? undefined : Number(normalizedCode),
        name: normalizedName || undefined,
        barcode: normalizedBarcode || undefined,
      });

      setProducts(searchedProducts as Product[]);
      setCurrentPage(1);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Arama basarisiz";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return {
    codeSearchTerm,
    nameSearchTerm,
    barcodeSearchTerm,
    setCodeSearchTerm,
    setNameSearchTerm,
    setBarcodeSearchTerm,
    handleFilter,
  };
};
