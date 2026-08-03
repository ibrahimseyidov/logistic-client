import { FiDollarSign, FiHash, FiSearch } from "react-icons/fi";
import type { SelectOption } from "../../common/components/select/Select";
import {
  FilterDateField,
  FilterDrawer,
  FilterGrid,
  FilterSection,
  FilterSelectField,
  FilterTextField,
} from "../../common/components/filters";
import type { MaliyyeFilterState } from "./lib/filterMaliyye";

interface Props {
  open: boolean;
  filter: MaliyyeFilterState;
  categoryOptions: SelectOption[];
  partnerOptions: SelectOption[];
  createdByOptions: SelectOption[];
  onFilterChange: (field: keyof MaliyyeFilterState, value: string) => void;
  onClose: () => void;
  onClear: () => void;
  onApplyFilter: () => void;
}

const TYPE_OPTIONS: SelectOption[] = [
  { value: "", label: "Hamısı" },
  { value: "INCOME", label: "Gəlir" },
  { value: "EXPENSE", label: "Xərc" },
];

const METHOD_OPTIONS: SelectOption[] = [
  { value: "", label: "Hamısı" },
  { value: "Kasa", label: "Kasa" },
  { value: "Bank", label: "Bank" },
];

export default function MaliyyeFiltersDrawer({
  open,
  filter,
  categoryOptions,
  partnerOptions,
  createdByOptions,
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
      description="Tarix, tip, məbləğ, tərəfdaş və digər sahələrə görə əməliyyatları daraldın. Axtarış bütün sütunları əhatə edir."
    >
      <FilterSection title="Tarix aralığı">
        <FilterGrid>
          <FilterDateField
            label="Başlanğıc tarixi"
            value={filter.dateFrom}
            onChange={(value) => onFilterChange("dateFrom", value)}
          />
          <FilterDateField
            label="Bitiş tarixi"
            value={filter.dateTo}
            onChange={(value) => onFilterChange("dateTo", value)}
          />
        </FilterGrid>
      </FilterSection>

      <FilterSection title="Əsas məlumatlar">
        <FilterGrid>
          <FilterTextField
            label="Axtarış"
            value={filter.search}
            onChange={(value) => onFilterChange("search", value)}
            placeholder="Ad, ID, tərəfdaş, məbləğ..."
            icon={<FiSearch />}
            fullWidth
          />
          <FilterSelectField
            label="Tip"
            value={filter.type}
            options={TYPE_OPTIONS}
            onChange={(value) => onFilterChange("type", value)}
          />
          <FilterSelectField
            label="Ödəniş metodu"
            value={filter.paymentMethod}
            options={METHOD_OPTIONS}
            onChange={(value) => onFilterChange("paymentMethod", value)}
          />
          <FilterTextField
            label="Sifariş №"
            value={filter.orderId}
            onChange={(value) => onFilterChange("orderId", value)}
            placeholder="# məsələn 71"
            icon={<FiHash />}
          />
        </FilterGrid>
      </FilterSection>

      <FilterSection title="Kateqoriya və tərəfdaş">
        <FilterGrid>
          <FilterSelectField
            label="Kateqoriya"
            value={filter.category}
            options={categoryOptions}
            onChange={(value) => onFilterChange("category", value)}
          />
          <FilterSelectField
            label="Tərəfdaş"
            value={filter.partner}
            options={partnerOptions}
            onChange={(value) => onFilterChange("partner", value)}
          />
          <FilterSelectField
            label="Yaradan"
            value={filter.createdBy}
            options={createdByOptions}
            onChange={(value) => onFilterChange("createdBy", value)}
            fullWidth
          />
        </FilterGrid>
      </FilterSection>

      <FilterSection title="Məbləğ aralığı (AZN)">
        <FilterGrid>
          <FilterTextField
            label="Min. məbləğ"
            value={filter.amountMin}
            onChange={(value) => onFilterChange("amountMin", value)}
            placeholder="0"
            icon={<FiDollarSign />}
          />
          <FilterTextField
            label="Maks. məbləğ"
            value={filter.amountMax}
            onChange={(value) => onFilterChange("amountMax", value)}
            placeholder="10000"
            icon={<FiDollarSign />}
          />
        </FilterGrid>
      </FilterSection>
    </FilterDrawer>
  );
}
