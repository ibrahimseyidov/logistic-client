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
import { FiCalendar, FiChevronDown, FiClock, FiFile, FiImage } from "react-icons/fi";
import Select from "../../../common/components/select/Select";
import type { SelectOption } from "../../../common/components/select/Select";
import {
  uploadTaskFileAction,
  type TaskFileInfo,
} from "../../../common/actions/task.actions";
import { buildApiUrl } from "../../../common/utils/fetch.utils";
import { useAppDispatch } from "../../../common/store/hooks";
import { showNotification } from "../../../common/store/modalSlice";
import datePickerStyles from "./TaskFiltersDrawer.module.css";

const FILE_ACCEPT =
  "image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip,.rar,.7z,.ppt,.pptx";

function isImageFile(nameOrType: string) {
  const v = nameOrType.toLowerCase();
  return (
    v.startsWith("image/") ||
    /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(v)
  );
}

function formatFileSize(bytes?: number) {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function resolveFileUrl(url: string) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url) || url.startsWith("blob:")) return url;
  return buildApiUrl(url);
}

const REMIND_OPTS: SelectOption[] = [
  { value: "day", label: "İcra günündə" },
  { value: "1d", label: "1 gün əvvəl" },
  { value: "1w", label: "1 həftə əvvəl" },
];
const DESTINATION_OPTS: SelectOption[] = [
  { value: "backlog", label: "Gözləmə" },
  { value: "todo", label: "Ediləcək" },
  { value: "in-progress", label: "İcrada" },
  { value: "review", label: "Yoxlama" },
  { value: "done", label: "Tamamlandı" },
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

export type TaskModalExecutor = { id: number; name: string };

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: TaskModalSavePayload) => void;
  initialData?: TaskModalInitialData | null;
  userOptions?: SelectOption[];
  authorLabel?: string;
}

export interface TaskModalSavePayload {
  title: string;
  description: string;
  counterparty: string;
  author: string;
  executors: TaskModalExecutor[];
  deadlineDate: string;
  deadlineTime: string;
  deadlineUntil: string;
  destinationColumn: string;
  recurring: boolean;
  remindEnabled: boolean;
  remindWhen: string;
  remindTime: string;
  checklist: ChecklistItem[];
  files: TaskFileInfo[];
}

export interface TaskModalInitialData {
  title: string;
  description: string;
  counterparty: string;
  author: string;
  executors: TaskModalExecutor[];
  deadlineDate: string;
  deadlineTime: string;
  deadlineUntil?: string;
  destinationColumn: string;
  recurring?: boolean;
  remindEnabled?: boolean;
  remindWhen?: string;
  remindTime?: string;
  checklist?: ChecklistItem[];
  files?: TaskFileInfo[];
}

const fieldBox = styles.fieldBox;

