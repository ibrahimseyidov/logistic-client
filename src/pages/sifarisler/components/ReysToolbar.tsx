import { FaBus, FaFileExcel, FaPlane, FaShip, FaTruck } from "react-icons/fa";
import { FiFilter } from "react-icons/fi";
import { REYS_TRANSPORT_TABS } from "../constants/reys.constants";
import type { ReysTransportMode } from "../types/reys.types";

interface Props {
  transportMode: ReysTransportMode;
  onTransportChange: (mode: ReysTransportMode) => void;
  onToggleFilters: () => void;
  count: number;
  totalValueAzn: number;
  onExcel: () => void;
  activeFilterCount: number;
}

function fmtMoney(n: number) {
  return new Intl.NumberFormat("az-AZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export default function ReysToolbar({
  transportMode,
  onTransportChange,
  onToggleFilters,
  count,
  totalValueAzn,
  onExcel,
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

        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="flex items-center gap-1.5 text-gray-500">
            <FaPlane title="Hava" className="text-base" aria-hidden />
            <FaShip title="Dəniz" className="text-base" aria-hidden />
            <FaBus title="Avtobus" className="text-base" aria-hidden />
            <FaTruck title="Yük" className="text-base" aria-hidden />
          </div>
          <button
            type="button"
            onClick={onExcel}
            className="inline-flex items-center gap-2 rounded-[16px] border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            title="Excel"
          >
            <FaFileExcel className="text-lg" aria-hidden />
            Excel
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {REYS_TRANSPORT_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTransportChange(tab.id)}
            className={`rounded-[16px] border px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap sm:text-sm ${
              transportMode === tab.id
                ? "border-green-600 bg-green-600 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 font-medium">
          Miqdarı: {count}
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 font-medium text-slate-700">
          Reyslərin dəyəri: {fmtMoney(totalValueAzn)} AZN
        </span>
      </div>
    </div>
  );
}
