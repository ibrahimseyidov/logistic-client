import Select from "../../../common/components/select/Select";
import type { SelectOption } from "../../../common/components/select/Select";
import { FILTER_SECTIONS } from "../constants/sorgular.constants";
import type { FilterFormState, FilterSectionId } from "../types/sorgu.types";

const inputClass =
  "rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-200 w-full bg-gray-50 border border-gray-300";

interface Props {
  activeSections: Set<FilterSectionId>;
  toggleSection: (id: FilterSectionId) => void;
  filter: FilterFormState;
  onFilterChange: (field: keyof FilterFormState, value: string) => void;
  companyOptions: SelectOption[];
  onSaveTemplate: () => void;
}

export default function SorgularFilters({
  activeSections,
  toggleSection,
  filter,
  onFilterChange,
  companyOptions,
  onSaveTemplate,
}: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Filtrləri göstər:</p>
        <div className="flex flex-wrap gap-2">
          {FILTER_SECTIONS.map(({ id, label }) => {
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-600">Sorğunun nömrəsi</span>
            <input
              className={inputClass}
              value={filter.queryNumber}
              onChange={(e) => onFilterChange("queryNumber", e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-600">
              Müştəridə olan sifarişin nömrəsi
            </span>
            <input
              className={inputClass}
              value={filter.customerOrderRef}
              onChange={(e) => onFilterChange("customerOrderRef", e.target.value)}
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
        </div>
      )}

      {activeSections.has("dates") && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <fieldset className="space-y-2">
              <legend className="text-xs font-medium text-gray-600 mb-1">
                Sorğunun tarixi
              </legend>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-gray-500">Tarixindən</span>
                  <input
                    type="date"
                    className={inputClass}
                    value={filter.queryDateFrom}
                    onChange={(e) => onFilterChange("queryDateFrom", e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-gray-500">Tarixinə qədər</span>
                  <input
                    type="date"
                    className={inputClass}
                    value={filter.queryDateTo}
                    onChange={(e) => onFilterChange("queryDateTo", e.target.value)}
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
                    onChange={(e) => onFilterChange("loadDateFrom", e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-gray-500">Tarixinə qədər</span>
                  <input
                    type="date"
                    className={inputClass}
                    value={filter.loadDateTo}
                    onChange={(e) => onFilterChange("loadDateTo", e.target.value)}
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
                    onChange={(e) => onFilterChange("unloadDateFrom", e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-gray-500">Tarixinə qədər</span>
                  <input
                    type="date"
                    className={inputClass}
                    value={filter.unloadDateTo}
                    onChange={(e) => onFilterChange("unloadDateTo", e.target.value)}
                  />
                </label>
              </div>
            </fieldset>
          </div>
          <fieldset className="space-y-2 max-w-md">
            <legend className="text-xs font-medium text-gray-600 mb-1">
              Statusun təyin edilməsi tarixi
            </legend>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-gray-500">Tarixindən</span>
                <input
                  type="date"
                  className={inputClass}
                  value={filter.statusDateFrom}
                  onChange={(e) => onFilterChange("statusDateFrom", e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-gray-500">Tarixinə qədər</span>
                <input
                  type="date"
                  className={inputClass}
                  value={filter.statusDateTo}
                  onChange={(e) => onFilterChange("statusDateTo", e.target.value)}
                />
              </label>
            </div>
          </fieldset>
        </div>
      )}

      {activeSections.has("customers") && (
        <label className="flex flex-col gap-1 max-w-md">
          <span className="text-xs font-medium text-gray-600">Müştəri adı</span>
          <input
            className={inputClass}
            value={filter.customerName}
            onChange={(e) => onFilterChange("customerName", e.target.value)}
            placeholder="Axtar..."
          />
        </label>
      )}

      {activeSections.has("directions") && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-600">Yükləmə yeri</span>
            <input
              className={inputClass}
              value={filter.loadPlace}
              onChange={(e) => onFilterChange("loadPlace", e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-600">Boşaltma yeri</span>
            <input
              className={inputClass}
              value={filter.unloadPlace}
              onChange={(e) => onFilterChange("unloadPlace", e.target.value)}
            />
          </label>
        </div>
      )}

      {(activeSections.has("transport") ||
        activeSections.has("loads") ||
        activeSections.has("users") ||
        activeSections.has("other") ||
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
