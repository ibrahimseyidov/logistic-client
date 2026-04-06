interface Props {
  totalRows: number;
  currentPage: number;
  totalPages: number;
  getVisiblePages: () => number[];
  onPageChange: (page: number) => void;
}

export default function SifarisPagination({
  totalRows,
  currentPage,
  totalPages,
  getVisiblePages,
  onPageChange,
}: Props) {
  return (
    <div className="flex items-center justify-between py-3 px-4 border-t bg-gray-50">
      <span className="text-sm text-gray-600">Cəmi sətir: {totalRows}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="px-3 py-1 rounded border bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 text-sm"
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
        >
          Əvvəlki
        </button>
        {getVisiblePages().map((page, index) =>
          page === -1 ? (
            <span key={`e-${index}`} className="px-2 py-1 text-gray-400 text-sm">
              …
            </span>
          ) : (
            <button
              key={page}
              type="button"
              className={`px-3 py-1 rounded border text-sm ${
                currentPage === page
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          ),
        )}
        <button
          type="button"
          className="px-3 py-1 rounded border bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 text-sm"
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Sonrakı
        </button>
      </div>
    </div>
  );
}
