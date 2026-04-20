import { FaBus, FaFileExcel, FaPlane, FaShip, FaTruck } from "react-icons/fa";
import { FiFilter } from "react-icons/fi";
import styles from "./ToolbarCommon.module.css";
import { REYS_TRANSPORT_TABS } from "../constants/reys.constants";
import type { ReysTransportMode } from "../types/reys.types";

interface Props {
  transportMode: ReysTransportMode;
  onTransportChange: (mode: ReysTransportMode) => void;
  onToggleFilters: () => void;
  count: number;
  totalValueAzn: number;
  onExcel: () => void;
  activeFilterCount: number;
}

function fmtMoney(n: number) {
  return new Intl.NumberFormat("az-AZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export default function ReysToolbar({
  transportMode,
  onTransportChange,
  onToggleFilters,
  count,
  totalValueAzn,
  onExcel,
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
          <div className={styles.iconStrip}>
            <FaPlane title="Hava" className={styles.icon} aria-hidden />
            <FaShip title="Dəniz" className={styles.icon} aria-hidden />
            <FaBus title="Avtobus" className={styles.icon} aria-hidden />
            <FaTruck title="Yük" className={styles.icon} aria-hidden />
          </div>
          <button
            type="button"
            onClick={onExcel}
            className={`${styles.buttonBase} ${styles.buttonSecondary}`}
            title="Excel"
          >
            <FaFileExcel className={styles.icon} aria-hidden />
            Excel
          </button>
        </div>
      </div>

      <div className={styles.transportTabs}>
        {REYS_TRANSPORT_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTransportChange(tab.id)}
            className={`${styles.transportButton} ${
              transportMode === tab.id ? styles.transportButtonActive : ""
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.statsRow}>
        <span className={styles.statPill}>Miqdarı: {count}</span>
        <span className={styles.statPill}>
          Reyslərin dəyəri: {fmtMoney(totalValueAzn)} AZN
        </span>
      </div>
    </div>
  );
}
