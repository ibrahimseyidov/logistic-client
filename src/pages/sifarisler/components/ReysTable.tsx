import { FaClipboard, FaEdit, FaEye, FaFileAlt, FaMinus } from "react-icons/fa";
import StatusBadge from "../../../common/components/StatusBadge";
import type { ReysRow, ReysTripStatusKind } from "../types/reys.types";
import styles from "./ReysTable.module.css";

interface Props {
  rows: ReysRow[];
}

export default function ReysTable({ rows }: Props) {
  return (
    <table className={styles.table}>
      <thead className={styles.head}>
        <tr>
          <th className={`${styles.headerCell} ${styles.min120}`}>Sifariş</th>
          <th className={styles.headerCell}>Reys</th>
          <th className={`${styles.headerCell} ${styles.min130}`}>
            Reysin statusu
          </th>
          <th className={`${styles.headerCell} ${styles.min120}`}>Müştəri</th>
          <th className={`${styles.headerCell} ${styles.min140}`}>
            Reysin qiyməti, paylaşdırma
          </th>
          <th className={styles.headerCell}>Daşıyıcı</th>
          <th className={`${styles.headerCell} ${styles.min160}`}>
            N/v-nin №, qoşqu, sürücü
          </th>
          <th className={`${styles.headerCell} ${styles.min180}`}>
            Yükün adı, konteynerin №
          </th>
          <th className={styles.headerCell}>Yükləmə tarixi</th>
          <th className={styles.headerCell}>Göndərən</th>
          <th className={styles.headerCell}>Yükləmə</th>
          <th className={styles.headerCell}>Boşaltma tarixi</th>
          <th className={styles.headerCell}>Alıcı</th>
          <th className={styles.headerCell}>Boşaltma</th>
          <th className={`${styles.headerCell} ${styles.min140}`}>Teqlər</th>
          <th className={`${styles.headerCell} ${styles.min120}`}>Sənədlər</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr
            key={row.id}
            className={index % 2 === 0 ? styles.rowEven : styles.rowOdd}
          >
            <td className={`${styles.cell} ${styles.cellXs}`}>
              <div className={styles.orderRef}>{row.orderRef}</div>
              <div className={`${styles.mutedText} ${styles.orderDate}`}>
                {row.orderDate}
              </div>
            </td>
            <td
              className={`${styles.cell} ${styles.primaryText} ${styles.nowrap}`}
            >
              {row.tripRef}
            </td>
            <td className={`${styles.cell} ${styles.center}`}>
              <StatusBadge label={row.tripStatus} kind={row.tripStatusKind} />
            </td>
            <td
              className={`${styles.cell} ${styles.bodyText} ${styles.cellXs}`}
            >
              {row.customer}
            </td>
            <td
              className={`${styles.cell} ${styles.bodyText} ${styles.cellXs} ${styles.nowrap}`}
            >
              {row.tripPrice}
            </td>
            <td
              className={`${styles.cell} ${styles.bodyText} ${styles.cellXs} ${styles.nowrap}`}
            >
              {row.carrier}
            </td>
            <td
              className={`${styles.cell} ${styles.subtleText} ${styles.cellXs}`}
            >
              {row.vehicleInfo}
            </td>
            <td
              className={`${styles.cell} ${styles.subtleText} ${styles.cellXs} ${styles.max220}`}
            >
              {row.cargoInfo}
            </td>
            <td
              className={`${styles.cell} ${styles.mutedText} ${styles.cellXs}`}
            >
              {row.loadDate || "—"}
            </td>
            <td
              className={`${styles.cell} ${styles.mutedText} ${styles.cellXs}`}
            >
              {row.sender || "—"}
            </td>
            <td
              className={`${styles.cell} ${styles.mutedText} ${styles.cellXs}`}
            >
              {row.loading || "—"}
            </td>
            <td
              className={`${styles.cell} ${styles.mutedText} ${styles.cellXs}`}
            >
              {row.unloadDate || "—"}
            </td>
            <td
              className={`${styles.cell} ${styles.mutedText} ${styles.cellXs}`}
            >
              {row.receiver || "—"}
            </td>
            <td
              className={`${styles.cell} ${styles.mutedText} ${styles.cellXs}`}
            >
              {row.unloading || "—"}
            </td>
            <td
              className={`${styles.cell} ${styles.subtleText} ${styles.cellXs} ${styles.preLine} ${styles.max180}`}
            >
              {row.tags || "—"}
            </td>
            <td
              className={styles.actionCell}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.actionRow}>
                <button
                  type="button"
                  title="Redaktə"
                  className={`${styles.iconButton} ${styles.editButton}`}
                  aria-label="Redaktə"
                >
                  <FaEdit className={styles.icon} />
                </button>
                <button
                  type="button"
                  title="Bax"
                  className={`${styles.iconButton} ${styles.viewButton}`}
                  aria-label="Bax"
                >
                  <FaEye className={styles.icon} />
                </button>
                <button
                  type="button"
                  title="Sənəd"
                  className={`${styles.iconButton} ${styles.fileButton}`}
                  aria-label="Sənəd"
                >
                  <FaFileAlt className={styles.icon} />
                </button>
                <button
                  type="button"
                  title="Kopyala"
                  className={`${styles.iconButton} ${styles.copyButton}`}
                  aria-label="Kopyala"
                >
                  <FaClipboard className={styles.icon} />
                </button>
                <button
                  type="button"
                  title="Sil"
                  className={`${styles.iconButton} ${styles.deleteButton}`}
                  aria-label="Sil"
                >
                  <FaMinus className={styles.icon} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
