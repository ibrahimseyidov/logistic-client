"use client";

import { useState } from "react";
import { FaEyeSlash, FaFilter, FaPlus, FaTasks, FaTh, FaThList } from "react-icons/fa";
import { useAppDispatch } from "../../common/store/hooks";
import { showNotification } from "../../common/store/modalSlice";
import { NotificationModal } from "../../common/components/NotificationModal";
import Select from "../../common/components/select/Select";
import type { SelectOption } from "../../common/components/select/Select";
import TaskViewModal from "./components/TaskViewModal";

const PLACEHOLDER_OPTS: SelectOption[] = [{ value: "", label: "Dəyəri seçin" }];

const DEMO_OPTS = (extra: { value: string; label: string }[]): SelectOption[] => [
  ...PLACEHOLDER_OPTS,
  ...extra,
];

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

  const handleAdd = () => {
    setTaskModalOpen(true);
  };

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
    <div
      className="flex flex-col overflow-hidden pt-4 md:pt-6"
      style={{ height: "calc(100vh - 56px)" }}
    >
      <NotificationModal />

      <TaskViewModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSave={handleTaskSave}
        onDelete={handleTaskDelete}
      />

      <div className="shrink-0 space-y-3 px-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium shadow-sm transition-colors w-full sm:w-auto"
          >
            <FaPlus aria-hidden />
            Əlavə et
          </button>

          <div className="inline-flex rounded-lg border border-gray-300 bg-white p-0.5 shadow-sm self-stretch sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors flex-1 sm:flex-initial justify-center ${
                viewMode === "kanban"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <FaThList className="text-sm shrink-0" aria-hidden />
              Tapşırıqların kanbanı
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors flex-1 sm:flex-initial justify-center ${
                viewMode === "list"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <FaTh className="text-sm shrink-0" aria-hidden />
              Bütün tapşırıqlar
            </button>
          </div>
        </div>

        <div className="bg-gray-100 border border-gray-200 rounded-lg p-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setFiltersVisible((v) => !v)}
              className="inline-flex items-center gap-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded text-sm font-medium transition-colors"
            >
              <FaEyeSlash className="text-gray-500" aria-hidden />
              {filtersVisible ? "Gizlət" : "Göstər"}
            </button>
            <button
              type="button"
              onClick={handleApplyFilter}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors"
            >
              <FaFilter className="text-xs opacity-90" aria-hidden />
              Filtrdən keçir
            </button>
          </div>

          {filtersVisible && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7 gap-3 pt-1">
              <label className="flex flex-col gap-1 min-w-0">
                <span className="text-xs font-medium text-gray-600">Müəllif</span>
                <Select
                  value={author}
                  options={authorOptions}
                  onChange={setAuthor}
                  placeholder="Dəyəri seçin"
                />
              </label>
              <label className="flex flex-col gap-1 min-w-0">
                <span className="text-xs font-medium text-gray-600">İcraçı</span>
                <Select
                  value={executor}
                  options={executorOptions}
                  onChange={setExecutor}
                  placeholder="Dəyəri seçin"
                />
              </label>
              <label className="flex flex-col gap-1 min-w-0">
                <span className="text-xs font-medium text-gray-600">Kontragent</span>
                <Select
                  value={counterparty}
                  options={counterpartyOptions}
                  onChange={setCounterparty}
                  placeholder="Dəyəri seçin"
                />
              </label>
              <label className="flex flex-col gap-1 min-w-0">
                <span className="text-xs font-medium text-gray-600">Son müddət</span>
                <input
                  type="date"
                  className="rounded border border-gray-300 bg-white px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-200"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1 min-w-0">
                <span className="text-xs font-medium text-gray-600">Status</span>
                <Select
                  value={status}
                  options={statusOptions}
                  onChange={setStatus}
                  placeholder="Dəyəri seçin"
                />
              </label>
              <label className="flex flex-col gap-1 min-w-0">
                <span className="text-xs font-medium text-gray-600">Nişan</span>
                <Select value={tag} options={tagOptions} onChange={setTag} placeholder="Dəyəri seçin" />
              </label>
              <label className="flex flex-col gap-1 min-w-0 xl:col-span-2 2xl:col-span-1">
                <span className="text-xs font-medium text-gray-600">Tapşırığın adı</span>
                <input
                  type="text"
                  className="rounded border border-gray-300 bg-white px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-200"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  placeholder="Axtar..."
                />
              </label>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col mx-2 mb-1 rounded-lg border border-gray-200 bg-gray-50/80 overflow-hidden">
        {viewMode === "list" ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <p className="text-lg text-gray-500 font-medium">Siyahı boşdur</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col md:flex-row gap-3 p-3 min-h-0 overflow-x-auto">
            {["Gözləmədə", "İcrada", "Bitib"].map((title) => (
              <div
                key={title}
                className="flex-1 min-w-[220px] rounded-lg border border-dashed border-gray-300 bg-white/60 flex items-center justify-center py-12"
              >
                <div className="text-center space-y-1">
                  <FaTasks className="mx-auto text-gray-300 text-2xl mb-2" aria-hidden />
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
