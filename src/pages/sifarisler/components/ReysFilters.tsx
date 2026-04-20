import Select from "../../../common/components/select/Select";
import type { SelectOption } from "../../../common/components/select/Select";
import FilterPanelShell from "./FilterPanelShell";
import formStyles from "./FilterForms.module.css";
import { REYS_FILTER_SECTIONS } from "../constants/reys.constants";
import type {
  ReysFilterFormState,
  ReysFilterSectionId,
} from "../types/reys.types";

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
      <div className={formStyles.stack}>
        {activeSections.has("id") && (
          <div className={formStyles.section}>
            <p className={formStyles.sectionTitle}>ID:</p>
            <div className={`${formStyles.grid2} ${formStyles.maxWidthLg}`}>
              <label className={formStyles.label}>
                <span className={formStyles.labelText}>Reysin nömrəsi</span>
                <input
                  className={formStyles.input}
                  value={filter.tripNumber}
                  onChange={(e) => onFilterChange("tripNumber", e.target.value)}
                  placeholder="Məs: ZF260 65-1"
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
            </div>
          </div>
        )}

        {activeSections.has("dates") && (
          <div className={formStyles.section}>
            <p className={formStyles.sectionTitle}>Tarixlər:</p>
            <div
              className={`${formStyles.grid1} ${formStyles.dateGrid} ${formStyles.dateGridLg2}`}
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
                  <legend className={formStyles.legend}>Reysin tarixi</legend>
                  <div className={formStyles.pairGrid}>
                    <label className={formStyles.label}>
                      <span className={formStyles.mutedText}>Tarixindən</span>
                      <input
                        type="date"
                        className={formStyles.input}
                        value={filter.tripDateFrom}
                        onChange={(e) =>
                          onFilterChange("tripDateFrom", e.target.value)
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
                        value={filter.tripDateTo}
                        onChange={(e) =>
                          onFilterChange("tripDateTo", e.target.value)
                        }
                      />
                    </label>
                  </div>
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
