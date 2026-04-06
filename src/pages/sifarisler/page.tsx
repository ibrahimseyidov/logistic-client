"use client";

import { useCallback, useMemo, useState } from "react";
import { useAppDispatch } from "../../common/store/hooks";
import { showNotification } from "../../common/store/modalSlice";
import { NotificationModal } from "../../common/components/NotificationModal";
import type { SelectOption } from "../../common/components/select/Select";
import {
  SifarisActionBar,
  SifarisFilters,
  SifarisPagination,
  SifarisSubTabs,
  SifarisTable,
  YukActionBar,
  YukFilters,
  YukTable,
  ReysFilters,
  ReysToolbar,
  ReysTable,
  EmekFilters,
  EmekSummaryBar,
  EmekTable,
} from "./components";
import { MOCK_SIFARISLER } from "./data/mockSifarisler";
import { MOCK_YUKLER } from "./data/mockYukler";
import { MOCK_REYSLER } from "./data/mockReysler";
import { MOCK_EMEK } from "./data/mockEmek";
import { aggregateSifarisStats, applySifarisFilters } from "./lib/filterSifarisler";
import { aggregateYukStats, applyYukFilters } from "./lib/filterYukler";
import {
  aggregateReysStats,
  applyReysFilters,
  filterByTransport,
} from "./lib/filterReysler";
import { aggregateEmekStats, applyEmekFilters } from "./lib/filterEmek";
import { useSifarisPagination } from "./hooks/useSifarisPagination";
import { useYukPagination } from "./hooks/useYukPagination";
import { useReysPagination } from "./hooks/useReysPagination";
import { useEmekPagination } from "./hooks/useEmekPagination";
import type {
  SifarisFilterFormState,
  SifarisFilterSectionId,
  SifarisSubTab,
} from "./types/sifaris.types";
import { emptySifarisFilter } from "./types/sifaris.types";
import type { YukFilterFormState, YukFilterSectionId } from "./types/yuk.types";
import { emptyYukFilter } from "./types/yuk.types";
import { YUK_USER_OPTIONS } from "./constants/yuk.constants";
import type {
  ReysFilterFormState,
  ReysFilterSectionId,
  ReysTransportMode,
} from "./types/reys.types";
import { emptyReysFilter } from "./types/reys.types";
import type { EmekFilterFormState, EmekFilterSectionId } from "./types/emek.types";
import { emptyEmekFilter } from "./types/emek.types";

const BULK_STATUS_OPTIONS: SelectOption[] = [
  { value: "", label: "Status" },
  { value: "planned", label: "Planlaşdırılıb" },
  { value: "progress", label: "Davam edir" },
  { value: "completed", label: "Tamamlandı" },
];

const YUK_ACCOUNT_OPTIONS: SelectOption[] = [
  { value: "", label: "Təfərrüatlı hesab irəli sür" },
  { value: "advance", label: "Avans hesabı" },
  { value: "closing", label: "Yekun hesab" },
];

const EMEK_SAVE_SELECTED_OPTIONS: SelectOption[] = [
  { value: "", label: "Seçilmişləri yaddaşda saxla" },
  { value: "template", label: "Şablon kimi saxla" },
];

