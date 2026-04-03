import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ProductsPaginationState {
  currentPage: number;
}

const initialState: ProductsPaginationState = {
  currentPage: 1,
};

const productsPaginationSlice = createSlice({
  name: "productsPagination",
  initialState,
  reducers: {
    setProductsPage(state, action: PayloadAction<number>) {
      state.currentPage = action.payload;
    },
  },
});

export const { setProductsPage } = productsPaginationSlice.actions;
export default productsPaginationSlice.reducer;
