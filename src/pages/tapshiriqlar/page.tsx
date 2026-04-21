"use client";

import { useState, type DragEvent as ReactDragEvent } from "react";
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
import type {
  TaskModalInitialData,
  TaskModalSavePayload,
} from "./components/TaskViewModal";

const PLACEHOLDER_OPTS: SelectOption[] = [{ value: "", label: "Dəyəri seçin" }];

const DEMO_OPTS = (
  extra: { value: string; label: string }[],
): SelectOption[] => [...PLACEHOLDER_OPTS, ...extra];

interface KanbanCard {
  id: string;
  title: string;
  author: string;
  executor: string;
  counterparty: string;
  deadline: string;
  status: string;
  tag: string;
}

interface KanbanColumn {
  id: string;
  title: string;
  cards: KanbanCard[];
}

interface TaskFilterState {
  author: string;
  executor: string;
  counterparty: string;
  deadline: string;
  status: string;
  tag: string;
  taskName: string;
}

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
  const [kanbanColumns, setKanbanColumns] = useState<KanbanColumn[]>([
    { id: "backlog", title: "Backlog", cards: [] },
    { id: "todo", title: "To Do", cards: [] },
    { id: "in-progress", title: "In Progress", cards: [] },
    { id: "review", title: "Review", cards: [] },
    { id: "done", title: "Done", cards: [] },
  ]);
  const [dragState, setDragState] = useState<{
    cardId: string;
    sourceColumnId: string;
  } | null>(null);
  const [editingTask, setEditingTask] = useState<{
    cardId: string;
    columnId: string;
  } | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<TaskFilterState>({
    author: "",
    executor: "",
    counterparty: "",
    deadline: "",
    status: "",
    tag: "",
    taskName: "",
  });

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

  const handleTaskSave = (payload: TaskModalSavePayload) => {
    if (editingTask) {
      setKanbanColumns((prev) => {
        let currentCard: KanbanCard | null = null;
        const withoutCurrent = prev.map((column) => {
          if (column.id !== editingTask.columnId) return column;
          const nextCards = column.cards.filter((card) => {
            if (card.id === editingTask.cardId) {
              currentCard = card;
              return false;
            }
            return true;
          });
          return { ...column, cards: nextCards };
        });

        if (!currentCard) return withoutCurrent;

        const updatedCard: KanbanCard = {
          ...currentCard,
          title: payload.title,
          author: payload.author,
          executor: payload.executors.join(", "),
          counterparty: payload.counterparty,
          deadline: payload.deadlineDate,
          status: payload.destinationColumn,
        };

        return withoutCurrent.map((column) =>
          column.id === payload.destinationColumn
            ? { ...column, cards: [...column.cards, updatedCard] }
            : column,
        );
      });
      setEditingTask(null);
      setTaskModalOpen(false);
      dispatch(
        showNotification({
          message: "Tapşırıq yeniləndi.",
          type: "success",
          autoCloseDuration: 2800,
        }),
      );
      return;
    }

    const taskCard: KanbanCard = {
      id: crypto.randomUUID(),
      title: payload.title,
      author: payload.author,
      executor: payload.executors.join(", "),
      counterparty: payload.counterparty,
      deadline: payload.deadlineDate,
      status: payload.destinationColumn,
      tag: "",
    };

    setKanbanColumns((prev) =>
      prev.map((column) =>
        column.id === payload.destinationColumn
          ? { ...column, cards: [...column.cards, taskCard] }
          : column,
      ),
    );
    setTaskModalOpen(false);
    dispatch(
      showNotification({
        message: "Tapşırıq yaradıldı.",
        type: "success",
        autoCloseDuration: 2800,
      }),
    );
  };

  const handleOpenCreateTask = () => {
    setEditingTask(null);
    setTaskModalOpen(true);
  };

  const handleOpenEditTask = (cardId: string, columnId: string) => {
    setEditingTask({ cardId, columnId });
    setTaskModalOpen(true);
  };

  const editingTaskInitialData: TaskModalInitialData | null = (() => {
    if (!editingTask) return null;
    const sourceColumn = kanbanColumns.find(
      (column) => column.id === editingTask.columnId,
    );
    const card = sourceColumn?.cards.find((item) => item.id === editingTask.cardId);
    if (!card) return null;
    return {
      title: card.title,
      description: "",
      counterparty: card.counterparty,
      author: card.author,
      executors: card.executor
        ? card.executor.split(",").map((item) => item.trim())
        : [],
      deadlineDate: card.deadline,
      deadlineTime: "",
      destinationColumn: sourceColumn?.id ?? "todo",
    };
  })();

  const handleCardDragStart = (cardId: string, sourceColumnId: string) => {
    setDragState({ cardId, sourceColumnId });
  };

  const handleCardDrop = (targetColumnId: string) => {
    if (!dragState) return;
    if (dragState.sourceColumnId === targetColumnId) {
      setDragState(null);
      return;
    }

    let movedCard: KanbanCard | null = null;
    setKanbanColumns((prev) => {
      const withoutSource = prev.map((column) => {
        if (column.id !== dragState.sourceColumnId) return column;
        const nextCards = column.cards.filter((card) => {
          if (card.id === dragState.cardId) {
            movedCard = card;
            return false;
          }
          return true;
        });
        return { ...column, cards: nextCards };
      });
      if (!movedCard) return withoutSource;
      return withoutSource.map((column) =>
        column.id === targetColumnId
          ? { ...column, cards: [...column.cards, movedCard as KanbanCard] }
          : column,
      );
    });
    setDragState(null);
  };

  const getCardCount = (columnId: string) => {
    return getFilteredCardsByColumn(columnId).length;
  };

  const getCardsByColumn = (columnId: string) => {
    const column = kanbanColumns.find((item) => item.id === columnId);
    return column?.cards ?? [];
  };

  const kanbanColumnMeta = kanbanColumns.map((column) => ({
    id: column.id,
    title: column.title,
  }));

  const resetKanbanComposerOnViewChange = (nextMode: "list" | "kanban") => {
    setViewMode(nextMode);
    if (nextMode === "list") {
      setDragState(null);
    }
  };

  const onDropCardToColumn = (
    event: ReactDragEvent<HTMLDivElement>,
    columnId: string,
  ) => {
    event.preventDefault();
    handleCardDrop(columnId);
  };

  const onDragOverColumn = (event: ReactDragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const onDragEndCard = () => {
    setDragState(null);
  };

  const matchesFilters = (card: KanbanCard) => {
    if (appliedFilters.author && card.author !== appliedFilters.author) {
      return false;
    }
    if (appliedFilters.executor && card.executor !== appliedFilters.executor) {
      return false;
    }
    if (
      appliedFilters.counterparty &&
      card.counterparty !== appliedFilters.counterparty
    ) {
      return false;
    }
    if (appliedFilters.deadline && card.deadline !== appliedFilters.deadline) {
      return false;
    }
    if (appliedFilters.status && card.status !== appliedFilters.status) {
      return false;
    }
    if (appliedFilters.tag && card.tag !== appliedFilters.tag) {
      return false;
    }
    if (
      appliedFilters.taskName &&
      !card.title.toLowerCase().includes(appliedFilters.taskName.toLowerCase())
    ) {
      return false;
    }
    return true;
  };

  const getFilteredCardsByColumn = (columnId: string) =>
    getCardsByColumn(columnId).filter(matchesFilters);

  const handleApplyFilterForList = () => {
    if (viewMode !== "list") return;
    setAppliedFilters({
      author,
      executor,
      counterparty,
      deadline,
      status,
      tag,
      taskName,
    });
    dispatch(
      showNotification({
        message: "Filtr tətbiq edildi (demo).",
        type: "success",
        autoCloseDuration: 2200,
      }),
    );
  };

  const allFilteredCards = kanbanColumns.flatMap((column) =>
    getFilteredCardsByColumn(column.id).map((card) => ({
      ...card,
      columnId: column.id,
      columnTitle: column.title,
    })),
  );

  return (
    <div className={styles.container}>
      <NotificationModal />

      <TaskViewModal
        isOpen={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleTaskSave}
        initialData={editingTaskInitialData}
      />

      <div className={styles.header}>
        <div className={styles.headerRow}>
          <div className={styles.pageIntro}>
            <h1 className={styles.pageTitle}>Tapşırıqlar</h1>
            <p className={styles.pageSubtitle}>
              Tapşırıqları izləyin, filtr edin və operativ idarə edin.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenCreateTask}
            className={styles.addButton}
          >
            <FaPlus aria-hidden />
            Yeni tapşırıq
          </button>
        </div>

        <div className={styles.toolbarRow}>
          <div className={styles.viewSwitch}>
            <button
              type="button"
              onClick={() => resetKanbanComposerOnViewChange("kanban")}
              className={`${styles.viewButton} ${
                viewMode === "kanban"
                  ? styles.viewButtonActive
                  : styles.viewButtonInactive
              }`}
            >
              <FaThList aria-hidden />
              Kanban görünüşü
            </button>
            <button
              type="button"
              onClick={() => resetKanbanComposerOnViewChange("list")}
              className={`${styles.viewButton} ${
                viewMode === "list"
                  ? styles.viewButtonActive
                  : styles.viewButtonInactive
              }`}
            >
              <FaTh aria-hidden />
              Siyahı görünüşü
            </button>
          </div>

          {viewMode === "list" ? (
            <div className={styles.filterActions}>
              <button
                type="button"
                onClick={() => setFiltersVisible((value) => !value)}
                className={styles.filterButton}
              >
                <FaEyeSlash aria-hidden />
                {filtersVisible ? "Filtrləri gizlət" : "Filtrləri göstər"}
              </button>
              <button
                type="button"
                onClick={handleApplyFilterForList}
                className={styles.applyFilterButton}
              >
                <FaFilter aria-hidden />
                Filtri tətbiq et
              </button>
            </div>
          ) : null}
        </div>

        {viewMode === "list" ? (
          <div className={styles.filterBar}>
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
                  className={styles.filterInput}
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
                  className={styles.filterInput}
                  value={taskName}
                  onChange={(event) => setTaskName(event.target.value)}
                  placeholder="Axtar..."
                />
              </label>
            </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className={styles.contentPanel}>
        {viewMode === "list" ? (
          allFilteredCards.length ? (
            <div className={styles.listContainer}>
              {allFilteredCards.map((card) => (
                <article
                  key={card.id}
                  className={styles.listItem}
                  onClick={() => handleOpenEditTask(card.id, card.columnId)}
                >
                  <div className={styles.listItemMain}>
                    <p className={styles.listItemTitle}>{card.title}</p>
                    <p className={styles.listItemMeta}>
                      {card.author || "Müəllif seçilməyib"} ·{" "}
                      {card.executor || "İcraçı seçilməyib"} ·{" "}
                      {card.counterparty || "Kontragent seçilməyib"}
                    </p>
                  </div>
                  <div className={styles.listItemBadges}>
                    <span className={styles.listBadge}>{card.columnTitle}</span>
                    {card.deadline ? (
                      <span className={styles.listBadge}>{card.deadline}</span>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <FaTasks className={styles.emptyStateIcon} aria-hidden />
              <p className={styles.emptyStateTitle}>Tapşırıq siyahısı boşdur</p>
              <p className={styles.emptyStateText}>
                Yeni tapşırıq əlavə edərək iş axınını başlayın.
              </p>
            </div>
          )
        ) : (
          <div className={styles.kanbanBoard}>
            {kanbanColumnMeta.map((column) => (
              <div
                key={column.id}
                className={`${styles.kanbanColumn} ${
                  dragState ? styles.kanbanColumnDropZone : ""
                }`}
                onDrop={(event) => onDropCardToColumn(event, column.id)}
                onDragOver={onDragOverColumn}
              >
                <div className={styles.kanbanColumnHeader}>
                  <span>{column.title}</span>
                  <span className={styles.kanbanCount}>{getCardCount(column.id)}</span>
                </div>
                <div className={styles.kanbanColumnBody}>
                  {getFilteredCardsByColumn(column.id).length ? (
                    <div className={styles.cardStack}>
                      {getFilteredCardsByColumn(column.id).map((card) => (
                        <article
                          key={card.id}
                          className={styles.taskCard}
                          draggable
                          onClick={() => handleOpenEditTask(card.id, column.id)}
                          onDragStart={() => handleCardDragStart(card.id, column.id)}
                          onDragEnd={onDragEndCard}
                        >
                          <p className={styles.taskCardTitle}>{card.title}</p>
                          <p className={styles.taskCardMeta}>
                            {card.author || "Müəllif seçilməyib"} ·{" "}
                            {card.executor || "İcraçı seçilməyib"}
                          </p>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.kanbanEmptyText}>Siyahı boşdur</p>
                  )}

                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className={styles.footer}>
        <p className={styles.footerText}>Logistra Copyright © 2013-2026</p>
      </footer>
    </div>
  );
}
