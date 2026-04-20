import type { ReactNode } from "react";
import {
  FiBookmark,
  FiCalendar,
  FiFilter,
  FiHash,
  FiMapPin,
  FiSearch,
  FiUsers,
  FiX,
} from "react-icons/fi";
import Select from "../../../common/components/select/Select";
import type { SelectOption } from "../../../common/components/select/Select";
import { FILTER_SECTIONS } from "../constants/sorgular.constants";
import type { FilterFormState, FilterSectionId } from "../types/sorgu.types";
import styles from "./SorgularFilters.module.css";

interface Props {
  activeSections: Set<FilterSectionId>;
  toggleSection: (id: FilterSectionId) => void;
  filter: FilterFormState;
  onFilterChange: (field: keyof FilterFormState, value: string) => void;
  companyOptions: SelectOption[];
  onClose: () => void;
  onClear: () => void;
  onApplyFilter: () => void;
  onSaveTemplate: () => void;
}

interface SectionCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: ReactNode;
}

interface DateFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function SectionCard({ title, description, icon, children }: SectionCardProps) {
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
}: TextFieldProps) {
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

function DateField({ label, value, onChange }: DateFieldProps) {
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

export default function SorgularFilters({
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
  const hasAdvancedSections =
    activeSections.has("transport") ||
    activeSections.has("loads") ||
    activeSections.has("users") ||
    activeSections.has("other") ||
    activeSections.has("sort") ||
    activeSections.has("templates");

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
                Sorğuları daha sürətli tapmaq üçün tarix, şirkət və istiqamətə
                görə görünüşü fərdiləşdirin.
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

        <div className={styles.chipRow}>
          {FILTER_SECTIONS.map(({ id, label }) => {
            const isActive = activeSections.has(id);

            return (
              <button
                key={id}
                type="button"
                onClick={() => toggleSection(id)}
                className={`${styles.chip} ${isActive ? styles.chipActive : ""}`}
              >
                <span
                  className={`${styles.chipDot} ${isActive ? styles.chipDotActive : ""}`}
                />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.body}>
        {activeSections.has("id") && (
          <SectionCard
            title="Əsas məlumatlar"
            description="Sorğunun nömrəsi, müştəri sifarişi və şirkət üzrə hədəfli axtarış edin."
            icon={<FiHash className={styles.iconLg} />}
          >
            <div className={styles.gridTwo}>
              <TextField
                label="Sorğunun nömrəsi"
                value={filter.queryNumber}
                onChange={(value) => onFilterChange("queryNumber", value)}
                placeholder="Məsələn, ZFR260236"
                icon={<FiSearch />}
              />
              <TextField
                label="Müştəri sifariş nömrəsi"
                value={filter.customerOrderRef}
                onChange={(value) => onFilterChange("customerOrderRef", value)}
                placeholder="Sifariş kodu daxil edin"
                icon={<FiSearch />}
              />
              <label className={styles.fieldFull}>
                <span className={styles.label}>Şirkət</span>
                <Select
                  value={filter.company}
                  options={companyOptions}
                  onChange={(value) => onFilterChange("company", value)}
                  placeholder="Şirkət seçin"
                  className={styles.selectControl}
                />
              </label>
            </div>
          </SectionCard>
        )}

        {activeSections.has("dates") && (
          <SectionCard
            title="Tarix aralıqları"
            description="Sorğunun tarix intervalını seçərək cədvəli daraldın."
            icon={<FiCalendar className={styles.iconLg} />}
          >
            <div className={styles.gridOne}>
              <div className={styles.datePanel}>
                <div className={styles.datePanelHeader}>
                  <FiCalendar className={styles.accentIcon} />
                  Sorğunun tarixi
                </div>
                <div className={styles.dateGrid}>
                  <DateField
                    label="Tarixindən"
                    value={filter.queryDateFrom}
                    onChange={(value) => onFilterChange("queryDateFrom", value)}
                  />
                  <DateField
                    label="Tarixinə qədər"
                    value={filter.queryDateTo}
                    onChange={(value) => onFilterChange("queryDateTo", value)}
                  />
                </div>
              </div>
            </div>
          </SectionCard>
        )}

        {activeSections.has("customers") && (
          <SectionCard
            title="Müştəri axtarışı"
            description="Müştəri adını daxil edərək uyğun sorğuları daha tez tapın."
            icon={<FiUsers className={styles.iconLg} />}
          >
            <TextField
              label="Müştəri adı"
              value={filter.customerName}
              onChange={(value) => onFilterChange("customerName", value)}
              placeholder="Müştəri adını yazın"
              icon={<FiUsers />}
            />
          </SectionCard>
        )}

        {activeSections.has("directions") && (
          <SectionCard
            title="İstiqamətlər"
            description="Yükləmə və boşaltma məntəqələrinə görə marşrutları ayırın."
            icon={<FiMapPin className={styles.iconLg} />}
          >
            <div className={styles.gridTwo}>
              <TextField
                label="Yükləmə yeri"
                value={filter.loadPlace}
                onChange={(value) => onFilterChange("loadPlace", value)}
                placeholder="Şəhər və ya terminal"
                icon={<FiMapPin />}
              />
              <TextField
                label="Boşaltma yeri"
                value={filter.unloadPlace}
                onChange={(value) => onFilterChange("unloadPlace", value)}
                placeholder="Şəhər və ya anbar"
                icon={<FiMapPin />}
              />
            </div>
          </SectionCard>
        )}

        {hasAdvancedSections && (
          <section className={styles.advancedCard}>
            <div className={styles.advancedHeader}>
              <div className={styles.advancedIcon}>
                <FiFilter />
              </div>
              <div>
                <h3 className={styles.advancedTitle}>
                  Genişlənmiş filtr qrupları
                </h3>
                <p className={styles.advancedDescription}>
                  Nəqliyyat, yüklər, istifadəçilər və digər qruplar üçün sahələr
                  API inteqrasiyası tamamlandıqda eyni bu görünüşdə əlavə
                  ediləcək.
                </p>
              </div>
            </div>
          </section>
        )}

        <button
          type="button"
          onClick={onSaveTemplate}
          className={styles.saveTemplateButton}
        >
          <FiBookmark />
          Filtrləri şablon kimi yaddaşda saxla
        </button>
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
