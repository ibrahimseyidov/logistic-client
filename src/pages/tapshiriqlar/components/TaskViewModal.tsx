"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./TaskViewModal.module.css";
import {
  FaCloudUploadAlt,
  FaInfoCircle,
  FaPlus,
  FaSave,
  FaTimes,
} from "react-icons/fa";
import { FiCalendar, FiChevronDown, FiClock } from "react-icons/fi";
import Select from "../../../common/components/select/Select";
import type { SelectOption } from "../../../common/components/select/Select";
import datePickerStyles from "./TaskFiltersDrawer.module.css";

const PLACEHOLDER: SelectOption[] = [{ value: "", label: "Dəyəri seçin" }];

const DEPT_OPTS: SelectOption[] = [
  ...PLACEHOLDER,
  { value: "sales", label: "Satış şöbəsi" },
  { value: "logistics", label: "Logistika" },
];

const KONTRAGENT_OPTS: SelectOption[] = [
  ...PLACEHOLDER,
  { value: "k1", label: "Karat MMC" },
  { value: "k2", label: "Ziyafreight" },
];

const AUTHOR_OPTS: SelectOption[] = [
  { value: "ulvi", label: "Ulvi Adilzadə (Satış şöbəsi)" },
  { value: "nargiz", label: "Nərgiz K. (Logistika)" },
];

const REMIND_OPTS: SelectOption[] = [
  { value: "day", label: "İcra günündə" },
  { value: "1d", label: "1 gün əvvəl" },
  { value: "1w", label: "1 həftə əvvəl" },
];
const DESTINATION_OPTS: SelectOption[] = [
  { value: "backlog", label: "Backlog" },
  { value: "todo", label: "To Do" },
  { value: "in-progress", label: "In Progress" },
  { value: "review", label: "Review" },
  { value: "done", label: "Done" },
];

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

interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: TaskModalSavePayload) => void;
  initialData?: TaskModalInitialData | null;
}

export interface TaskModalSavePayload {
  title: string;
  description: string;
  counterparty: string;
  author: string;
  executors: string[];
  deadlineDate: string;
  deadlineTime: string;
  destinationColumn: string;
}

export interface TaskModalInitialData {
  title: string;
  description: string;
  counterparty: string;
  author: string;
  executors: string[];
  deadlineDate: string;
  deadlineTime: string;
  destinationColumn: string;
}

const fieldBox = styles.fieldBox;

