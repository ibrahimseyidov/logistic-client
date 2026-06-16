import React from "react";
import {
  ContactPersonFormModal,
  type ContactPersonFormData,
} from "../../../common/components/modal/ContactPersonFormModal";
import type { ContactPersonRow } from "../../../common/actions/contact.actions";

interface ContactPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ContactPersonFormData) => void | Promise<void>;
  initialValues?: ContactPersonRow | null;
}

export const ContactPersonModal: React.FC<ContactPersonModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialValues,
}) => {
  return (
    <ContactPersonFormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      initialValues={initialValues}
      showCompany
      title={initialValues ? "Əlaqədar şəxsi redaktə et" : "Yeni əlaqədar şəxs əlavə et"}
      description={
        initialValues
          ? "Əlaqədar şəxsin məlumatlarını yeniləyin."
          : "Şəxsin əlaqə məlumatlarını daxil edərək siyahıya əlavə edin."
      }
      submitLabel={initialValues ? "Yadda saxla" : "Əlavə et"}
    />
  );
};
