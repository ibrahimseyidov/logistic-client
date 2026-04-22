import {
  FiCalendar,
  FiChevronDown,
  FiFilter,
  FiHash,
  FiSearch,
  FiTag,
  FiUser,
  FiX,
} from "react-icons/fi";
import { useEffect, useMemo, useRef, useState } from "react";
import Select from "../../../common/components/select/Select";
import type { SelectOption } from "../../../common/components/select/Select";
import styles from "../../sorgular/components/SorgularFilters.module.css";
import localStyles from "./TaskFiltersDrawer.module.css";

const MONTH_NAMES = [
  "Yanvar",
  "Fevral",
  "Mart",
  "Aprel",
  "May",
  "İyun",
  "İyul",
  "Avqust",
  "Sentyabr",
  "Oktyabr",
  "Noyabr",
  "Dekabr",
];

export interface TaskFilterState {
  author: string;
  executor: string;
  counterparty: string;
  deadline: string;
  status: string;
  tag: string;
  taskName: string;
}

interface Props {
  filter: TaskFilterState;
  authorOptions: SelectOption[];
  executorOptions: SelectOption[];
  counterpartyOptions: SelectOption[];
  statusOptions: SelectOption[];
  tagOptions: SelectOption[];
  onFilterChange: (field: keyof TaskFilterState, value: string) => void;
  onClose: () => void;
  onClear: () => void;
  onApplyFilter: () => void;
}

