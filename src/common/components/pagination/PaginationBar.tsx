import styles from "./PaginationBar.module.css";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "./constants";

export interface PaginationBarProps {
  totalRows: number;
  currentPage: number;
  totalPages: number;
  getVisiblePages: () => number[];
  onPageChange: (page: number) => void;
  pageSize?: number;
  pageSizeOptions?: readonly number[];
  onPageSizeChange?: (size: number) => void;
}

export default function PaginationBar({
  totalRows,
  currentPage,
  totalPages,
  getVisiblePages,
  onPageChange,
  pageSize = DEFAULT_PAGE_SIZE,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  onPageSizeChange,
}: PaginationBarProps) {
  return (
    <div className={styles.root}>
      <div className={styles.left}>
        <span className={styles.summary}>Cəmi sətir: {totalRows}</span>
        {onPageSizeChange ? (
          <label className={styles.pageSize}>
            <span>Sətir:</span>
            <select
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              aria-label="Səhifədə sətir sayı"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.button}
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
        >
          Əvvəlki
        </button>
        {getVisiblePages().map((page, index) =>
          page === -1 ? (
            <span key={`e-${index}`} className={styles.ellipsis}>
              …
            </span>
          ) : (
            <button
              key={page}
              type="button"
              className={`${styles.button} ${
                currentPage === page ? styles.activeButton : ""
              }`}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          ),
        )}
        <button
          type="button"
          className={styles.button}
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Sonrakı
        </button>
      </div>
    </div>
  );
}
