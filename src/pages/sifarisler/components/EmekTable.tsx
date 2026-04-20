import { useCallback, useState } from "react";
import StatusBadge from "../../../common/components/StatusBadge";
import type { EmekRow } from "../types/emek.types";
import styles from "./EmekTable.module.css";

interface Props {
  rows: EmekRow[];
  selectedIds: Set<string>;
  onToggleRow: (id: string) => void;
  onToggleAllPage: (ids: string[], checked: boolean) => void;
}

function fmt(n: number) {
  return new Intl.NumberFormat("az-AZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export default function EmekTable({
  rows,
  selectedIds,
  onToggleRow,
  onToggleAllPage,
}: Props) {
  const pageIds = rows.map((r) => r.id);
  const allSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));

  const [revenuePct, setRevenuePct] = useState<Record<string, string>>({});
  const [bonusPct, setBonusPct] = useState<Record<string, string>>({});

  const getRevenue = useCallback(
    (row: EmekRow) => revenuePct[row.id] ?? String(row.revenuePct),
    [revenuePct],
  );
  const getBonusPct = useCallback(
    (row: EmekRow) => bonusPct[row.id] ?? String(row.bonusPct),
    [bonusPct],
  );

  const tipLabel = (k: EmekRow["kind"]) =>
    k === "order" ? "Sifarişə görə" : "Reysə görə";

  return (
    <table className={styles.table}>
      <thead className={styles.head}>
        <tr>
          <th className={`${styles.headerCell} ${styles.headerCheckbox}`}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={allSelected}
              onChange={(e) => onToggleAllPage(pageIds, e.target.checked)}
              aria-label="Səhifədəki bütün sətirlər"
            />
          </th>
          <th className={`${styles.headerCell} ${styles.min100}`}>Tip</th>
          <th className={styles.headerCell}>Sifarişin nömrəsi</th>
          <th className={styles.headerCell}>Sifarişin tarixi</th>
          <th className={`${styles.headerCell} ${styles.min90}`}>
            Sifarişin statusu
          </th>
          <th className={`${styles.headerCell} ${styles.min100}`}>Müştəri</th>
          <th className={`${styles.headerCell} ${styles.min140}`}>İşçi</th>
          <th className={styles.headerCell}>Fraxt</th>
          <th className={styles.headerCell}>Xərclər</th>
          <th className={styles.headerCell}>Mənfəət</th>
          <th className={`${styles.headerCell} ${styles.min72}`}>
            % gəlirlər %
          </th>
          <th className={styles.headerCell}>Cəmi bonus</th>
          <th className={`${styles.headerCell} ${styles.min72}`}>
            bonus üçün %
          </th>
          <th className={styles.headerCell}>Mükafatın həcmi</th>
          <th className={styles.headerCell}>Ödenilib</th>
          <th className={styles.headerCell}>Ödənişin tarixi</th>
          <th className={styles.headerCell}>Marşrut</th>
          <th className={styles.headerCell}>Daşıyıcı</th>
          <th className={styles.headerCell}>Natamam yük</th>
          <th className={styles.headerCell}>Reysin nömrəsi</th>
          <th className={`${styles.headerCell} ${styles.min120}`}>
            Reys / Terminal qiyməti
          </th>
          <th className={styles.headerCell}>Hesablar</th>
          <th className={styles.headerCell}>Məbləğ</th>
          <th className={`${styles.headerCell} ${styles.min90}`}>
            Ödənilmiş məbləğ
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr
            key={row.id}
            className={index % 2 === 0 ? styles.rowEven : styles.rowOdd}
          >
            <td className={`${styles.cell} ${styles.center}`}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={selectedIds.has(row.id)}
                onChange={() => onToggleRow(row.id)}
              />
            </td>
            <td
              className={`${styles.cell} ${styles.textPrimary} ${styles.nowrap}`}
            >
              {tipLabel(row.kind)}
            </td>
            <td
              className={`${styles.cell} ${styles.textStrong} ${styles.nowrap}`}
            >
              {row.orderNumber}
            </td>
            <td
              className={`${styles.cell} ${styles.textMuted} ${styles.nowrap}`}
            >
              {row.orderDate}
            </td>
            <td className={styles.cell}>
              <StatusBadge
                label={row.orderStatus}
                className={styles.badgeText}
              />
            </td>
            <td
              className={`${styles.cell} ${styles.textPrimary} ${styles.max120}`}
            >
              {row.customer}
            </td>
            <td className={`${styles.cell} ${styles.textPrimary}`}>
              {row.employee}
              {row.employeeRequired && (
                <span className={styles.requiredMark}>*</span>
              )}
            </td>
            <td
              className={`${styles.cell} ${styles.textPrimary} ${styles.nowrap}`}
            >
              {row.freight}
            </td>
            <td
              className={`${styles.cell} ${styles.textPrimary} ${styles.numeric}`}
            >
              {fmt(row.expensesAzn)}
            </td>
            <td
              className={`${styles.cell} ${styles.textProfit} ${styles.numeric}`}
            >
              {fmt(row.profitAzn)}
            </td>
            <td className={styles.inputCell}>
              <input
                className={styles.input}
                value={getRevenue(row)}
                onChange={(e) =>
                  setRevenuePct((prev) => ({
                    ...prev,
                    [row.id]: e.target.value,
                  }))
                }
                inputMode="decimal"
              />
            </td>
            <td
              className={`${styles.cell} ${styles.textPrimary} ${styles.numeric}`}
            >
              {fmt(row.totalBonusAzn)}
            </td>
            <td className={styles.inputCell}>
              <input
                className={styles.input}
                value={getBonusPct(row)}
                onChange={(e) =>
                  setBonusPct((prev) => ({ ...prev, [row.id]: e.target.value }))
                }
                inputMode="decimal"
              />
            </td>
            <td
              className={`${styles.cell} ${styles.textPrimary} ${styles.numeric}`}
            >
              {fmt(row.rewardAmount)}
            </td>
            <td className={styles.cell}>
              <StatusBadge label={row.paidLabel} className={styles.badgeText} />
            </td>
            <td
              className={`${styles.cell} ${styles.textMuted} ${styles.nowrap}`}
            >
              {row.paymentDate || "—"}
            </td>
            <td
              className={`${styles.cell} ${styles.textPrimary} ${styles.nowrap} ${styles.max200}`}
            >
              {row.route}
            </td>
            <td className={`${styles.cell} ${styles.textPrimary}`}>
              {row.carrier}
            </td>
            <td className={`${styles.cell} ${styles.textMuted}`}>
              {row.incompleteLoad}
            </td>
            <td
              className={`${styles.cell} ${styles.textPrimary} ${styles.nowrap}`}
            >
              {row.tripNumber}
            </td>
            <td
              className={`${styles.cell} ${styles.textPrimary} ${styles.nowrap}`}
            >
              {row.voyagePrice}
            </td>
            <td className={`${styles.cell} ${styles.textMuted}`}>
              {row.accounts}
            </td>
            <td
              className={`${styles.cell} ${styles.numeric} ${
                row.amountRed ? styles.textRed : styles.textDefault
              }`}
            >
              {fmt(row.amountAzn)}
            </td>
            <td
              className={`${styles.cell} ${styles.numeric} ${
                row.paidAmountRed ? styles.textRed : styles.textDefault
              }`}
            >
              {fmt(row.paidAmountAzn)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
