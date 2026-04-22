"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { NotificationModal } from "../../common/components/NotificationModal";
import Loading from "../../common/components/loading/Loading";
import type { SelectOption } from "../../common/components/select/Select";
import { useAppDispatch } from "../../common/store/hooks";
import { showNotification } from "../../common/store/modalSlice";
import {
  SorgularActionBar,
  SorgularFilters,
  SorgularNewModal,
  SorgularPagination,
  SorgularTable,
  type NewSorguFormPayload,
} from "./components";
import {
  createQueryAction,
  fetchQueriesAction,
} from "../../common/actions/query.actions";
import { useSorgularPagination } from "./hooks/useSorgularPagination";
import { applyFilters, filterByTab } from "./lib/filterSorgular";
import styles from "./sorgular.module.css";
import type {
  FilterFormState,
  FilterSectionId,
  LogisticQueryRow,
  SorguSubTab,
} from "./types/sorgu.types";
import { emptyFilterForm } from "./types/sorgu.types";

export default function SorgularPage() {
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const initialTab: SorguSubTab =
    requestedTab === "archive" || requestedTab === "offers"
      ? requestedTab
      : "active";

  const [subTab, setSubTab] = useState<SorguSubTab>(initialTab);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [activeSections, setActiveSections] = useState<Set<FilterSectionId>>(
    () => new Set(["id", "dates"]),
  );
  const [filterDraft, setFilterDraft] =
    useState<FilterFormState>(emptyFilterForm);
  const [appliedFilter, setAppliedFilter] =
    useState<FilterFormState>(emptyFilterForm);
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [rows, setRows] = useState<LogisticQueryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const nextTab: SorguSubTab =
      requestedTab === "archive" || requestedTab === "offers"
        ? requestedTab
        : "active";

    setSubTab((prev) => (prev === nextTab ? prev : nextTab));
  }, [requestedTab]);

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
    let ignore = false;
    setLoading(true);
    fetchQueriesAction(subTab)
      .then((data) => {
        if (!ignore) {
          setRows(data);
        }
      })
      .catch(() => {
        if (!ignore) {
          dispatch(
            showNotification({
              message: "Sorğular yüklənmədi.",
              type: "error",
              autoCloseDuration: 3000,
            }),
          );
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, [dispatch, subTab]);

  const toggleSection = useCallback((id: FilterSectionId) => {
    setActiveSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const onFilterChange = useCallback(
    (field: keyof FilterFormState, value: string) => {
      setFilterDraft((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const companyOptions: SelectOption[] = useMemo(() => {
    const names = [...new Set(rows.map((row) => row.company))].sort();
    return [
      { value: "", label: "Hamısı" },
      ...names.map((name) => ({ value: name, label: name })),
    ];
  }, [rows]);

  const tabRows = useMemo(() => filterByTab(rows, subTab), [rows, subTab]);

  const filteredRows = useMemo(
    () => applyFilters(tabRows, appliedFilter),
    [tabRows, appliedFilter],
  );

  const confirmedCount = useMemo(
    () => filteredRows.filter((row) => row.confirmed).length,
    [filteredRows],
  );

  const activeFilterCount = useMemo(
    () =>
      Object.values(appliedFilter).filter((value) => value.trim() !== "")
        .length,
    [appliedFilter],
  );

  const {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedRows,
    getVisiblePages,
  } = useSorgularPagination(filteredRows);

  useEffect(() => {
    setCurrentPage(1);
    setIsFilterPanelOpen(false);
  }, [subTab, setCurrentPage]);

  const handleApplyFilter = () => {
    setAppliedFilter({ ...filterDraft });
    setCurrentPage(1);
    setIsFilterPanelOpen(false);
  };

  const handleClear = () => {
    const empty = emptyFilterForm();
    setFilterDraft(empty);
    setAppliedFilter(empty);
    setCurrentPage(1);
  };

  const handleSaveTemplate = () => {
    dispatch(
      showNotification({
        message: "Filtr şablonu yadda saxlanıldı (demo).",
        type: "success",
        autoCloseDuration: 3000,
      }),
    );
  };

  const handleImportExcel = () => {
    dispatch(
      showNotification({
        message: "Excel idxal tezliklə əlavə olunacaq.",
        type: "info",
        autoCloseDuration: 3500,
      }),
    );
  };

  const handleExportExcel = () => {
    dispatch(
      showNotification({
        message: "Excel ixrac tezliklə əlavə olunacaq.",
        type: "info",
        autoCloseDuration: 3500,
      }),
    );
  };

  const handleNewSubmit = async (payload: NewSorguFormPayload) => {
    setIsNewOpen(false);

    try {
      const created = await createQueryAction(payload.fields);
      setRows((prev) => [created, ...prev]);
      dispatch(
        showNotification({
          message: "Yeni sorğu yaradıldı.",
          type: "success",
          autoCloseDuration: 3000,
        }),
      );
    } catch {
      dispatch(
        showNotification({
          message: "Sorğu yaradılmadı.",
          type: "error",
          autoCloseDuration: 3000,
        }),
      );
    }
  };

  return (
    <div className={styles.container}>
      <NotificationModal />

      <div className={styles.header}>
        <SorgularActionBar
          total={filteredRows.length}
          confirmedCount={confirmedCount}
          onNew={() => setIsNewOpen(true)}
          onOpenFilters={() => setIsFilterPanelOpen(true)}
          onImportExcel={handleImportExcel}
          onExportExcel={handleExportExcel}
          activeFilterCount={activeFilterCount}
        />
      </div>

      <div className={styles.body} style={{ position: "relative" }}>
        {!loading && <SorgularTable rows={paginatedRows} />}
        {loading && (
          <div className={styles.statePanel}>
            <Loading />
          </div>
        )}
      </div>

      {!loading ? (
        <div className={styles.footer}>
          <SorgularPagination
            totalRows={filteredRows.length}
            currentPage={currentPage}
            totalPages={totalPages}
            getVisiblePages={getVisiblePages}
            onPageChange={setCurrentPage}
          />
        </div>
      ) : null}

      <SorgularNewModal
        isOpen={isNewOpen}
        onClose={() => setIsNewOpen(false)}
        onSubmit={handleNewSubmit}
      />

      <div
        className={`${styles.overlay} ${
          isFilterPanelOpen ? styles.overlayOpen : ""
        }`}
        onClick={() => setIsFilterPanelOpen(false)}
        aria-hidden={!isFilterPanelOpen}
      />

      <aside
        className={`${styles.drawer} ${
          isFilterPanelOpen ? styles.drawerOpen : ""
        }`}
        aria-hidden={!isFilterPanelOpen}
      >
        <SorgularFilters
          activeSections={activeSections}
          toggleSection={toggleSection}
          filter={filterDraft}
          onFilterChange={onFilterChange}
          companyOptions={companyOptions}
          onClose={() => setIsFilterPanelOpen(false)}
          onClear={handleClear}
          onApplyFilter={handleApplyFilter}
          onSaveTemplate={handleSaveTemplate}
        />
      </aside>
    </div>
  );
}
