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
          status: initialValues.status,
        });
      } else {
        setFormData({
          name: "",
          email: "",
          password: "",
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
    onSubmit({
      ...formData,
      // Yetki UI-dan çıxarıldı — mövcud role saxlanılır / yenidə operator
      role: initialValues?.role || "operator",
    });
  };

  return (
    <div className={styles.dialogRoot}>
      <div
        className={`${styles.dialogBackdrop} ${isVisible ? styles.dialogBackdropVisible : ""}`}
      />
      <aside className={`${styles.dialogPanel} ${isVisible ? styles.dialogPanelVisible : ""}`}>
        <div className={styles.dialogHeader}>
          <div className={styles.dialogHeaderText}>
            <h2 className={styles.dialogTitle}>
              {initialValues ? "İstifadəçini Redaktə Et" : "Yeni İstifadəçi"}
            </h2>
            <p style={{ margin: "0.35rem 0 0", fontSize: "0.8rem", color: "#64748b" }}>
              Səhifə icazələri əməliyyatlardakı qalxan düyməsi ilə ayarlanır
            </p>
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
              <span className={styles.label}>
                {initialValues ? "Şifrə (Dəyişmək üçün doldurun)" : "Şifrə"}
              </span>
              <input
                className={styles.input}
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!initialValues}
              />
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
          <button className={styles.secondaryButton} onClick={onClose} type="button">
            Ləğv et
          </button>
          <button className={styles.primaryButton} onClick={handleSubmit} type="submit">
            Yadda saxla
          </button>
        </div>
      </aside>
    </div>
  );
};
