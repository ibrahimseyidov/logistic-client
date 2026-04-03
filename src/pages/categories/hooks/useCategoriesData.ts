import { useEffect, useState } from "react";
import type { Category } from "../types/category.types";
import type { CategoryRecord } from "../../../common/actions/categories.actions";
import { fetchAllCategories } from "../../../common/actions/categories.actions";

export function useCategoriesData(companyId?: number) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    fetchAllCategories(companyId)
      .then((data: CategoryRecord[]) => {
        setCategories(
          data.map((c) => ({
            ...c,
            parentId: c.parentId ?? null,
            companyCategoryId:
              c.companyCategoryId === null || c.companyCategoryId === undefined
                ? undefined
                : c.companyCategoryId,
          })),
        );
      })
      .catch((err: unknown) =>
        setError(
          err instanceof Error ? err.message : "Kategoriler yüklenemedi",
        ),
      )
      .finally(() => setLoading(false));
  }, [companyId]);

  return { categories, setCategories, loading, error };
}
