import { FiFilter } from "react-icons/fi";
import Select from "../../../common/components/select/Select";
import type { SelectOption } from "../../../common/components/select/Select";
import styles from "./ToolbarCommon.module.css";

interface Props {
  profitAzn: number;
  bonusAzn: number;
  rewardAzn: number;
  saveSelectedValue: string;
  onSaveSelectedChange: (v: string) => void;
  saveSelectedOptions: SelectOption[];
  onToggleFilters: () => void;
  onExcel: () => void;
  onPerformActions: () => void;
  activeFilterCount: number;
}

function fmt(n: number) {
  return new Intl.NumberFormat("az-AZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export default function EmekSummaryBar({
  profitAzn,
  bonusAzn,
  rewardAzn,
  saveSelectedValue,
  onSaveSelectedChange,
  saveSelectedOptions,
  onToggleFilters,
  onExcel,
  onPerformActions,
  activeFilterCount,
}: Props) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.topRow}>
        <div className={styles.leftActions}>
          <button
            type="button"
            onClick={onToggleFilters}
            className={`${styles.buttonBase} ${styles.buttonSecondary}`}
          >
            <FiFilter />
            Filtrlər
            {activeFilterCount > 0 ? (
              <span className={styles.badge}>{activeFilterCount}</span>
            ) : null}
          </button>
        </div>

        <div className={styles.rightActions}>
          <button
            type="button"
            onClick={onExcel}
            className={`${styles.buttonBase} ${styles.buttonSecondary}`}
          >
            + Excel
          </button>
          <div className={styles.selectWrap}>
            <Select
              value={saveSelectedValue}
              options={saveSelectedOptions}
              onChange={onSaveSelectedChange}
              placeholder="Seçilmişlər"
              className={styles.selectControl}
            />
          </div>
          <button
            type="button"
            onClick={onPerformActions}
            className={`${styles.buttonBase} ${styles.buttonSuccess}`}
          >
            Hərəkətləri yerinə yetir
          </button>
        </div>
      </div>

      <div className={styles.statsRow}>
        <span className={`${styles.statPill} ${styles.statAccent}`}>
          Mənfəətin məbləği: {fmt(profitAzn)} AZN
        </span>
        <span className={styles.statPill}>
          Bonusların məbləği: {fmt(bonusAzn)} AZN
        </span>
        <span className={styles.statPill}>
          Mükafatların məbləği: {fmt(rewardAzn)} AZN
        </span>
      </div>
    </div>
  );
}
