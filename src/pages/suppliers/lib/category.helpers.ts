import type { Category } from "../types/category.types";
import type { Product } from "../types/supplier.types";

export const buildCategoryById = (categories: Category[]) => {
  const map = new Map<number, Category>();
  categories.forEach((category) => {
    map.set(category.id, category);
  });
  return map;
};

export const buildChildrenByParent = (categories: Category[]) => {
  const map = new Map<number, Category[]>();

  categories.forEach((category) => {
    if (category.parentId === null || category.parentId === undefined) {
      return;
    }

    const existing = map.get(category.parentId) || [];
    map.set(category.parentId, [...existing, category]);
  });

  return map;
};

export const getCategoryPathIds = (
  leafCategoryId: number,
  categoryById: Map<number, Category>,
) => {
  const visited = new Set<number>();
  const path: number[] = [];
  let current = categoryById.get(leafCategoryId);

  while (current) {
    if (visited.has(current.id)) {
      break;
    }

    visited.add(current.id);
    path.push(current.id);

    if (current.parentId === null || current.parentId === undefined) {
      break;
    }

    current = categoryById.get(current.parentId);
  }

  return path.reverse();
};

export const getProductCategoryLevels = (
  product: Product,
  categoryById: Map<number, Category>,
) => {
  const levels = ["-", "-", "-", "-"];

  const parent =
    categoryById.get(product.parentCategoryId) || product.parentCategory;
  if (parent?.name) {
    levels[0] = parent.name;
  }

  if (!product.subCategoryId) {
    return levels;
  }

  const path = getCategoryPathIds(product.subCategoryId, categoryById);
  const parentIndex = path.indexOf(product.parentCategoryId);
  const descendants = parentIndex >= 0 ? path.slice(parentIndex + 1) : [];

  descendants.slice(0, 3).forEach((categoryId, index) => {
    const category = categoryById.get(categoryId);
    levels[index + 1] = category?.name || "-";
  });

  if (descendants.length === 0 && product.subCategory?.name) {
    levels[1] = product.subCategory.name;
  }

  return levels;
};
