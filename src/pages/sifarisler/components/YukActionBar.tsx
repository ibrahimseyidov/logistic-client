import { FiFilter } from "react-icons/fi";
import Select from "../../../common/components/select/Select";
import type { SelectOption } from "../../../common/components/select/Select";

interface Stats {
  ldm: number;
  weight: number;
  volume: number;
  count: number;
}

interface Props {
  stats: Stats;
  accountAction: string;
  onAccountActionChange: (v: string) => void;
  accountOptions: SelectOption[];
  onToggleFilters: () => void;
  onTrackingImport: () => void;
  onExcel: () => void;
  onPerformActions: () => void;
  activeFilterCount: number;
}

function fmt(n: number, decimals = 2) {
  return new Intl.NumberFormat("az-AZ", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
  }).format(n);
}

export default function YukActionBar({
  stats,
  accountAction,
  onAccountActionChange,
  accountOptions,
  onToggleFilters,
  onTrackingImport,
  onExcel,
  onPerformActions,
  activeFilterCount,
}: Props) {
  return (
    <div className="space-y-3 pb-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
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

        <div className="flex flex-wrap items-center gap-2 justify-end">
          <button
            type="button"
            onClick={onTrackingImport}
            className="inline-flex items-center gap-2 rounded-[16px] border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            + Tracking idxal
          </button>
          <button
            type="button"
            onClick={onExcel}
            className="inline-flex items-center gap-2 rounded-[16px] border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            + Excel
          </button>
          <div className="w-56 min-w-[12rem]">
            <Select
              value={accountAction}
              options={accountOptions}
              onChange={onAccountActionChange}
              placeholder="Hesab əməliyyatı"
              className="rounded-[16px] border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            />
          </div>
          <button
            type="button"
            onClick={onPerformActions}
            className="inline-flex items-center gap-2 rounded-[16px] bg-green-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700"
          >
            Hərəkətləri yerinə yetir
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 font-medium">
          LDM: {fmt(stats.ldm, 0)}
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 font-medium">
          Çəki: {fmt(stats.weight, 2)}
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 font-medium">
          Həcm: {fmt(stats.volume, 2)}
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 font-medium">
          Yüklərin sayı: {stats.count}
        </span>
      </div>
    </div>
  );
}
