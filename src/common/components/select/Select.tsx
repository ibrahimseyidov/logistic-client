"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { FaChevronDown } from "react-icons/fa";
import styles from "./Select.module.css";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function Select({
  value,
  options,
  onChange,
  placeholder = "",
  disabled = false,
  className,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  const displayLabel = selectedOption
    ? selectedOption.label
    : placeholder || "";

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (containerRef.current.contains(event.target as Node)) return;
      setIsOpen(false);
    };

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

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
    onChange(option.value);
    setIsOpen(false);
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

      {isOpen && (
        <div className={styles.menu} role="listbox">
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
              <div className={styles.empty}>Sonuc bulunamadi</div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value || option.label}
                  role="option"
                  aria-selected={option.value === value}
                  className={`${styles.option} ${
                    option.value === value ? styles.optionActive : ""
                  } ${option.disabled ? styles.optionDisabled : ""}`}
                  onClick={() => handleSelect(option)}
                >
                  {option.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
