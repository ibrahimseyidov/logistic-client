import type { ProductsPaginationProps } from "./ProductsPagination";

type ToolbarPaginationProps = Pick<
  ProductsPaginationProps,
  "totalRows" | "totalPages" | "getVisiblePages"
>;

interface ProductsToolbarProps extends ToolbarPaginationProps {
  codeSearchTerm: string;
  nameSearchTerm: string;
  barcodeSearchTerm: string;
  setCodeSearchTerm: (value: string) => void;
  setNameSearchTerm: (value: string) => void;
  setBarcodeSearchTerm: (value: string) => void;
  onFilter: () => void;
  onCreate: () => void;
  onResetPage: () => void;
}

export default function ProductsToolbar({
  codeSearchTerm,
  nameSearchTerm,
  barcodeSearchTerm,
  setCodeSearchTerm,
  setNameSearchTerm,
  setBarcodeSearchTerm,
  onFilter,
  onCreate,
  onResetPage,
  totalRows,
  totalPages,
  getVisiblePages,
}: ProductsToolbarProps) {
  return (
    <div className="flex flex-col gap-2 bg-white p-3 rounded-lg mt-3 mb-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Kod ile ara..."
            value={codeSearchTerm}
            onChange={(e) => {
              setCodeSearchTerm(e.target.value);
              onResetPage();
            }}
            className="rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 transition w-32 bg-gray-50 border border-gray-300"
          />
          <input
            type="text"
            placeholder="İsim ile ara..."
            value={nameSearchTerm}
            onChange={(e) => {
              setNameSearchTerm(e.target.value);
              onResetPage();
            }}
            className="rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 transition w-40 bg-gray-50 border border-gray-300"
          />
          <input
            type="text"
            placeholder="Barkod ile ara..."
            value={barcodeSearchTerm}
            onChange={(e) => {
              setBarcodeSearchTerm(e.target.value);
              onResetPage();
            }}
            className="rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 transition w-36 bg-gray-50 border border-gray-300"
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
