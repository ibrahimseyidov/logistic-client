import React from "react";
import { FaEdit, FaTrash, FaUserShield } from "react-icons/fa";
import styles from "../../sorgular/components/SorgularTable.module.css";
import { UserRow } from "../types/user.types";

interface Props {
  rows: UserRow[];
  onEdit: (user: UserRow) => void;
  onDelete: (id: number) => void;
}

const roleLabels: Record<string, string> = {
  admin: "Admin",
  manager: "Menecer",
  operator: "Operator",
};

const statusLabels: Record<string, string> = {
  active: "Aktiv",
  deactive: "Deaktiv",
};

export const UsersTable: React.FC<Props> = ({ rows, onEdit, onDelete }) => {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.headerCell}>Ad soyad</th>
            <th className={styles.headerCell}>Email</th>
            <th className={styles.headerCell}>Yetki</th>
            <th className={styles.headerCell}>Status</th>
            <th className={styles.headerCell}>Əməliyyatlar</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className={styles.cell} style={{ fontWeight: 600 }}>{row.name}</td>
              <td className={styles.cell}>{row.email}</td>
              <td className={styles.cell}>{roleLabels[row.role] || row.role}</td>
              <td className={styles.cell}>
                <span style={{ 
                  padding: "4px 8px", 
                  borderRadius: "4px", 
                  fontSize: "0.75rem",
                  backgroundColor: row.status === "active" ? "#ecfdf5" : "#fef2f2",
                  color: row.status === "active" ? "#059669" : "#dc2626"
                }}>
                  {statusLabels[row.status] || row.status}
                </span>
              </td>
              <td className={styles.cell}>
                <div className={styles.actionRow}>
                  <button 
                    className={`${styles.iconButton} ${styles.detailsButton}`}
                    onClick={() => onEdit(row)}
                  >
                    <FaEdit />
                  </button>
                  <button 
                    className={`${styles.iconButton} ${styles.deleteButton}`}
                    onClick={() => onDelete(row.id)}
                  >
                    <FaTrash />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
