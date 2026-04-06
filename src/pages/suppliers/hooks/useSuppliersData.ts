import { useCallback, useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { fetchSuppliers as fetchSuppliersAction } from "../../../common/actions/suppliers.actions";
import type { Supplier } from "../types/supplier.types";

interface UseSuppliersDataResult {
  suppliers: Supplier[];
  allSuppliers: Supplier[];
  setSuppliers: Dispatch<SetStateAction<Supplier[]>>;
  setAllSuppliers: Dispatch<SetStateAction<Supplier[]>>;
  loading: boolean;
  setLoading: Dispatch<SetStateAction<boolean>>;
  error: string | null;
  setError: Dispatch<SetStateAction<string | null>>;
  fetchSuppliers: () => Promise<void>;
}

export const useSuppliersData = (
  companyId?: number,
): UseSuppliersDataResult => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetchedCompanyId = useRef<number | null>(null);

  const fetchSuppliers = useCallback(async () => {
    if (!companyId) {
      setLoading(false);
      setSuppliers([]);
      setAllSuppliers([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const supplierData = await fetchSuppliersAction(companyId);
      setAllSuppliers(supplierData as Supplier[]);
      setSuppliers(supplierData as Supplier[]);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Tedarikçiler getirilemedi";
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
    void fetchSuppliers();
  }, [companyId, fetchSuppliers]);

  return {
    suppliers,
    allSuppliers,
    setSuppliers,
    setAllSuppliers,
    loading,
    setLoading,
    error,
    setError,
    fetchSuppliers,
  };
};
