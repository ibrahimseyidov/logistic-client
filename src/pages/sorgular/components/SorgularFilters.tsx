import { FiBookmark, FiMapPin, FiSearch, FiUsers } from "react-icons/fi";
import type { SelectOption } from "../../../common/components/select/Select";
import {
  FilterChip,
  FilterChipRow,
  FilterDateField,
  FilterDrawer,
  FilterGrid,
  FilterSection,
  FilterSelectField,
  FilterTextField,
} from "../../../common/components/filters";
import { FILTER_SECTIONS } from "../constants/sorgular.constants";
import type { FilterFormState, FilterSectionId } from "../types/sorgu.types";

interface Props {
  open: boolean;
  activeSections: Set<FilterSectionId>;
  toggleSection: (id: FilterSectionId) => void;
  filter: FilterFormState;
  onFilterChange: (field: keyof FilterFormState, value: string) => void;
  companyOptions: SelectOption[];
  countryOptions?: SelectOption[];
  onClose: () => void;
  onClear: () => void;
  onApplyFilter: () => void;
  onSaveTemplate: () => void;
}

export default function SorgularFilters({
  open,
  activeSections,
  toggleSection,
  filter,
  onFilterChange,
  companyOptions,
  countryOptions = [{ value: "", label: "Hamısı" }],
  onClose,
  onClear,
  onApplyFilter,
  onSaveTemplate,
}: Props) {
  return (
    <FilterDrawer
      open={open}
      onClose={onClose}
      onClear={onClear}
      onApply={onApplyFilter}
      title="Filtrlər"
      description="Nömrə, şirkət, tarix və istiqamətə görə sorğuları daraldın."
      headerExtra={
        <FilterChipRow>
          {FILTER_SECTIONS.map(({ id, label }) => (
            <FilterChip
              key={id}
              label={label}
              active={activeSections.has(id)}
              onClick={() => toggleSection(id)}
            />
          ))}
        </FilterChipRow>
      }
      footerStart={
        <button
          type="button"
          onClick={onSaveTemplate}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            height: "2.4rem",
            padding: "0 0.85rem",
            borderRadius: "0.5rem",
            border: "1px solid #e2e8f0",
            background: "#fff",
            color: "#475569",
            fontSize: "0.8rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <FiBookmark size={14} />
          Şablon saxla
        </button>
      }
    >
      {activeSections.has("id") ? (
        <FilterSection title="Əsas məlumatlar">
          <FilterGrid>
            <FilterTextField
              label="Sorğunun nömrəsi"
              value={filter.queryNumber}
              onChange={(value) => onFilterChange("queryNumber", value)}
              placeholder="Məsələn, ZFR260236"
              icon={<FiSearch />}
            />
            <FilterTextField
              label="Müştəri sifariş №"
              value={filter.customerOrderRef}
              onChange={(value) => onFilterChange("customerOrderRef", value)}
              placeholder="Sifariş kodu"
              icon={<FiSearch />}
            />
            <FilterSelectField
              label="Şirkət"
              value={filter.company}
              options={companyOptions}
              onChange={(value) => onFilterChange("company", value)}
              placeholder="Hamısı"
              fullWidth
            />
            <FilterSelectField
              label="Ölkə"
              value={filter.country || ""}
              options={countryOptions}
              onChange={(value) => onFilterChange("country", value)}
              placeholder="Hamısı"
              fullWidth
            />
          </FilterGrid>
        </FilterSection>
      ) : null}

      {activeSections.has("dates") ? (
        <>
          <FilterSection title="Sorğunun tarixi">
            <FilterGrid>
              <FilterDateField
                label="Tarixindən"
                value={filter.queryDateFrom}
                onChange={(value) => onFilterChange("queryDateFrom", value)}
              />
              <FilterDateField
                label="Tarixinə qədər"
                value={filter.queryDateTo}
                onChange={(value) => onFilterChange("queryDateTo", value)}
              />
            </FilterGrid>
          </FilterSection>
          <FilterSection title="Yükləmə tarixi">
            <FilterGrid>
              <FilterDateField
                label="Tarixindən"
                value={filter.loadDateFrom}
                onChange={(value) => onFilterChange("loadDateFrom", value)}
              />
              <FilterDateField
                label="Tarixinə qədər"
                value={filter.loadDateTo}
                onChange={(value) => onFilterChange("loadDateTo", value)}
              />
            </FilterGrid>
          </FilterSection>
          <FilterSection title="Boşaltma tarixi">
            <FilterGrid>
              <FilterDateField
                label="Tarixindən"
                value={filter.unloadDateFrom}
                onChange={(value) => onFilterChange("unloadDateFrom", value)}
              />
              <FilterDateField
                label="Tarixinə qədər"
                value={filter.unloadDateTo}
                onChange={(value) => onFilterChange("unloadDateTo", value)}
              />
            </FilterGrid>
          </FilterSection>
          <FilterSection title="Status tarixi">
            <FilterGrid>
              <FilterDateField
                label="Tarixindən"
                value={filter.statusDateFrom}
                onChange={(value) => onFilterChange("statusDateFrom", value)}
              />
              <FilterDateField
                label="Tarixinə qədər"
                value={filter.statusDateTo}
                onChange={(value) => onFilterChange("statusDateTo", value)}
              />
            </FilterGrid>
          </FilterSection>
        </>
      ) : null}

      {activeSections.has("customers") ? (
        <FilterSection title="Müştəri">
          <FilterGrid cols={1}>
            <FilterTextField
              label="Müştəri adı"
              value={filter.customerName}
              onChange={(value) => onFilterChange("customerName", value)}
              placeholder="Müştəri adını yazın"
              icon={<FiUsers />}
            />
          </FilterGrid>
        </FilterSection>
      ) : null}

      {activeSections.has("directions") ? (
        <FilterSection title="İstiqamətlər">
          <FilterGrid>
            <FilterTextField
              label="Yükləmə yeri"
              value={filter.loadPlace}
              onChange={(value) => onFilterChange("loadPlace", value)}
              placeholder="Şəhər və ya terminal"
              icon={<FiMapPin />}
            />
            <FilterTextField
              label="Boşaltma yeri"
              value={filter.unloadPlace}
              onChange={(value) => onFilterChange("unloadPlace", value)}
              placeholder="Şəhər və ya anbar"
              icon={<FiMapPin />}
            />
          </FilterGrid>
        </FilterSection>
      ) : null}
    </FilterDrawer>
  );
}
