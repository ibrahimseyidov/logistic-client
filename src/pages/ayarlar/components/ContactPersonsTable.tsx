import React from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import tableStyles from "../../sorgular/components/SorgularTable.module.css";
import { ContactPersonRow } from "../../../common/actions/contact.actions";

interface Props {
  rows: ContactPersonRow[];
  onEdit: (c: ContactPersonRow) => void;
  onDelete: (id: string) => void;
}

export const ContactPersonsTable: React.FC<Props> = ({ rows, onEdit, onDelete }) => {
  return (
    <table className={tableStyles.table}>
      <thead className={tableStyles.head}>
        <tr>
          <th className={`${tableStyles.headerCell} ${tableStyles.min180}`}>Ad və Soyad</th>
          <th className={`${tableStyles.headerCell} ${tableStyles.min180}`}>Şirkət</th>
          <th className={`${tableStyles.headerCell} ${tableStyles.min150}`}>Telefon</th>
          <th className={`${tableStyles.headerCell} ${tableStyles.min170}`}>Email</th>
          <th className={`${tableStyles.headerCell} ${tableStyles.min150}`}>Vəzifə</th>
          <th className={`${tableStyles.headerCell} ${tableStyles.min120}`}>Əməliyyat</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={6} className={tableStyles.center} style={{ padding: "40px" }}>
              Əlaqədar şəxs tapılmadı
            </td>
          </tr>
        ) : (
          rows.map((row, index) => (
            <tr
              key={row.id}
              className={index % 2 === 0 ? tableStyles.rowEven : tableStyles.rowOdd}
            >
              <td className={`${tableStyles.cell} ${tableStyles.center}`}>{row.fullName}</td>
              <td className={`${tableStyles.cell} ${tableStyles.center}`}>{row.company}</td>
              <td className={`${tableStyles.cell} ${tableStyles.center}`}>{row.phone}</td>
              <td className={`${tableStyles.cell} ${tableStyles.center}`}>{row.email}</td>
              <td className={`${tableStyles.cell} ${tableStyles.center}`}>{row.position}</td>
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
                  <button
                    type="button"
                    className={`${tableStyles.iconButton} ${tableStyles.deleteButton}`}
                    onClick={() => onDelete(row.id)}
                    title="Sil"
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
  );
};
