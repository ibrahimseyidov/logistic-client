import { FaBus, FaFileExcel, FaPlane, FaShip, FaTruck } from "react-icons/fa";
import { REYS_TRANSPORT_TABS } from "../constants/reys.constants";
import type { ReysTransportMode } from "../types/reys.types";

interface Props {
  transportMode: ReysTransportMode;
  onTransportChange: (mode: ReysTransportMode) => void;
  count: number;
  totalValueAzn: number;
  onExcel: () => void;
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
  count,
  totalValueAzn,
  onExcel,
}: Props) {
  return (
    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
      <div className="flex flex-wrap gap-1 items-center">
        {REYS_TRANSPORT_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTransportChange(tab.id)}
            className={`px-3 py-1.5 rounded text-xs sm:text-sm font-medium border transition-colors whitespace-nowrap ${
              transportMode === tab.id
                ? "bg-green-600 text-white border-green-600 shadow-sm"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <div className="flex items-center gap-1.5 text-gray-500">
          <FaPlane title="Hava" className="text-base" aria-hidden />
          <FaShip title="Dəniz" className="text-base" aria-hidden />
          <FaBus title="Avtobus" className="text-base" aria-hidden />
          <FaTruck title="Yük" className="text-base" aria-hidden />
        </div>
        <button
          type="button"
          onClick={onExcel}
          className="inline-flex items-center gap-1.5 border border-green-600 bg-white text-green-700 hover:bg-green-50 px-3 py-1.5 rounded text-sm font-medium transition-colors"
          title="Excel"
        >
          <FaFileExcel className="text-lg" aria-hidden />
          Excel
        </button>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-800 border-l border-gray-200 pl-3">
          <span>
            <span className="font-medium text-gray-600">Miqdarı:</span>{" "}
            <span className="tabular-nums font-semibold">{count}</span>
          </span>
          <span>
            <span className="font-medium text-gray-600">Reyslərin dəyəri:</span>{" "}
            <span className="tabular-nums font-semibold text-green-700">
              {fmtMoney(totalValueAzn)} AZN
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
