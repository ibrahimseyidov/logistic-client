import { useState, useRef, useEffect } from "react";
import { FiFilePlus, FiFilter, FiUpload, FiDownload, FiChevronDown } from "react-icons/fi";
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
  const [isExcelOpen, setIsExcelOpen] = useState(false);
  const excelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (excelRef.current && !excelRef.current.contains(event.target as Node)) {
        setIsExcelOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
                onClick={() => { onExportExcel(); setIsExcelOpen(false); }}
              >
                <FiDownload />
                Excel-ə ixrac et
              </button>
              <button 
                className={styles.dropdownItem} 
                onClick={() => { onImportExcel(); setIsExcelOpen(false); }}
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
