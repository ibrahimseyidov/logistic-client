import React, { useState, useEffect } from "react";
import { FiX } from "react-icons/fi";
import styles from "../../sorgular/components/SorgularNewModal.module.css";
import { UserRow } from "../types/user.types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialValues?: UserRow | null;
}

export const UserModal: React.FC<Props> = ({ isOpen, onClose, onSubmit, initialValues }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "operator",
    status: "active",
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialValues) {
        setFormData({
          name: initialValues.name,
          email: initialValues.email,
          password: "",
          role: initialValues.role,
          status: initialValues.status,
        });
      } else {
        setFormData({
          name: "",
          email: "",
          password: "",
          role: "operator",
          status: "active",
        });
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
            <h2 className={styles.dialogTitle}>{initialValues ? "İstifadəçini Redaktə Et" : "Yeni İstifadəçi"}</h2>
          </div>
          <button className={styles.closeButton} onClick={onClose} type="button">
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.dialogBody}>
          <div className={styles.sectionStack}>
            <label className={styles.fieldStack}>
              <span className={styles.label}>Ad Soyad</span>
              <input
                className={styles.input}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </label>
            <label className={styles.fieldStack}>
              <span className={styles.label}>Email</span>
              <input
                className={styles.input}
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </label>
            <label className={styles.fieldStack}>
              <span className={styles.label}>{initialValues ? "Şifrə (Dəyişmək üçün doldurun)" : "Şifrə"}</span>
              <input
                className={styles.input}
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!initialValues}
              />
            </label>
            <label className={styles.fieldStack}>
              <span className={styles.label}>Yetki</span>
              <select
                className={styles.input}
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="admin">Admin</option>
                <option value="manager">Menecer</option>
                <option value="operator">Operator</option>
              </select>
            </label>
            <label className={styles.fieldStack}>
              <span className={styles.label}>Status</span>
              <select
                className={styles.input}
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="active">Aktiv</option>
                <option value="deactive">Deaktiv</option>
              </select>
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
