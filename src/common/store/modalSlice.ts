import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ModalState {
  notification: {
    open: boolean;
    message: string;
    type: "error" | "success" | "info";
    autoCloseDuration?: number;
  };
  delete: {
    open: boolean;
    categoryId: number | null;
    categoryName: string;
    level: number | null;
    isLoading: boolean;
    error: string | null;
  };
}

const initialState: ModalState = {
  notification: {
    open: false,
    message: "",
    type: "info",
    autoCloseDuration: 4000,
  },
  delete: {
    open: false,
    categoryId: null,
    categoryName: "",
    level: null,
    isLoading: false,
    error: null,
  },
};

const modalSlice = createSlice({
  name: "modal",
  initialState,
  reducers: {
    showNotification(
      state,
      action: PayloadAction<{
        message: string;
        type: "error" | "success" | "info";
        autoCloseDuration?: number;
      }>,
    ) {
      state.notification = { open: true, ...action.payload };
    },
    hideNotification(state) {
      state.notification.open = false;
    },
    showDeleteModal(
      state,
      action: PayloadAction<{
        categoryId: number;
        categoryName: string;
        level: number;
      }>,
    ) {
      state.delete.open = true;
      state.delete.categoryId = action.payload.categoryId;
      state.delete.categoryName = action.payload.categoryName || "";
      state.delete.level = action.payload.level;
      state.delete.isLoading = false;
      state.delete.error = null;
    },
    hideDeleteModal(state) {
      state.delete.open = false;
      state.delete.categoryId = null;
      state.delete.categoryName = "";
      state.delete.level = null;
      state.delete.isLoading = false;
      state.delete.error = null;
    },
    setDeleteModalLoading(state, action: PayloadAction<boolean>) {
      state.delete.isLoading = action.payload;
    },
    setDeleteModalError(state, action: PayloadAction<string | null>) {
      state.delete.error = action.payload;
    },
  },
});

export const {
  showNotification,
  hideNotification,
  showDeleteModal,
  hideDeleteModal,
  setDeleteModalLoading,
  setDeleteModalError,
} = modalSlice.actions;

export default modalSlice.reducer;
