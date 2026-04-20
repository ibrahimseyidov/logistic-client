import { useCallback, useState } from "react";
import { FaChartBar, FaCut, FaEdit, FaEye, FaMinus } from "react-icons/fa";
import { getStatusTone } from "../../../common/components/StatusBadge";
import { YUK_CARGO_STATUS_OPTIONS } from "../constants/yuk.constants";
import type { YukLoadRow } from "../types/yuk.types";
import styles from "./YukTable.module.css";

interface Props {
  rows: YukLoadRow[];
  selectedIds: Set<string>;
  onToggleRow: (id: string) => void;
  onToggleAllPage: (ids: string[], checked: boolean) => void;
}

export default function YukTable({
  rows,
  selectedIds,
  onToggleRow,
  onToggleAllPage,
}: Props) {
  const pageIds = rows.map((r) => r.id);
  const allSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));

  const [statusMap, setStatusMap] = useState<Record<string, string>>({});

  const statusFor = useCallback(
    (row: YukLoadRow) => statusMap[row.id] ?? row.cargoStatus,
    [statusMap],
  );

  const setStatus = (id: string, v: string) => {
    setStatusMap((prev) => ({ ...prev, [id]: v }));
  };

  const getStatusClassName = (value: string) => {
    switch (getStatusTone(value)) {
      case "emerald":
        return styles.statusEmerald;
      case "amber":
        return styles.statusAmber;
      case "sky":
      case "cyan":
      case "violet":
        return styles.statusSky;
      default:
        return styles.statusSlate;
    }
  };

  return (
    <table className={styles.table}>
      <thead className={styles.head}>
        <tr>
          <th className={`${styles.headerCell} ${styles.checkboxHeader}`}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={allSelected}
              onChange={(e) => onToggleAllPage(pageIds, e.target.checked)}
              aria-label="Səhifədəki bütün sətirlər"
            />
          </th>
          <th className={styles.headerCell}>Sifariş</th>
          <th className={styles.headerCell}>Şirkət</th>
          <th className={`${styles.headerCell} ${styles.min120}`}>Müştəri</th>
          <th className={styles.headerCell}>Yükləmə tarixi</th>
          <th className={styles.headerCell}>Boşaltma tarixi</th>
          <th className={styles.headerCell}>Göndərən</th>
          <th className={`${styles.headerCell} ${styles.min200}`}>
            Yükləmə yeri
          </th>
          <th className={styles.headerCell}>Alıcı</th>
          <th className={`${styles.headerCell} ${styles.min180}`}>
            Boşaltma yeri
          </th>
          <th className={`${styles.headerCell} ${styles.min140}`}>
            Yükün statusları
          </th>
          <th className={styles.headerCell}>Yeri</th>
          <th className={styles.headerCell}>Tarix</th>
          <th className={styles.headerCell}>Vaxt</th>
          <th className={`${styles.headerCell} ${styles.min100}`}>Şərhlər</th>
          <th className={styles.headerCell}>Yükün nömrəsi</th>
          <th className={`${styles.headerCell} ${styles.min120}`}>Yükün adı</th>
          <th className={`${styles.headerCell} ${styles.min220}`}>
            Yükün parametrləri
          </th>
          <th className={styles.headerCell}>Atributlar</th>
          <th className={`${styles.headerCell} ${styles.min120}`}>Daşıyıcı</th>
          <th className={`${styles.headerCell} ${styles.min160}`}>Reys</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr
            key={row.id}
            className={index % 2 === 0 ? styles.rowEven : styles.rowOdd}
          >
            <td
              className={`${styles.cell} ${styles.center} ${styles.cellWithBorder}`}
            >
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={selectedIds.has(row.id)}
                onChange={() => onToggleRow(row.id)}
                aria-label={`Seç: ${row.cargoNumber}`}
              />
            </td>
            <td
              className={`${styles.cell} ${styles.nowrap} ${styles.primaryText}`}
            >
              {row.orderRef}
            </td>
            <td
              className={`${styles.cell} ${styles.bodyText} ${styles.nowrap}`}
            >
              {row.company}
            </td>
            <td
              className={`${styles.cell} ${styles.bodyText} ${styles.smallText}`}
            >
              {row.customer}
            </td>
            <td
              className={`${styles.cell} ${styles.dateText} ${styles.nowrap}`}
            >
              {row.loadDate || "—"}
            </td>
            <td
              className={`${styles.cell} ${styles.dateText} ${styles.nowrap}`}
            >
              {row.unloadDate || "—"}
            </td>
            <td
              className={`${styles.cell} ${styles.dateText} ${styles.smallText}`}
            >
              {row.sender || "—"}
            </td>
            <td
              className={`${styles.cell} ${styles.mutedText} ${styles.smallText} ${styles.max280}`}
            >
              {row.loadPlace}
            </td>
            <td
              className={`${styles.cell} ${styles.mutedText} ${styles.nowrap}`}
            >
              {row.recipient}
            </td>
            <td
              className={`${styles.cell} ${styles.mutedText} ${styles.smallText} ${styles.max260}`}
            >
              {row.unloadPlace}
            </td>
            <td className={styles.cell}>
              <select
                className={`${styles.statusSelect} ${getStatusClassName(statusFor(row))}`}
                value={statusFor(row)}
                onChange={(e) => setStatus(row.id, e.target.value)}
              >
                {YUK_CARGO_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </td>
            <td className={`${styles.cell} ${styles.dateText}`}>
              {row.place || "—"}
            </td>
            <td
              className={`${styles.cell} ${styles.mutedText} ${styles.nowrap}`}
            >
              {row.entryDate}
            </td>
            <td
              className={`${styles.cell} ${styles.mutedText} ${styles.nowrap}`}
            >
              {row.entryTime}
            </td>
            <td
              className={`${styles.cell} ${styles.softText} ${styles.smallText}`}
            >
              {row.comments || "—"}
            </td>
            <td
              className={`${styles.cell} ${styles.bodyText} ${styles.nowrap}`}
            >
              {row.cargoNumber}
            </td>
            <td
              className={`${styles.cell} ${styles.bodyText} ${styles.nowrap}`}
            >
              {row.cargoName}
            </td>
            <td
              className={`${styles.cell} ${styles.mutedText} ${styles.preLine} ${styles.smallText} ${styles.max280}`}
            >
              {row.cargoParams}
            </td>
            <td
              className={`${styles.cell} ${styles.softText} ${styles.smallText}`}
            >
              {row.attributes || "—"}
            </td>
            <td
              className={`${styles.cell} ${styles.bodyText} ${styles.smallText} ${styles.nowrap}`}
            >
              {row.carrier}
            </td>
            <td className={styles.cell} onClick={(e) => e.stopPropagation()}>
              <div className={styles.tripWrap}>
                <span className={styles.tripId}>{row.tripId}</span>
                <div className={styles.actionRow}>
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
                    title="Qrafik"
                    className={`${styles.iconButton} ${styles.chartButton}`}
                    aria-label="Qrafik"
                  >
                    <FaChartBar className={styles.icon} />
                  </button>
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
                    title="Sil"
                    className={`${styles.iconButton} ${styles.deleteButton}`}
                    aria-label="Sil"
                  >
                    <FaMinus className={styles.icon} />
                  </button>
                  <button
                    type="button"
                    title="Böl"
                    className={`${styles.iconButton} ${styles.splitButton}`}
                    aria-label="Böl"
                  >
                    <FaCut className={styles.icon} />
                  </button>
                </div>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
