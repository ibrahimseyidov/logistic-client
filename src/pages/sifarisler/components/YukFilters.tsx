import Select from "../../../common/components/select/Select";
import type { SelectOption } from "../../../common/components/select/Select";
import { YUK_FILTER_SECTIONS } from "../constants/yuk.constants";
import type { YukFilterFormState, YukFilterSectionId } from "../types/yuk.types";

const inputClass =
  "rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-200 w-full bg-gray-50 border border-gray-300";

interface Props {
  activeSections: Set<YukFilterSectionId>;
  toggleSection: (id: YukFilterSectionId) => void;
  filter: YukFilterFormState;
  onFilterChange: (field: keyof YukFilterFormState, value: string) => void;
  userOptions: SelectOption[];
  onSaveTemplate: () => void;
}

export default function YukFilters({
  activeSections,
  toggleSection,
  filter,
  onFilterChange,
  userOptions,
  onSaveTemplate,
}: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Filtrləri göstər:</p>
        <div className="flex flex-wrap gap-2">
          {YUK_FILTER_SECTIONS.map(({ id, label }) => {
            const on = activeSections.has(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggleSection(id)}
                className={`px-3 py-1.5 rounded text-sm font-medium border transition-colors ${
                  on
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {activeSections.has("id") && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-600">İstifadəçi</span>
            <Select
              value={filter.userId}
              options={userOptions}
              onChange={(v) => onFilterChange("userId", v)}
              placeholder="Hamısı"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-600">Şirkət</span>
            <input
              className={inputClass}
              value={filter.company}
              onChange={(e) => onFilterChange("company", e.target.value)}
              placeholder="Şirkət adı ilə axtar..."
            />
          </label>
        </div>
      )}

      {(activeSections.has("counterparties") ||
        activeSections.has("loading") ||
        activeSections.has("reload") ||
        activeSections.has("unloading") ||
        activeSections.has("cargo_statuses") ||
        activeSections.has("loads") ||
        activeSections.has("orders") ||
        activeSections.has("sort") ||
        activeSections.has("templates")) && (
        <p className="text-xs text-gray-500 italic">
          Bu filtr qrupu üçün əlavə sahələr API bağlandıqda doldurulacaq.
        </p>
      )}

      <button
        type="button"
        onClick={onSaveTemplate}
        className="w-full md:w-auto px-4 py-2 rounded text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition-colors"
      >
        Filtrləri şablon kimi yaddaşda saxla
      </button>
    </div>
  );
}
