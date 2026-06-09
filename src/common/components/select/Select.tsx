"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { FaChevronDown } from "react-icons/fa";
import styles from "./Select.module.css";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  value: any;
  options: SelectOption[];
  onChange: (value: any) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  isMulti?: boolean;
}

export default function Select({
  value,
  options,
  onChange,
  placeholder = "",
  disabled = false,
  className,
  isMulti = false,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuBox, setMenuBox] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  }>({ top: 0, left: 0, width: 0, maxHeight: 260 });

  const updateMenuPosition = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const gap = 8;
    const estimatedMenuHeight = 260;
    const spaceBelow = viewportHeight - rect.bottom - gap;
    const safeSpaceBelow = Math.max(0, spaceBelow);
    const maxHeight = Math.max(90, Math.min(estimatedMenuHeight, safeSpaceBelow));
    const top = rect.bottom + 6;

    setMenuBox({
      top,
      left: rect.left,
      width: rect.width,
      maxHeight,
    });
  }, []);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  let displayLabel: React.ReactNode = placeholder || "";
  
  if (isMulti) {
    const valArr = Array.isArray(value) ? value : (value ? [value] : []);
    if (valArr.length > 0) {
      const selectedLabels = valArr.map(v => options.find(o => o.value === v)?.label || v);
      displayLabel = (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {selectedLabels.map((lbl, idx) => (
            <span key={idx} style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem', color: '#1e293b' }}>
              {lbl}
            </span>
          ))}
        </div>
      );
    }
  } else {
    displayLabel = selectedOption ? selectedOption.label : placeholder || "";
  }

  useLayoutEffect(() => {
    if (!isOpen) return;
    updateMenuPosition();
  }, [isOpen, updateMenuPosition]);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      const t = event.target as Node;
      if (containerRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setIsOpen(false);
    };

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", updateMenuPosition, true);
    window.addEventListener("resize", updateMenuPosition);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", updateMenuPosition, true);
      window.removeEventListener("resize", updateMenuPosition);
    };
  }, [isOpen, updateMenuPosition]);

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        setSearchTerm("");
      }
      return next;
    });
  };

  const handleKeyToggle = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsOpen((prev) => !prev);
    }
  };

  const handleSelect = (option: SelectOption) => {
    if (option.disabled) return;
    
    if (isMulti) {
      const valArr = Array.isArray(value) ? value : (value ? [value] : []);
      if (valArr.includes(option.value)) {
        onChange(valArr.filter((v: any) => v !== option.value));
      } else {
        onChange([...valArr, option.value]);
      }
    } else {
      onChange(option.value);
      setIsOpen(false);
    }
  };

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const term = searchTerm.trim().toLowerCase();
    return options.filter((option) =>
      option.label.toLowerCase().includes(term),
    );
  }, [options, searchTerm]);

  return (
    <div className={styles.container} ref={containerRef}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`${styles.trigger} ${className ?? ""} ${
          disabled ? styles.triggerDisabled : ""
        }`}
        onClick={handleToggle}
        onKeyDown={handleKeyToggle}
      >
        <span className={styles.value}>{displayLabel}</span>
        <span
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}
          aria-hidden="true"
        >
          <FaChevronDown />
        </span>
      </div>

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            className={styles.menu}
            style={{
              position: "fixed",
              top: menuBox.top,
              left: menuBox.left,
              width: menuBox.width,
              maxHeight: menuBox.maxHeight,
              zIndex: 5000,
            }}
            role="listbox"
          >
            <input
              className={styles.search}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Ara..."
              type="text"
              autoFocus
            />
            <div className={styles.list}>
              {filteredOptions.length === 0 ? (
                <div className={styles.empty}>Nəticə tapılmadı</div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = isMulti ? (Array.isArray(value) && value.includes(option.value)) : option.value === value;
                  return (
                    <div
                      key={option.value || option.label}
                      role="option"
                      aria-selected={isSelected}
                      className={`${styles.option} ${
                        isSelected ? styles.optionActive : ""
                      } ${option.disabled ? styles.optionDisabled : ""}`}
                      onClick={() => handleSelect(option)}
                    >
                      {option.label}
                      {isMulti && isSelected && <span style={{ float: 'right' }}>✓</span>}
                    </div>
                  );
                })
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
