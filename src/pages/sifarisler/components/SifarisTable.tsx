import { FaFileAlt } from "react-icons/fa";
import StatusBadge from "../../../common/components/StatusBadge";
import type { OrderStatusKind, SifarisOrderRow } from "../types/sifaris.types";
import styles from "./SifarisTable.module.css";

function rowTone(kind: OrderStatusKind): string {
  switch (kind) {
    case "planned":
      return styles.rowPlanned;
    case "progress":
      return styles.rowProgress;
    case "completed":
      return styles.rowCompleted;
    default:
      return styles.rowDefault;
  }
}

interface Props {
  rows: SifarisOrderRow[];
  selectedIds: Set<string>;
  onToggleRow: (id: string) => void;
  onToggleAllPage: (ids: string[], checked: boolean) => void;
}

export default function SifarisTable({
  rows,
  selectedIds,
  onToggleRow,
  onToggleAllPage,
}: Props) {
  const pageIds = rows.map((r) => r.id);
  const allSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));

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
          <th className={styles.headerCell}>Sifarişin nömrəsi</th>
          <th className={styles.headerCell}>Sifarişin tarixi</th>
          <th className={styles.headerCell}>Sifarişin statusu</th>
          <th className={`${styles.headerCell} ${styles.min160}`}>Müştəri</th>
          <th className={`${styles.headerCell} ${styles.min140}`}>
            Daşıyıcılar
          </th>
          <th className={styles.headerCell}>Reysin nömrəsi</th>
          <th className={`${styles.headerCell} ${styles.min140}`}>
            Marşrutlar
          </th>
          <th className={`${styles.headerCell} ${styles.min180}`}>
            Yükün parametrləri
          </th>
          <th className={styles.headerCell}>Fraxt</th>
          <th className={styles.headerCell}>Əlavə xərclər</th>
          <th className={styles.headerCell}>Mənfəət</th>
          <th className={styles.headerCell}>Sənədlər</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className={rowTone(row.statusKind)}>
            <td className={`${styles.cell} ${styles.center}`}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={selectedIds.has(row.id)}
                onChange={() => onToggleRow(row.id)}
                aria-label={`Seç: ${row.orderNumber}`}
              />
            </td>
            <td
              className={`${styles.cell} ${styles.nowrap} ${styles.primaryText}`}
            >
              {row.orderNumber}
            </td>
            <td
              className={`${styles.cell} ${styles.mutedText} ${styles.nowrap}`}
            >
              {row.orderDate}
            </td>
            <td className={`${styles.cell} ${styles.nowrap}`}>
              <StatusBadge label={row.statusLabel} kind={row.statusKind} />
            </td>
            <td
              className={`${styles.cell} ${styles.bodyText} ${styles.smallText}`}
            >
              <div>{row.customer}</div>
              <div className={`${styles.softText} ${styles.customerMeta}`}>
                {row.customerRefs}
              </div>
            </td>
            <td
              className={`${styles.cell} ${styles.mutedText} ${styles.smallText} ${styles.preLine}`}
            >
              {row.carriers}
            </td>
            <td
              className={`${styles.cell} ${styles.mutedText} ${styles.nowrap}`}
            >
              {row.voyageNumber}
            </td>
            <td
              className={`${styles.cell} ${styles.bodyText} ${styles.nowrap}`}
            >
              {row.route}
            </td>
            <td
              className={`${styles.cell} ${styles.mutedText} ${styles.preLine} ${styles.smallText} ${styles.max240}`}
            >
              {row.cargoParams}
            </td>
            <td
              className={`${styles.cell} ${styles.bodyText} ${styles.nowrap}`}
            >
              {row.freight}
            </td>
            <td
              className={`${styles.cell} ${styles.mutedText} ${styles.nowrap}`}
            >
              {row.extraCosts}
            </td>
            <td
              className={`${styles.cell} ${styles.profitText} ${styles.nowrap}`}
            >
              {row.profit}
            </td>
            <td className={styles.cell}>
              <div className={styles.documents} title={row.documents}>
                <FaFileAlt className={styles.documentsIcon} />
                <span className={`${styles.smallText} ${styles.documentsText}`}>
                  {row.documents}
                </span>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
