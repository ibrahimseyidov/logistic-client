import { useState, useRef, useEffect, useMemo } from "react";
import { FiFilePlus, FiFilter, FiUpload, FiDownload, FiChevronDown } from "react-icons/fi";
import { usePermissions } from "../../../common/hooks/usePermissions";
import { SORGU_STATUS_OPTIONS } from "../lib/sorguStatus";
import { SorguStatus } from "../types/sorgu.types";
import styles from "./SorgularActionBar.module.css";

interface Props {
  total: number;
  statusCounts: Record<string, number>;
  /** null / "" = Hamısı */
  statusFilter?: string | null;
  onStatusFilter?: (status: string | null) => void;
  onNew: () => void;
  onOpenFilters: () => void;
  onImportExcel: () => void;
  onExportExcel: () => void;
  activeFilterCount: number;
  /** İcazə child: active | archive | offers */
  permChild?: string;
}

const pillToneClass: Record<string, string> = {
  amber: styles.statPillAmber,
  emerald: styles.statPillEmerald,
  rose: styles.statPillRose,
  sky: styles.statPillSky,
};

export default function SorgularActionBar({
  total,
  statusCounts,
  statusFilter = null,
  onStatusFilter,
  onNew,
  onOpenFilters,
  onImportExcel,
  onExportExcel,
  activeFilterCount,
  permChild = "active",
}: Props) {
  const { canCreate } = usePermissions();
  const allowCreate = canCreate("sorgular", permChild);
  const [isExcelOpen, setIsExcelOpen] = useState(false);
  const excelRef = useRef<HTMLDivElement>(null);

  const visibleStatusOptions = useMemo(() => {
    if (permChild === "offers") return [];
    if (permChild === "archive") {
      return SORGU_STATUS_OPTIONS.filter(
        (o) =>
          o.value === SorguStatus.Approved ||
          o.value === SorguStatus.Cancelled,
      );
    }
    return SORGU_STATUS_OPTIONS.filter(
      (o) =>
        o.value === SorguStatus.NewQuery ||
        o.value === SorguStatus.WaitingOffer ||
        o.value === SorguStatus.Evaluated ||
        o.value === SorguStatus.Offered,
    );
  }, [permChild]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (excelRef.current && !excelRef.current.contains(event.target as Node)) {
        setIsExcelOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isAllActive = !statusFilter;

  return (
    <div className={styles.wrapper}>
      <div className={styles.group}>
        {allowCreate ? (
          <button
            type="button"
            onClick={onNew}
            className={`${styles.buttonBase} ${styles.buttonPrimary}`}
          >
            <FiFilePlus />
            Yeni sorğu
          </button>
        ) : null}
        <button
          type="button"
          onClick={onOpenFilters}
          className={`${styles.buttonBase} ${styles.buttonSecondary}`}
        >
          <FiFilter />
          Filtrlər
          {activeFilterCount > 0 ? (
            <span className={styles.badge}>{activeFilterCount}</span>
          ) : null}
        </button>
      </div>

      {permChild !== "offers" ? (
        <div className={styles.statsGroup}>
          <button
            type="button"
            className={`${styles.statPill} ${styles.statPillClickable} ${
              isAllActive ? styles.statPillActive : ""
            }`}
            onClick={() => onStatusFilter?.(null)}
            title="Bütün statuslar"
          >
            Hamısı: {total}
          </button>
          {visibleStatusOptions.map((opt) => {
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
      ) : (
        <div className={styles.statsGroup} />
      )}

      <div className={styles.group}>
        <div className={styles.dropdownContainer} ref={excelRef}>
          <button
            type="button"
            onClick={() => setIsExcelOpen(!isExcelOpen)}
            className={`${styles.buttonBase} ${styles.buttonSecondary}`}
          >
            <FiDownload />
            Excel
            <FiChevronDown style={{ marginLeft: "0.25rem", opacity: 0.5 }} />
          </button>

          {isExcelOpen && (
            <div className={styles.dropdownMenu}>
              <button
                className={styles.dropdownItem}
                onClick={() => {
                  onExportExcel();
                  setIsExcelOpen(false);
                }}
              >
                <FiDownload />
                Excel-ə ixrac et
              </button>
              <button
                className={styles.dropdownItem}
                onClick={() => {
                  onImportExcel();
                  setIsExcelOpen(false);
                }}
              >
                <FiUpload />
                Excel-dən idxal et
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
