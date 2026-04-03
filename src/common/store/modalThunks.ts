import { createAsyncThunk } from "@reduxjs/toolkit";
import { deleteCategory as apiDeleteCategory } from "../actions/categories.actions";
import {
  setDeleteModalLoading,
  setDeleteModalError,
  hideDeleteModal,
} from "./modalSlice";

export const deleteCategoryThunk = createAsyncThunk<
  void,
  { companyId: number },
  { state: any }
>(
  "modal/deleteCategoryThunk",
  async ({ companyId }, { getState, dispatch }) => {
    const { categoryId } = getState().modal.delete;
    if (!companyId || !categoryId) return;
    try {
      dispatch(setDeleteModalLoading(true));
      dispatch(setDeleteModalError(null));
      await apiDeleteCategory(categoryId, companyId);
      dispatch(hideDeleteModal());
      // Optionally: dispatch a notification or refetch categories here
    } catch (err) {
      dispatch(
        setDeleteModalError(
          err instanceof Error ? err.message : "Kategori silinemedi",
        ),
      );
    } finally {
      dispatch(setDeleteModalLoading(false));
    }
  },
);
