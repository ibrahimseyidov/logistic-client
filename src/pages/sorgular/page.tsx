"use client";

import { useCallback, useMemo, useState } from "react";
import { useAppDispatch } from "../../common/store/hooks";
import { showNotification } from "../../common/store/modalSlice";
import { NotificationModal } from "../../common/components/NotificationModal";
import {
  SorgularActionBar,
  SorgularFilters,
  SorgularNewModal,
  SorgularPagination,
  SorgularSubTabs,
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
  const [subTab, setSubTab] = useState<SorguSubTab>("active");
  const [activeSections, setActiveSections] = useState<Set<FilterSectionId>>(
    () => new Set(["id", "dates"]),
  );
  const [filterDraft, setFilterDraft] = useState<FilterFormState>(emptyFilterForm);
  const [appliedFilter, setAppliedFilter] = useState<FilterFormState>(emptyFilterForm);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [isNewOpen, setIsNewOpen] = useState(false);

  const toggleSection = useCallback((id: FilterSectionId) => {
    setActiveSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const onFilterChange = useCallback((field: keyof FilterFormState, value: string) => {
    setFilterDraft((prev) => ({ ...prev, [field]: value }));
  }, []);

  const companyOptions: SelectOption[] = useMemo(() => {
    const names = [...new Set(MOCK_SORGULAR.map((r) => r.company))].sort();
    return [{ value: "", label: "Hamısı" }, ...names.map((n) => ({ value: n, label: n }))];
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

  const {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedRows,
    getVisiblePages,
  } = useSorgularPagination(filteredRows);

  const handleSubTab = (tab: SorguSubTab) => {
    setSubTab(tab);
    setCurrentPage(1);
    setSelectedIds(new Set());
  };

  const handleApplyFilter = () => {
    setAppliedFilter({ ...filterDraft });
    setCurrentPage(1);
    setSelectedIds(new Set());
  };

  const handleClear = () => {
    const empty = emptyFilterForm();
    setFilterDraft(empty);
    setAppliedFilter(empty);
    setCurrentPage(1);
    setSelectedIds(new Set());
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

  const toggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllPage = (ids: string[], checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => {
        if (checked) next.add(id);
        else next.delete(id);
      });
      return next;
    });
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
      className="flex flex-col overflow-hidden"
      style={{ height: "calc(100vh - 56px)" }}
    >
      <NotificationModal />

      <div className="shrink-0 space-y-3 mt-2 px-2">
        <SorgularSubTabs value={subTab} onChange={handleSubTab} />
        <SorgularFilters
          activeSections={activeSections}
          toggleSection={toggleSection}
          filter={filterDraft}
          onFilterChange={onFilterChange}
          companyOptions={companyOptions}
          onSaveTemplate={handleSaveTemplate}
        />
        <SorgularActionBar
          total={filteredRows.length}
          confirmedCount={confirmedCount}
          onNew={() => setIsNewOpen(true)}
          onClear={handleClear}
          onApplyFilter={handleApplyFilter}
          onImportExcel={handleImportExcel}
          onExportExcel={handleExportExcel}
        />
      </div>

      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto px-2 pb-2">
        <SorgularTable
          rows={paginatedRows}
          selectedIds={selectedIds}
          onToggleRow={toggleRow}
          onToggleAllPage={toggleAllPage}
        />
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
    </div>
  );
}
