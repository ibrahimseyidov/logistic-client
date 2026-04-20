import { FiFilePlus, FiFilter, FiUpload, FiDownload } from "react-icons/fi";
import styles from "./SorgularActionBar.module.css";

interface Props {
  total: number;
  confirmedCount: number;
  onNew: () => void;
  onOpenFilters: () => void;
  onImportExcel: () => void;
  onExportExcel: () => void;
  activeFilterCount: number;
}

export default function SorgularActionBar({
  total,
  confirmedCount,
  onNew,
  onOpenFilters,
  onImportExcel,
  onExportExcel,
  activeFilterCount,
}: Props) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.group}>
        <button
          type="button"
          onClick={onNew}
          className={`${styles.buttonBase} ${styles.buttonPrimary}`}
        >
          <FiFilePlus />
          Yeni sorğu
        </button>
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

      <div className={styles.statsGroup}>
        <span className={styles.statPill}>Cəmi: {total}</span>
        <span className={styles.statPill}>Təsdiq edilib: {confirmedCount}</span>
      </div>

      <div className={styles.group}>
        <button
          type="button"
          onClick={onImportExcel}
          className={`${styles.buttonBase} ${styles.buttonSecondary}`}
        >
          <FiUpload />
          Excel-dən idxal et
        </button>
        <button
          type="button"
          onClick={onExportExcel}
          className={`${styles.buttonBase} ${styles.buttonSecondary}`}
        >
          <FiDownload />
          Excel-ə ixrac et
        </button>
      </div>
    </div>
  );
}
