import Select from "../../../common/components/select/Select";
import type { SelectOption } from "../../../common/components/select/Select";

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
  bulkStatus: string;
  onBulkStatusChange: (v: string) => void;
  statusOptions: SelectOption[];
  onNew: () => void;
  onClear: () => void;
  onApplyFilter: () => void;
  onNotify: () => void;
  onChangeStatus: () => void;
  onImportExcel: () => void;
  onExportExcel: () => void;
}

function fmt(n: number) {
  return new Intl.NumberFormat("az-AZ", { maximumFractionDigits: 1 }).format(n);
}

export default function SifarisActionBar({
  stats,
  bulkStatus,
  onBulkStatusChange,
  statusOptions,
  onNew,
  onClear,
  onApplyFilter,
  onNotify,
  onChangeStatus,
  onImportExcel,
  onExportExcel,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 bg-white border border-gray-200 rounded-lg p-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onNew}
            className="inline-flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors"
          >
            + Yeni sifariş
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
            Filtirdən keçir
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onNotify}
            className="inline-flex items-center gap-1 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded text-sm font-medium transition-colors"
          >
            Bildiriş göndər
          </button>
          <div className="w-44">
            <Select
              value={bulkStatus}
              options={statusOptions}
              onChange={onBulkStatusChange}
              placeholder="Status"
            />
          </div>
          <button
            type="button"
            onClick={onChangeStatus}
            className="inline-flex items-center gap-1 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded text-sm font-medium transition-colors"
          >
            + Statusu dəyiş
          </button>
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
            + Excel
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
        <span>
          <span className="font-medium">Sifarişlər:</span> {stats.orders}
        </span>
        <span className="text-gray-300">|</span>
        <span>
          <span className="font-medium">Yüklər:</span> {stats.loads}
        </span>
        <span className="text-gray-300">|</span>
        <span>
          <span className="font-medium">Reyslər:</span> {stats.voyages}
        </span>
        <span className="text-gray-300 hidden sm:inline">|</span>
        <span>
          <span className="font-medium">Çəki (kq):</span> {fmt(stats.weight)}
        </span>
        <span>
          <span className="font-medium">Həcm (m³):</span> {fmt(stats.volume)}
        </span>
        <span>
          <span className="font-medium">LDM:</span> {fmt(stats.ldm)}
        </span>
        <span className="text-gray-300 hidden md:inline">|</span>
        <span>
          <span className="font-medium">Fraxtın məbləği (AZN):</span> {fmt(stats.freightAzn)}
        </span>
        <span>
          <span className="font-medium">Gəlirin məbləği (AZN):</span> {fmt(stats.profitAzn)}
        </span>
      </div>
    </div>
  );
}