export default function TaskViewModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  userOptions = [],
  authorLabel = "",
}: Props) {
  const dispatch = useAppDispatch();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("");
  const [executorPick, setExecutorPick] = useState("");
  const [executorTags, setExecutorTags] = useState<TaskModalExecutor[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [savedFiles, setSavedFiles] = useState<TaskFileInfo[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [recurring, setRecurring] = useState(false);
  const [createdDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [createdTime] = useState(() =>
    new Date().toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit", hour12: false }),
  );
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

  // Only hydrate when modal opens — not on every parent re-render of initialData
  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description);
      setAuthor(initialData.author || authorLabel);
      setExecutorTags(
        Array.isArray(initialData.executors) ? [...initialData.executors] : [],
      );
      setDeadlineDate(initialData.deadlineDate);
      setDeadlineTime(initialData.deadlineTime);
      setDeadlineUntil(initialData.deadlineUntil || "");
      setDestinationColumn(initialData.destinationColumn || "todo");
      setRecurring(initialData.recurring ?? false);
      setRemindEnabled(initialData.remindEnabled ?? true);
      setRemindWhen(initialData.remindWhen || "day");
      setRemindTime(initialData.remindTime || "10:00");
      setChecklistItems(initialData.checklist || []);
      setSavedFiles(
        Array.isArray(initialData.files)
          ? initialData.files.filter((f) => f?.url)
          : [],
      );
      setPendingFiles([]);
      setExecutorPick("");
      return;
    }

    setTitle("");
    setDescription("");
    setAuthor(authorLabel);
    setExecutorPick("");
    setExecutorTags([]);
    setChecklistItems([]);
    setSavedFiles([]);
    setPendingFiles([]);
    setRecurring(false);
    setDeadlineDate("");
    setDeadlineTime("");
    setDeadlineUntil("");
    setRemindEnabled(true);
    setRemindWhen("day");
    setRemindTime("10:00");
    setDestinationColumn("todo");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

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

  const removeExecutorTag = (id: number) => {
    setExecutorTags((prev) => prev.filter((x) => x.id !== id));
  };

  const addExecutorByValue = (value: string) => {
    if (!value) return;
    const option = userOptions.find((o) => o.value === value);
    if (!option) return;
    const id = Number(option.value);
    if (!Number.isFinite(id) || id <= 0) return;
    setExecutorTags((prev) => {
      if (prev.some((e) => e.id === id)) return prev;
      return [...prev, { id, name: option.label }];
    });
    setExecutorPick("");
  };

  const addExecutorTag = () => {
    addExecutorByValue(executorPick);
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
    setPendingFiles((prev) => [...prev, ...Array.from(files)]);
  };

  const onFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    appendFiles(event.target.files);
    event.target.value = "";
  };

  const onFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    appendFiles(event.dataTransfer.files);
  };

  const removeSavedFile = (index: number) => {
    setSavedFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSaveClick = async () => {
    const normalizedTitle = title.trim();
    if (!normalizedTitle || uploading) return;

    // Include pending select value even if user didn't click "+"
    let executorsToSave = executorTags;
    if (executorPick) {
      const option = userOptions.find((o) => o.value === executorPick);
      const id = Number(option?.value);
      if (option && Number.isFinite(id) && id > 0 && !executorsToSave.some((e) => e.id === id)) {
        executorsToSave = [...executorsToSave, { id, name: option.label }];
      }
    }

    let uploaded: TaskFileInfo[] = [];
    if (pendingFiles.length) {
      setUploading(true);
      try {
        uploaded = await Promise.all(
          pendingFiles.map((file) => uploadTaskFileAction(file)),
        );
      } catch (err) {
        console.error(err);
        setUploading(false);
        dispatch(
          showNotification({
            message: "Fayl yüklənərkən xəta baş verdi.",
            type: "error",
            autoCloseDuration: 3500,
          }),
        );
        return;
      }
      setUploading(false);
    }

    const filesToSave = [...savedFiles, ...uploaded];

    onSave({
      title: normalizedTitle,
      description: description.trim(),
      counterparty: "",
      author: author || authorLabel,
      executors: executorsToSave,
      deadlineDate,
      deadlineTime,
      deadlineUntil,
      destinationColumn,
      recurring,
      remindEnabled,
      remindWhen,
      remindTime,
      checklist: checklistItems,
      files: filesToSave,
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
                  accept={FILE_ACCEPT}
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
                  <span>Foto və ya faylı sürüşdürün &amp; buraxın ya da seçin</span>
                  <span className={styles.fileDropHint}>
                    Şəkil, PDF, Word, Excel və digər sənədlər
                  </span>
                </div>
                {savedFiles.length > 0 || pendingFiles.length > 0 ? (
                  <div className={styles.fileList}>
                    {savedFiles.map((file, index) => {
                      const href = resolveFileUrl(file.url);
                      const image = isImageFile(file.name || file.url);
                      return (
                        <div key={`saved-${file.url}-${index}`} className={styles.fileItem}>
                          <div className={styles.fileMeta}>
                            {image ? (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.fileThumbLink}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <img
                                  src={href}
                                  alt={file.name}
                                  className={styles.fileThumb}
                                />
                              </a>
                            ) : (
                              <span className={styles.fileIconWrap}>
                                <FiFile />
                              </span>
                            )}
                            <div className={styles.fileTextCol}>
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.fileName}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {file.name}
                              </a>
                              {file.size ? (
                                <span className={styles.fileSize}>
                                  {formatFileSize(file.size)}
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <button
                            type="button"
                            className={styles.fileRemove}
                            onClick={() => removeSavedFile(index)}
                            aria-label="Faylı sil"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      );
                    })}
                    {pendingFiles.map((file, index) => (
                        <div key={`pending-${file.name}-${index}`} className={styles.fileItem}>
                          <div className={styles.fileMeta}>
                            <span className={styles.fileIconWrap}>
                              {isImageFile(file.type || file.name) ? (
                                <FiImage />
                              ) : (
                                <FiFile />
                              )}
                            </span>
                            <div className={styles.fileTextCol}>
                              <span className={styles.fileName}>{file.name}</span>
                              <span className={styles.fileSize}>
                                {formatFileSize(file.size)}
                                {formatFileSize(file.size) ? " · " : ""}
                                saxlananda yüklənəcək
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            className={styles.fileRemove}
                            onClick={() => removePendingFile(index)}
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
                <span className={styles.fieldLabel}>Müəllif</span>
                <input
                  type="text"
                  className={styles.inputControl}
                  value={author || authorLabel}
                  readOnly
                  disabled
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
                  <Select
                    value={executorPick}
                    options={[
                      { value: "", label: "İstifadəçi seçin" },
                      ...userOptions.filter(
                        (o) => !executorTags.some((e) => String(e.id) === o.value),
                      ),
                    ]}
                    onChange={(value) => addExecutorByValue(value)}
                  />
                  <button
                    type="button"
                    onClick={addExecutorTag}
                    className={styles.addMiniButton}
                    title="İcraçı əlavə et"
                  >
                    <FaPlus aria-hidden />
                  </button>
                </div>
                <div className={styles.tagList}>
                  {executorTags.map((t) => (
                    <span key={t.id} className={styles.tagItem}>
                      {t.name}
                      <button
                        type="button"
                        onClick={() => removeExecutorTag(t.id)}
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
            onClick={() => {
              void handleSaveClick();
            }}
            className={styles.saveButton}
            disabled={uploading}
          >
            <FaSave aria-hidden />
            {uploading ? "Fayllar yüklənir..." : "Yaddaşda saxla və çıx"}
          </button>
        </div>
      </div>
    </div>
  );
}
