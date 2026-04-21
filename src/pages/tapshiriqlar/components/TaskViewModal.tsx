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
import Select from "../../../common/components/select/Select";
import type { SelectOption } from "../../../common/components/select/Select";

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
const modalTransitionMs = 280;

export default function TaskViewModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
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
  const [remindEnabled, setRemindEnabled] = useState(true);
  const [remindWhen, setRemindWhen] = useState("day");
  const [remindTime, setRemindTime] = useState("10:00");
  const [destinationColumn, setDestinationColumn] = useState("todo");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const openAnimationFrameRef = useRef<number | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);

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
    if (!mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mounted]);

  useEffect(() => {
    if (openAnimationFrameRef.current !== null) {
      cancelAnimationFrame(openAnimationFrameRef.current);
      openAnimationFrameRef.current = null;
    }
    if (closeTimeoutRef.current !== null) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    if (isOpen) {
      setMounted(true);
      setVisible(false);
      openAnimationFrameRef.current = requestAnimationFrame(() => {
        openAnimationFrameRef.current = requestAnimationFrame(() => {
          setVisible(true);
          openAnimationFrameRef.current = null;
        });
      });
      return;
    }

    setVisible(false);
    closeTimeoutRef.current = window.setTimeout(() => {
      setMounted(false);
      closeTimeoutRef.current = null;
    }, modalTransitionMs);
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (openAnimationFrameRef.current !== null) {
        cancelAnimationFrame(openAnimationFrameRef.current);
      }
      if (closeTimeoutRef.current !== null) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  if (!mounted) return null;

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

  return (
    <div
      className={`${styles.modalOverlay} ${visible ? styles.modalOverlayVisible : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
      onClick={onClose}
    >
      <div
        className={`${styles.modalContainer} ${visible ? styles.modalContainerVisible : ""}`}
        onClick={(e) => e.stopPropagation()}
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
                  <input
                    type="date"
                    value={deadlineDate}
                    onChange={(e) => setDeadlineDate(e.target.value)}
                    className={styles.inputControl}
                  />
                  <input
                    type="time"
                    value={deadlineTime}
                    onChange={(e) => setDeadlineTime(e.target.value)}
                    className={styles.inputControl}
                  />
                  <input
                    type="time"
                    value={deadlineUntil}
                    onChange={(e) => setDeadlineUntil(e.target.value)}
                    className={styles.inputControl}
                  />
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
