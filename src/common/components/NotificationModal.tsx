import React, { useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { hideNotification } from "../store/modalSlice";
import styles from "./NotificationModal.module.css";

export const NotificationModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const { open, message, type, autoCloseDuration } = useAppSelector(
    (state) => state.modal.notification,
  );

  useEffect(() => {
    if (open && autoCloseDuration && autoCloseDuration > 0) {
      const timer = setTimeout(() => {
        dispatch(hideNotification());
      }, autoCloseDuration);
      return () => clearTimeout(timer);
    }
  }, [open, autoCloseDuration, dispatch]);

  if (!open) return null;

  let toneClass = styles.info;
  let title = "Bilgi";

  if (type === "error") {
    toneClass = styles.error;
    title = "Hata";
  } else if (type === "success") {
    toneClass = styles.success;
    title = "Başarılı";
  }

  return (
    <div className={styles.overlay}>
      <div
        className={`${styles.modal} ${toneClass}`}
        role="alertdialog"
        aria-modal="true"
      >
        <div className={styles.header}>
          <div>
            <h3 className={styles.title}>{title}</h3>
          </div>
          <button
            type="button"
            onClick={() => dispatch(hideNotification())}
            className={styles.closeButton}
            aria-label="Kapat"
          >
            <FaTimes />
          </button>
        </div>
        <div className={styles.body}>
          <p className={styles.message}>{message}</p>
        </div>
        <div className={styles.footer}>
          <button
            type="button"
            onClick={() => dispatch(hideNotification())}
            className={styles.actionButton}
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
