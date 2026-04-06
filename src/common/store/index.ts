import { configureStore } from "@reduxjs/toolkit";
import modalReducer from "./modalSlice";
import productModalReducer from "./productModalSlice";
import productsPaginationReducer from "../../pages/products/store/productsPaginationSlice";
import suppliersPaginationReducer from "../../pages/suppliers/store/suppliersPaginationSlice";

export const store = configureStore({
  reducer: {
    modal: modalReducer,
    productModal: productModalReducer,
    productsPagination: productsPaginationReducer,
    suppliersPagination: suppliersPaginationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
