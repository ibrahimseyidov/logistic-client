import type { ReactNode } from "react";
import { FiBookmark } from "react-icons/fi";
import {
  FilterChip,
  FilterChipRow,
  FilterDrawer,
} from "../../../common/components/filters";

interface SectionItem<T extends string> {
  id: T;
  label: string;
}

interface Props<T extends string> {
  open: boolean;
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
  open,
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
    <FilterDrawer
      open={open}
      onClose={onClose}
      onClear={onClear}
      onApply={onApplyFilter}
      title={title}
      description={description}
      applyLabel="Filtrdən keçir"
      headerExtra={
        <FilterChipRow>
          {sections.map(({ id, label }) => (
            <FilterChip
              key={id}
              label={label}
              active={activeSections.has(id)}
              onClick={() => onToggleSection(id)}
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
      {children}
    </FilterDrawer>
  );
}
