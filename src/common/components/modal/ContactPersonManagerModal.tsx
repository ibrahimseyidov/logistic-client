import React, { useState } from "react";
import { FiEdit2, FiPlus } from "react-icons/fi";
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
  onEdit?: (contact: ContactPersonRow, data: ContactPersonFormData) => void | Promise<void>;
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
  onEdit,
  onRemove,
  entityName,
  entityTypeLabel = "şirkət",
  emptyMessage,
  isSubmitting = false,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactPersonRow | null>(null);

  if (!isOpen) return null;

  const subtitle = entityName
    ? `${entityName} üçün ${entityTypeLabel} əlaqədar şəxsləri`
    : `Yeni ${entityTypeLabel} üçün əlaqədar şəxslər`;

  const openCreateForm = () => {
    setEditingContact(null);
    setIsFormOpen(true);
  };

  const openEditForm = (contact: ContactPersonRow) => {
    setEditingContact(contact);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingContact(null);
  };

  const handleSubmit = async (data: ContactPersonFormData) => {
    if (editingContact && onEdit) {
      await onEdit(editingContact, data);
    } else {
      await onAdd(data);
    }
    closeForm();
  };

  return (
    <>
      <div className={styles.overlay}>
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

          <button type="button" className={styles.addButton} onClick={openCreateForm}>
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
                  <div className={styles.cardActions}>
                    {onEdit ? (
                      <button
                        type="button"
                        className={styles.editButton}
                        onClick={() => openEditForm(contact)}
                        aria-label="Şəxsi redaktə et"
                      >
                        <FiEdit2 />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className={styles.removeButton}
                      onClick={() => onRemove(contact, index)}
                      aria-label="Şəxsi sil"
                    >
                      ×
                    </button>
                  </div>
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
        onClose={closeForm}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        initialValues={
          editingContact
            ? {
                fullName: editingContact.fullName,
                phone: editingContact.phone,
                email: editingContact.email,
                position: editingContact.position,
                company: editingContact.company || entityName,
              }
            : { company: entityName }
        }
        title={editingContact ? "Əlaqədar şəxsi redaktə et" : "Yeni əlaqədar şəxs əlavə et"}
        description={
          editingContact
            ? "Əlaqədar şəxsin məlumatlarını yeniləyin."
            : "Şəxsin əlaqə məlumatlarını daxil edərək siyahıya əlavə edin."
        }
        submitLabel={editingContact ? "Yadda saxla" : "Əlavə et"}
      />
    </>
  );
};
