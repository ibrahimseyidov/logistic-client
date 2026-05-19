import React from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import styles from "../../sorgular/components/SorgularTable.module.css";
import type { LookupOptionRow } from "../types/lookup.types";

interface Props {
  rows: LookupOptionRow[];
  onEdit: (row: LookupOptionRow) => void;
  onDelete: (id: number) => void;
}

export const LookupOptionsTable: React.FC<Props> = ({
  rows,
  onEdit,
  onDelete,
}) => {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={`${styles.headerCell} ${styles.center}`}>Kod</th>
            <th className={`${styles.headerCell} ${styles.center}`}>Ad</th>
            <th className={styles.headerCell}>Əməliyyatlar</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className={styles.emptyCell} colSpan={3}>
                Məlumat tapılmadı
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id}>
                <td className={`${styles.cell} ${styles.center}`}>
                  {row.value}
                </td>
                <td className={`${styles.cell} ${styles.center}`}>
                  {row.label}
                </td>
                <td className={styles.cell}>
                  <div className={styles.actionRow}>
                    <button
                      type="button"
                      className={`${styles.iconButton} ${styles.detailsButton}`}
                      onClick={() => onEdit(row)}
                    >
                      <FaEdit />
                    </button>
                    <button
                      type="button"
                      className={`${styles.iconButton} ${styles.deleteButton}`}
                      onClick={() => onDelete(row.id)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
