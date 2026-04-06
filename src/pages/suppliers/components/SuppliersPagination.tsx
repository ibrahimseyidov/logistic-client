import { useAppDispatch, useAppSelector } from "../../../common/store/hooks";
import { setSuppliersPage } from "../store/suppliersPaginationSlice";

export interface SuppliersPaginationProps {
  totalRows: number;
  totalPages: number;
  getVisiblePages: () => number[];
}

export default function SuppliersPagination({
  totalRows,
  totalPages,
  getVisiblePages,
}: SuppliersPaginationProps) {
  const dispatch = useAppDispatch();
  const currentPage = useAppSelector(
    (state) => state.suppliersPagination.currentPage,
  );

  const handleSetPage = (page: number) => {
    dispatch(setSuppliersPage(page));
  };

  return (
    <div className="flex items-center justify-between py-3 px-4 border-t bg-gray-50">
      <span className="text-sm text-gray-600">Toplam Satır: {totalRows}</span>
      <div className="flex items-center gap-1">
        <button
          className="px-3 py-1 rounded border bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          onClick={() => handleSetPage(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
        >
          Önceki
        </button>

        {getVisiblePages().map((page, index) =>
          page === -1 ? (
            <span key={`ellipsis-${index}`} className="px-3 py-1 text-gray-400">
              ...
            </span>
          ) : (
            <button
              key={page}
              className={`px-3 py-1 rounded border ${currentPage === page ? "bg-blue-500 text-white" : "bg-white text-gray-700 hover:bg-gray-100"}`}
              onClick={() => handleSetPage(page)}
            >
              {page}
            </button>
          ),
        )}

        <button
          className="px-3 py-1 rounded border bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          onClick={() => handleSetPage(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Sonraki
        </button>
      </div>
    </div>
  );
}
