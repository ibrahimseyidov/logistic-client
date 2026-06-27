import React, { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";
import styles from "../../sorgular/components/SorgularNewModal.module.css";
import type { LookupOptionRow } from "../types/lookup.types";

interface Props {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  onSubmit: (data: { value: string; label: string }) => void;
  initialValues?: LookupOptionRow | null;
  singleField?: boolean;
  singleFieldLabel?: string;
}

export const LookupOptionModal: React.FC<Props> = ({
  isOpen,
  title,
  onClose,
  onSubmit,
  initialValues,
  singleField = false,
  singleFieldLabel = "Ad",
}) => {
  const [formData, setFormData] = useState({ value: "", label: "" });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const label = initialValues?.label ?? initialValues?.value ?? "";
      setFormData({
        value: initialValues?.value ?? label,
        label,
      });
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
    }
  }, [isOpen, initialValues]);

  if (!isOpen) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (singleField) {
      onSubmit({ value: formData.label.trim(), label: formData.label.trim() });
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className={styles.dialogRoot}>
      <div
        className={`${styles.dialogBackdrop} ${isVisible ? styles.dialogBackdropVisible : ""}`}
      />
      <aside
        className={`${styles.dialogPanel} ${isVisible ? styles.dialogPanelVisible : ""}`}
      >
        <div className={styles.dialogHeader}>
          <div className={styles.dialogHeaderText}>
            <h2 className={styles.dialogTitle}>{title}</h2>
          </div>
          <button className={styles.closeButton} onClick={onClose} type="button">
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.dialogBody}>
          <div className={styles.sectionStack}>
            {!singleField ? (
              <label className={styles.fieldStack}>
                <span className={styles.label}>Kod</span>
                <input
                  className={styles.input}
                  value={formData.value}
                  onChange={(event) =>
                    setFormData({ ...formData, value: event.target.value })
                  }
                  required
                />
              </label>
            ) : null}
            <label className={styles.fieldStack}>
              <span className={styles.label}>{singleField ? singleFieldLabel : "Ad"}</span>
              <input
                className={styles.input}
                value={formData.label}
                onChange={(event) =>
                  setFormData({ ...formData, label: event.target.value })
                }
                required
              />
            </label>
          </div>
        </form>

        <div className={styles.dialogFooter}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={onClose}
          >
            Ləğv et
          </button>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleSubmit}
          >
            Yadda saxla
          </button>
        </div>
      </aside>
    </div>
  );
};
