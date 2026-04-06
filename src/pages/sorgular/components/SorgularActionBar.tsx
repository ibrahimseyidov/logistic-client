interface Props {
  total: number;
  confirmedCount: number;
  onNew: () => void;
  onClear: () => void;
  onApplyFilter: () => void;
  onImportExcel: () => void;
  onExportExcel: () => void;
}

export default function SorgularActionBar({
  total,
  confirmedCount,
  onNew,
  onClear,
  onApplyFilter,
  onImportExcel,
  onExportExcel,
}: Props) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-white border border-gray-200 rounded-lg p-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onNew}
          className="inline-flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors"
        >
          + Yeni sorğu
        </button>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-4 py-1.5 rounded text-sm font-medium transition-colors"
        >
          ✕ Təmizlə
        </button>
        <button
          type="button"
          onClick={onApplyFilter}
          className="inline-flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors"
        >
          Filterdən keçir
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700">
        <span>
          <span className="font-medium">Cəmi:</span> {total}
        </span>
        <span>
          <span className="font-medium">Təsdiq edilib:</span> {confirmedCount}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onImportExcel}
          className="inline-flex items-center gap-1 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded text-sm font-medium transition-colors"
        >
          + Excel-dən idxal et
        </button>
        <button
          type="button"
          onClick={onExportExcel}
          className="inline-flex items-center gap-1 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded text-sm font-medium transition-colors"
        >
          + Excel-ə ixrac et
        </button>
      </div>
    </div>
  );
}
