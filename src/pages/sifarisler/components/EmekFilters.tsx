import Select from "../../../common/components/select/Select";
import type { SelectOption } from "../../../common/components/select/Select";
import FilterPanelShell from "./FilterPanelShell";
import {
  EMEK_CUSTOMER_TYPE_OPTIONS,
  EMEK_FILTER_SECTIONS,
  EMEK_STATUS_OPTIONS,
  EMEK_TIP_OPTIONS,
} from "../constants/emek.constants";
import type {
  EmekFilterFormState,
  EmekFilterSectionId,
} from "../types/emek.types";

const inputClass =
  "rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-200 w-full bg-gray-50 border border-gray-300";

const sectionClass =
  "rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm";

interface Props {
  activeSections: Set<EmekFilterSectionId>;
  toggleSection: (id: EmekFilterSectionId) => void;
  filter: EmekFilterFormState;
  onFilterChange: (field: keyof EmekFilterFormState, value: string) => void;
  companyOptions: SelectOption[];
  customerOptions: SelectOption[];
  carrierOptions: SelectOption[];
  onClose: () => void;
  onSaveTemplate: () => void;
  onClear: () => void;
  onApplyFilter: () => void;
}

export default function EmekFilters({
  activeSections,
  toggleSection,
  filter,
  onFilterChange,
  companyOptions,
  customerOptions,
  carrierOptions,
  onClose,
  onSaveTemplate,
  onClear,
  onApplyFilter,
}: Props) {
  return (
    <FilterPanelShell
      title="Filtrlər"
      description="Əmək haqqı hesablamasını şirkət, tarix, müştəri və daşıyıcı üzrə dəqiqləşdirin."
      sections={EMEK_FILTER_SECTIONS}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-600">
                  Sifarişin nömrəsi
                </span>
                <input
                  className={inputClass}
                  value={filter.orderNumber}
                  onChange={(e) =>
                    onFilterChange("orderNumber", e.target.value)
                  }
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-600">Tip</span>
                <Select
                  value={filter.tip}
                  options={EMEK_TIP_OPTIONS}
                  onChange={(v) => onFilterChange("tip", v)}
                  placeholder="Hamısı"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-600">
                  Status
                </span>
                <Select
                  value={filter.status}
                  options={EMEK_STATUS_OPTIONS}
                  onChange={(v) => onFilterChange("status", v)}
                  placeholder="Hamısı"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-600">
                  Reysin nömrəsi
                </span>
                <input
                  className={inputClass}
                  value={filter.tripNumber}
                  onChange={(e) => onFilterChange("tripNumber", e.target.value)}
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
                  Aktın yaradılması tarixi
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
                  Yükləmə tarixi
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-gray-500">Tarixindən</span>
                    <input
                      type="date"
                      className={inputClass}
                      value={filter.loadDateFrom}
                      onChange={(e) =>
                        onFilterChange("loadDateFrom", e.target.value)
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
                      value={filter.loadDateTo}
                      onChange={(e) =>
                        onFilterChange("loadDateTo", e.target.value)
                      }
                    />
                  </label>
                </div>
              </fieldset>
              <fieldset className="space-y-2">
                <legend className="text-xs font-medium text-gray-600 mb-1">
                  Boşaltma tarixi
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-gray-500">Tarixindən</span>
                    <input
                      type="date"
                      className={inputClass}
                      value={filter.unloadDateFrom}
                      onChange={(e) =>
                        onFilterChange("unloadDateFrom", e.target.value)
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
                      value={filter.unloadDateTo}
                      onChange={(e) =>
                        onFilterChange("unloadDateTo", e.target.value)
                      }
                    />
                  </label>
                </div>
              </fieldset>
              <fieldset className="space-y-2">
                <legend className="text-xs font-medium text-gray-600 mb-1">
                  Yazılıb irəli sürülmüş hesabın ödəniş tarixi
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-gray-500">Tarixindən</span>
                    <input
                      type="date"
                      className={inputClass}
                      value={filter.invoicePaymentFrom}
                      onChange={(e) =>
                        onFilterChange("invoicePaymentFrom", e.target.value)
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
                      value={filter.invoicePaymentTo}
                      onChange={(e) =>
                        onFilterChange("invoicePaymentTo", e.target.value)
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
            <p className="text-xs font-semibold text-gray-700 mb-2">
              Müştərilər:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-600">
                  Müştəri
                </span>
                <Select
                  value={filter.customer}
                  options={customerOptions}
                  onChange={(v) => onFilterChange("customer", v)}
                  placeholder="Hamısı"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-600">
                  Daşıyıcı
                </span>
                <Select
                  value={filter.carrier}
                  options={carrierOptions}
                  onChange={(v) => onFilterChange("carrier", v)}
                  placeholder="Hamısı"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-600">
                  Müştəri tipi
                </span>
                <Select
                  value={filter.customerType}
                  options={EMEK_CUSTOMER_TYPE_OPTIONS}
                  onChange={(v) => onFilterChange("customerType", v)}
                  placeholder="Hamısı"
                />
              </label>
            </div>
          </div>
        )}

        {(activeSections.has("users") ||
          activeSections.has("other") ||
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
