"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppDispatch } from "../../common/store/hooks";
import { showNotification } from "../../common/store/modalSlice";
import { NotificationModal } from "../../common/components/NotificationModal";
import {
  SorgularActionBar,
  SorgularFilters,
  SorgularNewModal,
  SorgularPagination,
  SorgularTable,
  type NewSorguFormPayload,
} from "./components";
import { MOCK_SORGULAR } from "./data/mockSorgular";
import { useSorgularPagination } from "./hooks/useSorgularPagination";
import { applyFilters, filterByTab } from "./lib/filterSorgular";
import type { SelectOption } from "../../common/components/select/Select";
import type {
  FilterFormState,
  FilterSectionId,
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
    () => new Set(),
  );
  const [filterDraft, setFilterDraft] =
    useState<FilterFormState>(emptyFilterForm);
  const [appliedFilter, setAppliedFilter] =
    useState<FilterFormState>(emptyFilterForm);
  const [isNewOpen, setIsNewOpen] = useState(false);

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
    const names = [...new Set(MOCK_SORGULAR.map((r) => r.company))].sort();
    return [
      { value: "", label: "Hamısı" },
      ...names.map((n) => ({ value: n, label: n })),
    ];
  }, []);

  const tabRows = useMemo(() => filterByTab(MOCK_SORGULAR, subTab), [subTab]);
  const filteredRows = useMemo(
    () => applyFilters(tabRows, appliedFilter),
    [tabRows, appliedFilter],
  );

  const confirmedCount = useMemo(
    () => filteredRows.filter((r) => r.confirmed).length,
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

  const handleNewSubmit = (_payload: NewSorguFormPayload) => {
    setIsNewOpen(false);
    dispatch(
      showNotification({
        message: "Yeni sorğu yaradıldı (demo).",
        type: "success",
        autoCloseDuration: 3000,
      }),
    );
  };

  return (
    <div
      className="relative flex flex-col overflow-hidden bg-gray-50"
      style={{ height: "calc(100vh - 56px)" }}
    >
      <NotificationModal />

      <div className="shrink-0 space-y-3 mt-2 px-2">
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

      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto px-2 pb-2">
        <SorgularTable rows={paginatedRows} />
      </div>

      <div className="shrink-0 border-t bg-white">
        <SorgularPagination
          totalRows={filteredRows.length}
          currentPage={currentPage}
          totalPages={totalPages}
          getVisiblePages={getVisiblePages}
          onPageChange={setCurrentPage}
        />
      </div>

      <SorgularNewModal
        isOpen={isNewOpen}
        onClose={() => setIsNewOpen(false)}
        onSubmit={handleNewSubmit}
      />

      <div
        className={`absolute inset-0 z-40 transition-opacity duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isFilterPanelOpen
            ? "pointer-events-auto bg-slate-900/15 opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsFilterPanelOpen(false)}
        aria-hidden={!isFilterPanelOpen}
      />

      <aside
        className={`absolute inset-y-0 right-0 z-50 w-full max-w-[620px] border-l border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.12)] transition-transform duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform ${
          isFilterPanelOpen ? "translate-x-0" : "translate-x-full"
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
