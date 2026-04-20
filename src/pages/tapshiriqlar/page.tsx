"use client";

import { useState } from "react";
import styles from "./tapshiriqlar.module.css";
import {
  FaEyeSlash,
  FaFilter,
  FaPlus,
  FaTasks,
  FaTh,
  FaThList,
} from "react-icons/fa";
import { useAppDispatch } from "../../common/store/hooks";
import { showNotification } from "../../common/store/modalSlice";
import { NotificationModal } from "../../common/components/NotificationModal";
import Select from "../../common/components/select/Select";
import type { SelectOption } from "../../common/components/select/Select";
import TaskViewModal from "./components/TaskViewModal";

const PLACEHOLDER_OPTS: SelectOption[] = [{ value: "", label: "Dəyəri seçin" }];

const DEMO_OPTS = (
  extra: { value: string; label: string }[],
): SelectOption[] => [...PLACEHOLDER_OPTS, ...extra];

export default function TapshiriqlarPage() {
  const dispatch = useAppDispatch();
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [filtersVisible, setFiltersVisible] = useState(true);

  const [author, setAuthor] = useState("");
  const [executor, setExecutor] = useState("");
  const [counterparty, setCounterparty] = useState("");
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState("");
  const [tag, setTag] = useState("");
  const [taskName, setTaskName] = useState("");

  const authorOptions = DEMO_OPTS([
    { value: "u1", label: "Ulvi Adilzadə" },
    { value: "u2", label: "Nərgiz K." },
  ]);
  const executorOptions = DEMO_OPTS([
    { value: "e1", label: "Elçin Məmmədov" },
    { value: "e2", label: "Rəşad Hüseynov" },
  ]);
  const counterpartyOptions = DEMO_OPTS([
    { value: "c1", label: "Karat MMC" },
    { value: "c2", label: "Ziyafreight" },
  ]);
  const statusOptions = DEMO_OPTS([
    { value: "open", label: "Açıq" },
    { value: "progress", label: "İcrada" },
    { value: "done", label: "Bitib" },
  ]);
  const tagOptions = DEMO_OPTS([
    { value: "urgent", label: "Təcili" },
    { value: "finance", label: "Maliyyə" },
  ]);

  const handleTaskSave = () => {
    setTaskModalOpen(false);
    dispatch(
      showNotification({
        message: "Tapşırıq yadda saxlanıldı (demo).",
        type: "success",
        autoCloseDuration: 2800,
      }),
    );
  };

  const handleTaskDelete = () => {
    setTaskModalOpen(false);
    dispatch(
      showNotification({
        message: "Tapşırıq silindi (demo).",
        type: "info",
        autoCloseDuration: 2500,
      }),
    );
  };

  const handleApplyFilter = () => {
    dispatch(
      showNotification({
        message: "Filtr tətbiq edildi (demo).",
        type: "success",
        autoCloseDuration: 2200,
      }),
    );
  };

  return (
    <div className={styles.container}>
      <NotificationModal />

      <TaskViewModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSave={handleTaskSave}
        onDelete={handleTaskDelete}
      />

      <div className={styles.header}>
        <div className={styles.headerRow}>
          <button
            type="button"
            onClick={() => setTaskModalOpen(true)}
            className={styles.addButton}
          >
            <FaPlus aria-hidden />
            Əlavə et
          </button>

          <div className={styles.viewSwitch}>
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={`${styles.viewButton} ${
                viewMode === "kanban"
                  ? styles.viewButtonActive
                  : styles.viewButtonInactive
              }`}
            >
              <FaThList aria-hidden />
              Tapşırıqların kanbanı
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`${styles.viewButton} ${
                viewMode === "list"
                  ? styles.viewButtonActive
                  : styles.viewButtonInactive
              }`}
            >
              <FaTh aria-hidden />
              Bütün tapşırıqlar
            </button>
          </div>
        </div>

        <div className={styles.filterBar}>
          <div className={styles.filterActions}>
            <button
              type="button"
              onClick={() => setFiltersVisible((value) => !value)}
              className={styles.filterButton}
            >
              <FaEyeSlash aria-hidden />
              {filtersVisible ? "Gizlət" : "Göstər"}
            </button>
            <button
              type="button"
              onClick={handleApplyFilter}
              className={styles.applyFilterButton}
            >
              <FaFilter aria-hidden />
              Filtrdən keçir
            </button>
          </div>

          {filtersVisible ? (
            <div className={styles.filtersGrid}>
              <label className={styles.filterLabel}>
                <span className={styles.filterLabelText}>Müəllif</span>
                <Select
                  value={author}
                  options={authorOptions}
                  onChange={setAuthor}
                  placeholder="Dəyəri seçin"
                />
              </label>
              <label className={styles.filterLabel}>
                <span className={styles.filterLabelText}>İcraçı</span>
                <Select
                  value={executor}
                  options={executorOptions}
                  onChange={setExecutor}
                  placeholder="Dəyəri seçin"
                />
              </label>
              <label className={styles.filterLabel}>
                <span className={styles.filterLabelText}>Kontragent</span>
                <Select
                  value={counterparty}
                  options={counterpartyOptions}
                  onChange={setCounterparty}
                  placeholder="Dəyəri seçin"
                />
              </label>
              <label className={styles.filterLabel}>
                <span className={styles.filterLabelText}>Son müddət</span>
                <input
                  type="date"
                  className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  value={deadline}
                  onChange={(event) => setDeadline(event.target.value)}
                />
              </label>
              <label className={styles.filterLabel}>
                <span className={styles.filterLabelText}>Status</span>
                <Select
                  value={status}
                  options={statusOptions}
                  onChange={setStatus}
                  placeholder="Dəyəri seçin"
                />
              </label>
              <label className={styles.filterLabel}>
                <span className={styles.filterLabelText}>Nişan</span>
                <Select
                  value={tag}
                  options={tagOptions}
                  onChange={setTag}
                  placeholder="Dəyəri seçin"
                />
              </label>
              <label className={styles.filterLabel}>
                <span className={styles.filterLabelText}>Tapşırığın adı</span>
                <input
                  type="text"
                  className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  value={taskName}
                  onChange={(event) => setTaskName(event.target.value)}
                  placeholder="Axtar..."
                />
              </label>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mx-2 mb-1 flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-gray-200 bg-gray-50/80">
        {viewMode === "list" ? (
          <div className="flex flex-1 items-center justify-center p-8">
            <p className="text-lg font-medium text-gray-500">Siyahı boşdur</p>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-x-auto p-3 md:flex-row">
            {["Gözləmədə", "İcrada", "Bitib"].map((title) => (
              <div
                key={title}
                className="flex min-w-[220px] flex-1 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white/60 py-12"
              >
                <div className="space-y-1 text-center">
                  <FaTasks
                    className="mx-auto mb-2 text-2xl text-gray-300"
                    aria-hidden
                  />
                  <p className="text-sm font-medium text-gray-600">{title}</p>
                  <p className="text-xs text-gray-400">Boş</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="shrink-0 px-4 py-2 text-left">
        <p className="text-xs text-gray-400">Logistra Copyright © 2013–2026</p>
      </footer>
    </div>
  );
}
