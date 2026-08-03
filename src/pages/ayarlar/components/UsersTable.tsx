import React from "react";
import { FaEdit, FaTrash, FaUserShield } from "react-icons/fa";
import styles from "../../sorgular/components/SorgularTable.module.css";
import { UserRow } from "../types/user.types";

interface Props {
  rows: UserRow[];
  onEdit: (user: UserRow) => void;
  onPermissions: (user: UserRow) => void;
  onDelete: (id: number) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

const statusLabels: Record<string, string> = {
  active: "Aktiv",
  deactive: "Deaktiv",
};

export const UsersTable: React.FC<Props> = ({
  rows,
  onEdit,
  onPermissions,
  onDelete,
  canEdit = true,
  canDelete = true,
}) => {
  const showActions = canEdit || canDelete;

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.headerCell}>Ad soyad</th>
            <th className={styles.headerCell}>Email</th>
            <th className={styles.headerCell}>Status</th>
            {showActions ? (
              <th className={styles.headerCell}>Əməliyyatlar</th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className={styles.cell} style={{ fontWeight: 600 }}>
                {row.name}
              </td>
              <td className={styles.cell}>{row.email}</td>
              <td className={styles.cell}>
                <span
                  style={{
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "0.75rem",
                    backgroundColor:
                      row.status === "active" ? "#ecfdf5" : "#fef2f2",
                    color: row.status === "active" ? "#059669" : "#dc2626",
                  }}
                >
                  {statusLabels[row.status] || row.status}
                </span>
              </td>
              {showActions ? (
                <td className={styles.cell}>
                  <div className={styles.actionRow}>
                    {canEdit ? (
                      <button
                        type="button"
                        className={`${styles.iconButton} ${styles.detailsButton}`}
                        title="Redaktə"
                        onClick={() => onEdit(row)}
                      >
                        <FaEdit />
                      </button>
                    ) : null}
                    {canEdit ? (
                      <button
                        type="button"
                        className={`${styles.iconButton} ${styles.detailsButton}`}
                        title="İcazələr"
                        onClick={() => onPermissions(row)}
                        style={{ color: "#7c3aed" }}
                      >
                        <FaUserShield />
                      </button>
                    ) : null}
                    {canDelete ? (
                      <button
                        type="button"
                        className={`${styles.iconButton} ${styles.deleteButton}`}
                        title="Sil"
                        onClick={() => onDelete(row.id)}
                      >
                        <FaTrash />
                      </button>
                    ) : null}
                  </div>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
