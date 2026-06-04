import React, { useEffect, useState } from "react";
import { FiFilePlus, FiFilter } from "react-icons/fi";
import {
  ContactPersonRow,
  createContactPersonAction,
  deleteContactPersonAction,
  fetchContactPersonsAction,
  updateContactPersonAction,
} from "../../../common/actions/contact.actions";
import { ConfirmModal } from "../../../common/components/ConfirmModal";
import { useAppDispatch } from "../../../common/store/hooks";
import { showNotification } from "../../../common/store/modalSlice";
import actionStyles from "../../sorgular/components/SorgularActionBar.module.css";
import layoutStyles from "../../sorgular/sorgular.module.css";
import { ContactPersonModal } from "./ContactPersonModal";
import { ContactPersonsTable } from "./ContactPersonsTable";

export const ContactPersonsSection: React.FC = () => {
  const [contacts, setContacts] = useState<ContactPersonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ContactPersonRow | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const dispatch = useAppDispatch();

  const loadContacts = async () => {
    try {
      setLoading(true);
      const data = await fetchContactPersonsAction();
      setContacts(data);
    } catch {
      dispatch(showNotification({ message: "Xəta!", type: "error" }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const handleCreate = () => {
    setSelectedContact(null);
    setIsModalOpen(true);
  };

  const handleEdit = (c: ContactPersonRow) => {
    setSelectedContact(c);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setContactToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!contactToDelete) return;
    setIsDeleting(true);
    try {
      await deleteContactPersonAction(contactToDelete);
      setContacts(contacts.filter((c) => c.id !== contactToDelete));
      dispatch(showNotification({ message: "Silindi", type: "success" }));
      setDeleteConfirmOpen(false);
      setContactToDelete(null);
    } catch {
      dispatch(showNotification({ message: "Xəta!", type: "error" }));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (data: Omit<ContactPersonRow, "id">) => {
    try {
      if (selectedContact) {
        const updated = await updateContactPersonAction(selectedContact.id, data);
        setContacts(contacts.map((c) => (c.id === selectedContact.id ? updated : c)));
        dispatch(showNotification({ message: "Yeniləndi", type: "success" }));
      } else {
        const created = await createContactPersonAction(data);
        setContacts([created, ...contacts]);
        dispatch(showNotification({ message: "Yaradıldı", type: "success" }));
      }
      setIsModalOpen(false);
    } catch {
      dispatch(showNotification({ message: "Xəta!", type: "error" }));
    }
  };

  return (
    <>
      <div className={actionStyles.wrapper} style={{ padding: "0.5rem 1rem" }}>
        <div className={actionStyles.group}>
          <button
            type="button"
            className={`${actionStyles.buttonBase} ${actionStyles.buttonPrimary}`}
            onClick={handleCreate}
          >
            <FiFilePlus /> Yeni şəxs
          </button>
        </div>
        <div className={actionStyles.statsGroup}>
          <span className={actionStyles.statPill}>Cəmi: {contacts.length}</span>
        </div>
      </div>

      <div className={layoutStyles.body}>
        {loading ? (
          <div style={{ padding: "2rem", textAlign: "center" }}>Yüklənir...</div>
        ) : (
          <ContactPersonsTable rows={contacts} onEdit={handleEdit} onDelete={handleDelete} />
        )}
      </div>

      <ContactPersonModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialValues={selectedContact}
      />

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        title="Sil"
        message="Bu əlaqədar şəxsi silmək istədiyinizə əminsiniz?"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setContactToDelete(null);
        }}
        isLoading={isDeleting}
      />
    </>
  );
};
