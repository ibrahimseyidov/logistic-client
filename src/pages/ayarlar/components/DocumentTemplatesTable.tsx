import React from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import tableStyles from "../../sorgular/components/SorgularTable.module.css";
import type { DocumentTemplate } from "../../../common/actions/document.actions";

const SCOPE_LABEL: Record<string, string> = {
  query: "Sorğu",
  order: "Sifariş",
  both: "Hər ikisi",
};

interface Props {
  rows: DocumentTemplate[];
  selectedId?: number | null;
  onEdit: (tpl: DocumentTemplate) => void;
  onDelete: (tpl: DocumentTemplate) => void;
}

export const DocumentTemplatesTable: React.FC<Props> = ({
  rows,
  selectedId,
  onEdit,
  onDelete,
}) => {
  return (
    <div className={tableStyles.tableWrapper}>
      <table className={tableStyles.table}>
        <thead className={tableStyles.head}>
          <tr>
            <th className={`${tableStyles.headerCell} ${tableStyles.min180}`}>Ad</th>
            <th className={`${tableStyles.headerCell} ${tableStyles.min120}`}>Tip</th>
            <th className={`${tableStyles.headerCell} ${tableStyles.min120}`}>Scope</th>
            <th className={`${tableStyles.headerCell} ${tableStyles.min150}`}>Kod</th>
            <th className={`${tableStyles.headerCell} ${tableStyles.min120}`}>Əməliyyat</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={5} className={tableStyles.center} style={{ padding: "40px" }}>
                Şablon tapılmadı
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr
                key={row.id}
                className={index % 2 === 0 ? tableStyles.rowEven : tableStyles.rowOdd}
                style={
                  selectedId === row.id
                    ? { outline: "2px solid #16a34a", outlineOffset: -2 }
                    : undefined
                }
              >
                <td className={`${tableStyles.cell} ${tableStyles.center}`}>{row.name}</td>
                <td className={`${tableStyles.cell} ${tableStyles.center}`}>
                  {row.isSystem ? "Sistem" : "Özəl"}
                </td>
                <td className={`${tableStyles.cell} ${tableStyles.center}`}>
                  {SCOPE_LABEL[row.scope] || row.scope}
                </td>
                <td className={`${tableStyles.cell} ${tableStyles.center}`}>{row.code}</td>
                <td className={`${tableStyles.cell} ${tableStyles.center}`}>
                  <div className={tableStyles.actionRow}>
                    <button
                      type="button"
                      className={`${tableStyles.iconButton} ${tableStyles.detailsButton}`}
                      onClick={() => onEdit(row)}
                      title="Redaktə et"
                    >
                      <FaEdit />
                    </button>
                    {!row.isSystem ? (
                      <button
                        type="button"
                        className={`${tableStyles.iconButton} ${tableStyles.deleteButton}`}
                        onClick={() => onDelete(row)}
                        title="Sil"
                      >
                        <FaTrash />
                      </button>
                    ) : null}
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
