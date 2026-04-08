import Select from "../../../common/components/select/Select";
import type { SelectOption } from "../../../common/components/select/Select";
import FilterPanelShell from "./FilterPanelShell";
import { REYS_FILTER_SECTIONS } from "../constants/reys.constants";
import type {
  ReysFilterFormState,
  ReysFilterSectionId,
} from "../types/reys.types";

const inputClass =
  "rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-200 w-full bg-gray-50 border border-gray-300";

const sectionClass =
  "rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm";

interface Props {
  activeSections: Set<ReysFilterSectionId>;
  toggleSection: (id: ReysFilterSectionId) => void;
  filter: ReysFilterFormState;
  onFilterChange: (field: keyof ReysFilterFormState, value: string) => void;
  companyOptions: SelectOption[];
  onClose: () => void;
  onSaveTemplate: () => void;
  onClear: () => void;
  onApplyFilter: () => void;
}

export default function ReysFilters({
  activeSections,
  toggleSection,
  filter,
  onFilterChange,
  companyOptions,
  onClose,
  onSaveTemplate,
  onClear,
  onApplyFilter,
}: Props) {
  return (
    <FilterPanelShell
      title="Filtrlər"
      description="Reysləri şirkət, tarix və reys nömrəsinə görə süzüb nəticəni ayrıca görünüşdə izləyin."
      sections={REYS_FILTER_SECTIONS}
      activeSections={activeSections}
      onToggleSection={toggleSection}
      onClose={onClose}
      onClear={onClear}
      onApplyFilter={onApplyFilter}
      onSaveTemplate={onSaveTemplate}
    >
      <div className="space-y-4">
        {activeSections.has("id") && (
          <div className={sectionClass}>
            <p className="text-xs font-semibold text-gray-700 mb-2">ID:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-600">
                  Reysin nömrəsi
                </span>
                <input
                  className={inputClass}
                  value={filter.tripNumber}
                  onChange={(e) => onFilterChange("tripNumber", e.target.value)}
                  placeholder="Məs: ZF260 65-1"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-600">
                  Şirkət
                </span>
                <Select
                  value={filter.company}
                  options={companyOptions}
                  onChange={(v) => onFilterChange("company", v)}
                  placeholder="Hamısı"
                />
              </label>
            </div>
          </div>
        )}

        {activeSections.has("dates") && (
          <div className={sectionClass}>
            <p className="text-xs font-semibold text-gray-700 mb-2">
              Tarixlər:
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <fieldset className="space-y-2">
                <legend className="text-xs font-medium text-gray-600 mb-1">
                  Sifarişin tarixi
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-gray-500">Tarixindən</span>
                    <input
                      type="date"
                      className={inputClass}
                      value={filter.orderDateFrom}
                      onChange={(e) =>
                        onFilterChange("orderDateFrom", e.target.value)
                      }
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-gray-500">
                      Tarixinə qədər
                    </span>
                    <input
                      type="date"
                      className={inputClass}
                      value={filter.orderDateTo}
                      onChange={(e) =>
                        onFilterChange("orderDateTo", e.target.value)
                      }
                    />
                  </label>
                </div>
              </fieldset>
              <fieldset className="space-y-2">
                <legend className="text-xs font-medium text-gray-600 mb-1">
                  Reysin tarixi
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-gray-500">Tarixindən</span>
                    <input
                      type="date"
                      className={inputClass}
                      value={filter.tripDateFrom}
                      onChange={(e) =>
                        onFilterChange("tripDateFrom", e.target.value)
                      }
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-gray-500">
                      Tarixinə qədər
                    </span>
                    <input
                      type="date"
                      className={inputClass}
                      value={filter.tripDateTo}
                      onChange={(e) =>
                        onFilterChange("tripDateTo", e.target.value)
                      }
                    />
                  </label>
                </div>
              </fieldset>
            </div>
          </div>
        )}

        {(activeSections.has("orders") ||
          activeSections.has("carriers") ||
          activeSections.has("route") ||
          activeSections.has("other") ||
          activeSections.has("sort") ||
          activeSections.has("statuses") ||
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
