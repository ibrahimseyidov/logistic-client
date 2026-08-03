import React from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import styles from "../../sorgular/components/SorgularTable.module.css";
import type { LookupOptionRow } from "../types/lookup.types";

interface Props {
  rows: LookupOptionRow[];
  onEdit: (row: LookupOptionRow) => void;
  onDelete: (id: number) => void;
  singleColumn?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

export const LookupOptionsTable: React.FC<Props> = ({
  rows,
  onEdit,
  onDelete,
  singleColumn = false,
  canEdit = true,
  canDelete = true,
}) => {
  const showActions = canEdit || canDelete;
  const columnCount = (singleColumn ? 1 : 2) + (showActions ? 1 : 0);

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {!singleColumn ? (
              <th className={`${styles.headerCell} ${styles.center}`}>Kod</th>
            ) : null}
            <th className={`${styles.headerCell} ${styles.center}`}>Ad</th>
            {showActions ? (
              <th className={styles.headerCell}>Əməliyyatlar</th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className={styles.emptyCell} colSpan={columnCount}>
                Məlumat tapılmadı
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id}>
                {!singleColumn ? (
                  <td className={`${styles.cell} ${styles.center}`}>
                    {row.value}
                  </td>
                ) : null}
                <td className={`${styles.cell} ${styles.center}`}>
                  {row.label}
                </td>
                {showActions ? (
                  <td className={styles.cell}>
                    <div className={styles.actionRow}>
                      {canEdit ? (
                        <button
                          type="button"
                          className={`${styles.iconButton} ${styles.detailsButton}`}
                          onClick={() => onEdit(row)}
                        >
                          <FaEdit />
                        </button>
                      ) : null}
                      {canDelete ? (
                        <button
                          type="button"
                          className={`${styles.iconButton} ${styles.deleteButton}`}
                          onClick={() => onDelete(row.id)}
                        >
                          <FaTrash />
                        </button>
                      ) : null}
                    </div>
                  </td>
                ) : null}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
