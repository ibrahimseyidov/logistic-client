import { FiFilter } from "react-icons/fi";
import Select from "../../../common/components/select/Select";
import type { SelectOption } from "../../../common/components/select/Select";
import styles from "./ToolbarCommon.module.css";

interface Stats {
  ldm: number;
  weight: number;
  volume: number;
  count: number;
}

interface Props {
  stats: Stats;
  accountAction: string;
  onAccountActionChange: (v: string) => void;
  accountOptions: SelectOption[];
  onToggleFilters: () => void;
  onTrackingImport: () => void;
  onExcel: () => void;
  onPerformActions: () => void;
  activeFilterCount: number;
}

function fmt(n: number, decimals = 2) {
  return new Intl.NumberFormat("az-AZ", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
  }).format(n);
}

export default function YukActionBar({
  stats,
  accountAction,
  onAccountActionChange,
  accountOptions,
  onToggleFilters,
  onTrackingImport,
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
            onClick={onTrackingImport}
            className={`${styles.buttonBase} ${styles.buttonSecondary}`}
          >
            + Tracking idxal
          </button>
          <button
            type="button"
            onClick={onExcel}
            className={`${styles.buttonBase} ${styles.buttonSecondary}`}
          >
            + Excel
          </button>
          <div className={styles.selectWrap}>
            <Select
              value={accountAction}
              options={accountOptions}
              onChange={onAccountActionChange}
              placeholder="Hesab əməliyyatı"
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
        <span className={styles.statPill}>LDM: {fmt(stats.ldm, 0)}</span>
        <span className={styles.statPill}>Çəki: {fmt(stats.weight, 2)}</span>
        <span className={styles.statPill}>Həcm: {fmt(stats.volume, 2)}</span>
        <span className={styles.statPill}>Yüklərin sayı: {stats.count}</span>
      </div>
    </div>
  );
}
