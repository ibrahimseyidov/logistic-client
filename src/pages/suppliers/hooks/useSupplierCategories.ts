import { useCallback, useMemo, useState } from "react";
import { fetchAllCategories } from "../../../common/actions/categories.actions";
import {
  buildCategoryById,
  buildChildrenByParent,
  getCategoryPathIds,
} from "../lib/category.helpers";
import type { Category } from "../types/category.types";
// No Product/Supplier import needed

export const useSupplierCategories = (companyId?: number) => {
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [parentCategories, setParentCategories] = useState<Category[]>([]);

  const categoryById = useMemo(
    () => buildCategoryById(allCategories),
    [allCategories],
  );

  const childrenByParent = useMemo(
    () => buildChildrenByParent(allCategories),
    [allCategories],
  );

  const getPath = useCallback(
    (leafCategoryId: number) =>
      getCategoryPathIds(leafCategoryId, categoryById),
    [categoryById],
  );

  const ensureCategoriesLoaded = useCallback(async () => {
    if (!companyId) return;
    if (allCategories.length > 0) return;

    try {
      const categoryData = await fetchAllCategories(companyId);
      const typedCategories = categoryData as Category[];
      setAllCategories(typedCategories);
      setParentCategories(
        typedCategories.filter((category) => category.parentId === null),
      );
    } catch {
      // kategori yüklenemezse modal yine açılır, seçim listeleri boş kalır
    }
  }, [allCategories.length, companyId]);

  return {
    allCategories,
    parentCategories,
    childrenByParent,
    getPath,
    ensureCategoriesLoaded,
  };
};
