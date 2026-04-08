import { FiFilePlus, FiFilter } from "react-icons/fi";

interface Stats {
  orders: number;
  loads: number;
  voyages: number;
  weight: number;
  volume: number;
  ldm: number;
  freightAzn: number;
  profitAzn: number;
}

interface Props {
  stats: Stats;
  onNew: () => void;
  onToggleFilters: () => void;
  onExportExcel: () => void;
  activeFilterCount: number;
}

function fmt(n: number) {
  return new Intl.NumberFormat("az-AZ", { maximumFractionDigits: 1 }).format(n);
}

export default function SifarisActionBar({
  stats,
  onNew,
  onToggleFilters,
  onExportExcel,
  activeFilterCount,
}: Props) {
  return (
    <div className="space-y-3 pb-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onNew}
            className="inline-flex items-center gap-2 rounded-[18px] border border-slate-300 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
          >
            <FiFilePlus />
            Yeni sifariş
          </button>
          <button
            type="button"
            onClick={onToggleFilters}
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

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onExportExcel}
            className="inline-flex items-center gap-2 rounded-[16px] border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            + Excel
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 font-medium">
          Sifarişlər: {stats.orders}
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 font-medium">
          Yüklər: {stats.loads}
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 font-medium">
          Reyslər: {stats.voyages}
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 font-medium">
          Çəki (kq): {fmt(stats.weight)}
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 font-medium">
          Həcm (m³): {fmt(stats.volume)}
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 font-medium">
          LDM: {fmt(stats.ldm)}
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 font-medium">
          Fraxtın məbləği (AZN): {fmt(stats.freightAzn)}
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 font-medium text-slate-700">
          Gəlirin məbləği (AZN): {fmt(stats.profitAzn)}
        </span>
      </div>
    </div>
  );
}
