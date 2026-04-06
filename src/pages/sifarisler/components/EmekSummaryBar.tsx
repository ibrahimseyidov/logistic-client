import Select from "../../../common/components/select/Select";
import type { SelectOption } from "../../../common/components/select/Select";

interface Props {
  profitAzn: number;
  bonusAzn: number;
  rewardAzn: number;
  saveSelectedValue: string;
  onSaveSelectedChange: (v: string) => void;
  saveSelectedOptions: SelectOption[];
  onExcel: () => void;
  onPerformActions: () => void;
}

function fmt(n: number) {
  return new Intl.NumberFormat("az-AZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export default function EmekSummaryBar({
  profitAzn,
  bonusAzn,
  rewardAzn,
  saveSelectedValue,
  onSaveSelectedChange,
  saveSelectedOptions,
  onExcel,
  onPerformActions,
}: Props) {
  return (
    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-3">
      <div className="flex flex-wrap gap-3 flex-1">
        <div className="flex-1 min-w-[160px] rounded-lg border border-gray-300 bg-gray-100 px-4 py-2 text-center shadow-sm">
          <div className="text-xs font-medium text-gray-600">Mənfəətin məbləği</div>
          <div className="text-lg font-semibold text-green-700 tabular-nums">{fmt(profitAzn)} AZN</div>
        </div>
        <div className="flex-1 min-w-[160px] rounded-lg border border-gray-300 bg-gray-100 px-4 py-2 text-center shadow-sm">
          <div className="text-xs font-medium text-gray-600">Bonusların məbləği</div>
          <div className="text-lg font-semibold text-gray-900 tabular-nums">{fmt(bonusAzn)} AZN</div>
        </div>
        <div className="flex-1 min-w-[160px] rounded-lg border border-gray-300 bg-gray-100 px-4 py-2 text-center shadow-sm">
          <div className="text-xs font-medium text-gray-600">Mükafatların məbləği</div>
          <div className="text-lg font-semibold text-gray-900 tabular-nums">{fmt(rewardAzn)} AZN</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 justify-end">
        <button
          type="button"
          onClick={onExcel}
          className="inline-flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
        >
          + Excel
        </button>
        <div className="w-56 min-w-[12rem]">
          <Select
            value={saveSelectedValue}
            options={saveSelectedOptions}
            onChange={onSaveSelectedChange}
            placeholder="Seçilmişlər"
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
  );
}
