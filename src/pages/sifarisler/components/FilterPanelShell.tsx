import type { ReactNode } from "react";
import { FiBookmark, FiFilter, FiX } from "react-icons/fi";
import styles from "./FilterPanelShell.module.css";

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
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.headerInfo}>
            <div className={styles.iconWrap}>
              <FiFilter className={styles.icon} />
            </div>
            <div>
              <h2 className={styles.title}>{title}</h2>
              <p className={styles.description}>{description}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Filtrləri bağla"
          >
            <FiX className={styles.icon} />
          </button>
        </div>

        <div className={styles.sections}>
          {sections.map(({ id, label }) => {
            const isActive = activeSections.has(id);

            return (
              <button
                key={id}
                type="button"
                onClick={() => onToggleSection(id)}
                className={`${styles.sectionButton} ${
                  isActive ? styles.sectionButtonActive : ""
                }`}
              >
                <span
                  className={`${styles.sectionDot} ${
                    isActive ? styles.sectionDotActive : ""
                  }`}
                />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.content}>{children}</div>

      <div className={styles.footer}>
        <div className={styles.footerRow}>
          <button
            type="button"
            onClick={onSaveTemplate}
            className={`${styles.buttonBase} ${styles.buttonSecondary}`}
          >
            <FiBookmark />
            Filtrləri şablon kimi yaddaşda saxla
          </button>

          <div className={styles.footerActions}>
            <button
              type="button"
              onClick={onClear}
              className={`${styles.buttonBase} ${styles.buttonSecondary}`}
            >
              <FiX />
              Təmizlə
            </button>
            <button
              type="button"
              onClick={onApplyFilter}
              className={`${styles.buttonBase} ${styles.buttonPrimary}`}
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
