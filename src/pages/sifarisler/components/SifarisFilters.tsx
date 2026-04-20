import Select from "../../../common/components/select/Select";
import type { SelectOption } from "../../../common/components/select/Select";
import FilterPanelShell from "./FilterPanelShell";
import formStyles from "./FilterForms.module.css";
import {
  FILTER_SECTIONS,
  STATUS_OPTIONS,
} from "../constants/sifaris.constants";
import type {
  SifarisFilterFormState,
  SifarisFilterSectionId,
} from "../types/sifaris.types";

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
      <div className={formStyles.stack}>
        {activeSections.has("id") && (
          <div className={`${formStyles.section} ${formStyles.grid5}`}>
            <label className={formStyles.label}>
              <span className={formStyles.labelText}>ID</span>
              <input
                className={formStyles.input}
                value={filter.orderNumber}
                onChange={(e) => onFilterChange("orderNumber", e.target.value)}
                placeholder="Sifariş nömrəsi"
              />
            </label>
            <label className={formStyles.label}>
              <span className={formStyles.labelText}>Status</span>
              <Select
                value={filter.status}
                options={STATUS_OPTIONS}
                onChange={(v) => onFilterChange("status", v)}
                placeholder="Hamısı"
              />
            </label>
            <label className={formStyles.label}>
              <span className={formStyles.labelText}>Şirkət</span>
              <Select
                value={filter.company}
                options={companyOptions}
                onChange={(v) => onFilterChange("company", v)}
                placeholder="Hamısı"
              />
            </label>
            <label className={formStyles.label}>
              <span className={formStyles.labelText}>
                Müştəridə olan sifarişin nömrəsi
              </span>
              <input
                className={formStyles.input}
                value={filter.customerOrderRef}
                onChange={(e) =>
                  onFilterChange("customerOrderRef", e.target.value)
                }
              />
            </label>
            <label className={formStyles.label}>
              <span className={formStyles.labelText}>Teqlər</span>
              <input
                className={formStyles.input}
                value={filter.tags}
                onChange={(e) => onFilterChange("tags", e.target.value)}
                placeholder="Axtar..."
              />
            </label>
          </div>
        )}

        {activeSections.has("dates") && (
          <div className={`${formStyles.section} ${formStyles.sectionStack}`}>
            <div
              className={`${formStyles.grid1} ${formStyles.dateGrid} ${formStyles.dateGridLg2} ${formStyles.dateGridLg3}`}
            >
              <fieldset className={formStyles.dateFieldset}>
                <div className={formStyles.fieldsetInner}>
                  <legend className={formStyles.legend}>
                    Sifarişin tarixi
                  </legend>
                  <div className={formStyles.pairGrid}>
                    <label className={formStyles.label}>
                      <span className={formStyles.mutedText}>Tarixindən</span>
                      <input
                        type="date"
                        className={formStyles.input}
                        value={filter.orderDateFrom}
                        onChange={(e) =>
                          onFilterChange("orderDateFrom", e.target.value)
                        }
                      />
                    </label>
                    <label className={formStyles.label}>
                      <span className={formStyles.mutedText}>
                        Tarixinə qədər
                      </span>
                      <input
                        type="date"
                        className={formStyles.input}
                        value={filter.orderDateTo}
                        onChange={(e) =>
                          onFilterChange("orderDateTo", e.target.value)
                        }
                      />
                    </label>
                  </div>
                </div>
              </fieldset>
              <fieldset className={formStyles.dateFieldset}>
                <div className={formStyles.fieldsetInner}>
                  <legend className={formStyles.legend}>
                    Aktın yaradılması
                  </legend>
                  <div className={formStyles.pairGrid}>
                    <label className={formStyles.label}>
                      <span className={formStyles.mutedText}>Tarixindən</span>
                      <input
                        type="date"
                        className={formStyles.input}
                        value={filter.actCreatedFrom}
                        onChange={(e) =>
                          onFilterChange("actCreatedFrom", e.target.value)
                        }
                      />
                    </label>
                    <label className={formStyles.label}>
                      <span className={formStyles.mutedText}>
                        Tarixinə qədər
                      </span>
                      <input
                        type="date"
                        className={formStyles.input}
                        value={filter.actCreatedTo}
                        onChange={(e) =>
                          onFilterChange("actCreatedTo", e.target.value)
                        }
                      />
                    </label>
                  </div>
                </div>
              </fieldset>
              <fieldset className={formStyles.dateFieldset}>
                <div className={formStyles.fieldsetInner}>
                  <legend className={formStyles.legend}>Aktın tarixi</legend>
                  <div className={formStyles.pairGrid}>
                    <label className={formStyles.label}>
                      <span className={formStyles.mutedText}>Tarixindən</span>
                      <input
                        type="date"
                        className={formStyles.input}
                        value={filter.actDateFrom}
                        onChange={(e) =>
                          onFilterChange("actDateFrom", e.target.value)
                        }
                      />
                    </label>
                    <label className={formStyles.label}>
                      <span className={formStyles.mutedText}>
                        Tarixinə qədər
                      </span>
                      <input
                        type="date"
                        className={formStyles.input}
                        value={filter.actDateTo}
                        onChange={(e) =>
                          onFilterChange("actDateTo", e.target.value)
                        }
                      />
                    </label>
                  </div>
                </div>
              </fieldset>
              <fieldset className={formStyles.dateFieldset}>
                <div className={formStyles.fieldsetInner}>
                  <legend className={formStyles.legend}>
                    CMR-in boşaldılması
                  </legend>
                  <div className={formStyles.pairGrid}>
                    <label className={formStyles.label}>
                      <span className={formStyles.mutedText}>Tarixindən</span>
                      <input
                        type="date"
                        className={formStyles.input}
                        value={filter.cmrUnloadFrom}
                        onChange={(e) =>
                          onFilterChange("cmrUnloadFrom", e.target.value)
                        }
                      />
                    </label>
                    <label className={formStyles.label}>
                      <span className={formStyles.mutedText}>
                        Tarixinə qədər
                      </span>
                      <input
                        type="date"
                        className={formStyles.input}
                        value={filter.cmrUnloadTo}
                        onChange={(e) =>
                          onFilterChange("cmrUnloadTo", e.target.value)
                        }
                      />
                    </label>
                  </div>
                </div>
              </fieldset>
              <fieldset className={formStyles.dateFieldset}>
                <div className={formStyles.fieldsetInner}>
                  <legend className={formStyles.legend}>Hesab yazılıb</legend>
                  <div className={formStyles.pairGrid}>
                    <label className={formStyles.label}>
                      <span className={formStyles.mutedText}>Tarixindən</span>
                      <input
                        type="date"
                        className={formStyles.input}
                        value={filter.invoicedFrom}
                        onChange={(e) =>
                          onFilterChange("invoicedFrom", e.target.value)
                        }
                      />
                    </label>
                    <label className={formStyles.label}>
                      <span className={formStyles.mutedText}>
                        Tarixinə qədər
                      </span>
                      <input
                        type="date"
                        className={formStyles.input}
                        value={filter.invoicedTo}
                        onChange={(e) =>
                          onFilterChange("invoicedTo", e.target.value)
                        }
                      />
                    </label>
                  </div>
                </div>
              </fieldset>
            </div>
          </div>
        )}

        {activeSections.has("customers") && (
          <div className={formStyles.section}>
            <label className={`${formStyles.label} ${formStyles.maxWidthMd}`}>
              <span className={formStyles.labelText}>Müştəri</span>
              <input
                className={formStyles.input}
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
          <div className={formStyles.section}>
            <p className={formStyles.helperText}>
              Bu filtr qrupu üçün əlavə sahələr API bağlandıqda doldurulacaq.
            </p>
          </div>
        )}
      </div>
    </FilterPanelShell>
  );
}
