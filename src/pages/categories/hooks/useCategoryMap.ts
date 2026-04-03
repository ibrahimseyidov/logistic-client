import { useMemo } from "react";
import type { Category } from "../types/category.types";

export function useCategoryMap(
  categories: Category[],
  childrenByParent: Record<number, Category[]>,
) {
  return useMemo(() => {
    const map = new Map<number, Category>();
    categories.forEach((c) => map.set(c.id, c));
    Object.values(childrenByParent)
      .flat()
      .forEach((c) => map.set(c.id, c));
    return map;
  }, [categories, childrenByParent]);
}
