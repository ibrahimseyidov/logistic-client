import { useCallback, useMemo, useState } from "react";
import { fetchAllCategories } from "../../../common/actions/categories.actions";
import {
  buildCategoryById,
  buildChildrenByParent,
  getCategoryPathIds,
  getProductCategoryLevels,
} from "../lib/category.helpers";
import type { Category } from "../types/category.types";
import type { Product } from "../types/product.types";

export const useProductCategories = (companyId?: number) => {
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

  const getLevels = useCallback(
    (product: Product) => getProductCategoryLevels(product, categoryById),
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
    getLevels,
    ensureCategoriesLoaded,
  };
};
