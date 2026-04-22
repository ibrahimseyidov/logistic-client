// Tüm alanları string'e çeviren yardımcı fonksiyon
// Zorunlu alanlar eksikse bile boş string olarak ekle
const REQUIRED_FIELDS = [
  "number",
  "customerOrderRef",
  "status",
  "statusAssignedAt",
  "purpose",
  "transportType",
  "cargoInfo",
  "loadPlace",
  "recipient",
  "unloadPlace",
  "loadDate",
  "unloadDate",
  "seller",
  "priceOffers",
];

function toStringFields(fields: Record<string, any>) {
  const result: Record<string, string> = {};
  for (const key of REQUIRED_FIELDS) {
    result[key] = fields[key] == null ? "" : String(fields[key]);
  }
  // Diğer alanları da ekle (varsa)
  for (const [k, v] of Object.entries(fields)) {
    if (!(k in result)) {
      result[k] = v == null ? "" : String(v);
    }
  }
  return result;
}
("use client");

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppDispatch } from "../../common/store/hooks";
import { showNotification } from "../../common/store/modalSlice";
import { NotificationModal } from "../../common/components/NotificationModal";
import Loading from "../../common/components/loading/Loading";
import type { SelectOption } from "../../common/components/select/Select";
import {
  SifarisActionBar,
  SifarisFilters,
  SifarisNewModal,
  SifarisPagination,
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
  type NewSifarisFormPayload,
} from "./components";
import styles from "./sifarisler.module.css";
import { MOCK_SIFARISLER } from "./data/mockSifarisler";
import { MOCK_YUKLER } from "./data/mockYukler";
import { MOCK_REYSLER } from "./data/mockReysler";
import { MOCK_EMEK } from "./data/mockEmek";
import {
  aggregateSifarisStats,
  applySifarisFilters,
} from "./lib/filterSifarisler";
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
import type {
  EmekFilterFormState,
  EmekFilterSectionId,
} from "./types/emek.types";
import { emptyEmekFilter } from "./types/emek.types";
import axios from "axios";

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
  // Data yükleniyor state'i
  const [loading, setLoading] = useState(true);
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const initialTab: SifarisSubTab =
    requestedTab === "loads" ||
    requestedTab === "voyages" ||
    requestedTab === "payroll"
      ? requestedTab
      : "orders";
  const [subTab, setSubTab] = useState<SifarisSubTab>(initialTab);
  const [openFilterPanel, setOpenFilterPanel] = useState<SifarisSubTab | null>(
    null,
  );
  const [isSifarisNewOpen, setIsSifarisNewOpen] = useState(false);

  const [activeSections, setActiveSections] = useState<
    Set<SifarisFilterSectionId>
  >(() => new Set(["id", "dates"]));
  const [filterDraft, setFilterDraft] =
    useState<SifarisFilterFormState>(emptySifarisFilter);
  const [appliedFilter, setAppliedFilter] =
    useState<SifarisFilterFormState>(emptySifarisFilter);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const [yukActiveSections, setYukActiveSections] = useState<
    Set<YukFilterSectionId>
  >(() => new Set(["id"]));
  const [yukFilterDraft, setYukFilterDraft] =
    useState<YukFilterFormState>(emptyYukFilter);
  const [yukAppliedFilter, setYukAppliedFilter] =
    useState<YukFilterFormState>(emptyYukFilter);
  const [yukSelectedIds, setYukSelectedIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [yukAccountAction, setYukAccountAction] = useState("");

  const [reysActiveSections, setReysActiveSections] = useState<
    Set<ReysFilterSectionId>
  >(() => new Set(["id", "dates"]));
  const [reysFilterDraft, setReysFilterDraft] =
    useState<ReysFilterFormState>(emptyReysFilter);
  const [reysAppliedFilter, setReysAppliedFilter] =
    useState<ReysFilterFormState>(emptyReysFilter);
  const [reysTransportMode, setReysTransportMode] =
    useState<ReysTransportMode>("all");

  const [emekActiveSections, setEmekActiveSections] = useState<
    Set<EmekFilterSectionId>
  >(() => new Set(["id", "dates", "customers"]));
  const [emekFilterDraft, setEmekFilterDraft] =
    useState<EmekFilterFormState>(emptyEmekFilter);
  const [emekAppliedFilter, setEmekAppliedFilter] =
    useState<EmekFilterFormState>(emptyEmekFilter);
  const [emekSelectedIds, setEmekSelectedIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [emekSaveSelected, setEmekSaveSelected] = useState("");

  useEffect(() => {
    const nextTab: SifarisSubTab =
      requestedTab === "loads" ||
      requestedTab === "voyages" ||
      requestedTab === "payroll"
        ? requestedTab
        : "orders";

    setSubTab((prev) => (prev === nextTab ? prev : nextTab));
  }, [requestedTab]);

  useEffect(() => {
    if (!openFilterPanel) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenFilterPanel(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openFilterPanel]);

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
    return [
      { value: "", label: "Hamısı" },
      ...names.map((n) => ({ value: n, label: n })),
    ];
  }, []);

  const reysCompanyOptions: SelectOption[] = useMemo(() => {
    const names = [...new Set(MOCK_REYSLER.map((r) => r.company))].sort();
    return [
      { value: "", label: "Hamısı" },
      ...names.map((n) => ({ value: n, label: n })),
    ];
  }, []);

  const emekCompanyOptions: SelectOption[] = useMemo(() => {
    const names = [...new Set(MOCK_EMEK.map((r) => r.company))].sort();
    return [
      { value: "", label: "Hamısı" },
      ...names.map((n) => ({ value: n, label: n })),
    ];
  }, []);

  const emekCustomerOptions: SelectOption[] = useMemo(() => {
    const names = [...new Set(MOCK_EMEK.map((r) => r.customer))].sort();
    return [
      { value: "", label: "Hamısı" },
      ...names.map((n) => ({ value: n, label: n })),
    ];
  }, []);

  const emekCarrierOptions: SelectOption[] = useMemo(() => {
    const names = [...new Set(MOCK_EMEK.map((r) => r.carrier))].sort();
    return [
      { value: "", label: "Hamısı" },
      ...names.map((n) => ({ value: n, label: n })),
    ];
  }, []);

  const filteredRows = useMemo(
    () => applySifarisFilters(MOCK_SIFARISLER, appliedFilter),
    [appliedFilter],
  );

  const stats = useMemo(
    () => aggregateSifarisStats(filteredRows),
    [filteredRows],
  );

  const sifarisActiveFilterCount = useMemo(
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
  } = useSifarisPagination(filteredRows);

  const yukFilteredRows = useMemo(
    () => applyYukFilters(MOCK_YUKLER, yukAppliedFilter),
    [yukAppliedFilter],
  );

  const yukStats = useMemo(
    () => aggregateYukStats(yukFilteredRows),
    [yukFilteredRows],
  );

  const yukActiveFilterCount = useMemo(
    () =>
      Object.values(yukAppliedFilter).filter((value) => value.trim() !== "")
        .length,
    [yukAppliedFilter],
  );

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

  const reysStats = useMemo(
    () => aggregateReysStats(reysFilteredRows),
    [reysFilteredRows],
  );

  const reysActiveFilterCount = useMemo(
    () =>
      Object.values(reysAppliedFilter).filter((value) => value.trim() !== "")
        .length,
    [reysAppliedFilter],
  );

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

  const emekStats = useMemo(
    () => aggregateEmekStats(emekFilteredRows),
    [emekFilteredRows],
  );

  const emekActiveFilterCount = useMemo(
    () =>
      Object.values(emekAppliedFilter).filter((value) => value.trim() !== "")
        .length,
    [emekAppliedFilter],
  );

  const {
    currentPage: emekPage,
    setCurrentPage: setEmekPage,
    totalPages: emekTotalPages,
    paginatedRows: emekPaginated,
    getVisiblePages: emekGetVisiblePages,
  } = useEmekPagination(emekFilteredRows);

  useEffect(() => {
    setOpenFilterPanel(null);
    setCurrentPage(1);
    setYukPage(1);
    setReysPage(1);
    setEmekPage(1);
    setSelectedIds(new Set());
    setYukSelectedIds(new Set());
    setEmekSelectedIds(new Set());
  }, [subTab, setCurrentPage, setYukPage, setReysPage, setEmekPage]);

  const handleApplyFilter = () => {
    setAppliedFilter({ ...filterDraft });
    setCurrentPage(1);
    setSelectedIds(new Set());
    setOpenFilterPanel(null);
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
    setOpenFilterPanel(null);
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
    setOpenFilterPanel(null);
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
    setOpenFilterPanel(null);
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

  const handleExportExcel = () => {
    dispatch(
      showNotification({
        message: "Excel ixrac tezliklə əlavə olunacaq.",
        type: "info",
        autoCloseDuration: 3500,
      }),
    );
  };

  const handleNewOrder = () => {
    setIsSifarisNewOpen(true);
  };

  const handleNewOrderSubmit = (_payload: NewSifarisFormPayload) => {
    // Tüm alanları string'e çevir, boş/undefined ise "" gönder
    const fields = _payload.fields || {};
    const fixedFields = toStringFields(fields);
    // Sifarişler sayfasında sadece demo bildirim
    setIsSifarisNewOpen(false);
    dispatch(
      showNotification({
        message: "Yeni sifariş yaradıldı (demo).",
        type: "success",
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
    <div className={styles.container}>
      <NotificationModal />
      <div className={styles.header}>
        {subTab === "payroll" && (
          <EmekSummaryBar
            profitAzn={emekStats.profit}
            bonusAzn={emekStats.bonus}
            rewardAzn={emekStats.reward}
            saveSelectedValue={emekSaveSelected}
            onSaveSelectedChange={setEmekSaveSelected}
            saveSelectedOptions={EMEK_SAVE_SELECTED_OPTIONS}
            onToggleFilters={() => setOpenFilterPanel("payroll")}
            onExcel={handleEmekExcel}
            onPerformActions={handleEmekPerformActions}
            activeFilterCount={emekActiveFilterCount}
          />
        )}
        {subTab === "orders" && (
          <SifarisActionBar
            stats={stats}
            onNew={handleNewOrder}
            onToggleFilters={() => setOpenFilterPanel("orders")}
            onExportExcel={handleExportExcel}
            activeFilterCount={sifarisActiveFilterCount}
          />
        )}
        {subTab === "voyages" && (
          <ReysToolbar
            transportMode={reysTransportMode}
            onTransportChange={handleReysTransportChange}
            onToggleFilters={() => setOpenFilterPanel("voyages")}
            count={reysStats.count}
            totalValueAzn={reysStats.totalValueAzn}
            onExcel={handleReysExcel}
            activeFilterCount={reysActiveFilterCount}
          />
        )}
        {subTab === "loads" && (
          <YukActionBar
            stats={yukStats}
            accountAction={yukAccountAction}
            onAccountActionChange={setYukAccountAction}
            accountOptions={YUK_ACCOUNT_OPTIONS}
            onToggleFilters={() => setOpenFilterPanel("loads")}
            onTrackingImport={handleYukTrackingImport}
            onExcel={handleYukExcel}
            onPerformActions={handleYukPerformActions}
            activeFilterCount={yukActiveFilterCount}
          />
        )}
      </div>

      {/* Tablo gövdesi ve loading */}
      <div className={styles.body}>
        {loading ? (
          <div className={styles.statePanel}>
            <Loading />
          </div>
        ) : (
          <>
            {subTab === "orders" && (
              <>
                <div className={styles.tableBody}>
                  <SifarisTable
                    rows={paginatedRows}
                    selectedIds={selectedIds}
                    onToggleRow={toggleRow}
                    onToggleAllPage={toggleAllPage}
                  />
                </div>
                <div className={styles.footer}>
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
                <div className={styles.tableBody}>
                  <ReysTable rows={reysPaginated} />
                </div>
                <div className={styles.footer}>
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
                <div className={styles.tableBody}>
                  <YukTable
                    rows={yukPaginated}
                    selectedIds={yukSelectedIds}
                    onToggleRow={toggleYukRow}
                    onToggleAllPage={toggleYukAllPage}
                  />
                </div>
                <div className={styles.footer}>
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
                <div className={styles.tableBody}>
                  <EmekTable
                    rows={emekPaginated}
                    selectedIds={emekSelectedIds}
                    onToggleRow={toggleEmekRow}
                    onToggleAllPage={toggleEmekAllPage}
                  />
                </div>
                <div className={styles.footer}>
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
          </>
        )}
      </div>
      <SifarisNewModal
        isOpen={isSifarisNewOpen}
        onClose={() => setIsSifarisNewOpen(false)}
        onSubmit={handleNewOrderSubmit}
      />

      <div
        className={`${styles.overlay} ${
          openFilterPanel ? styles.overlayOpen : ""
        }`}
        onClick={() => setOpenFilterPanel(null)}
        aria-hidden={!openFilterPanel}
      />

      <aside
        className={`${styles.drawer} ${
          openFilterPanel ? styles.drawerOpen : ""
        }`}
        aria-hidden={!openFilterPanel}
      >
        {openFilterPanel === "orders" ? (
          <SifarisFilters
            activeSections={activeSections}
            toggleSection={toggleSection}
            filter={filterDraft}
            onFilterChange={onFilterChange}
            companyOptions={companyOptions}
            onClose={() => setOpenFilterPanel(null)}
            onClear={handleClear}
            onApplyFilter={handleApplyFilter}
            onSaveTemplate={handleSaveTemplate}
          />
        ) : null}

        {openFilterPanel === "loads" ? (
          <YukFilters
            activeSections={yukActiveSections}
            toggleSection={toggleYukSection}
            filter={yukFilterDraft}
            onFilterChange={onYukFilterChange}
            userOptions={YUK_USER_OPTIONS}
            onClose={() => setOpenFilterPanel(null)}
            onClear={handleYukClear}
            onApplyFilter={handleYukApplyFilter}
            onSaveTemplate={handleYukSaveTemplate}
          />
        ) : null}

        {openFilterPanel === "voyages" ? (
          <ReysFilters
            activeSections={reysActiveSections}
            toggleSection={toggleReysSection}
            filter={reysFilterDraft}
            onFilterChange={onReysFilterChange}
            companyOptions={reysCompanyOptions}
            onClose={() => setOpenFilterPanel(null)}
            onSaveTemplate={handleReysSaveTemplate}
            onClear={handleReysClear}
            onApplyFilter={handleReysApplyFilter}
          />
        ) : null}

        {openFilterPanel === "payroll" ? (
          <EmekFilters
            activeSections={emekActiveSections}
            toggleSection={toggleEmekSection}
            filter={emekFilterDraft}
            onFilterChange={onEmekFilterChange}
            companyOptions={emekCompanyOptions}
            customerOptions={emekCustomerOptions}
            carrierOptions={emekCarrierOptions}
            onClose={() => setOpenFilterPanel(null)}
            onSaveTemplate={handleEmekSaveTemplate}
            onClear={handleEmekClear}
            onApplyFilter={handleEmekApplyFilter}
          />
        ) : null}
      </aside>
    </div>
  );
}