export default function TaskFiltersDrawer({
  filter,
  authorOptions,
  executorOptions,
  counterpartyOptions,
  statusOptions,
  tagOptions,
  onFilterChange,
  onClose,
  onClear,
  onApplyFilter,
}: Props) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLDivElement | null>(null);

  const initialDate = filter.deadline ? new Date(filter.deadline) : new Date();
  const [calendarMonth, setCalendarMonth] = useState(
    new Date(initialDate.getFullYear(), initialDate.getMonth(), 1),
  );

  useEffect(() => {
    if (!isCalendarOpen) return undefined;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (calendarRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      setIsCalendarOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsCalendarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isCalendarOpen]);

  const formattedDeadline = filter.deadline
    ? new Date(filter.deadline).toLocaleDateString("az-AZ", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "";
  const [manualDateText, setManualDateText] = useState(formattedDeadline);

  useEffect(() => {
    setManualDateText(formattedDeadline);
  }, [formattedDeadline]);

  const monthLabel = useMemo(
    () => MONTH_NAMES[calendarMonth.getMonth()],
    [calendarMonth],
  );
  const yearLabel = calendarMonth.getFullYear();

  const selectedDate = filter.deadline ? new Date(filter.deadline) : null;
  const today = new Date();
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 21 }, (_, index) => currentYear - 10 + index);
  }, []);

  const days = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startOffset = (firstDay.getDay() + 6) % 7;
    const totalDays = lastDay.getDate();
    const totalCells = Math.ceil((startOffset + totalDays) / 7) * 7;

    return Array.from({ length: totalCells }, (_, index) => {
      const dayNumber = index - startOffset + 1;
      const date = new Date(year, month, dayNumber);
      const inCurrentMonth = dayNumber >= 1 && dayNumber <= totalDays;
      return { date, inCurrentMonth };
    });
  }, [calendarMonth]);

  const toYmd = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const isSameDay = (a: Date | null, b: Date) =>
    !!a &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const weekDays = ["B.E", "Ç.A", "Ç", "C.A", "C", "Ş", "B"];

  const applyManualDate = () => {
    const raw = manualDateText.trim();
    if (!raw) {
      onFilterChange("deadline", "");
      return;
    }

    const match = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (!match) return;

    const [, dd, mm, yyyy] = match;
    const day = Number(dd);
    const month = Number(mm);
    const year = Number(yyyy);
    const parsed = new Date(year, month - 1, day);

    const isValid =
      parsed.getFullYear() === year &&
      parsed.getMonth() === month - 1 &&
      parsed.getDate() === day;

    if (!isValid) return;

    onFilterChange("deadline", toYmd(parsed));
    setCalendarMonth(new Date(year, month - 1, 1));
  };

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
                Tapşırıqları müəllif, icraçı, kontragent və tarixə görə filtr edin.
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
        <section className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon}>
              <FiUser className={styles.iconLg} />
            </div>
            <div>
              <h3 className={styles.sectionTitle}>İştirakçılar</h3>
              <p className={styles.sectionDescription}>Müəllif və icraçıya görə axtarış edin.</p>
            </div>
          </div>
          <div className={styles.sectionContent}>
            <div className={styles.gridTwo}>
              <label className={styles.field}>
                <span className={styles.label}>Müəllif</span>
                <Select
                  value={filter.author}
                  options={authorOptions}
                  onChange={(value) => onFilterChange("author", value)}
                  placeholder="Dəyəri seçin"
                  className={styles.selectControl}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>İcraçı</span>
                <Select
                  value={filter.executor}
                  options={executorOptions}
                  onChange={(value) => onFilterChange("executor", value)}
                  placeholder="Dəyəri seçin"
                  className={styles.selectControl}
                />
              </label>
            </div>
          </div>
        </section>

        <section className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon}>
              <FiHash className={styles.iconLg} />
            </div>
            <div>
              <h3 className={styles.sectionTitle}>Tapşırıq məlumatları</h3>
              <p className={styles.sectionDescription}>Tapşırığın adı, kontragent və status üzrə filtr edin.</p>
            </div>
          </div>
          <div className={styles.sectionContent}>
            <div className={styles.gridTwo}>
              <label className={styles.fieldFull}>
                <span className={styles.label}>Tapşırığın adı</span>
                <div className={styles.fieldWrap}>
                  <span className={styles.leadingIcon}>
                    <FiSearch />
                  </span>
                  <input
                    className={styles.inputWithIcon}
                    value={filter.taskName}
                    onChange={(event) => onFilterChange("taskName", event.target.value)}
                    placeholder="Axtar..."
                  />
                </div>
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Kontragent</span>
                <Select
                  value={filter.counterparty}
                  options={counterpartyOptions}
                  onChange={(value) => onFilterChange("counterparty", value)}
                  placeholder="Dəyəri seçin"
                  className={styles.selectControl}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Status</span>
                <Select
                  value={filter.status}
                  options={statusOptions}
                  onChange={(value) => onFilterChange("status", value)}
                  placeholder="Dəyəri seçin"
                  className={styles.selectControl}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Nişan</span>
                <Select
                  value={filter.tag}
                  options={tagOptions}
                  onChange={(value) => onFilterChange("tag", value)}
                  placeholder="Dəyəri seçin"
                  className={styles.selectControl}
                />
              </label>
            </div>
          </div>
        </section>

        <section className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon}>
              <FiCalendar className={styles.iconLg} />
            </div>
            <div>
              <h3 className={styles.sectionTitle}>Tarix</h3>
              <p className={styles.sectionDescription}>Son müddətə görə tapşırıqları daraldın.</p>
            </div>
          </div>
          <div className={styles.sectionContent}>
            <label className={styles.field}>
              <span className={styles.label}>Son müddət</span>
              <div
                ref={triggerRef}
                className={`${styles.fieldWrap} ${localStyles.dateFieldWrap}`}
              >
                <input
                  type="text"
                  value={manualDateText}
                  onChange={(event) => setManualDateText(event.target.value)}
                  onFocus={() => setIsCalendarOpen(true)}
                  onBlur={applyManualDate}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      applyManualDate();
                    }
                  }}
                  className={`${styles.input} ${localStyles.manualDateInputSingle}`}
                  placeholder="gg.aa.yyyy"
                />
                <button
                  type="button"
                  className={localStyles.inlineCalendarButton}
                  onClick={() => setIsCalendarOpen((prev) => !prev)}
                  aria-label="Tarix seç"
                >
                  <FiCalendar />
                </button>

                {isCalendarOpen ? (
                  <div ref={calendarRef} className={localStyles.calendarPopover}>
                    <div className={localStyles.calendarHeader}>
                      <button
                        type="button"
                        className={localStyles.calendarNavButton}
                        onClick={() =>
                          setCalendarMonth(
                            (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
                          )
                        }
                      >
                        &lt;
                      </button>
                      <div className={localStyles.calendarMonthMeta}>
                        <span className={localStyles.calendarMonthLabel}>
                          {monthLabel}
                        </span>
                        <div className={localStyles.calendarYearSelectWrap}>
                          <select
                            className={localStyles.calendarYearSelect}
                            value={yearLabel}
                            onChange={(event) =>
                              setCalendarMonth(
                                new Date(
                                  Number(event.target.value),
                                  calendarMonth.getMonth(),
                                  1,
                                ),
                              )
                            }
                          >
                            {yearOptions.map((year) => (
                              <option key={year} value={year}>
                                {year}
                              </option>
                            ))}
                          </select>
                          <FiChevronDown className={localStyles.calendarYearSelectIcon} />
                        </div>
                      </div>
                      <button
                        type="button"
                        className={localStyles.calendarNavButton}
                        onClick={() =>
                          setCalendarMonth(
                            (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
                          )
                        }
                      >
                        &gt;
                      </button>
                    </div>

                    <div className={localStyles.weekdayRow}>
                      {weekDays.map((day) => (
                        <span key={day} className={localStyles.weekdayCell}>
                          {day}
                        </span>
                      ))}
                    </div>

                    <div className={localStyles.daysGrid}>
                      {days.map(({ date, inCurrentMonth }) => {
                        const selected = isSameDay(selectedDate, date);
                        const isToday = isSameDay(today, date);
                        return (
                          <button
                            key={date.toISOString()}
                            type="button"
                            className={`${localStyles.dayCell} ${
                              inCurrentMonth ? "" : localStyles.dayCellMuted
                            } ${selected ? localStyles.dayCellSelected : ""} ${
                              isToday ? localStyles.dayCellToday : ""
                            }`}
                            onClick={() => {
                              onFilterChange("deadline", toYmd(date));
                              setIsCalendarOpen(false);
                            }}
                          >
                            {date.getDate()}
                          </button>
                        );
                      })}
                    </div>

                    <div className={localStyles.calendarFooter}>
                      <button
                        type="button"
                        className={localStyles.calendarFooterGhost}
                        onClick={() => onFilterChange("deadline", "")}
                      >
                        Təmizlə
                      </button>
                      <button
                        type="button"
                        className={localStyles.calendarFooterPrimary}
                        onClick={() => {
                          onFilterChange("deadline", toYmd(today));
                          setCalendarMonth(
                            new Date(today.getFullYear(), today.getMonth(), 1),
                          );
                          setIsCalendarOpen(false);
                        }}
                      >
                        Bu gün
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
              <p className={localStyles.dateHint}>Format: gg.aa.yyyy</p>
            </label>
          </div>
        </section>
      </div>

      <div className={styles.footer}>
        <div className={styles.footerActions}>
          <button type="button" onClick={onClear} className={styles.ghostButton}>
            <FiX />
            Təmizlə
          </button>
          <button type="button" onClick={onApplyFilter} className={styles.primaryButton}>
            <FiTag />
            Filterdən keçir
          </button>
        </div>
      </div>
    </div>
  );
}
