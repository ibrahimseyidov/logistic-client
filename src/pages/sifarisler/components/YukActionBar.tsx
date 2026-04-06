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
  onClear: () => void;
  onApplyFilter: () => void;
  onTrackingImport: () => void;
  onExcel: () => void;
  onPerformActions: () => void;
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
  onClear,
  onApplyFilter,
  onTrackingImport,
  onExcel,
  onPerformActions,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-gray-100 border border-gray-200 rounded-lg px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-2">
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
            Filtirdən keçir
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 justify-end">
          <button
            type="button"
            onClick={onTrackingImport}
            className="inline-flex items-center gap-1 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded text-sm font-medium transition-colors"
          >
            + Tracking idxal
          </button>
          <button
            type="button"
            onClick={onExcel}
            className="inline-flex items-center gap-1 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded text-sm font-medium transition-colors"
          >
            + Excel
          </button>
          <div className="w-56 min-w-[12rem]">
            <Select
              value={accountAction}
              options={accountOptions}
              onChange={onAccountActionChange}
              placeholder="Hesab əməliyyatı"
            />
          </div>
          <button
            type="button"
            onClick={onPerformActions}
            className="inline-flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded text-sm font-semibold transition-colors shadow-sm"
          >
            Hərəkətləri yerinə yetir
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-stretch">
        <div className="flex-1 min-w-[140px] border-2 border-green-600 rounded-lg bg-white px-4 py-1.5 text-center shadow-sm">
          <div className="text-xs font-medium text-gray-600">LDM</div>
          <div className="text-lg font-semibold text-gray-900 tabular-nums">{fmt(stats.ldm, 0)}</div>
        </div>
        <div className="flex-1 min-w-[140px] border-2 border-green-600 rounded-lg bg-white px-4 py-1.5 text-center shadow-sm">
          <div className="text-xs font-medium text-gray-600">Çəki</div>
          <div className="text-lg font-semibold text-gray-900 tabular-nums">{fmt(stats.weight, 2)}</div>
        </div>
        <div className="flex-1 min-w-[140px] border-2 border-green-600 rounded-lg bg-white px-4 py-1.5 text-center shadow-sm">
          <div className="text-xs font-medium text-gray-600">Həcm</div>
          <div className="text-lg font-semibold text-gray-900 tabular-nums">{fmt(stats.volume, 2)}</div>
        </div>
        <div className="flex-1 min-w-[140px] border-2 border-green-600 rounded-lg bg-white px-4 py-1.5 text-center shadow-sm">
          <div className="text-xs font-medium text-gray-600">Yüklərin sayı</div>
          <div className="text-lg font-semibold text-gray-900 tabular-nums">{stats.count}</div>
        </div>
      </div>
    </div>
  );
}
