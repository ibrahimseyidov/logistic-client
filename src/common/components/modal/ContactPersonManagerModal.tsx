import React, { useState } from "react";
import { FiPlus } from "react-icons/fi";
import type { ContactPersonRow } from "../../actions/contact.actions";
import {
  ContactPersonFormModal,
  type ContactPersonFormData,
} from "./ContactPersonFormModal";
import styles from "./ContactPersonManagerModal.module.css";

interface ContactPersonManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: ContactPersonRow[];
  onAdd: (data: ContactPersonFormData) => void | Promise<void>;
  onRemove: (contact: ContactPersonRow, index: number) => void;
  entityName?: string;
  entityTypeLabel?: string;
  emptyMessage?: string;
  isSubmitting?: boolean;
}

export const ContactPersonManagerModal: React.FC<ContactPersonManagerModalProps> = ({
  isOpen,
  onClose,
  contacts,
  onAdd,
  onRemove,
  entityName,
  entityTypeLabel = "şirkət",
  emptyMessage,
  isSubmitting = false,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);

  if (!isOpen) return null;

  const subtitle = entityName
    ? `${entityName} üçün ${entityTypeLabel} əlaqədar şəxsləri`
    : `Yeni ${entityTypeLabel} üçün əlaqədar şəxslər`;

  const handleAdd = async (data: ContactPersonFormData) => {
    await onAdd(data);
    setIsFormOpen(false);
  };

  return (
    <>
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.panel} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
          <div className={styles.header}>
            <div>
              <h3 className={styles.title}>Əlaqədar şəxslər</h3>
              <p className={styles.description}>{subtitle}</p>
            </div>
            <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Bağla">
              ×
            </button>
          </div>

          <button type="button" className={styles.addButton} onClick={() => setIsFormOpen(true)}>
            <FiPlus />
            Yeni əlaqədar şəxs
          </button>

          <div className={styles.list}>
            {contacts.length === 0 ? (
              <p className={styles.empty}>
                {emptyMessage || `Bu ${entityTypeLabel}ə aid heç bir əlaqədar şəxs tapılmadı.`}
              </p>
            ) : (
              contacts.map((contact, index) => (
                <div key={contact.id || `${contact.fullName}-${index}`} className={styles.card}>
                  <div className={styles.cardBody}>
                    <div className={styles.name}>
                      {contact.fullName}
                      {contact.position ? ` (${contact.position})` : ""}
                    </div>
                    <div className={styles.meta}>
                      {contact.phone ? `Telefon: ${contact.phone}` : ""}
                      {contact.phone && contact.email ? " · " : ""}
                      {contact.email ? `E-poçt: ${contact.email}` : ""}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() => onRemove(contact, index)}
                    aria-label="Şəxsi sil"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>

          <div className={styles.footer}>
            <button type="button" className={styles.doneButton} onClick={onClose}>
              Hazırdır
            </button>
          </div>
        </div>
      </div>

      <ContactPersonFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleAdd}
        isSubmitting={isSubmitting}
        initialValues={{ company: entityName }}
      />
    </>
  );
};
