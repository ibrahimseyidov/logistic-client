"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import styles from "./tapshiriqlar.module.css";
import {
  FaEdit,
  FaMinus,
  FaPlus,
  FaTrash,
} from "react-icons/fa";
import { FiFilter } from "react-icons/fi";
import { useAppDispatch } from "../../common/store/hooks";
import { showNotification } from "../../common/store/modalSlice";
import { NotificationModal } from "../../common/components/NotificationModal";
import type { SelectOption } from "../../common/components/select/Select";
import TaskViewModal from "./components/TaskViewModal";
import type {
  TaskModalInitialData,
  TaskModalSavePayload,
} from "./components/TaskViewModal";
import TaskFiltersDrawer from "./components/TaskFiltersDrawer";
import type { TaskFilterState } from "./components/TaskFiltersDrawer";
import sorguLayoutStyles from "../sorgular/sorgular.module.css";
import sorguActionBarStyles from "../sorgular/components/SorgularActionBar.module.css";
import sorguTableStyles from "../sorgular/components/SorgularTable.module.css";

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

const emptyTaskFilter = (): TaskFilterState => ({
  author: "",
  executor: "",
  counterparty: "",
  deadline: "",
  status: "",
  tag: "",
  taskName: "",
});

export default function TapshiriqlarPage() {
  const dispatch = useAppDispatch();
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  const [filterDraft, setFilterDraft] = useState<TaskFilterState>(emptyTaskFilter);
  const [kanbanColumns, setKanbanColumns] = useState<KanbanColumn[]>([
    { id: "backlog", title: "Backlog", cards: [] },
    { id: "todo", title: "To Do", cards: [] },
    { id: "in-progress", title: "In Progress", cards: [] },
    { id: "review", title: "Review", cards: [] },
    { id: "done", title: "Done", cards: [] },
  ]);
  const [editingTask, setEditingTask] = useState<{
    cardId: string;
    columnId: string;
  } | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<TaskFilterState>(emptyTaskFilter);

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
          ...(currentCard as KanbanCard),
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

  const allCardsWithColumn = kanbanColumns.flatMap((column) =>
    column.cards.map((card) => ({
      ...card,
      columnId: column.id,
      columnTitle: column.title,
    })),
  );

  const handleFilterChange = (field: keyof TaskFilterState, value: string) => {
    setFilterDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyFilterForList = () => {
    setAppliedFilters({ ...filterDraft });
    setIsFilterPanelOpen(false);
    dispatch(
      showNotification({
        message: "Filtr tətbiq edildi (demo).",
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
      Object.values(appliedFilters).filter((value) => value.trim() !== "").length,
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

  const allFilteredCards = allCardsWithColumn.filter(matchesFilters);

  return (
    <div className={sorguLayoutStyles.container}>
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

      <div className={sorguLayoutStyles.header}>
        <section className={sorguActionBarStyles.wrapper}>
          <div className={sorguActionBarStyles.group}>
            <button
              type="button"
              onClick={handleOpenCreateTask}
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
                <span className={sorguActionBarStyles.badge}>{activeFilterCount}</span>
              ) : null}
            </button>
          </div>
          <div className={sorguActionBarStyles.statsGroup}>
            <span className={sorguActionBarStyles.statPill}>
              Cəmi: {allFilteredCards.length}
            </span>
          </div>
          <div className={sorguActionBarStyles.group}>
            <button
              type="button"
              className={`${sorguActionBarStyles.buttonBase} ${sorguActionBarStyles.buttonSecondary}`}
            >
              Excel-dən idxal et
            </button>
            <button
              type="button"
              className={`${sorguActionBarStyles.buttonBase} ${sorguActionBarStyles.buttonSecondary}`}
            >
              Excel-ə ixrac et
            </button>
          </div>
        </section>
      </div>

      <div className={sorguLayoutStyles.body}>
        <table className={sorguTableStyles.table}>
          <thead className={sorguTableStyles.head}>
            <tr>
              <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min240}`}>
                Tapşırıq
              </th>
              <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min150}`}>
                Müəllif
              </th>
              <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min170}`}>
                İcraçı
              </th>
              <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min150}`}>
                Kontragent
              </th>
              <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min140}`}>
                Son tarix
              </th>
              <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min140}`}>
                Bölmə
              </th>
              <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min120}`}>
                Əməliyyatlar
              </th>
            </tr>
          </thead>
          <tbody>
            {allFilteredCards.length === 0 ? (
              <tr className={sorguTableStyles.rowEven}>
                <td
                  className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}
                  colSpan={7}
                >
                  Tapşırıq siyahısı boşdur
                </td>
              </tr>
            ) : (
              allFilteredCards.map((card, index) => (
                <tr
                  key={card.id}
                  className={index % 2 === 0 ? sorguTableStyles.rowEven : sorguTableStyles.rowOdd}
                >
                  <td
                    className={`${sorguTableStyles.cell} ${sorguTableStyles.bodyText} ${sorguTableStyles.center}`}
                  >
                    {card.title}
                  </td>
                  <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>
                    {card.author || <FaMinus className={sorguTableStyles.mutedText} />}
                  </td>
                  <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>
                    {card.executor || <FaMinus className={sorguTableStyles.mutedText} />}
                  </td>
                  <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>
                    {card.counterparty || <FaMinus className={sorguTableStyles.mutedText} />}
                  </td>
                  <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>
                    {card.deadline || <FaMinus className={sorguTableStyles.mutedText} />}
                  </td>
                  <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>
                    {card.columnTitle}
                  </td>
                  <td className={`${sorguTableStyles.actionCell} ${sorguTableStyles.center}`}>
                    <div className={sorguTableStyles.actionRow}>
                      <button
                        type="button"
                        className={`${sorguTableStyles.iconButton} ${sorguTableStyles.detailsButton}`}
                        onClick={() => handleOpenEditTask(card.id, card.columnId)}
                        title="Düzəliş et"
                        aria-label="Düzəliş et"
                      >
                        <FaEdit />
                      </button>
                      <button
                        type="button"
                        className={`${sorguTableStyles.iconButton} ${sorguTableStyles.deleteButton}`}
                        title="Sil"
                        aria-label="Sil"
                        onClick={() => {
                          setKanbanColumns((prev) =>
                            prev.map((column) =>
                              column.id === card.columnId
                                ? {
                                    ...column,
                                    cards: column.cards.filter((item) => item.id !== card.id),
                                  }
                                : column,
                            ),
                          );
                        }}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div
        className={`${styles.overlay} ${isFilterPanelOpen ? styles.overlayOpen : ""}`}
        onClick={() => setIsFilterPanelOpen(false)}
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
        <p className={styles.footerText}>Logistra Copyright © 2013-2026</p>
      </footer>
    </div>
  );
}
