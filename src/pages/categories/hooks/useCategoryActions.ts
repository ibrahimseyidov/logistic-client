import { useCallback } from "react";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../../common/actions/categories.actions";
import type { Category } from "../types/category.types";

export function useCategoryActions(companyId?: number) {
  const handleCreate = useCallback(
    async (data: { name: string; parentId: number | null }) => {
      if (!companyId) throw new Error("Şirket ID bulunamadı");
      return createCategory({ ...data, companyId });
    },
    [companyId],
  );

  const handleUpdate = useCallback(
    async (id: number, data: { name: string; parentId: number | null }) => {
      if (!companyId) throw new Error("Şirket ID bulunamadı");
      return updateCategory(id, { ...data, companyId });
    },
    [companyId],
  );

  const handleDelete = useCallback(
    async (id: number) => {
      if (!companyId) throw new Error("Şirket ID bulunamadı");
      return deleteCategory(id, companyId);
    },
    [companyId],
  );

  return { handleCreate, handleUpdate, handleDelete };
}
