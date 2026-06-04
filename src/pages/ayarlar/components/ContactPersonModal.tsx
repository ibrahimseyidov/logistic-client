import React, { useEffect, useState } from "react";
import styles from "../../sorgular/components/SorgularNewModal.module.css";
import { FiX } from "react-icons/fi";
import { ContactPersonRow } from "../../../common/actions/contact.actions";

interface ContactPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<ContactPersonRow, "id">) => void;
  initialValues?: ContactPersonRow | null;
}

export const ContactPersonModal: React.FC<ContactPersonModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialValues,
}) => {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    position: "",
    company: "",
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialValues) {
        setFormData({
          fullName: initialValues.fullName,
          phone: initialValues.phone,
          email: initialValues.email,
          position: initialValues.position,
          company: initialValues.company || "",
        });
      } else {
        setFormData({ fullName: "", phone: "", email: "", position: "", company: "" });
      }
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
    }
  }, [isOpen, initialValues]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className={styles.dialogRoot}>
      <div 
        className={`${styles.dialogBackdrop} ${isVisible ? styles.dialogBackdropVisible : ""}`} 
        onClick={onClose} 
      />
      <aside className={`${styles.dialogPanel} ${isVisible ? styles.dialogPanelVisible : ""}`}>
        <div className={styles.dialogHeader}>
          <div className={styles.dialogHeaderText}>
            <h2 className={styles.dialogTitle}>{initialValues ? "Əlaqədar şəxsi redaktə et" : "Yeni əlaqədar şəxs"}</h2>
          </div>
          <button className={styles.closeButton} onClick={onClose} type="button">
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.dialogBody}>
          <div className={styles.sectionStack}>
            <label className={styles.fieldStack}>
              <span className={styles.label}>Ad və Soyad</span>
              <input
                className={styles.input}
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </label>
            <label className={styles.fieldStack}>
              <span className={styles.label}>Şirkət</span>
              <input
                className={styles.input}
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </label>
            <label className={styles.fieldStack}>
              <span className={styles.label}>Telefon</span>
              <input
                className={styles.input}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </label>
            <label className={styles.fieldStack}>
              <span className={styles.label}>Email</span>
              <input
                className={styles.input}
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </label>
            <label className={styles.fieldStack}>
              <span className={styles.label}>Vəzifə</span>
              <input
                className={styles.input}
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              />
            </label>
          </div>
        </form>

        <div className={styles.dialogFooter}>
          <button className={styles.secondaryButton} onClick={onClose} type="button">Ləğv et</button>
          <button className={styles.primaryButton} onClick={handleSubmit} type="submit">Yadda saxla</button>
        </div>
      </aside>
    </div>
  );
};
