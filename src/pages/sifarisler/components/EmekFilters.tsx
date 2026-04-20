import Select from "../../../common/components/select/Select";
import type { SelectOption } from "../../../common/components/select/Select";
import FilterPanelShell from "./FilterPanelShell";
import formStyles from "./FilterForms.module.css";
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
      <div className={formStyles.stack}>
        {activeSections.has("id") && (
          <div className={formStyles.section}>
            <p className={formStyles.sectionTitle}>ID:</p>
            <div className={formStyles.grid5}>
              <label className={formStyles.label}>
                <span className={formStyles.labelText}>Şirkət</span>
                <Select
                  value={filter.company}
                  options={companyOptions}
                  onChange={(value) => onFilterChange("company", value)}
                  placeholder="Hamısı"
                />
              </label>
              <label className={formStyles.label}>
                <span className={formStyles.labelText}>Sifarişin nömrəsi</span>
                <input
                  className={formStyles.input}
                  value={filter.orderNumber}
                  onChange={(event) =>
                    onFilterChange("orderNumber", event.target.value)
                  }
                />
              </label>
              <label className={formStyles.label}>
                <span className={formStyles.labelText}>Tip</span>
                <Select
                  value={filter.tip}
                  options={EMEK_TIP_OPTIONS}
                  onChange={(value) => onFilterChange("tip", value)}
                  placeholder="Hamısı"
                />
              </label>
              <label className={formStyles.label}>
                <span className={formStyles.labelText}>Status</span>
                <Select
                  value={filter.status}
                  options={EMEK_STATUS_OPTIONS}
                  onChange={(value) => onFilterChange("status", value)}
                  placeholder="Hamısı"
                />
              </label>
              <label className={formStyles.label}>
                <span className={formStyles.labelText}>Reysin nömrəsi</span>
                <input
                  className={formStyles.input}
                  value={filter.tripNumber}
                  onChange={(event) =>
                    onFilterChange("tripNumber", event.target.value)
                  }
                />
              </label>
            </div>
          </div>
        )}

        {activeSections.has("dates") && (
          <div className={formStyles.section}>
            <p className={formStyles.sectionTitle}>Tarixlər:</p>
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
                        onChange={(event) =>
                          onFilterChange("orderDateFrom", event.target.value)
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
                        onChange={(event) =>
                          onFilterChange("orderDateTo", event.target.value)
                        }
                      />
                    </label>
                  </div>
                </div>
              </fieldset>

              <fieldset className={formStyles.dateFieldset}>
                <div className={formStyles.fieldsetInner}>
                  <legend className={formStyles.legend}>
                    Aktın yaradılması tarixi
                  </legend>
                  <div className={formStyles.pairGrid}>
                    <label className={formStyles.label}>
                      <span className={formStyles.mutedText}>Tarixindən</span>
                      <input
                        type="date"
                        className={formStyles.input}
                        value={filter.actCreatedFrom}
                        onChange={(event) =>
                          onFilterChange("actCreatedFrom", event.target.value)
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
                        onChange={(event) =>
                          onFilterChange("actCreatedTo", event.target.value)
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
                        onChange={(event) =>
                          onFilterChange("actDateFrom", event.target.value)
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
                        onChange={(event) =>
                          onFilterChange("actDateTo", event.target.value)
                        }
                      />
                    </label>
                  </div>
                </div>
              </fieldset>

              <fieldset className={formStyles.dateFieldset}>
                <div className={formStyles.fieldsetInner}>
                  <legend className={formStyles.legend}>Yükləmə tarixi</legend>
                  <div className={formStyles.pairGrid}>
                    <label className={formStyles.label}>
                      <span className={formStyles.mutedText}>Tarixindən</span>
                      <input
                        type="date"
                        className={formStyles.input}
                        value={filter.loadDateFrom}
                        onChange={(event) =>
                          onFilterChange("loadDateFrom", event.target.value)
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
                        value={filter.loadDateTo}
                        onChange={(event) =>
                          onFilterChange("loadDateTo", event.target.value)
                        }
                      />
                    </label>
                  </div>
                </div>
              </fieldset>

              <fieldset className={formStyles.dateFieldset}>
                <div className={formStyles.fieldsetInner}>
                  <legend className={formStyles.legend}>Boşaltma tarixi</legend>
                  <div className={formStyles.pairGrid}>
                    <label className={formStyles.label}>
                      <span className={formStyles.mutedText}>Tarixindən</span>
                      <input
                        type="date"
                        className={formStyles.input}
                        value={filter.unloadDateFrom}
                        onChange={(event) =>
                          onFilterChange("unloadDateFrom", event.target.value)
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
                        value={filter.unloadDateTo}
                        onChange={(event) =>
                          onFilterChange("unloadDateTo", event.target.value)
                        }
                      />
                    </label>
                  </div>
                </div>
              </fieldset>

              <fieldset className={formStyles.dateFieldset}>
                <div className={formStyles.fieldsetInner}>
                  <legend className={formStyles.legend}>
                    Hesabın ödəniş tarixi
                  </legend>
                  <div className={formStyles.pairGrid}>
                    <label className={formStyles.label}>
                      <span className={formStyles.mutedText}>Tarixindən</span>
                      <input
                        type="date"
                        className={formStyles.input}
                        value={filter.invoicePaymentFrom}
                        onChange={(event) =>
                          onFilterChange(
                            "invoicePaymentFrom",
                            event.target.value,
                          )
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
                        value={filter.invoicePaymentTo}
                        onChange={(event) =>
                          onFilterChange("invoicePaymentTo", event.target.value)
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
            <p className={formStyles.sectionTitle}>Müştərilər:</p>
            <div className={`${formStyles.grid2} ${formStyles.maxWidthLg}`}>
              <label className={formStyles.label}>
                <span className={formStyles.labelText}>Müştəri</span>
                <Select
                  value={filter.customer}
                  options={customerOptions}
                  onChange={(value) => onFilterChange("customer", value)}
                  placeholder="Hamısı"
                />
              </label>
              <label className={formStyles.label}>
                <span className={formStyles.labelText}>Daşıyıcı</span>
                <Select
                  value={filter.carrier}
                  options={carrierOptions}
                  onChange={(value) => onFilterChange("carrier", value)}
                  placeholder="Hamısı"
                />
              </label>
              <label className={`${formStyles.label} ${formStyles.maxWidthMd}`}>
                <span className={formStyles.labelText}>Müştəri tipi</span>
                <Select
                  value={filter.customerType}
                  options={EMEK_CUSTOMER_TYPE_OPTIONS}
                  onChange={(value) => onFilterChange("customerType", value)}
                  placeholder="Hamısı"
                />
              </label>
            </div>
          </div>
        )}

        {(activeSections.has("users") ||
          activeSections.has("other") ||
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
