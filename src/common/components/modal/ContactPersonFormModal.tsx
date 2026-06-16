import React, { useEffect, useState } from "react";
import styles from "./ContactPersonFormModal.module.css";

export interface ContactPersonFormData {
  fullName: string;
  phone: string;
  email: string;
  position: string;
  company?: string;
}

const EMPTY_FORM: ContactPersonFormData = {
  fullName: "",
  phone: "",
  email: "",
  position: "",
  company: "",
};

interface ContactPersonFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ContactPersonFormData) => void | Promise<void>;
  initialValues?: Partial<ContactPersonFormData> | null;
  title?: string;
  description?: string;
  submitLabel?: string;
  showCompany?: boolean;
  isSubmitting?: boolean;
}

export const ContactPersonFormModal: React.FC<ContactPersonFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialValues,
  title = "Yeni əlaqədar şəxs əlavə et",
  description = "Şəxsin əlaqə məlumatlarını daxil edərək siyahıya əlavə edin.",
  submitLabel = "Əlavə et",
  showCompany = false,
  isSubmitting = false,
}) => {
  const [form, setForm] = useState<ContactPersonFormData>(EMPTY_FORM);

  useEffect(() => {
    if (!isOpen) return;
    setForm({
      fullName: initialValues?.fullName || "",
      phone: initialValues?.phone || "",
      email: initialValues?.email || "",
      position: initialValues?.position || "",
      company: initialValues?.company || "",
    });
  }, [isOpen, initialValues]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!form.fullName.trim()) return;
    await onSubmit({
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      position: form.position.trim(),
      company: form.company?.trim() || "",
    });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className={styles.header}>
          <div>
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.description}>{description}</p>
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Bağla">
            ×
          </button>
        </div>

        <div className={styles.form}>
          <label className={styles.field}>
            <span className={styles.label}>Ad Soyad *</span>
            <input
              type="text"
              className={styles.input}
              value={form.fullName}
              onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
              placeholder="Məs: Nicat Namazov"
            />
          </label>

          {showCompany ? (
            <label className={styles.field}>
              <span className={styles.label}>Şirkət</span>
              <input
                type="text"
                className={styles.input}
                value={form.company}
                onChange={(e) => setForm((prev) => ({ ...prev, company: e.target.value }))}
                placeholder="Şirkət adı"
              />
            </label>
          ) : null}

          <label className={styles.field}>
            <span className={styles.label}>Telefon nömrəsi</span>
            <input
              type="text"
              className={styles.input}
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="Məs: +994 50 000 00 00"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>E-poçt</span>
            <input
              type="email"
              className={styles.input}
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="Məs: info@domain.com"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Vəzifə</span>
            <input
              type="text"
              className={styles.input}
              value={form.position}
              onChange={(e) => setForm((prev) => ({ ...prev, position: e.target.value }))}
              placeholder="Məs: Menecer"
            />
          </label>
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.cancelButton} onClick={onClose}>
            Ləğv et
          </button>
          <button
            type="button"
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={isSubmitting || !form.fullName.trim()}
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
