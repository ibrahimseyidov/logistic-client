import { FiSearch } from "react-icons/fi";
import type { SelectOption } from "../../../common/components/select/Select";
import {
  FilterDateField,
  FilterDrawer,
  FilterGrid,
  FilterSection,
  FilterSelectField,
  FilterTextField,
} from "../../../common/components/filters";

export interface TaskFilterState {
  author: string;
  executor: string;
  counterparty: string;
  deadline: string;
  status: string;
  tag: string;
  taskName: string;
}

interface Props {
  open: boolean;
  filter: TaskFilterState;
  authorOptions: SelectOption[];
  executorOptions: SelectOption[];
  counterpartyOptions: SelectOption[];
  statusOptions: SelectOption[];
  tagOptions: SelectOption[];
  onFilterChange: (field: keyof TaskFilterState, value: string) => void;
  onClose: () => void;
  onClear: () => void;
  onApplyFilter: () => void;
}

export default function TaskFiltersDrawer({
  open,
  filter,
  authorOptions,
  executorOptions,
  counterpartyOptions,
  statusOptions,
  tagOptions,
  onFilterChange,
  onClose,
  onClear,
  onApplyFilter,
}: Props) {
  return (
    <FilterDrawer
      open={open}
      onClose={onClose}
      onClear={onClear}
      onApply={onApplyFilter}
      title="Filtrlər"
      description="Müəllif, icraçı, status, tarix və digər sahələrə görə tapşırıqları daraldın."
    >
      <FilterSection title="İştirakçılar">
        <FilterGrid>
          <FilterSelectField
            label="Müəllif"
            value={filter.author}
            options={authorOptions}
            onChange={(value) => onFilterChange("author", value)}
            placeholder="Hamısı"
          />
          <FilterSelectField
            label="İcraçı"
            value={filter.executor}
            options={executorOptions}
            onChange={(value) => onFilterChange("executor", value)}
            placeholder="Hamısı"
          />
        </FilterGrid>
      </FilterSection>

      <FilterSection title="Tapşırıq məlumatları">
        <FilterGrid>
          <FilterTextField
            label="Tapşırığın adı"
            value={filter.taskName}
            onChange={(value) => onFilterChange("taskName", value)}
            placeholder="Axtar..."
            icon={<FiSearch />}
            fullWidth
          />
          <FilterSelectField
            label="Kontragent"
            value={filter.counterparty}
            options={counterpartyOptions}
            onChange={(value) => onFilterChange("counterparty", value)}
            placeholder="Hamısı"
          />
          <FilterSelectField
            label="Status"
            value={filter.status}
            options={statusOptions}
            onChange={(value) => onFilterChange("status", value)}
            placeholder="Hamısı"
          />
          <FilterSelectField
            label="Nişan"
            value={filter.tag}
            options={tagOptions}
            onChange={(value) => onFilterChange("tag", value)}
            placeholder="Hamısı"
            fullWidth
          />
        </FilterGrid>
      </FilterSection>

      <FilterSection title="Tarix">
        <FilterGrid cols={1}>
          <FilterDateField
            label="Son müddət"
            value={filter.deadline}
            onChange={(value) => onFilterChange("deadline", value)}
          />
        </FilterGrid>
      </FilterSection>
    </FilterDrawer>
  );
}
