import type { ReactNode } from "react";
import { FiBookmark, FiFilter, FiX } from "react-icons/fi";

interface SectionItem<T extends string> {
  id: T;
  label: string;
}

interface Props<T extends string> {
  title: string;
  description: string;
  sections: readonly SectionItem<T>[];
  activeSections: Set<T>;
  onToggleSection: (id: T) => void;
  onClose: () => void;
  onClear: () => void;
  onApplyFilter: () => void;
  onSaveTemplate: () => void;
  children: ReactNode;
}

export default function FilterPanelShell<T extends string>({
  title,
  description,
  sections,
  activeSections,
  onToggleSection,
  onClose,
  onClear,
  onApplyFilter,
  onSaveTemplate,
  children,
}: Props<T>) {
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
                {title}
              </h2>
              <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
                {description}
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
          {sections.map(({ id, label }) => {
            const isActive = activeSections.has(id);

            return (
              <button
                key={id}
                type="button"
                onClick={() => onToggleSection(id)}
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

      <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>

      <div className="border-t border-slate-200 bg-white px-5 py-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onSaveTemplate}
            className="inline-flex items-center justify-center gap-2 rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <FiBookmark />
            Filtrləri şablon kimi yaddaşda saxla
          </button>

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
    </div>
  );
}
