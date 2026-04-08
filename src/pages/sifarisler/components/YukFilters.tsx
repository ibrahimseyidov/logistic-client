import Select from "../../../common/components/select/Select";
import type { SelectOption } from "../../../common/components/select/Select";
import FilterPanelShell from "./FilterPanelShell";
import { YUK_FILTER_SECTIONS } from "../constants/yuk.constants";
import type {
  YukFilterFormState,
  YukFilterSectionId,
} from "../types/yuk.types";

const inputClass =
  "rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-200 w-full bg-gray-50 border border-gray-300";

const sectionClass =
  "rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm";

interface Props {
  activeSections: Set<YukFilterSectionId>;
  toggleSection: (id: YukFilterSectionId) => void;
  filter: YukFilterFormState;
  onFilterChange: (field: keyof YukFilterFormState, value: string) => void;
  userOptions: SelectOption[];
  onClose: () => void;
  onClear: () => void;
  onApplyFilter: () => void;
  onSaveTemplate: () => void;
}

export default function YukFilters({
  activeSections,
  toggleSection,
  filter,
  onFilterChange,
  userOptions,
  onClose,
  onClear,
  onApplyFilter,
  onSaveTemplate,
}: Props) {
  return (
    <FilterPanelShell
      title="Filtrlər"
      description="Yükləri istifadəçi, şirkət və əlaqəli tərəf meyarlarına görə daha sürətli süzün."
      sections={YUK_FILTER_SECTIONS}
      activeSections={activeSections}
      onToggleSection={toggleSection}
      onClose={onClose}
      onClear={onClear}
      onApplyFilter={onApplyFilter}
      onSaveTemplate={onSaveTemplate}
    >
      <div className="space-y-4">
        {activeSections.has("id") && (
          <div
            className={`${sectionClass} grid max-w-2xl grid-cols-1 gap-4 md:grid-cols-2`}
          >
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-600">
                İstifadəçi
              </span>
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
          <div className={sectionClass}>
            <p className="text-xs text-gray-500 italic">
              Bu filtr qrupu üçün əlavə sahələr API bağlandıqda doldurulacaq.
            </p>
          </div>
        )}
      </div>
    </FilterPanelShell>
  );
}
