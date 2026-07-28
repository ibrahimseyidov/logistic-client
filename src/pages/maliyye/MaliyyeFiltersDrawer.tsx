import type { ReactNode } from "react";
import {
  FiCalendar,
  FiDollarSign,
  FiFilter,
  FiHash,
  FiSearch,
  FiTag,
  FiX,
} from "react-icons/fi";
import Select from "../../common/components/select/Select";
import type { SelectOption } from "../../common/components/select/Select";
import styles from "../sorgular/components/SorgularFilters.module.css";
import type { MaliyyeFilterState } from "./lib/filterMaliyye";

interface Props {
  filter: MaliyyeFilterState;
  categoryOptions: SelectOption[];
  partnerOptions: SelectOption[];
  createdByOptions: SelectOption[];
  onFilterChange: (field: keyof MaliyyeFilterState, value: string) => void;
  onClose: () => void;
  onClear: () => void;
  onApplyFilter: () => void;
}

function SectionCard({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionIcon}>{icon}</div>
        <div>
          <h3 className={styles.sectionTitle}>{title}</h3>
          <p className={styles.sectionDescription}>{description}</p>
        </div>
      </div>
      <div className={styles.sectionContent}>{children}</div>
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: ReactNode;
}) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <div className={styles.fieldWrap}>
        {icon ? <span className={styles.leadingIcon}>{icon}</span> : null}
        <input
          className={icon ? styles.inputWithIcon : styles.input}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
      </div>
    </label>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <div className={styles.fieldWrap}>
        <input
          type="date"
          className={styles.dateInput}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <FiCalendar className={styles.trailingIcon} />
      </div>
    </label>
  );
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
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <div className={styles.headerIntro}>
            <div className={styles.iconBadge}>
              <FiFilter className={styles.iconLg} />
            </div>
            <div>
              <h2 className={styles.headerTitle}>Filtrlər</h2>
              <p className={styles.headerDescription}>
                Əməliyyatları tarix, tip, məbləğ, tərəfdaş və digər sahələrə görə
                daraldın.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Filtrləri bağla"
          >
            <FiX className={styles.iconLg} />
          </button>
        </div>
      </div>

      <div className={styles.body}>
        <SectionCard
          title="Tarix aralığı"
          description="Əməliyyat tarixinə görə başlanğıc və bitiş seçin."
          icon={<FiCalendar className={styles.iconLg} />}
        >
          <div className={styles.gridTwo}>
            <DateField
              label="Başlanğıc tarixi"
              value={filter.dateFrom}
              onChange={(value) => onFilterChange("dateFrom", value)}
            />
            <DateField
              label="Bitiş tarixi"
              value={filter.dateTo}
              onChange={(value) => onFilterChange("dateTo", value)}
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Əsas məlumatlar"
          description="Axtarış, tip və ödəniş metoduna görə filtr edin."
          icon={<FiHash className={styles.iconLg} />}
        >
          <div className={styles.gridTwo}>
            <TextField
              label="Axtarış"
              value={filter.search}
              onChange={(value) => onFilterChange("search", value)}
              placeholder="Ad, ID, tərəfdaş..."
              icon={<FiSearch />}
            />
            <label className={styles.field}>
              <span className={styles.label}>Tip</span>
              <Select
                value={filter.type}
                options={TYPE_OPTIONS}
                onChange={(value) => onFilterChange("type", value)}
                placeholder="Hamısı"
                className={styles.selectControl}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Ödəniş metodu</span>
              <Select
                value={filter.paymentMethod}
                options={METHOD_OPTIONS}
                onChange={(value) => onFilterChange("paymentMethod", value)}
                placeholder="Hamısı"
                className={styles.selectControl}
              />
            </label>
            <TextField
              label="Sifariş №"
              value={filter.orderId}
              onChange={(value) => onFilterChange("orderId", value)}
              placeholder="Məsələn, 71"
              icon={<FiHash />}
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Kateqoriya və tərəfdaş"
          description="Kateqoriya, tərəfdaş və yaradana görə daraldın."
          icon={<FiTag className={styles.iconLg} />}
        >
          <div className={styles.gridTwo}>
            <label className={styles.field}>
              <span className={styles.label}>Kateqoriya</span>
              <Select
                value={filter.category}
                options={categoryOptions}
                onChange={(value) => onFilterChange("category", value)}
                placeholder="Hamısı"
                className={styles.selectControl}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Tərəfdaş</span>
              <Select
                value={filter.partner}
                options={partnerOptions}
                onChange={(value) => onFilterChange("partner", value)}
                placeholder="Hamısı"
                className={styles.selectControl}
              />
            </label>
            <label className={styles.fieldFull}>
              <span className={styles.label}>Yaradan</span>
              <Select
                value={filter.createdBy}
                options={createdByOptions}
                onChange={(value) => onFilterChange("createdBy", value)}
                placeholder="Hamısı"
                className={styles.selectControl}
              />
            </label>
          </div>
        </SectionCard>

        <SectionCard
          title="Məbləğ aralığı"
          description="AZN məbləğinə görə minimum və maksimum hədd təyin edin."
          icon={<FiDollarSign className={styles.iconLg} />}
        >
          <div className={styles.gridTwo}>
            <TextField
              label="Min. məbləğ (AZN)"
              value={filter.amountMin}
              onChange={(value) => onFilterChange("amountMin", value)}
              placeholder="0"
              icon={<FiDollarSign />}
            />
            <TextField
              label="Maks. məbləğ (AZN)"
              value={filter.amountMax}
              onChange={(value) => onFilterChange("amountMax", value)}
              placeholder="10000"
              icon={<FiDollarSign />}
            />
          </div>
        </SectionCard>
      </div>

      <div className={styles.footer}>
        <div className={styles.footerActions}>
          <button
            type="button"
            onClick={onClear}
            className={styles.ghostButton}
          >
            <FiX />
            Təmizlə
          </button>
          <button
            type="button"
            onClick={onApplyFilter}
            className={styles.primaryButton}
          >
            <FiFilter />
            Filterdən keçir
          </button>
        </div>
      </div>
    </div>
  );
}