export default function SifarislerPage() {
  const dispatch = useAppDispatch();
  const [subTab, setSubTab] = useState<SifarisSubTab>("orders");

  const [activeSections, setActiveSections] = useState<Set<SifarisFilterSectionId>>(
    () => new Set(["id", "dates"]),
  );
  const [filterDraft, setFilterDraft] = useState<SifarisFilterFormState>(emptySifarisFilter);
  const [appliedFilter, setAppliedFilter] = useState<SifarisFilterFormState>(emptySifarisFilter);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkStatus, setBulkStatus] = useState("");

  const [yukActiveSections, setYukActiveSections] = useState<Set<YukFilterSectionId>>(
    () => new Set(["id"]),
  );
  const [yukFilterDraft, setYukFilterDraft] = useState<YukFilterFormState>(emptyYukFilter);
  const [yukAppliedFilter, setYukAppliedFilter] = useState<YukFilterFormState>(emptyYukFilter);
  const [yukSelectedIds, setYukSelectedIds] = useState<Set<string>>(() => new Set());
  const [yukAccountAction, setYukAccountAction] = useState("");

  const [reysActiveSections, setReysActiveSections] = useState<Set<ReysFilterSectionId>>(
    () => new Set(["id", "dates"]),
  );
  const [reysFilterDraft, setReysFilterDraft] = useState<ReysFilterFormState>(emptyReysFilter);
  const [reysAppliedFilter, setReysAppliedFilter] = useState<ReysFilterFormState>(emptyReysFilter);
  const [reysTransportMode, setReysTransportMode] = useState<ReysTransportMode>("all");

  const [emekActiveSections, setEmekActiveSections] = useState<Set<EmekFilterSectionId>>(
    () => new Set(["id", "dates", "customers"]),
  );
  const [emekFilterDraft, setEmekFilterDraft] = useState<EmekFilterFormState>(emptyEmekFilter);
  const [emekAppliedFilter, setEmekAppliedFilter] = useState<EmekFilterFormState>(emptyEmekFilter);
  const [emekSelectedIds, setEmekSelectedIds] = useState<Set<string>>(() => new Set());
  const [emekSaveSelected, setEmekSaveSelected] = useState("");

  const toggleSection = useCallback((id: SifarisFilterSectionId) => {
    setActiveSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleYukSection = useCallback((id: YukFilterSectionId) => {
    setYukActiveSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleReysSection = useCallback((id: ReysFilterSectionId) => {
    setReysActiveSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleEmekSection = useCallback((id: EmekFilterSectionId) => {
    setEmekActiveSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const onFilterChange = useCallback(
    (field: keyof SifarisFilterFormState, value: string) => {
      setFilterDraft((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const onYukFilterChange = useCallback(
    (field: keyof YukFilterFormState, value: string) => {
      setYukFilterDraft((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const onReysFilterChange = useCallback(
    (field: keyof ReysFilterFormState, value: string) => {
      setReysFilterDraft((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const onEmekFilterChange = useCallback(
    (field: keyof EmekFilterFormState, value: string) => {
      setEmekFilterDraft((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const companyOptions: SelectOption[] = useMemo(() => {
    const names = [...new Set(MOCK_SIFARISLER.map((r) => r.company))].sort();
    return [{ value: "", label: "Hamısı" }, ...names.map((n) => ({ value: n, label: n }))];
  }, []);

  const reysCompanyOptions: SelectOption[] = useMemo(() => {
    const names = [...new Set(MOCK_REYSLER.map((r) => r.company))].sort();
    return [{ value: "", label: "Hamısı" }, ...names.map((n) => ({ value: n, label: n }))];
  }, []);

  const emekCompanyOptions: SelectOption[] = useMemo(() => {
    const names = [...new Set(MOCK_EMEK.map((r) => r.company))].sort();
    return [{ value: "", label: "Hamısı" }, ...names.map((n) => ({ value: n, label: n }))];
  }, []);

  const emekCustomerOptions: SelectOption[] = useMemo(() => {
    const names = [...new Set(MOCK_EMEK.map((r) => r.customer))].sort();
    return [{ value: "", label: "Hamısı" }, ...names.map((n) => ({ value: n, label: n }))];
  }, []);

  const emekCarrierOptions: SelectOption[] = useMemo(() => {
    const names = [...new Set(MOCK_EMEK.map((r) => r.carrier))].sort();
    return [{ value: "", label: "Hamısı" }, ...names.map((n) => ({ value: n, label: n }))];
  }, []);

  const filteredRows = useMemo(
    () => applySifarisFilters(MOCK_SIFARISLER, appliedFilter),
    [appliedFilter],
  );

  const stats = useMemo(() => aggregateSifarisStats(filteredRows), [filteredRows]);

  const {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedRows,
    getVisiblePages,
  } = useSifarisPagination(filteredRows);

  const yukFilteredRows = useMemo(
    () => applyYukFilters(MOCK_YUKLER, yukAppliedFilter),
    [yukAppliedFilter],
  );

  const yukStats = useMemo(() => aggregateYukStats(yukFilteredRows), [yukFilteredRows]);

  const {
    currentPage: yukPage,
    setCurrentPage: setYukPage,
    totalPages: yukTotalPages,
    paginatedRows: yukPaginated,
    getVisiblePages: yukGetVisiblePages,
  } = useYukPagination(yukFilteredRows);

  const reysFilteredRows = useMemo(() => {
    const after = applyReysFilters(MOCK_REYSLER, reysAppliedFilter);
    return filterByTransport(after, reysTransportMode);
  }, [reysAppliedFilter, reysTransportMode]);

  const reysStats = useMemo(() => aggregateReysStats(reysFilteredRows), [reysFilteredRows]);

  const {
    currentPage: reysPage,
    setCurrentPage: setReysPage,
    totalPages: reysTotalPages,
    paginatedRows: reysPaginated,
    getVisiblePages: reysGetVisiblePages,
  } = useReysPagination(reysFilteredRows);

  const emekFilteredRows = useMemo(
    () => applyEmekFilters(MOCK_EMEK, emekAppliedFilter),
    [emekAppliedFilter],
  );

  const emekStats = useMemo(() => aggregateEmekStats(emekFilteredRows), [emekFilteredRows]);

  const {
    currentPage: emekPage,
    setCurrentPage: setEmekPage,
    totalPages: emekTotalPages,
    paginatedRows: emekPaginated,
    getVisiblePages: emekGetVisiblePages,
  } = useEmekPagination(emekFilteredRows);

  const handleSubTab = (tab: SifarisSubTab) => {
    setSubTab(tab);
    setCurrentPage(1);
    setYukPage(1);
    setReysPage(1);
    setEmekPage(1);
    setSelectedIds(new Set());
    setYukSelectedIds(new Set());
    setEmekSelectedIds(new Set());
  };

  const handleApplyFilter = () => {
    setAppliedFilter({ ...filterDraft });
    setCurrentPage(1);
    setSelectedIds(new Set());
  };

  const handleClear = () => {
    const empty = emptySifarisFilter();
    setFilterDraft(empty);
    setAppliedFilter(empty);
    setCurrentPage(1);
    setSelectedIds(new Set());
  };

  const handleYukApplyFilter = () => {
    setYukAppliedFilter({ ...yukFilterDraft });
    setYukPage(1);
    setYukSelectedIds(new Set());
  };

  const handleYukClear = () => {
    const empty = emptyYukFilter();
    setYukFilterDraft(empty);
    setYukAppliedFilter(empty);
    setYukPage(1);
    setYukSelectedIds(new Set());
  };

  const handleReysApplyFilter = () => {
    setReysAppliedFilter({ ...reysFilterDraft });
    setReysPage(1);
  };

  const handleReysClear = () => {
    const empty = emptyReysFilter();
    setReysFilterDraft(empty);
    setReysAppliedFilter(empty);
    setReysTransportMode("all");
    setReysPage(1);
  };

  const handleReysSaveTemplate = () => {
    dispatch(
      showNotification({
        message: "Reys filtri şablonu yadda saxlanıldı (demo).",
        type: "success",
        autoCloseDuration: 3000,
      }),
    );
  };

  const handleReysExcel = () => {
    dispatch(
      showNotification({
        message: "Excel ixrac (demo).",
        type: "info",
        autoCloseDuration: 2500,
      }),
    );
  };

  const handleReysTransportChange = (mode: ReysTransportMode) => {
    setReysTransportMode(mode);
    setReysPage(1);
  };

  const handleEmekApplyFilter = () => {
    setEmekAppliedFilter({ ...emekFilterDraft });
    setEmekPage(1);
    setEmekSelectedIds(new Set());
  };

  const handleEmekClear = () => {
    const empty = emptyEmekFilter();
    setEmekFilterDraft(empty);
    setEmekAppliedFilter(empty);
    setEmekPage(1);
    setEmekSelectedIds(new Set());
  };

  const handleEmekSaveTemplate = () => {
    dispatch(
      showNotification({
        message: "Əmək haqqı filtri şablonu yadda saxlanıldı (demo).",
        type: "success",
        autoCloseDuration: 3000,
      }),
    );
  };

  const handleEmekExcel = () => {
    dispatch(
      showNotification({
        message: "Excel ixrac (demo).",
        type: "info",
        autoCloseDuration: 2500,
      }),
    );
  };

  const handleEmekPerformActions = () => {
    dispatch(
      showNotification({
        message: "Hərəkətlər yerinə yetirildi (demo).",
        type: "success",
        autoCloseDuration: 2800,
      }),
    );
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

  const handleYukSaveTemplate = () => {
    dispatch(
      showNotification({
        message: "Yük filtri şablonu yadda saxlanıldı (demo).",
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

  const handleNotify = () => {
    dispatch(
      showNotification({
        message: "Bildiriş göndərildi (demo).",
        type: "success",
        autoCloseDuration: 2500,
      }),
    );
  };

  const handleChangeStatus = () => {
    dispatch(
      showNotification({
        message: "Status dəyişikliyi (demo) — seçilmiş sətirlər.",
        type: "info",
        autoCloseDuration: 3000,
      }),
    );
  };

  const handleNewOrder = () => {
    dispatch(
      showNotification({
        message: "Yeni sifariş formu tezliklə əlavə olunacaq.",
        type: "info",
        autoCloseDuration: 3000,
      }),
    );
  };

  const handleYukTrackingImport = () => {
    dispatch(
      showNotification({
        message: "Tracking idxal (demo).",
        type: "info",
        autoCloseDuration: 2500,
      }),
    );
  };

  const handleYukExcel = () => {
    dispatch(
      showNotification({
        message: "Excel əməliyyatı (demo).",
        type: "info",
        autoCloseDuration: 2500,
      }),
    );
  };

  const handleYukPerformActions = () => {
    dispatch(
      showNotification({
        message: "Hərəkətlər yerinə yetirildi (demo).",
        type: "success",
        autoCloseDuration: 2800,
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

  const toggleYukRow = (id: string) => {
    setYukSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleYukAllPage = (ids: string[], checked: boolean) => {
    setYukSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => {
        if (checked) next.add(id);
        else next.delete(id);
      });
      return next;
    });
  };

  const toggleEmekRow = (id: string) => {
    setEmekSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleEmekAllPage = (ids: string[], checked: boolean) => {
    setEmekSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => {
        if (checked) next.add(id);
        else next.delete(id);
      });
      return next;
    });
  };

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{ height: "calc(100vh - 56px)" }}
    >
      <NotificationModal />

      <div className="shrink-0 space-y-3 mt-2 px-2">
        <SifarisSubTabs value={subTab} onChange={handleSubTab} />

        {subTab === "payroll" && (
          <>
            <EmekFilters
              activeSections={emekActiveSections}
              toggleSection={toggleEmekSection}
              filter={emekFilterDraft}
              onFilterChange={onEmekFilterChange}
              companyOptions={emekCompanyOptions}
              customerOptions={emekCustomerOptions}
              carrierOptions={emekCarrierOptions}
              onSaveTemplate={handleEmekSaveTemplate}
              onClear={handleEmekClear}
              onApplyFilter={handleEmekApplyFilter}
            />
            <EmekSummaryBar
              profitAzn={emekStats.profit}
              bonusAzn={emekStats.bonus}
              rewardAzn={emekStats.reward}
              saveSelectedValue={emekSaveSelected}
              onSaveSelectedChange={setEmekSaveSelected}
              saveSelectedOptions={EMEK_SAVE_SELECTED_OPTIONS}
              onExcel={handleEmekExcel}
              onPerformActions={handleEmekPerformActions}
            />
          </>
        )}

        {subTab === "orders" && (
          <>
            <SifarisFilters
              activeSections={activeSections}
              toggleSection={toggleSection}
              filter={filterDraft}
              onFilterChange={onFilterChange}
              companyOptions={companyOptions}
              onSaveTemplate={handleSaveTemplate}
            />
            <SifarisActionBar
              stats={stats}
              bulkStatus={bulkStatus}
              onBulkStatusChange={setBulkStatus}
              statusOptions={BULK_STATUS_OPTIONS}
              onNew={handleNewOrder}
              onClear={handleClear}
              onApplyFilter={handleApplyFilter}
              onNotify={handleNotify}
              onChangeStatus={handleChangeStatus}
              onImportExcel={handleImportExcel}
              onExportExcel={handleExportExcel}
            />
          </>
        )}

        {subTab === "voyages" && (
          <>
            <ReysFilters
              activeSections={reysActiveSections}
              toggleSection={toggleReysSection}
              filter={reysFilterDraft}
              onFilterChange={onReysFilterChange}
              companyOptions={reysCompanyOptions}
              onSaveTemplate={handleReysSaveTemplate}
              onClear={handleReysClear}
              onApplyFilter={handleReysApplyFilter}
            />
            <ReysToolbar
              transportMode={reysTransportMode}
              onTransportChange={handleReysTransportChange}
              count={reysStats.count}
              totalValueAzn={reysStats.totalValueAzn}
              onExcel={handleReysExcel}
            />
          </>
        )}

        {subTab === "loads" && (
          <>
            <YukFilters
              activeSections={yukActiveSections}
              toggleSection={toggleYukSection}
              filter={yukFilterDraft}
              onFilterChange={onYukFilterChange}
              userOptions={YUK_USER_OPTIONS}
              onSaveTemplate={handleYukSaveTemplate}
            />
            <YukActionBar
              stats={yukStats}
              accountAction={yukAccountAction}
              onAccountActionChange={setYukAccountAction}
              accountOptions={YUK_ACCOUNT_OPTIONS}
              onClear={handleYukClear}
              onApplyFilter={handleYukApplyFilter}
              onTrackingImport={handleYukTrackingImport}
              onExcel={handleYukExcel}
              onPerformActions={handleYukPerformActions}
            />
          </>
        )}
      </div>

      {subTab === "orders" && (
        <>
          <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto px-2 pb-2">
            <SifarisTable
              rows={paginatedRows}
              selectedIds={selectedIds}
              onToggleRow={toggleRow}
              onToggleAllPage={toggleAllPage}
            />
          </div>

          <div className="shrink-0 border-t bg-white">
            <SifarisPagination
              totalRows={filteredRows.length}
              currentPage={currentPage}
              totalPages={totalPages}
              getVisiblePages={getVisiblePages}
              onPageChange={setCurrentPage}
            />
          </div>
        </>
      )}

      {subTab === "voyages" && (
        <>
          <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto px-2 pb-2">
            <ReysTable rows={reysPaginated} />
          </div>

          <div className="shrink-0 border-t bg-white">
            <SifarisPagination
              totalRows={reysFilteredRows.length}
              currentPage={reysPage}
              totalPages={reysTotalPages}
              getVisiblePages={reysGetVisiblePages}
              onPageChange={setReysPage}
            />
          </div>
        </>
      )}

      {subTab === "loads" && (
        <>
          <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto px-2 pb-2">
            <YukTable
              rows={yukPaginated}
              selectedIds={yukSelectedIds}
              onToggleRow={toggleYukRow}
              onToggleAllPage={toggleYukAllPage}
            />
          </div>

          <div className="shrink-0 border-t bg-white">
            <SifarisPagination
              totalRows={yukFilteredRows.length}
              currentPage={yukPage}
              totalPages={yukTotalPages}
              getVisiblePages={yukGetVisiblePages}
              onPageChange={setYukPage}
            />
          </div>
        </>
      )}

      {subTab === "payroll" && (
        <>
          <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto px-2 pb-2">
            <EmekTable
              rows={emekPaginated}
              selectedIds={emekSelectedIds}
              onToggleRow={toggleEmekRow}
              onToggleAllPage={toggleEmekAllPage}
            />
          </div>

          <div className="shrink-0 border-t bg-white">
            <SifarisPagination
              totalRows={emekFilteredRows.length}
              currentPage={emekPage}
              totalPages={emekTotalPages}
              getVisiblePages={emekGetVisiblePages}
              onPageChange={setEmekPage}
            />
          </div>
        </>
      )}
    </div>
  );
}
