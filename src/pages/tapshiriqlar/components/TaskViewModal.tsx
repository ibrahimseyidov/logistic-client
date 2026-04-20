"use client";

import { useEffect, useState } from "react";
import styles from "./TaskViewModal.module.css";
import {
  FaCloudUploadAlt,
  FaInfoCircle,
  FaPlus,
  FaSave,
  FaTimes,
  FaTrash,
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

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
}

const fieldBox = styles.fieldBox;

export default function TaskViewModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [kontragent, setKontragent] = useState("");
  const [department, setDepartment] = useState("");
  const [author, setAuthor] = useState("ulvi");
  const [executorTags, setExecutorTags] = useState<string[]>([
    "Ulvi Adilzadə (Satış şöbəsi)",
  ]);
  const [recurring, setRecurring] = useState(false);
  const [createdDate] = useState("2026-04-06");
  const [createdTime] = useState("22:00");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [deadlineTime, setDeadlineTime] = useState("");
  const [deadlineUntil, setDeadlineUntil] = useState("");
  const [remindEnabled, setRemindEnabled] = useState(true);
  const [remindWhen, setRemindWhen] = useState("day");
  const [remindTime, setRemindTime] = useState("10:00");

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

  return (
    <div
      className={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
      onClick={onClose}
    >
      <div
        className={styles.modalContainer}
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

              <div>
                <span className="mb-2 block text-xs font-medium text-gray-500">
                  Çeklist
                </span>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200"
                >
                  <FaPlus className="text-xs" aria-hidden />
                  Əlavə et
                </button>
              </div>

              <div>
                <span className="mb-2 block text-xs font-medium text-gray-500">
                  Əlavə edilmiş fayllar
                </span>
                <div
                  className={`flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50/80 px-4 py-8 text-center text-sm text-gray-500 transition-colors hover:border-gray-400 hover:bg-gray-50`}
                >
                  <FaCloudUploadAlt
                    className="mb-2 text-2xl text-gray-400"
                    aria-hidden
                  />
                  <span>Faylınızı sürüşdürün &amp; buraxın ya da seçin</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className={fieldBox}>
                <span className="mb-1 block text-xs font-medium text-gray-500">
                  Kontragent
                </span>
                <Select
                  value={kontragent}
                  options={KONTRAGENT_OPTS}
                  onChange={setKontragent}
                  placeholder="Dəyəri seçin"
                />
              </div>

              <div className={fieldBox}>
                <span className="mb-1 block text-xs font-medium text-gray-500">
                  Şöbə
                </span>
                <Select
                  value={department}
                  options={DEPT_OPTS}
                  onChange={setDepartment}
                  placeholder="Dəyəri seçin"
                />
              </div>

              <div className={fieldBox}>
                <span className="mb-1 block text-xs font-medium text-gray-500">
                  Müəllif
                </span>
                <Select
                  value={author}
                  options={AUTHOR_OPTS}
                  onChange={setAuthor}
                />
              </div>

              <div className={fieldBox}>
                <span className="mb-1 block text-xs font-medium text-gray-500">
                  İcraçı
                </span>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {executorTags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-900"
                    >
                      {t}
                      <button
                        type="button"
                        onClick={() => removeExecutorTag(t)}
                        className="rounded-full p-0.5 hover:bg-blue-200"
                        aria-label="Sil"
                      >
                        <FaTimes className="text-[10px]" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className={`${fieldBox} flex items-center gap-2`}>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-800">
                  <input
                    type="checkbox"
                    checked={recurring}
                    onChange={(e) => setRecurring(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  Təkrarlanan tapşırıq
                </label>
                <FaInfoCircle
                  className="text-blue-500"
                  title="Məlumat"
                  aria-hidden
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className={fieldBox}>
                  <span className="mb-1 block text-xs font-medium text-gray-500">
                    Yaradılması tarixi
                  </span>
                  <input
                    type="text"
                    readOnly
                    value={createdDate.split("-").reverse().join(".")}
                    className="w-full border-0 bg-transparent p-0 text-sm text-gray-900"
                  />
                </label>
                <label className={fieldBox}>
                  <span className="mb-1 block text-xs font-medium text-gray-500">
                    Vaxt
                  </span>
                  <input
                    type="text"
                    readOnly
                    value={createdTime}
                    className="w-full border-0 bg-transparent p-0 text-sm text-gray-900"
                  />
                </label>
              </div>

              <div>
                <span className="mb-1 block text-xs font-medium text-gray-500">
                  Son müddət
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="date"
                    value={deadlineDate}
                    onChange={(e) => setDeadlineDate(e.target.value)}
                    className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs text-gray-800"
                  />
                  <input
                    type="time"
                    value={deadlineTime}
                    onChange={(e) => setDeadlineTime(e.target.value)}
                    className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs text-gray-800"
                  />
                  <input
                    type="text"
                    value={deadlineUntil}
                    onChange={(e) => setDeadlineUntil(e.target.value)}
                    placeholder="Qədər"
                    className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs text-gray-800 placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div className={fieldBox}>
                <label className="mb-2 flex items-center gap-2 text-sm text-gray-800">
                  <input
                    type="checkbox"
                    checked={remindEnabled}
                    onChange={(e) => setRemindEnabled(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  Xatırlat
                  <FaInfoCircle className="text-blue-500" aria-hidden />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={remindWhen}
                    options={REMIND_OPTS}
                    onChange={setRemindWhen}
                  />
                  <input
                    type="time"
                    value={remindTime}
                    onChange={(e) => setRemindTime(e.target.value)}
                    className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3">
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <FaTrash className="text-gray-500" aria-hidden />
            Sil
          </button>
          <button
            type="button"
            onClick={onSave}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <FaSave aria-hidden />
            Yaddaşda saxla və çıx
          </button>
        </div>
      </div>
    </div>
  );
}
