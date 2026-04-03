import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ProductModalState {
  create: {
    open: boolean;
    isLoading: boolean;
    error: string | null;
  };
  edit: {
    open: boolean;
    isLoading: boolean;
    error: string | null;
    productId: number | null;
  };
  delete: {
    open: boolean;
    isLoading: boolean;
    error: string | null;
    productId: number | null;
    productName: string;
  };
  notification: {
    open: boolean;
    message: string;
    type: "error" | "success" | "info";
    autoCloseDuration?: number;
  };
}

const initialState: ProductModalState = {
  create: { open: false, isLoading: false, error: null },
  edit: { open: false, isLoading: false, error: null, productId: null },
  delete: {
    open: false,
    isLoading: false,
    error: null,
    productId: null,
    productName: "",
  },
  notification: {
    open: false,
    message: "",
    type: "info",
    autoCloseDuration: 4000,
  },
};

const productModalSlice = createSlice({
  name: "productModal",
  initialState,
  reducers: {
    showCreateModal(state) {
      state.create.open = true;
      state.create.isLoading = false;
      state.create.error = null;
    },
    hideCreateModal(state) {
      state.create.open = false;
      state.create.isLoading = false;
      state.create.error = null;
    },
    setCreateModalLoading(state, action: PayloadAction<boolean>) {
      state.create.isLoading = action.payload;
    },
    setCreateModalError(state, action: PayloadAction<string | null>) {
      state.create.error = action.payload;
    },
    showEditModal(state, action: PayloadAction<{ productId: number }>) {
      state.edit.open = true;
      state.edit.productId = action.payload.productId;
      state.edit.isLoading = false;
      state.edit.error = null;
    },
    hideEditModal(state) {
      state.edit.open = false;
      state.edit.productId = null;
      state.edit.isLoading = false;
      state.edit.error = null;
    },
    setEditModalLoading(state, action: PayloadAction<boolean>) {
      state.edit.isLoading = action.payload;
    },
    setEditModalError(state, action: PayloadAction<string | null>) {
      state.edit.error = action.payload;
    },
    showDeleteModal(
      state,
      action: PayloadAction<{ productId: number; productName: string }>,
    ) {
      state.delete.open = true;
      state.delete.productId = action.payload.productId;
      state.delete.productName = action.payload.productName;
      state.delete.isLoading = false;
      state.delete.error = null;
    },
    hideDeleteModal(state) {
      state.delete.open = false;
      state.delete.productId = null;
      state.delete.productName = "";
      state.delete.isLoading = false;
      state.delete.error = null;
    },
    setDeleteModalLoading(state, action: PayloadAction<boolean>) {
      state.delete.isLoading = action.payload;
    },
    setDeleteModalError(state, action: PayloadAction<string | null>) {
      state.delete.error = action.payload;
    },
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
  },
});

export const {
  showCreateModal,
  hideCreateModal,
  setCreateModalLoading,
  setCreateModalError,
  showEditModal,
  hideEditModal,
  setEditModalLoading,
  setEditModalError,
  showDeleteModal,
  hideDeleteModal,
  setDeleteModalLoading,
  setDeleteModalError,
  showNotification,
  hideNotification,
} = productModalSlice.actions;

export default productModalSlice.reducer;
