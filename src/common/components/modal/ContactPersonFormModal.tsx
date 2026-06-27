import React, { useCallback, useEffect, useMemo, useState } from "react";
import Select from "../select/Select";
import { fetchLookupAction, type LookupRow } from "../../actions/lookup.actions";
import { LookupManagerModal } from "./LookupManagerModal";
import {
  CONTACT_POSITIONS_LOOKUP_TYPE,
  lookupRowsToPositionOptions,
  withCustomPositionOption,
} from "../../utils/contactPosition.utils";
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
  const [positionsData, setPositionsData] = useState<LookupRow[]>([]);
  const [isPositionModalOpen, setIsPositionModalOpen] = useState(false);

  const loadPositions = useCallback(async () => {
    const data = await fetchLookupAction(CONTACT_POSITIONS_LOOKUP_TYPE);
    setPositionsData(data);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setForm({
      fullName: initialValues?.fullName || "",
      phone: initialValues?.phone || "",
      email: initialValues?.email || "",
      position: initialValues?.position || "",
      company: initialValues?.company || "",
    });
    void loadPositions();
  }, [isOpen, initialValues, loadPositions]);

  const positionOptions = useMemo(
    () =>
      withCustomPositionOption(
        lookupRowsToPositionOptions(positionsData),
        form.position,
      ),
    [positionsData, form.position],
  );

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
    <>
      <div className={styles.overlay}>
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

            <div className={styles.field}>
              <span className={styles.label}>Vəzifə</span>
              <div className={styles.inlineControlRow}>
                <div className={styles.grow}>
                  <Select
                    value={form.position}
                    options={positionOptions}
                    onChange={(value) => setForm((prev) => ({ ...prev, position: value }))}
                    placeholder="Vəzifə seçin"
                    className={styles.selectControl}
                  />
                </div>
                <button
                  type="button"
                  title="Vəzifə əlavə et"
                  className={styles.plusButton}
                  onClick={() => setIsPositionModalOpen(true)}
                >
                  +
                </button>
              </div>
            </div>
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

      <LookupManagerModal
        isOpen={isPositionModalOpen}
        onClose={() => setIsPositionModalOpen(false)}
        lookupType={CONTACT_POSITIONS_LOOKUP_TYPE}
        title="Vəzifələr"
        onDataChanged={setPositionsData}
      />
    </>
  );
};
