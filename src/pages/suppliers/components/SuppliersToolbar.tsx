import type { SuppliersPaginationProps } from "./SuppliersPagination";

interface SuppliersToolbarProps extends SuppliersPaginationProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  onFilter: () => void;
  onCreate: () => void;
  onResetPage: () => void;
}

export default function SuppliersToolbar({
  searchTerm,
  setSearchTerm,
  onFilter,
  onCreate,
  onResetPage,
  totalRows,
  totalPages,
  getVisiblePages,
}: SuppliersToolbarProps) {
  return (
    <div className="flex flex-col gap-2 bg-white p-3 rounded-lg mt-3 mb-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Tedarikçi adı, telefon veya email ile ara..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              onResetPage();
            }}
            className="rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 transition w-64 bg-gray-50 border border-gray-300"
          />
          <button
            onClick={onFilter}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded transition text-sm font-medium"
          >
            Filtre
          </button>
        </div>
        <div className="flex items-center justify-end">
          <button
            onClick={onCreate}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded transition text-sm font-medium"
          >
            Oluştur
          </button>
        </div>
      </div>
    </div>
  );
}
