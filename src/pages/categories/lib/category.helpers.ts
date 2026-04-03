import type { Category } from "../types/category.types";

export function getRootCategories(categories: Category[]): Category[] {
  return categories.filter((c) => c.parentId == null);
}

export function buildCategoryMap(
  categories: Category[],
  childrenByParent: Record<number, Category[]>,
): Map<number, Category> {
  const map = new Map<number, Category>();
  categories.forEach((c) => map.set(c.id, c));
  Object.values(childrenByParent)
    .flat()
    .forEach((c) => map.set(c.id, c));
  return map;
}
