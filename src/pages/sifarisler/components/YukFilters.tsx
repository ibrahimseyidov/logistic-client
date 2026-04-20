import Select from "../../../common/components/select/Select";
import type { SelectOption } from "../../../common/components/select/Select";
import FilterPanelShell from "./FilterPanelShell";
import formStyles from "./FilterForms.module.css";
import { YUK_FILTER_SECTIONS } from "../constants/yuk.constants";
import type {
  YukFilterFormState,
  YukFilterSectionId,
} from "../types/yuk.types";

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
      <div className={formStyles.stack}>
        {activeSections.has("id") && (
          <div
            className={`${formStyles.section} ${formStyles.grid2} ${formStyles.maxWidthLg}`}
          >
            <label className={formStyles.label}>
              <span className={formStyles.labelText}>İstifadəçi</span>
              <Select
                value={filter.userId}
                options={userOptions}
                onChange={(v) => onFilterChange("userId", v)}
                placeholder="Hamısı"
              />
            </label>
            <label className={formStyles.label}>
              <span className={formStyles.labelText}>Şirkət</span>
              <input
                className={formStyles.input}
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
