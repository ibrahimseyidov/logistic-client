import Select from "../../../common/components/select/Select";
import type { SelectOption } from "../../../common/components/select/Select";
import FilterPanelShell from "./FilterPanelShell";
import {
  FILTER_SECTIONS,
  STATUS_OPTIONS,
} from "../constants/sifaris.constants";
import type {
  SifarisFilterFormState,
  SifarisFilterSectionId,
} from "../types/sifaris.types";

const inputClass =
  "rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-200 w-full bg-gray-50 border border-gray-300";

const sectionClass =
  "rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm";

interface Props {
  activeSections: Set<SifarisFilterSectionId>;
  toggleSection: (id: SifarisFilterSectionId) => void;
  filter: SifarisFilterFormState;
  onFilterChange: (field: keyof SifarisFilterFormState, value: string) => void;
  companyOptions: SelectOption[];
  onClose: () => void;
  onClear: () => void;
  onApplyFilter: () => void;
  onSaveTemplate: () => void;
}

export default function SifarisFilters({
  activeSections,
  toggleSection,
  filter,
  onFilterChange,
  companyOptions,
  onClose,
  onClear,
  onApplyFilter,
  onSaveTemplate,
}: Props) {
  return (
    <FilterPanelShell
      title="Filtrlər"
      description="Sifarişləri daha sürətli tapmaq üçün status, tarix və müştəri meyarlarına görə görünüşü fərdiləşdirin."
      sections={FILTER_SECTIONS}
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
            className={`${sectionClass} grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5`}
          >
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-600">ID</span>
              <input
                className={inputClass}
                value={filter.orderNumber}
                onChange={(e) => onFilterChange("orderNumber", e.target.value)}
                placeholder="Sifariş nömrəsi"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-600">Status</span>
              <Select
                value={filter.status}
                options={STATUS_OPTIONS}
                onChange={(v) => onFilterChange("status", v)}
                placeholder="Hamısı"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-600">Şirkət</span>
              <Select
                value={filter.company}
                options={companyOptions}
                onChange={(v) => onFilterChange("company", v)}
                placeholder="Hamısı"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-600">
                Müştəridə olan sifarişin nömrəsi
              </span>
              <input
                className={inputClass}
                value={filter.customerOrderRef}
                onChange={(e) =>
                  onFilterChange("customerOrderRef", e.target.value)
                }
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-600">Teqlər</span>
              <input
                className={inputClass}
                value={filter.tags}
                onChange={(e) => onFilterChange("tags", e.target.value)}
                placeholder="Axtar..."
              />
            </label>
          </div>
        )}

        {activeSections.has("dates") && (
          <div className={`${sectionClass} space-y-3`}>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
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
                  Aktın yaradılması
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-gray-500">Tarixindən</span>
                    <input
                      type="date"
                      className={inputClass}
                      value={filter.actCreatedFrom}
                      onChange={(e) =>
                        onFilterChange("actCreatedFrom", e.target.value)
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
                      value={filter.actCreatedTo}
                      onChange={(e) =>
                        onFilterChange("actCreatedTo", e.target.value)
                      }
                    />
                  </label>
                </div>
              </fieldset>
              <fieldset className="space-y-2">
                <legend className="text-xs font-medium text-gray-600 mb-1">
                  Aktın tarixi
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-gray-500">Tarixindən</span>
                    <input
                      type="date"
                      className={inputClass}
                      value={filter.actDateFrom}
                      onChange={(e) =>
                        onFilterChange("actDateFrom", e.target.value)
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
                      value={filter.actDateTo}
                      onChange={(e) =>
                        onFilterChange("actDateTo", e.target.value)
                      }
                    />
                  </label>
                </div>
              </fieldset>
              <fieldset className="space-y-2">
                <legend className="text-xs font-medium text-gray-600 mb-1">
                  CMR-in boşaldılması
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-gray-500">Tarixindən</span>
                    <input
                      type="date"
                      className={inputClass}
                      value={filter.cmrUnloadFrom}
                      onChange={(e) =>
                        onFilterChange("cmrUnloadFrom", e.target.value)
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
                      value={filter.cmrUnloadTo}
                      onChange={(e) =>
                        onFilterChange("cmrUnloadTo", e.target.value)
                      }
                    />
                  </label>
                </div>
              </fieldset>
              <fieldset className="space-y-2">
                <legend className="text-xs font-medium text-gray-600 mb-1">
                  Hesab yazılıb
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-gray-500">Tarixindən</span>
                    <input
                      type="date"
                      className={inputClass}
                      value={filter.invoicedFrom}
                      onChange={(e) =>
                        onFilterChange("invoicedFrom", e.target.value)
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
                      value={filter.invoicedTo}
                      onChange={(e) =>
                        onFilterChange("invoicedTo", e.target.value)
                      }
                    />
                  </label>
                </div>
              </fieldset>
            </div>
          </div>
        )}

        {activeSections.has("customers") && (
          <div className={sectionClass}>
            <label className="flex max-w-md flex-col gap-1">
              <span className="text-xs font-medium text-gray-600">Müştəri</span>
              <input
                className={inputClass}
                value={filter.customerName}
                onChange={(e) => onFilterChange("customerName", e.target.value)}
                placeholder="Axtar..."
              />
            </label>
          </div>
        )}

        {(activeSections.has("loads") ||
          activeSections.has("voyages") ||
          activeSections.has("users") ||
          activeSections.has("documents") ||
          activeSections.has("transport") ||
          activeSections.has("other") ||
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
