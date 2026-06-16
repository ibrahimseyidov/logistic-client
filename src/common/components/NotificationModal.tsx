import React, { useEffect, useState } from "react";
import {
  FaCheckCircle,
  FaEdit,
  FaExclamationCircle,
  FaInfoCircle,
  FaPlusCircle,
  FaTimes,
  FaTrash,
} from "react-icons/fa";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { hideNotification } from "../store/modalSlice";
import {
  getNotificationTheme,
  NotificationKind,
} from "../utils/notification.utils";
import styles from "./NotificationModal.module.css";

const NOTIFICATION_ICONS: Record<
  NotificationKind,
  React.ComponentType<{ className?: string }>
> = {
  added: FaPlusCircle,
  updated: FaEdit,
  deleted: FaTrash,
  error: FaExclamationCircle,
  info: FaInfoCircle,
  success: FaCheckCircle,
};

export const NotificationModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const { open, message, type, autoCloseDuration } = useAppSelector(
    (state) => state.modal.notification,
  );
  const [rendered, setRendered] = useState(false);
  const [exiting, setExiting] = useState(false);

  const duration = autoCloseDuration ?? 4000;
  const theme = getNotificationTheme(type);
  const Icon = NOTIFICATION_ICONS[type];

  const closeToast = () => {
    dispatch(hideNotification());
  };

  useEffect(() => {
    if (open) {
      setRendered(true);
      setExiting(false);
      return;
    }

    if (rendered) {
      setExiting(true);
      const timer = window.setTimeout(() => {
        setRendered(false);
        setExiting(false);
      }, 280);
      return () => window.clearTimeout(timer);
    }
  }, [open, rendered]);

  useEffect(() => {
    if (!open || duration <= 0) return;
    const timer = window.setTimeout(closeToast, duration);
    return () => window.clearTimeout(timer);
  }, [open, duration, message, type, dispatch]);

  if (!rendered) return null;

  return (
    <div className={styles.container} aria-live="polite">
      <div
        className={`${styles.toast} ${styles[theme.toneClass]} ${exiting ? styles.toastExit : styles.toastEnter}`}
        role="status"
      >
        <div className={styles.iconWrap} aria-hidden>
          <Icon className={styles.icon} />
        </div>
        <div className={styles.content}>
          <p className={styles.title}>{theme.title}</p>
          <p className={styles.message}>{message}</p>
        </div>
        <button
          type="button"
          onClick={closeToast}
          className={styles.closeButton}
          aria-label="Bağla"
        >
          <FaTimes />
        </button>
      </div>
    </div>
  );
};
