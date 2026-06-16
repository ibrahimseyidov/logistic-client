import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  NotificationInputType,
  NotificationKind,
  resolveNotificationKind,
} from "../utils/notification.utils";

interface ModalState {
  notification: {
    open: boolean;
    message: string;
    type: NotificationKind;
    autoCloseDuration?: number;
  };
  confirm: {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirmKey?: string; // We'll use a key to identify the action
    isLoading?: boolean;
  };
}

const initialState: ModalState = {
  notification: {
    open: false,
    message: "",
    type: "info",
    autoCloseDuration: 4000,
  },
  confirm: {
    open: false,
    title: "",
    message: "",
    confirmLabel: "Bəli",
    cancelLabel: "Ləğv et",
    onConfirmKey: "",
    isLoading: false,
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
        type: NotificationInputType;
        autoCloseDuration?: number;
      }>,
    ) {
      const { message, type, autoCloseDuration } = action.payload;
      state.notification = {
        open: true,
        message,
        type: resolveNotificationKind(type, message),
        autoCloseDuration,
      };
    },
    hideNotification(state) {
      state.notification.open = false;
    },
    showConfirm(
      state,
      action: PayloadAction<{
        title: string;
        message: string;
        confirmLabel?: string;
        cancelLabel?: string;
        onConfirmKey?: string;
      }>,
    ) {
      state.confirm = { ...initialState.confirm, open: true, ...action.payload };
    },
    hideConfirm(state) {
      state.confirm.open = false;
    },
    setConfirmLoading(state, action: PayloadAction<boolean>) {
      state.confirm.isLoading = action.payload;
    },
  },
});

export const {
  showNotification,
  hideNotification,
  showConfirm,
  hideConfirm,
  setConfirmLoading,
} = modalSlice.actions;

export default modalSlice.reducer;
