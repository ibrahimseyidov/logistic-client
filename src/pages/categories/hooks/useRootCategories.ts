import { useMemo } from "react";
import type { Category } from "../types/category.types";

export function useRootCategories(categories: Category[]) {
  return useMemo(
    () => categories.filter((c) => c.parentId == null),
    [categories],
  );
}
