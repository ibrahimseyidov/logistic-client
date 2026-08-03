"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FiPlus, FiUser } from "react-icons/fi";
import {
  createTaskAction,
  fetchTasksAction,
  updateTaskAction,
  type TaskDto,
} from "../../../common/actions/task.actions";
import { fetchUserDirectoryAction } from "../../../common/actions/user.actions";
import { useAuth } from "../../../common/contexts/AuthContext";
import { usePermissions } from "../../../common/hooks/usePermissions";
import { useAppDispatch } from "../../../common/store/hooks";
import { showNotification } from "../../../common/store/modalSlice";
import type { SelectOption } from "../../../common/components/select/Select";
import TaskViewModal from "../../../pages/tapshiriqlar/components/TaskViewModal";
import type {
  TaskModalInitialData,
  TaskModalSavePayload,
} from "../../../pages/tapshiriqlar/components/TaskViewModal";

type Props = {
  orderId?: number | null;
  queryId?: number | null;
  /** İcazə: modul + child (məs. sifarisler/order_tasks) */
  permModule?: string;
  permChild?: string;
};

const STATUS_OPTIONS: { value: string; label: string; color: string; bg: string }[] = [
  { value: "backlog", label: "Gözləmə", color: "#64748b", bg: "#f1f5f9" },
  { value: "todo", label: "Ediləcək", color: "#1d4ed8", bg: "#dbeafe" },
  { value: "in-progress", label: "İcrada", color: "#b45309", bg: "#fef3c7" },
  { value: "review", label: "Yoxlama", color: "#7c3aed", bg: "#ede9fe" },
  { value: "done", label: "Tamamlandı", color: "#15803d", bg: "#dcfce7" },
];

function executorLabel(task: TaskDto) {
  if (!task.executors?.length) return "—";
  return task.executors.map((e) => e.name || `#${e.id}`).join(", ");
}

function statusMeta(status: string) {
  return (
    STATUS_OPTIONS.find((s) => s.value === status) || {
      value: status,
      label: status,
      color: "#64748b",
      bg: "#f1f5f9",
    }
  );
}

