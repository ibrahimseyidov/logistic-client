import { FiFilePlus, FiFilter, FiUpload, FiDownload } from "react-icons/fi";

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
    <div className="flex flex-col gap-3 pb-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onNew}
          className="inline-flex items-center gap-2 rounded-[18px] border border-slate-300 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
        >
          <FiFilePlus />
          Yeni sorğu
        </button>
        <button
          type="button"
          onClick={onOpenFilters}
          className="inline-flex items-center gap-2 rounded-[18px] border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          <FiFilter />
          Filtrlər
          {activeFilterCount > 0 ? (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
              {activeFilterCount}
            </span>
          ) : null}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 font-medium">
          Cəmi: {total}
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 font-medium text-slate-700">
          Təsdiq edilib: {confirmedCount}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onImportExcel}
          className="inline-flex items-center gap-2 rounded-[16px] border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          <FiUpload />
          Excel-dən idxal et
        </button>
        <button
          type="button"
          onClick={onExportExcel}
          className="inline-flex items-center gap-2 rounded-[16px] border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          <FiDownload />
          Excel-ə ixrac et
        </button>
      </div>
    </div>
  );
}
