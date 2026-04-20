import { FiFilePlus, FiFilter } from "react-icons/fi";
import styles from "./ToolbarCommon.module.css";

interface Stats {
  orders: number;
  loads: number;
  voyages: number;
  weight: number;
  volume: number;
  ldm: number;
  freightAzn: number;
  profitAzn: number;
}

interface Props {
  stats: Stats;
  onNew: () => void;
  onToggleFilters: () => void;
  onExportExcel: () => void;
  activeFilterCount: number;
}

function fmt(n: number) {
  return new Intl.NumberFormat("az-AZ", { maximumFractionDigits: 1 }).format(n);
}

export default function SifarisActionBar({
  stats,
  onNew,
  onToggleFilters,
  onExportExcel,
  activeFilterCount,
}: Props) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.topRow}>
        <div className={styles.leftActions}>
          <button
            type="button"
            onClick={onNew}
            className={`${styles.buttonBase} ${styles.buttonPrimary}`}
          >
            <FiFilePlus />
            Yeni sifariş
          </button>
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
            onClick={onExportExcel}
            className={`${styles.buttonBase} ${styles.buttonSecondary}`}
          >
            + Excel
          </button>
        </div>
      </div>

      <div className={styles.statsRow}>
        <span className={styles.statPill}>Sifarişlər: {stats.orders}</span>
        <span className={styles.statPill}>Yüklər: {stats.loads}</span>
        <span className={styles.statPill}>Reyslər: {stats.voyages}</span>
        <span className={styles.statPill}>Çəki (kq): {fmt(stats.weight)}</span>
        <span className={styles.statPill}>Həcm (m³): {fmt(stats.volume)}</span>
        <span className={styles.statPill}>LDM: {fmt(stats.ldm)}</span>
        <span className={styles.statPill}>
          Fraxtın məbləği (AZN): {fmt(stats.freightAzn)}
        </span>
        <span className={styles.statPill}>
          Gəlirin məbləği (AZN): {fmt(stats.profitAzn)}
        </span>
      </div>
    </div>
  );
}
