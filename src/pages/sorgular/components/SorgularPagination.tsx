import styles from "./SorgularPagination.module.css";

interface Props {
  totalRows: number;
  currentPage: number;
  totalPages: number;
  getVisiblePages: () => number[];
  onPageChange: (page: number) => void;
}

export default function SorgularPagination({
  totalRows,
  currentPage,
  totalPages,
  getVisiblePages,
  onPageChange,
}: Props) {
  return (
    <div className={styles.root}>
      <span className={styles.summary}>Cəmi sətir: {totalRows}</span>
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
              className={`${styles.button} ${currentPage === page ? styles.activeButton : ""}`}
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
