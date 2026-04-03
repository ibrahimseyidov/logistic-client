import { configureStore } from "@reduxjs/toolkit";
import modalReducer from "./modalSlice";
import productModalReducer from "./productModalSlice";
import productsPaginationReducer from "../../pages/products/store/productsPaginationSlice";

export const store = configureStore({
  reducer: {
    modal: modalReducer,
    productModal: productModalReducer,
    productsPagination: productsPaginationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
