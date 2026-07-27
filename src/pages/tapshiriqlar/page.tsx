"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type DragEvent,
} from "react";
import styles from "./tapshiriqlar.module.css";
import { FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import { FiFilter } from "react-icons/fi";
import { useAppDispatch } from "../../common/store/hooks";
import { showNotification } from "../../common/store/modalSlice";
import type { SelectOption } from "../../common/components/select/Select";
import TaskViewModal from "./components/TaskViewModal";
import type {
  TaskModalInitialData,
  TaskModalSavePayload,
} from "./components/TaskViewModal";
import TaskFiltersDrawer from "./components/TaskFiltersDrawer";
import type { TaskFilterState } from "./components/TaskFiltersDrawer";
import { ConfirmModal } from "../../common/components/ConfirmModal";
import sorguLayoutStyles from "../sorgular/sorgular.module.css";
import sorguActionBarStyles from "../sorgular/components/SorgularActionBar.module.css";
import {
  createTaskAction,
  deleteTaskAction,
  fetchTasksAction,
  updateTaskAction,
  type TaskDto,
} from "../../common/actions/task.actions";
import { fetchUserDirectoryAction } from "../../common/actions/user.actions";
import { useAuth } from "../../common/contexts/AuthContext";
import Loading from "../../common/components/loading/Loading";

const BOARD_COLUMNS = [
  { id: "backlog", title: "Gözləmə" },
  { id: "todo", title: "Ediləcək" },
  { id: "in-progress", title: "İcrada" },
  { id: "review", title: "Yoxlama" },
  { id: "done", title: "Tamamlandı" },
] as const;

const emptyTaskFilter = (): TaskFilterState => ({
  author: "",
  executor: "",
  counterparty: "",
  deadline: "",
  status: "",
  tag: "",
  taskName: "",
});

function clipText(value: string, max: number) {
  const text = (value || "").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

function ownerNames(task: TaskDto) {
  if (task.executors?.length) {
    return task.executors.map((e) => e.name || `#${e.id}`);
  }
  if (task.author?.name) return [task.author.name];
  return [] as string[];
}

export default function TapshiriqlarPage() {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [userOptions, setUserOptions] = useState<SelectOption[]>([]);
  const [filterDraft, setFilterDraft] =
    useState<TaskFilterState>(emptyTaskFilter);
  const [appliedFilters, setAppliedFilters] =
    useState<TaskFilterState>(emptyTaskFilter);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [createStatus, setCreateStatus] = useState<string>("todo");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const authorOptions = useMemo(
    () => [{ value: "", label: "Dəyəri seçin" }, ...userOptions],
    [userOptions],
  );
  const executorOptions = authorOptions;
  const statusOptions: SelectOption[] = [
    { value: "", label: "Dəyəri seçin" },
    ...BOARD_COLUMNS.map((c) => ({ value: c.id, label: c.title })),
  ];
  const counterpartyOptions: SelectOption[] = [
    { value: "", label: "Dəyəri seçin" },
  ];
  const tagOptions: SelectOption[] = [{ value: "", label: "Dəyəri seçin" }];

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTasksAction();
      setTasks(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTasks();
    void fetchUserDirectoryAction().then((users) => {
      setUserOptions(
        users.map((u) => ({
          value: String(u.id),
          label: u.name,
        })),
      );
    });
  }, [loadTasks]);

  const editingTask = useMemo(
    () =>
      editingTaskId == null
        ? null
        : tasks.find((t) => t.id === editingTaskId) || null,
    [editingTaskId, tasks],
  );

  const editingTaskInitialData: TaskModalInitialData | null = editingTask
    ? {
        title: editingTask.title,
        description: editingTask.description || "",
        counterparty: editingTask.counterparty || "",
        author: editingTask.author?.name || "",
        executors: editingTask.executors || [],
        deadlineDate: editingTask.deadlineDate || "",
        deadlineTime: editingTask.deadlineTime || "",
        deadlineUntil: editingTask.deadlineUntil || "",
        destinationColumn: editingTask.status || "todo",
        recurring: editingTask.recurring,
        remindEnabled: editingTask.remindEnabled,
        remindWhen: editingTask.remindWhen,
        remindTime: editingTask.remindTime,
        checklist: (editingTask.checklist || []).map((c, idx) => ({
          id: c.id || String(idx),
          text: c.text,
          done: Boolean(c.done),
        })),
        files: editingTask.files || [],
      }
    : null;

  const handleTaskSave = async (payload: TaskModalSavePayload) => {
    if (saving) return;
    setSaving(true);
    try {
      const body = {
        title: payload.title,
        description: payload.description,
        status: payload.destinationColumn,
        executors: payload.executors,
        counterparty: payload.counterparty,
        deadlineDate: payload.deadlineDate || null,
        deadlineTime: payload.deadlineTime || null,
        deadlineUntil: payload.deadlineUntil || null,
        recurring: payload.recurring,
        remindEnabled: payload.remindEnabled,
        remindWhen: payload.remindWhen,
        remindTime: payload.remindTime,
        checklist: payload.checklist,
        files: payload.files || [],
      };

      if (editingTaskId != null) {
        const updated = await updateTaskAction(editingTaskId, body);
        setTasks((prev) =>
          prev.map((t) => (t.id === updated.id ? updated : t)),
        );
        dispatch(
          showNotification({
            message: "Tapşırıq yeniləndi.",
            type: "success",
            autoCloseDuration: 2800,
          }),
        );
      } else {
        const created = await createTaskAction(body);
        setTasks((prev) => [created, ...prev]);
        dispatch(
          showNotification({
            message: "Tapşırıq yaradıldı.",
            type: "success",
            autoCloseDuration: 2800,
          }),
        );
      }
      setEditingTaskId(null);
      setTaskModalOpen(false);
    } catch (err) {
      console.error(err);
      dispatch(
        showNotification({
          message: "Tapşırıq saxlanılarkən xəta baş verdi.",
          type: "error",
          autoCloseDuration: 3500,
        }),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleOpenCreateTask = (status = "todo") => {
    setCreateStatus(status);
    setEditingTaskId(null);
    setTaskModalOpen(true);
  };

  const handleOpenEditTask = (id: number) => {
    setEditingTaskId(id);
    setTaskModalOpen(true);
  };

  const moveTaskToColumn = async (taskId: number, status: string) => {
    const current = tasks.find((t) => t.id === taskId);
    if (!current || current.status === status) return;

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status } : t)),
    );

    try {
      const updated = await updateTaskAction(taskId, { status });
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      console.error(err);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, status: current.status } : t,
        ),
      );
      dispatch(
        showNotification({
          message: "Status dəyişdirilmədi.",
          type: "error",
          autoCloseDuration: 3000,
        }),
      );
    }
  };

  const onCardDragStart = (e: DragEvent, taskId: number) => {
    setDraggingId(taskId);
    e.dataTransfer.setData("text/plain", String(taskId));
    e.dataTransfer.effectAllowed = "move";
  };

  const onCardDragEnd = () => {
    setDraggingId(null);
    setDragOverColumn(null);
  };

  const onColumnDragOver = (e: DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(columnId);
  };

  const onColumnDrop = (e: DragEvent, columnId: string) => {
    e.preventDefault();
    const id = Number(e.dataTransfer.getData("text/plain") || draggingId);
    setDragOverColumn(null);
    setDraggingId(null);
    if (!Number.isFinite(id)) return;
    void moveTaskToColumn(id, columnId);
  };

  const fold = (value: string) =>
    String(value || "")
      .toLocaleLowerCase("tr-TR")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ı/g, "i")
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c");

  const matchesFilters = (task: TaskDto) => {
    if (appliedFilters.author) {
      const authorOpt = authorOptions.find(
        (o) => o.value === appliedFilters.author,
      );
      const authorNeedle = fold(authorOpt?.label || appliedFilters.author);
      const authorMatch =
        String(task.authorId) === appliedFilters.author ||
        fold(task.author?.name || "") === authorNeedle;
      if (!authorMatch) return false;
    }
    if (appliedFilters.executor) {
      const executorOpt = executorOptions.find(
        (o) => o.value === appliedFilters.executor,
      );
      const executorNeedle = fold(
        executorOpt?.label || appliedFilters.executor,
      );
      const ok = (task.executors || []).some((e) => {
        const idMatch = String(e.id) === String(appliedFilters.executor);
        const nameFolded = fold(e.name || "");
        return idMatch || nameFolded === executorNeedle;
      });
      if (!ok) return false;
    }
    if (
      appliedFilters.counterparty &&
      task.counterparty !== appliedFilters.counterparty
    ) {
      return false;
    }
    if (
      appliedFilters.deadline &&
      task.deadlineDate !== appliedFilters.deadline
    ) {
      return false;
    }
    if (appliedFilters.status && task.status !== appliedFilters.status) {
      return false;
    }
    if (
      appliedFilters.taskName &&
      !task.title.toLowerCase().includes(appliedFilters.taskName.toLowerCase())
    ) {
      return false;
    }
    return true;
  };

  const handleFilterChange = (field: keyof TaskFilterState, value: string) => {
    setFilterDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyFilterForList = () => {
    setAppliedFilters({ ...filterDraft });
    setIsFilterPanelOpen(false);
    dispatch(
      showNotification({
        message: "Filtr tətbiq edildi.",
        type: "success",
        autoCloseDuration: 2200,
      }),
    );
  };

  const handleClearFilterForList = () => {
    const empty = emptyTaskFilter();
    setFilterDraft(empty);
    setAppliedFilters(empty);
  };

  const activeFilterCount = useMemo(
    () =>
      Object.values(appliedFilters).filter((value) => value.trim() !== "")
        .length,
    [appliedFilters],
  );

  useEffect(() => {
    if (!isFilterPanelOpen) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFilterPanelOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFilterPanelOpen]);

  useEffect(() => {
    if (!isFilterPanelOpen) return undefined;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [isFilterPanelOpen]);

  const filteredTasks = tasks.filter(matchesFilters);

  const tasksByColumn = useMemo(() => {
    const map: Record<string, TaskDto[]> = {};
    for (const col of BOARD_COLUMNS) map[col.id] = [];
    for (const task of filteredTasks) {
      const key = map[task.status] ? task.status : "todo";
      map[key].push(task);
    }
    return map;
  }, [filteredTasks]);

  const confirmDelete = async () => {
    if (taskToDelete == null) return;
    try {
      await deleteTaskAction(taskToDelete);
      setTasks((prev) => prev.filter((t) => t.id !== taskToDelete));
      dispatch(
        showNotification({
          message: "Tapşırıq silindi.",
          type: "success",
          autoCloseDuration: 2500,
        }),
      );
    } catch (err) {
      console.error(err);
      dispatch(
        showNotification({
          message: "Tapşırıq silinərkən xəta baş verdi.",
          type: "error",
          autoCloseDuration: 3500,
        }),
      );
    } finally {
      setDeleteConfirmOpen(false);
      setTaskToDelete(null);
    }
  };

  if (loading) {
    return <Loading />;
  }

  const createInitialData: TaskModalInitialData | null =
    editingTaskId == null
      ? {
          title: "",
          description: "",
          counterparty: "",
          author: user?.name || "",
          executors: [],
          deadlineDate: "",
          deadlineTime: "",
          deadlineUntil: "",
          destinationColumn: createStatus,
          recurring: false,
          remindEnabled: false,
          remindWhen: "same-day",
          remindTime: "09:00",
          checklist: [],
        }
      : editingTaskInitialData;

  return (
    <div className={`${sorguLayoutStyles.container} ${styles.pageRoot}`}>
      <TaskViewModal
        key={
          editingTaskId != null
            ? `edit-${editingTaskId}`
            : `new-${createStatus}`
        }
        isOpen={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false);
          setEditingTaskId(null);
        }}
        onSave={handleTaskSave}
        initialData={createInitialData}
        userOptions={userOptions}
        authorLabel={user?.name || ""}
      />

      <div className={sorguLayoutStyles.header}>
        <section className={sorguActionBarStyles.wrapper}>
          <div className={sorguActionBarStyles.group}>
            <button
              type="button"
              onClick={() => handleOpenCreateTask("todo")}
              className={`${sorguActionBarStyles.buttonBase} ${sorguActionBarStyles.buttonPrimary}`}
            >
              <FaPlus aria-hidden />
              Yeni tapşırıq
            </button>
            <button
              type="button"
              onClick={() => setIsFilterPanelOpen(true)}
              className={`${sorguActionBarStyles.buttonBase} ${sorguActionBarStyles.buttonSecondary}`}
            >
              <FiFilter aria-hidden />
              Filtrlər
              {activeFilterCount > 0 ? (
                <span className={sorguActionBarStyles.badge}>
                  {activeFilterCount}
                </span>
              ) : null}
            </button>
          </div>
          <div className={sorguActionBarStyles.statsGroup}>
            <span className={sorguActionBarStyles.statPill}>
              Cəmi: {filteredTasks.length}
            </span>
          </div>
        </section>
      </div>

      <div className={`${sorguLayoutStyles.body} ${styles.boardBody}`}>
        <div className={styles.kanbanBoard}>
          {BOARD_COLUMNS.map((column) => {
            const columnTasks = tasksByColumn[column.id] || [];
            return (
              <section
                key={column.id}
                className={`${styles.kanbanColumn} ${styles.kanbanColumnDropZone} ${
                  dragOverColumn === column.id ? styles.kanbanColumnActive : ""
                }`}
                onDragOver={(e) => onColumnDragOver(e, column.id)}
                onDragLeave={() =>
                  setDragOverColumn((prev) =>
                    prev === column.id ? null : prev,
                  )
                }
                onDrop={(e) => onColumnDrop(e, column.id)}
              >
                <header className={styles.kanbanColumnHeader}>
                  <span>{column.title}</span>
                  <span className={styles.kanbanCount}>
                    {columnTasks.length}
                  </span>
                </header>

                <div className={styles.kanbanColumnBody}>
                  <button
                    type="button"
                    className={styles.createTriggerButton}
                    onClick={() => handleOpenCreateTask(column.id)}
                  >
                    + Kart əlavə et
                  </button>

                  <div className={styles.cardStack}>
                    {columnTasks.length === 0 ? (
                      <p className={styles.kanbanEmptyText}>Boş</p>
                    ) : (
                      columnTasks.map((task) => (
                        <article
                          key={task.id}
                          className={`${styles.taskCard} ${
                            draggingId === task.id
                              ? styles.taskCardDragging
                              : ""
                          }`}
                          draggable
                          onDragStart={(e) => onCardDragStart(e, task.id)}
                          onDragEnd={onCardDragEnd}
                          onDoubleClick={() => handleOpenEditTask(task.id)}
                        >
                          <div className={styles.taskCardTop}>
                            <h3
                              className={styles.taskCardTitle}
                              title={task.title}
                            >
                              {clipText(task.title, 48)}
                            </h3>
                            <div className={styles.taskCardActions}>
                              <button
                                type="button"
                                className={styles.cardIconBtn}
                                title="Düzəliş et"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditTask(task.id);
                                }}
                              >
                                <FaEdit />
                              </button>
                              <button
                                type="button"
                                className={`${styles.cardIconBtn} ${styles.cardIconDanger}`}
                                title="Sil"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTaskToDelete(task.id);
                                  setDeleteConfirmOpen(true);
                                }}
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </div>

                          {task.description ? (
                            <p
                              className={styles.taskCardDesc}
                              title={task.description}
                            >
                              {clipText(task.description, 80)}
                            </p>
                          ) : null}

                          <div className={styles.ownerRow}>
                            {ownerNames(task).length ? (
                              ownerNames(task).map((name) => (
                                <span
                                  key={`${task.id}-${name}`}
                                  className={styles.ownerBadge}
                                  title={name}
                                >
                                  {clipText(name, 22)}
                                </span>
                              ))
                            ) : (
                              <span className={styles.ownerEmpty}>
                                Təyin olunmayıb
                              </span>
                            )}
                          </div>

                          {task.author?.name ? (
                            <p
                              className={styles.taskCardMeta}
                              title={task.author.name}
                            >
                              Müəllif: {clipText(task.author.name, 28)}
                            </p>
                          ) : null}
                          {task.deadlineDate ? (
                            <p className={styles.taskCardDeadline}>
                              Son tarix: {task.deadlineDate}
                              {task.deadlineTime ? ` ${task.deadlineTime}` : ""}
                            </p>
                          ) : null}
                          {task.counterparty ? (
                            <p
                              className={styles.taskCardMeta}
                              title={task.counterparty}
                            >
                              Kontragent: {clipText(task.counterparty, 28)}
                            </p>
                          ) : null}
                        </article>
                      ))
                    )}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <div
        className={`${styles.overlay} ${isFilterPanelOpen ? styles.overlayOpen : ""}`}
        aria-hidden={!isFilterPanelOpen}
      />

      <aside
        className={`${styles.drawer} ${isFilterPanelOpen ? styles.drawerOpen : ""}`}
        aria-hidden={!isFilterPanelOpen}
      >
        <TaskFiltersDrawer
          filter={filterDraft}
          authorOptions={authorOptions}
          executorOptions={executorOptions}
          counterpartyOptions={counterpartyOptions}
          statusOptions={statusOptions}
          tagOptions={tagOptions}
          onFilterChange={handleFilterChange}
          onClose={() => setIsFilterPanelOpen(false)}
          onClear={handleClearFilterForList}
          onApplyFilter={handleApplyFilterForList}
        />
      </aside>

      <footer className={sorguLayoutStyles.footer}>
        <p className={styles.footerText}>Ziyalog Copyright © 2013-2026</p>
      </footer>

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        title="Tapşırığı sil"
        message="Bu tapşırığı silmək istədiyinizə əminsiniz?"
        onConfirm={() => {
          void confirmDelete();
        }}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setTaskToDelete(null);
        }}
      />
    </div>
  );
}
