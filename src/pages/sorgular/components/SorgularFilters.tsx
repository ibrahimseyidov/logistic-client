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

const inputClass =
  "h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100";

const selectTriggerClass =
  "h-12 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 focus-within:border-emerald-300 focus-within:ring-2 focus-within:ring-emerald-100";

const sectionCardClass =
  "rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm";

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
    <section className={sectionCardClass}>
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-semibold tracking-[0.01em] text-slate-900">
            {title}
          </h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
        </div>
      </div>
      {children}
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
    <label className="flex flex-col gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </span>
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        ) : null}
        <input
          className={`${inputClass} ${icon ? "pl-11" : ""}`}
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
    <label className="flex flex-col gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </span>
      <div className="relative">
        <input
          type="date"
          className={`${inputClass} pr-11 [color-scheme:light]`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <FiCalendar className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
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
    <div className="flex h-full flex-col bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <FiFilter className="text-lg" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-[0.01em] text-slate-900">
                Filtrlər
              </h2>
              <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
                Sorğuları daha sürətli tapmaq üçün tarix, şirkət və istiqamətə
                görə görünüşü fərdiləşdirin.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
            aria-label="Filtrləri bağla"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2.5">
          {FILTER_SECTIONS.map(({ id, label }) => {
            const isActive = activeSections.has(id);

            return (
              <button
                key={id}
                type="button"
                onClick={() => toggleSection(id)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-slate-800 bg-slate-800 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isActive ? "bg-white" : "bg-slate-300"
                  }`}
                />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {activeSections.has("id") && (
          <SectionCard
            title="Əsas məlumatlar"
            description="Sorğunun nömrəsi, müştəri sifarişi və şirkət üzrə hədəfli axtarış edin."
            icon={<FiHash className="text-lg" />}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              <label className="flex flex-col gap-2 sm:col-span-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Şirkət
                </span>
                <Select
                  value={filter.company}
                  options={companyOptions}
                  onChange={(value) => onFilterChange("company", value)}
                  placeholder="Şirkət seçin"
                  className={selectTriggerClass}
                />
              </label>
            </div>
          </SectionCard>
        )}

        {activeSections.has("dates") && (
          <SectionCard
            title="Tarix aralıqları"
            description="Sorğunun tarix intervalını seçərək cədvəli daraldın."
            icon={<FiCalendar className="text-lg" />}
          >
            <div className="grid grid-cols-1 gap-4">
              <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <FiCalendar className="text-emerald-600" />
                  Sorğunun tarixi
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
            icon={<FiUsers className="text-lg" />}
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
            icon={<FiMapPin className="text-lg" />}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          <section className="rounded-[24px] border border-dashed border-slate-300 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <FiFilter />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Genişlənmiş filtr qrupları
                </h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">
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
          className="inline-flex w-full items-center justify-center gap-2 rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          <FiBookmark />
          Filtrləri şablon kimi yaddaşda saxla
        </button>
      </div>

      <div className="border-t border-slate-200 bg-white px-5 py-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center justify-center gap-2 rounded-[18px] border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <FiX />
            Təmizlə
          </button>
          <button
            type="button"
            onClick={onApplyFilter}
            className="inline-flex items-center justify-center gap-2 rounded-[18px] border border-slate-300 bg-slate-800 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
          >
            <FiFilter />
            Filterdən keçir
          </button>
        </div>
      </div>
    </div>
  );
}
