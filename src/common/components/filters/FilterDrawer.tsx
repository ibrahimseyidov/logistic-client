"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { FiCalendar, FiFilter, FiX } from "react-icons/fi";
import Select from "../select/Select";
import type { SelectOption } from "../select/Select";
import styles from "./FilterDrawer.module.css";

export function FilterSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      {children}
    </section>
  );
}

export function FilterGrid({
  cols = 2,
  children,
}: {
  cols?: 1 | 2;
  children: ReactNode;
}) {
  return (
    <div className={cols === 1 ? styles.grid1 : styles.grid2}>{children}</div>
  );
}

export function FilterTextField({
  label,
  value,
  onChange,
  placeholder,
  icon,
  fullWidth,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <label className={fullWidth ? styles.fieldFull : styles.field}>
      <span className={styles.label}>{label}</span>
      <div className={styles.controlWrap}>
        {icon ? <span className={styles.leadingIcon}>{icon}</span> : null}
        <input
          className={icon ? styles.inputWithIcon : styles.input}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
    </label>
  );
}

export function FilterDateField({
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
      <div className={styles.controlWrap}>
        <input
          type="date"
          className={styles.dateInput}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <FiCalendar className={styles.trailingIcon} />
      </div>
    </label>
  );
}

export function FilterChipRow({ children }: { children: ReactNode }) {
  return <div className={styles.chipRow}>{children}</div>;
}

export function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${styles.chip} ${active ? styles.chipActive : ""}`}
    >
      <span
        className={`${styles.chipDot} ${active ? styles.chipDotActive : ""}`}
      />
      {label}
    </button>
  );
}

export function FilterSelectField({
  label,
  value,
  options,
  onChange,
  placeholder = "Hamısı",
  fullWidth,
}: {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  fullWidth?: boolean;
}) {
  return (
    <label className={fullWidth ? styles.fieldFull : styles.field}>
      <span className={styles.label}>{label}</span>
      <Select
        value={value}
        options={options}
        onChange={onChange}
        placeholder={placeholder}
        className={styles.selectControl}
      />
    </label>
  );
}

type Props = {
  open: boolean;
  onClose: () => void;
  onClear: () => void;
  onApply: () => void;
  title?: string;
  description?: string;
  applyLabel?: string;
  clearLabel?: string;
  /** Header-in altında (məs. section chip-lər) */
  headerExtra?: ReactNode;
  /** Footer-də solda (məs. şablon saxla) */
  footerStart?: ReactNode;
  children: ReactNode;
};

/**
 * Global sağ filter paneli — overlay + header + body + footer.
 * Səhifələr yalnız field məzmununu ötürür.
 */
export default function FilterDrawer({
  open,
  onClose,
  onClear,
  onApply,
  title = "Filtrlər",
  description,
  applyLabel = "Filtrdən keçir",
  clearLabel = "Təmizlə",
  headerExtra,
  footerStart,
  children,
}: Props) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <div
        className={`${styles.overlay} ${open ? styles.overlayOpen : ""}`}
        aria-hidden={!open}
        onClick={onClose}
      />
      <aside
        className={`${styles.panel} ${open ? styles.panelOpen : ""}`}
        aria-hidden={!open}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className={styles.header}>
          <div className={styles.headerText}>
            <h2 className={styles.title}>{title}</h2>
            {description ? (
              <p className={styles.description}>{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Filtrləri bağla"
          >
            <FiX size={16} />
          </button>
        </div>
        {headerExtra ? (
          <div className={styles.headerExtra}>{headerExtra}</div>
        ) : null}

        <div className={styles.body}>{children}</div>

        <div className={styles.footer}>
          {footerStart ? (
            <div className={styles.footerStart}>{footerStart}</div>
          ) : null}
          <div className={styles.footerActions}>
            <button type="button" className={styles.ghostBtn} onClick={onClear}>
              <FiX size={14} />
              {clearLabel}
            </button>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={onApply}
            >
              <FiFilter size={14} />
              {applyLabel}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