export default function TaskViewModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [kontragent, setKontragent] = useState("");
  const [department, setDepartment] = useState("");
  const [author, setAuthor] = useState("ulvi");
  const [executorInput, setExecutorInput] = useState("");
  const [executorTags, setExecutorTags] = useState<string[]>([
    "Ulvi Adilzadə (Satış şöbəsi)",
  ]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [recurring, setRecurring] = useState(false);
  const [createdDate] = useState("2026-04-06");
  const [createdTime] = useState("22:00");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [deadlineTime, setDeadlineTime] = useState("");
  const [deadlineUntil, setDeadlineUntil] = useState("");
  const [deadlineTimeText, setDeadlineTimeText] = useState("");
  const [deadlineUntilText, setDeadlineUntilText] = useState("");
  const [activeTimePicker, setActiveTimePicker] = useState<"start" | "end" | null>(null);
  const [timePickerDirection, setTimePickerDirection] = useState<{
    start: "up" | "down";
    end: "up" | "down";
  }>({ start: "up", end: "up" });
  const [timePickerAlign, setTimePickerAlign] = useState<{
    start: "left" | "right";
    end: "left" | "right";
  }>({ start: "left", end: "left" });
  const [remindEnabled, setRemindEnabled] = useState(true);
  const [remindWhen, setRemindWhen] = useState("day");
  const [remindTime, setRemindTime] = useState("10:00");
  const [destinationColumn, setDestinationColumn] = useState("todo");
  const [isDeadlineCalendarOpen, setIsDeadlineCalendarOpen] = useState(false);
  const [manualDeadlineText, setManualDeadlineText] = useState("");
  const deadlineCalendarRef = useRef<HTMLDivElement | null>(null);
  const deadlineTriggerRef = useRef<HTMLDivElement | null>(null);
  const deadlineTimeWrapRef = useRef<HTMLDivElement | null>(null);
  const deadlineUntilWrapRef = useRef<HTMLDivElement | null>(null);
  const [deadlineCalendarMonth, setDeadlineCalendarMonth] = useState(new Date());
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description);
      setKontragent(initialData.counterparty);
      setAuthor(initialData.author || "ulvi");
      setExecutorTags(initialData.executors.length ? initialData.executors : []);
      setDeadlineDate(initialData.deadlineDate);
      setDeadlineTime(initialData.deadlineTime);
      setDestinationColumn(initialData.destinationColumn || "todo");
      return;
    }

    setTitle("");
    setDescription("");
    setKontragent("");
    setDepartment("");
    setAuthor("ulvi");
    setExecutorInput("");
    setExecutorTags(["Ulvi Adilzadə (Satış şöbəsi)"]);
    setChecklistItems([]);
    setAttachedFiles([]);
    setRecurring(false);
    setDeadlineDate("");
    setDeadlineTime("");
    setDeadlineUntil("");
    setRemindEnabled(true);
    setRemindWhen("day");
    setRemindTime("10:00");
    setDestinationColumn("todo");
  }, [isOpen, initialData]);

  useEffect(() => {
    const formattedDeadline = deadlineDate
      ? new Date(deadlineDate).toLocaleDateString("az-AZ", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "";
    setManualDeadlineText(formattedDeadline);
  }, [deadlineDate]);

  useEffect(() => {
    setDeadlineTimeText(deadlineTime);
  }, [deadlineTime]);

  useEffect(() => {
    setDeadlineUntilText(deadlineUntil);
  }, [deadlineUntil]);

  useEffect(() => {
    if (!isDeadlineCalendarOpen) return undefined;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (deadlineCalendarRef.current?.contains(target)) return;
      if (deadlineTriggerRef.current?.contains(target)) return;
      setIsDeadlineCalendarOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsDeadlineCalendarOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isDeadlineCalendarOpen]);

  useEffect(() => {
    if (!activeTimePicker) return undefined;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (deadlineTimeWrapRef.current?.contains(target)) return;
      if (deadlineUntilWrapRef.current?.contains(target)) return;
      setActiveTimePicker(null);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveTimePicker(null);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [activeTimePicker]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const removeExecutorTag = (t: string) => {
    setExecutorTags((prev) => prev.filter((x) => x !== t));
  };

  const addExecutorTag = () => {
    const next = executorInput.trim();
    if (!next) return;
    if (executorTags.includes(next)) {
      setExecutorInput("");
      return;
    }
    setExecutorTags((prev) => [...prev, next]);
    setExecutorInput("");
  };

  const addChecklistItem = () => {
    setChecklistItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text: "", done: false },
    ]);
  };

  const updateChecklistItem = (id: string, patch: Partial<ChecklistItem>) => {
    setChecklistItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  };

  const removeChecklistItem = (id: string) => {
    setChecklistItems((prev) => prev.filter((item) => item.id !== id));
  };

  const appendFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setAttachedFiles((prev) => [...prev, ...Array.from(files)]);
  };

  const onFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    appendFiles(event.target.files);
    event.target.value = "";
  };

  const onFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    appendFiles(event.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSaveClick = () => {
    const normalizedTitle = title.trim();
    if (!normalizedTitle) return;

    onSave({
      title: normalizedTitle,
      description: description.trim(),
      counterparty: kontragent,
      author,
      executors: executorTags,
      deadlineDate,
      deadlineTime,
      destinationColumn,
    });
  };

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

  const applyManualDeadlineDate = () => {
    const raw = manualDeadlineText.trim();
    if (!raw) {
      setDeadlineDate("");
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

    setDeadlineDate(toYmd(parsed));
    setDeadlineCalendarMonth(new Date(year, month - 1, 1));
  };

  const deadlineSelectedDate = deadlineDate ? new Date(deadlineDate) : null;
  const deadlineToday = new Date();
  const deadlineMonthLabel = MONTH_NAMES[deadlineCalendarMonth.getMonth()];
  const deadlineYearLabel = deadlineCalendarMonth.getFullYear();
  const deadlineYearOptions = Array.from({ length: 21 }, (_, index) => {
    const currentYear = new Date().getFullYear();
    return currentYear - 10 + index;
  });
  const deadlineWeekDays = ["B.E", "Ç.A", "Ç", "C.A", "C", "Ş", "B"];
  const deadlineDays = (() => {
    const year = deadlineCalendarMonth.getFullYear();
    const month = deadlineCalendarMonth.getMonth();
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
  })();

  const timeOptions: string[] = [];
  for (let hour = 0; hour < 24; hour += 1) {
    for (let minute = 0; minute < 60; minute += 30) {
      timeOptions.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
    }
  }

  const parseTime = (value: string) => {
    const normalized = value.trim();
    if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(normalized)) return "";
    return normalized;
  };

  const applyManualTime = (field: "start" | "end") => {
    const raw = field === "start" ? deadlineTimeText : deadlineUntilText;
    const parsed = parseTime(raw);
    if (!parsed && raw.trim() !== "") return;
    if (field === "start") setDeadlineTime(parsed);
    else setDeadlineUntil(parsed);
  };

  const openTimePicker = (field: "start" | "end") => {
    const targetRef = field === "start" ? deadlineTimeWrapRef.current : deadlineUntilWrapRef.current;
    if (!targetRef) {
      setActiveTimePicker(field);
      return;
    }

    const rect = targetRef.getBoundingClientRect();
    const estimatedPopoverHeight = 320;
    const estimatedPopoverWidth = 300;
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    const direction: "up" | "down" =
      spaceBelow < estimatedPopoverHeight && spaceAbove > spaceBelow ? "up" : "down";
    const align: "left" | "right" =
      rect.left + estimatedPopoverWidth > window.innerWidth - 12 ? "right" : "left";

    setTimePickerDirection((prev) => ({ ...prev, [field]: direction }));
    setTimePickerAlign((prev) => ({ ...prev, [field]: align }));
    setActiveTimePicker(field);
  };

  return (
    <div
      className={`${styles.modalOverlay} ${styles.modalOverlayVisible}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
      onClick={onClose}
    >
      <div
        className={`${styles.modalContainer} ${styles.modalContainerVisible}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: "min(100vw, 1120px)",
          display: "flex",
          flexDirection: "column",
          background: "#f8fafc",
          borderLeft: "1px solid #e2e8f0",
          boxShadow: "0 24px 70px rgba(15, 23, 42, 0.18)",
          overflowY: "auto",
          transform: "translateX(0)",
          opacity: 1,
        }}
      >
        <div className={styles.header}>
          <h2 id="task-modal-title" className={styles.title}>
            Tapşırığa baxış
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Bağla"
          >
            <FaTimes />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.gridContainer}>
            <div className={styles.leftCol}>
              <label className={styles.labelBlock}>
                <span className={styles.labelTitle}>Adı</span>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={styles.inputTitle}
                  placeholder="Tapşırığın adı"
                />
              </label>

              <label className={styles.labelBlock}>
                <span className={styles.labelTitle}>Təsviri</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  className={styles.textareaDesc}
                  placeholder="Təsvir daxil edin..."
                />
              </label>

              <div className={styles.sectionBlock}>
                <span className={styles.sectionLabel}>Çeklist</span>
                {checklistItems.length > 0 ? (
                  <div className={styles.checklistList}>
                    {checklistItems.map((item) => (
                      <div key={item.id} className={styles.checklistRow}>
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={(event) =>
                            updateChecklistItem(item.id, {
                              done: event.target.checked,
                            })
                          }
                          className={styles.checklistCheckbox}
                        />
                        <button
                          type="button"
                          className={styles.checklistRemove}
                          onClick={() => removeChecklistItem(item.id)}
                          aria-label="Çeklist sətrini sil"
                        >
                          <FaTimes />
                        </button>
                        <input
                          type="text"
                          value={item.text}
                          onChange={(event) =>
                            updateChecklistItem(item.id, {
                              text: event.target.value,
                            })
                          }
                          className={styles.checklistInput}
                          placeholder="Çeklist bəndi yazın"
                        />
                      </div>
                    ))}
                  </div>
                ) : null}
                <button
                  type="button"
                  className={styles.secondaryActionButton}
                  onClick={addChecklistItem}
                >
                  <FaPlus className={styles.buttonIconSmall} aria-hidden />
                  Əlavə et
                </button>
              </div>

              <div className={styles.sectionBlock}>
                <span className={styles.sectionLabel}>Əlavə edilmiş fayllar</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className={styles.hiddenFileInput}
                  onChange={onFileInputChange}
                />
                <div
                  className={styles.fileDropArea}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={onFileDrop}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                >
                  <FaCloudUploadAlt className={styles.fileDropIcon} aria-hidden />
                  <span>Faylınızı sürüşdürün &amp; buraxın ya da seçin</span>
                </div>
                {attachedFiles.length > 0 ? (
                  <div className={styles.fileList}>
                    {attachedFiles.map((file, index) => (
                      <div key={`${file.name}-${index}`} className={styles.fileItem}>
                        <span className={styles.fileName}>{file.name}</span>
                        <button
                          type="button"
                          className={styles.fileRemove}
                          onClick={() => removeFile(index)}
                          aria-label="Faylı sil"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <div className={styles.rightCol}>
              <div className={fieldBox}>
                <span className={styles.fieldLabel}>Kontragent</span>
                <Select
                  value={kontragent}
                  options={KONTRAGENT_OPTS}
                  onChange={setKontragent}
                  placeholder="Dəyəri seçin"
                />
              </div>

              <div className={fieldBox}>
                <span className={styles.fieldLabel}>Şöbə</span>
                <Select
                  value={department}
                  options={DEPT_OPTS}
                  onChange={setDepartment}
                  placeholder="Dəyəri seçin"
                />
              </div>

              <div className={fieldBox}>
                <span className={styles.fieldLabel}>Müəllif</span>
                <Select
                  value={author}
                  options={AUTHOR_OPTS}
                  onChange={setAuthor}
                />
              </div>

              <div className={fieldBox}>
                <span className={styles.fieldLabel}>Düşəcəyi bölmə</span>
                <Select
                  value={destinationColumn}
                  options={DESTINATION_OPTS}
                  onChange={setDestinationColumn}
                />
              </div>

              <div className={fieldBox}>
                <span className={styles.fieldLabel}>İcraçı</span>
                <div className={styles.executorInputRow}>
                  <input
                    type="text"
                    value={executorInput}
                    onChange={(event) => setExecutorInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addExecutorTag();
                      }
                    }}
                    className={styles.inputControl}
                    placeholder="Ad yazın və əlavə edin"
                  />
                  <button
                    type="button"
                    onClick={addExecutorTag}
                    className={styles.addMiniButton}
                  >
                    <FaPlus aria-hidden />
                  </button>
                </div>
                <div className={styles.tagList}>
                  {executorTags.map((t) => (
                    <span key={t} className={styles.tagItem}>
                      {t}
                      <button
                        type="button"
                        onClick={() => removeExecutorTag(t)}
                        className={styles.tagRemove}
                        aria-label="Sil"
                      >
                        <FaTimes className={styles.tagRemoveIcon} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className={`${fieldBox} ${styles.inlineField}`}>
                <label className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={recurring}
                    onChange={(e) => setRecurring(e.target.checked)}
                    className={styles.checkbox}
                  />
                  Təkrarlanan tapşırıq
                </label>
                <span className={styles.tooltipWrap}>
                  <FaInfoCircle className={styles.infoIcon} aria-hidden />
                  <span className={styles.tooltipBubble}>
                    Təkrarlanan tapşırıq aktiv olanda dövri olaraq yaradılır.
                  </span>
                </span>
              </div>

              <div className={styles.twoColGrid}>
                <label className={fieldBox}>
                  <span className={styles.fieldLabel}>Yaradılması tarixi</span>
                  <input
                    type="text"
                    readOnly
                    value={createdDate.split("-").reverse().join(".")}
                    className={styles.readOnlyInput}
                  />
                </label>
                <label className={fieldBox}>
                  <span className={styles.fieldLabel}>Vaxt</span>
                  <input
                    type="text"
                    readOnly
                    value={createdTime}
                    className={styles.readOnlyInput}
                  />
                </label>
              </div>

              <div className={styles.sectionBlock}>
                <span className={styles.fieldLabel}>Son müddət</span>
                <div className={styles.threeColGrid}>
                  <div
                    ref={deadlineTriggerRef}
                    className={`${styles.datePickerWrap} ${datePickerStyles.dateFieldWrap}`}
                  >
                    <input
                      type="text"
                      value={manualDeadlineText}
                      onChange={(event) => setManualDeadlineText(event.target.value)}
                      onFocus={() => setIsDeadlineCalendarOpen(true)}
                      onBlur={applyManualDeadlineDate}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          applyManualDeadlineDate();
                        }
                      }}
                      className={`${styles.inputControl} ${datePickerStyles.manualDateInputSingle}`}
                      placeholder="gg.aa.yyyy"
                    />
                    <button
                      type="button"
                      className={datePickerStyles.inlineCalendarButton}
                      onClick={() => setIsDeadlineCalendarOpen((prev) => !prev)}
                      aria-label="Tarix seç"
                    >
                      <FiCalendar />
                    </button>
                    {isDeadlineCalendarOpen ? (
                      <div ref={deadlineCalendarRef} className={datePickerStyles.calendarPopover}>
                        <div className={datePickerStyles.calendarHeader}>
                          <button
                            type="button"
                            className={datePickerStyles.calendarNavButton}
                            onClick={() =>
                              setDeadlineCalendarMonth(
                                (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
                              )
                            }
                          >
                            &lt;
                          </button>
                          <div className={datePickerStyles.calendarMonthMeta}>
                            <span className={datePickerStyles.calendarMonthLabel}>{deadlineMonthLabel}</span>
                            <div className={datePickerStyles.calendarYearSelectWrap}>
                              <select
                                className={datePickerStyles.calendarYearSelect}
                                value={deadlineYearLabel}
                                onChange={(event) =>
                                  setDeadlineCalendarMonth(
                                    new Date(
                                      Number(event.target.value),
                                      deadlineCalendarMonth.getMonth(),
                                      1,
                                    ),
                                  )
                                }
                              >
                                {deadlineYearOptions.map((year) => (
                                  <option key={year} value={year}>
                                    {year}
                                  </option>
                                ))}
                              </select>
                              <FiChevronDown className={datePickerStyles.calendarYearSelectIcon} />
                            </div>
                          </div>
                          <button
                            type="button"
                            className={datePickerStyles.calendarNavButton}
                            onClick={() =>
                              setDeadlineCalendarMonth(
                                (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
                              )
                            }
                          >
                            &gt;
                          </button>
                        </div>

                        <div className={datePickerStyles.weekdayRow}>
                          {deadlineWeekDays.map((day) => (
                            <span key={day} className={datePickerStyles.weekdayCell}>
                              {day}
                            </span>
                          ))}
                        </div>

                        <div className={datePickerStyles.daysGrid}>
                          {deadlineDays.map(({ date, inCurrentMonth }) => {
                            const selected = isSameDay(deadlineSelectedDate, date);
                            const isToday = isSameDay(deadlineToday, date);
                            return (
                              <button
                                key={date.toISOString()}
                                type="button"
                                className={`${datePickerStyles.dayCell} ${
                                  inCurrentMonth ? "" : datePickerStyles.dayCellMuted
                                } ${selected ? datePickerStyles.dayCellSelected : ""} ${
                                  isToday ? datePickerStyles.dayCellToday : ""
                                }`}
                                onClick={() => {
                                  setDeadlineDate(toYmd(date));
                                  setIsDeadlineCalendarOpen(false);
                                }}
                              >
                                {date.getDate()}
                              </button>
                            );
                          })}
                        </div>

                        <div className={datePickerStyles.calendarFooter}>
                          <button
                            type="button"
                            className={datePickerStyles.calendarFooterGhost}
                            onClick={() => setDeadlineDate("")}
                          >
                            Təmizlə
                          </button>
                          <button
                            type="button"
                            className={datePickerStyles.calendarFooterPrimary}
                            onClick={() => {
                              setDeadlineDate(toYmd(deadlineToday));
                              setDeadlineCalendarMonth(
                                new Date(deadlineToday.getFullYear(), deadlineToday.getMonth(), 1),
                              );
                              setIsDeadlineCalendarOpen(false);
                            }}
                          >
                            Bu gün
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <div ref={deadlineTimeWrapRef} className={styles.timePickerWrap}>
                    <input
                      type="text"
                      value={deadlineTimeText}
                      onChange={(event) => setDeadlineTimeText(event.target.value)}
                      onFocus={() => openTimePicker("start")}
                      onBlur={() => applyManualTime("start")}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          applyManualTime("start");
                        }
                      }}
                      className={`${styles.inputControl} ${styles.timeInputWithIcon}`}
                      placeholder="ss:dd"
                    />
                    <button
                      type="button"
                      className={styles.timePickerIconButton}
                      onClick={() =>
                        setActiveTimePicker((prev) => {
                          if (prev === "start") return null;
                          openTimePicker("start");
                          return "start";
                        })
                      }
                      aria-label="Vaxt seç"
                    >
                      <FiClock />
                    </button>
                    {activeTimePicker === "start" ? (
                      <div
                        className={`${styles.timePopover} ${
                          timePickerDirection.start === "up"
                            ? styles.timePopoverUp
                            : styles.timePopoverDown
                        } ${
                          timePickerAlign.start === "right"
                            ? styles.timePopoverAlignRight
                            : styles.timePopoverAlignLeft
                        }`}
                      >
                        <div className={styles.timeGrid}>
                          {timeOptions.map((time) => (
                            <button
                              key={`start-${time}`}
                              type="button"
                              className={`${styles.timeOptionButton} ${
                                deadlineTime === time ? styles.timeOptionButtonActive : ""
                              }`}
                              onClick={() => {
                                setDeadlineTime(time);
                                setActiveTimePicker(null);
                              }}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                        <div className={styles.timePopoverFooter}>
                          <button type="button" className={styles.timeFooterGhost} onClick={() => setDeadlineTime("")}>
                            Təmizlə
                          </button>
                          <button
                            type="button"
                            className={styles.timeFooterPrimary}
                            onClick={() => {
                              const now = new Date();
                              const current = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
                              setDeadlineTime(current);
                              setActiveTimePicker(null);
                            }}
                          >
                            İndi
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <div ref={deadlineUntilWrapRef} className={styles.timePickerWrap}>
                    <input
                      type="text"
                      value={deadlineUntilText}
                      onChange={(event) => setDeadlineUntilText(event.target.value)}
                      onFocus={() => openTimePicker("end")}
                      onBlur={() => applyManualTime("end")}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          applyManualTime("end");
                        }
                      }}
                      className={`${styles.inputControl} ${styles.timeInputWithIcon}`}
                      placeholder="ss:dd"
                    />
                    <button
                      type="button"
                      className={styles.timePickerIconButton}
                      onClick={() =>
                        setActiveTimePicker((prev) => {
                          if (prev === "end") return null;
                          openTimePicker("end");
                          return "end";
                        })
                      }
                      aria-label="Bitmə vaxtı seç"
                    >
                      <FiClock />
                    </button>
                    {activeTimePicker === "end" ? (
                      <div
                        className={`${styles.timePopover} ${
                          timePickerDirection.end === "up"
                            ? styles.timePopoverUp
                            : styles.timePopoverDown
                        } ${
                          timePickerAlign.end === "right"
                            ? styles.timePopoverAlignRight
                            : styles.timePopoverAlignLeft
                        }`}
                      >
                        <div className={styles.timeGrid}>
                          {timeOptions.map((time) => (
                            <button
                              key={`end-${time}`}
                              type="button"
                              className={`${styles.timeOptionButton} ${
                                deadlineUntil === time ? styles.timeOptionButtonActive : ""
                              }`}
                              onClick={() => {
                                setDeadlineUntil(time);
                                setActiveTimePicker(null);
                              }}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                        <div className={styles.timePopoverFooter}>
                          <button type="button" className={styles.timeFooterGhost} onClick={() => setDeadlineUntil("")}>
                            Təmizlə
                          </button>
                          <button
                            type="button"
                            className={styles.timeFooterPrimary}
                            onClick={() => {
                              const now = new Date();
                              const current = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
                              setDeadlineUntil(current);
                              setActiveTimePicker(null);
                            }}
                          >
                            İndi
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className={fieldBox}>
                <label className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={remindEnabled}
                    onChange={(e) => setRemindEnabled(e.target.checked)}
                    className={styles.checkbox}
                  />
                  Xatırlat
                  <span className={styles.tooltipWrap}>
                    <FaInfoCircle className={styles.infoIcon} aria-hidden />
                    <span className={styles.tooltipBubble}>
                      Seçilən tarixdən əvvəl xatırlatma göndərilir.
                    </span>
                  </span>
                </label>
                <div className={styles.twoColGrid}>
                  <Select
                    value={remindWhen}
                    options={REMIND_OPTS}
                    onChange={setRemindWhen}
                  />
                  <input
                    type="time"
                    value={remindTime}
                    onChange={(e) => setRemindTime(e.target.value)}
                    className={styles.inputControl}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            onClick={handleSaveClick}
            className={styles.saveButton}
          >
            <FaSave aria-hidden />
            Yaddaşda saxla və çıx
          </button>
        </div>
      </div>
    </div>
  );
}