export default function EntityTasksPanel({
  orderId,
  queryId,
  permModule,
  permChild,
}: Props) {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const { canCreate, canEdit } = usePermissions();
  const allowCreate = !permModule || canCreate(permModule, permChild);
  const allowEdit = !permModule || canEdit(permModule, permChild);
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [userOptions, setUserOptions] = useState<SelectOption[]>([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!orderId && !queryId) {
      setTasks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchTasksAction({
        ...(orderId ? { orderId } : {}),
        ...(queryId ? { queryId } : {}),
      });
      setTasks(data);
    } finally {
      setLoading(false);
    }
  }, [orderId, queryId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void fetchUserDirectoryAction().then((users) => {
      setUserOptions(users.map((u) => ({ value: String(u.id), label: u.name })));
    });
  }, []);

  const editing = useMemo(
    () => (editingId == null ? null : tasks.find((t) => t.id === editingId) || null),
    [editingId, tasks],
  );

  const initialData: TaskModalInitialData | null = editing
    ? {
        title: editing.title,
        description: editing.description || "",
        counterparty: editing.counterparty || "",
        author: editing.author?.name || "",
        executors: editing.executors || [],
        deadlineDate: editing.deadlineDate || "",
        deadlineTime: editing.deadlineTime || "",
        deadlineUntil: editing.deadlineUntil || "",
        destinationColumn: editing.status || "todo",
        recurring: editing.recurring,
        remindEnabled: editing.remindEnabled,
        remindWhen: editing.remindWhen,
        remindTime: editing.remindTime,
        checklist: (editing.checklist || []).map((c, idx) => ({
          id: c.id || String(idx),
          text: c.text,
          done: Boolean(c.done),
        })),
        files: editing.files || [],
      }
    : null;

  const handleSave = async (payload: TaskModalSavePayload) => {
    if (saving) return;
    if (editingId != null ? !allowEdit : !allowCreate) return;
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
        orderId: orderId ?? null,
        queryId: queryId ?? null,
      };

      if (editingId != null) {
        const updated = await updateTaskAction(editingId, body);
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        dispatch(
          showNotification({
            message: "Tapşırıq yeniləndi.",
            type: "success",
            autoCloseDuration: 2500,
          }),
        );
      } else {
        const created = await createTaskAction(body);
        setTasks((prev) => [created, ...prev]);
        dispatch(
          showNotification({
            message: "Tapşırıq yaradıldı.",
            type: "success",
            autoCloseDuration: 2500,
          }),
        );
      }
      setModalOpen(false);
      setEditingId(null);
    } catch {
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

  const changeStatus = async (task: TaskDto, status: string) => {
    if (task.status === status) return;
    const prevStatus = task.status;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status } : t)));
    try {
      const updated = await updateTaskAction(task.id, { status });
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: prevStatus } : t)),
      );
      dispatch(
        showNotification({
          message: "Status yenilənərkən xəta baş verdi.",
          type: "error",
          autoCloseDuration: 3000,
        }),
      );
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "2px solid #f1f5f9",
          paddingBottom: "0.75rem",
        }}
      >
        <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#1e293b" }}>
          Tapşırıqlar ({tasks.length})
        </h3>
        {allowCreate ? (
        <button
          type="button"
          onClick={() => {
            setEditingId(null);
            setModalOpen(true);
          }}
          style={{
            background: "#16a34a",
            color: "#ffffff",
            border: 0,
            borderRadius: "0.375rem",
            padding: "0.45rem 1rem",
            fontSize: "0.825rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.375rem",
          }}
        >
          <FiPlus />
          Tapşırıq əlavə et
        </button>
        ) : null}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          maxHeight: "450px",
          overflowY: "auto",
          paddingRight: "0.25rem",
        }}
      >
        {loading ? (
          <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.875rem", textAlign: "center" }}>
            Yüklənir...
          </p>
        ) : tasks.length === 0 ? (
          <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.875rem", textAlign: "center" }}>
            Hələ tapşırıq yoxdur
          </p>
        ) : (
          tasks.map((task) => {
            const meta = statusMeta(task.status || "todo");
            const isDone = task.status === "done";
            return (
              <div
                key={task.id}
                style={{
                  background: "#ffffff",
                  padding: "1.25rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                  cursor: allowEdit ? "pointer" : "default",
                }}
                onClick={() => {
                  if (!allowEdit) return;
                  setEditingId(task.id);
                  setModalOpen(true);
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: "0.925rem",
                        color: "#1e293b",
                        textDecoration: isDone ? "line-through" : "none",
                      }}
                    >
                      {task.title}
                    </span>
                    {task.description ? (
                      <span
                        style={{
                          fontSize: "0.825rem",
                          color: "#64748b",
                          textDecoration: isDone ? "line-through" : "none",
                        }}
                      >
                        {task.description.length > 70
                          ? `${task.description.slice(0, 70)}...`
                          : task.description}
                      </span>
                    ) : null}
                  </div>

                  <select
                    value={STATUS_OPTIONS.some((s) => s.value === task.status) ? task.status : "todo"}
                    disabled={!allowEdit}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      e.stopPropagation();
                      if (!allowEdit) return;
                      void changeStatus(task, e.target.value);
                    }}
                    style={{
                      flexShrink: 0,
                      border: `1px solid ${meta.color}33`,
                      background: meta.bg,
                      color: meta.color,
                      borderRadius: "0.4rem",
                      padding: "0.3rem 0.5rem",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      cursor: allowEdit ? "pointer" : "not-allowed",
                      maxWidth: "8.5rem",
                      opacity: allowEdit ? 1 : 0.7,
                    }}
                    aria-label="Status"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "0.725rem",
                    color: "#94a3b8",
                    borderTop: "1px dashed #f1f5f9",
                    paddingTop: "0.5rem",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <FiUser /> {executorLabel(task)}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {task.files?.length ? (
                      <span
                        style={{
                          background: "#eff6ff",
                          color: "#1d4ed8",
                          padding: "0.15rem 0.45rem",
                          borderRadius: "0.25rem",
                          fontWeight: 600,
                        }}
                      >
                        {task.files.length} fayl
                      </span>
                    ) : null}
                    {task.deadlineDate ? (
                      <span
                        style={{
                          background: "#fee2e2",
                          color: "#b91c1c",
                          padding: "0.15rem 0.45rem",
                          borderRadius: "0.25rem",
                          fontWeight: 600,
                        }}
                      >
                        Son: {task.deadlineDate}
                      </span>
                    ) : null}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <TaskViewModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingId(null);
        }}
        onSave={handleSave}
        initialData={initialData}
        userOptions={userOptions}
        authorLabel={user?.name || ""}
      />
    </div>
  );
}
