import { FiFilePlus, FiFilter } from "react-icons/fi";
import { usePermissions } from "../../../common/hooks/usePermissions";
import { SIFARIS_STATUS_PILLS } from "../constants/sifaris.constants";
import type { OrderStatusKind } from "../types/sifaris.types";
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
  statusCounts: Record<OrderStatusKind, number>;
  statusTotal: number;
  statusFilter?: string | null;
  onStatusFilter?: (status: string | null) => void;
  onNew: () => void;
  onToggleFilters: () => void;
  onExportExcel: () => void;
  activeFilterCount: number;
}

function fmt(n: number) {
  return new Intl.NumberFormat("az-AZ", { maximumFractionDigits: 1 }).format(n);
}

const pillToneClass: Record<string, string> = {
  amber: styles.statPillAmber,
  emerald: styles.statPillEmerald,
  rose: styles.statPillRose,
  sky: styles.statPillSky,
  violet: styles.statPillViolet,
};

export default function SifarisActionBar({
  stats,
  statusCounts,
  statusTotal,
  statusFilter = null,
  onStatusFilter,
  onNew,
  onToggleFilters,
  onExportExcel,
  activeFilterCount,
}: Props) {
  const { canCreate } = usePermissions();
  const allowCreate = canCreate("sifarisler", "orders");
  const isAllActive = !statusFilter;

  return (
    <div className={styles.wrapper}>
      <div className={styles.topRow}>
        <div className={styles.leftActions}>
          {allowCreate ? (
            <button
              type="button"
              onClick={onNew}
              className={`${styles.buttonBase} ${styles.buttonPrimary}`}
            >
              <FiFilePlus />
              Yeni sifariş
            </button>
          ) : null}
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

        <div className={styles.centerActions}>
          <button
            type="button"
            className={`${styles.statPill} ${styles.statPillClickable} ${
              isAllActive ? styles.statPillActive : ""
            }`}
            onClick={() => onStatusFilter?.(null)}
            title="Bütün statuslar"
          >
            Hamısı: {statusTotal}
          </button>
          {SIFARIS_STATUS_PILLS.map((opt) => {
            const selected = statusFilter === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                className={`${styles.statPill} ${styles.statPillClickable} ${
                  pillToneClass[opt.tone] || ""
                } ${selected ? styles.statPillActive : ""}`}
                title={`${opt.label} — filtrə tətbiq et`}
                onClick={() => onStatusFilter?.(opt.value)}
              >
                {opt.label}: {statusCounts[opt.value] ?? 0}
              </button>
            );
          })}
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
