import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface SuppliersPaginationState {
  currentPage: number;
}

const initialState: SuppliersPaginationState = {
  currentPage: 1,
};

const suppliersPaginationSlice = createSlice({
  name: "suppliersPagination",
  initialState,
  reducers: {
    setSuppliersPage(state, action: PayloadAction<number>) {
      state.currentPage = action.payload;
    },
  },
});

export const { setSuppliersPage } = suppliersPaginationSlice.actions;
export default suppliersPaginationSlice.reducer;
