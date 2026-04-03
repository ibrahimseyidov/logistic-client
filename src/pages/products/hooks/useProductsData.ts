import { useCallback, useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { fetchProducts as fetchProductsAction } from "../../../common/actions/products.actions";
import type { Product } from "../types/product.types";

interface UseProductsDataResult {
  products: Product[];
  setProducts: Dispatch<SetStateAction<Product[]>>;
  loading: boolean;
  setLoading: Dispatch<SetStateAction<boolean>>;
  error: string | null;
  setError: Dispatch<SetStateAction<string | null>>;
  fetchProducts: () => Promise<void>;
}

export const useProductsData = (companyId?: number): UseProductsDataResult => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetchedCompanyId = useRef<number | null>(null);

  const fetchProducts = useCallback(async () => {
    if (!companyId) {
      setLoading(false);
      setProducts([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const productData = await fetchProductsAction(companyId);
      setProducts(productData as Product[]);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Ürünler Getirilemedi";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (!companyId) {
      lastFetchedCompanyId.current = null;
      return;
    }

    if (lastFetchedCompanyId.current === companyId) {
      return;
    }

    lastFetchedCompanyId.current = companyId;
    void fetchProducts();
  }, [companyId, fetchProducts]);

  return {
    products,
    setProducts,
    loading,
    setLoading,
    error,
    setError,
    fetchProducts,
  };
};
