"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { fetchLookupAction } from "../../common/actions/lookup.actions";
import { COUNTRY_OPTIONS } from "./constants/options.constants";
import { useSorgularPagination } from "./hooks/useSorgularPagination";
import { applyFilters, filterByTab } from "./lib/filterSorgular";
import { countSorguStatuses, normalizeSorguStatus } from "./lib/sorguStatus";
import styles from "./sorgular.module.css";
import type {
  FilterFormState,
  FilterSectionId,
  LogisticQueryRow,
  SorguSubTab,
} from "./types/sorgu.types";
import { emptyFilterForm } from "./types/sorgu.types";

interface SorgularTemplateProps {
  subTab: SorguSubTab;
  customFetch?: () => Promise<LogisticQueryRow[]>;
}

export default function SorgularTemplate({ 
  subTab, 
  customFetch 
}: SorgularTemplateProps) {
  const dispatch = useAppDispatch();
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [activeSections, setActiveSections] = useState<Set<FilterSectionId>>(
    () => new Set(["id", "dates"]),
  );
  const [filterDraft, setFilterDraft] =
    useState<FilterFormState>(emptyFilterForm);
  const [appliedFilter, setAppliedFilter] =
    useState<FilterFormState>(emptyFilterForm);
  const [statusQuickFilter, setStatusQuickFilter] = useState<string | null>(
    null,
  );
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [rows, setRows] = useState<LogisticQueryRow[]>([]);
  const [countriesData, setCountriesData] = useState<
    Array<{ value: string; label?: string }>
  >([]);
  const [loading, setLoading] = useState(true);

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
    
    const fetchFn = customFetch ? customFetch : () => fetchQueriesAction(subTab);

    fetchFn()
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
  }, [dispatch, subTab, customFetch]);

  useEffect(() => {
    let ignore = false;
    fetchLookupAction("countries")
      .then((data) => {
        if (!ignore) setCountriesData(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!ignore) setCountriesData([]);
      });
    return () => {
      ignore = true;
    };
  }, []);

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

  const countryFilterOptions: SelectOption[] = useMemo(() => {
    const source =
      countriesData.length > 0 ? countriesData : COUNTRY_OPTIONS;
    const seen = new Set<string>();
    const opts = source
      .map((c) => ({
        value: String(c.value || "").trim(),
        label: String(c.label || c.value || "").trim(),
      }))
      .filter((o) => {
        if (!o.value) return false;
        const key = o.value.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => a.label.localeCompare(b.label, "az"));
    return [{ value: "", label: "Hamısı" }, ...opts];
  }, [countriesData]);

  const tabRows = useMemo(() => filterByTab(rows, subTab), [rows, subTab]);

  const baseFilteredRows = useMemo(
    () => applyFilters(tabRows, appliedFilter, countryFilterOptions),
    [tabRows, appliedFilter, countryFilterOptions],
  );

  const filteredRows = useMemo(() => {
    if (!statusQuickFilter) return baseFilteredRows;
    return baseFilteredRows.filter(
      (row) => normalizeSorguStatus(row.status) === statusQuickFilter,
    );
  }, [baseFilteredRows, statusQuickFilter]);

  const statusCounts = useMemo(
    () => countSorguStatuses(baseFilteredRows),
    [baseFilteredRows],
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
    pageSize,
    setPageSize,
    totalPages,
    paginatedRows,
    getVisiblePages,
  } = useSorgularPagination(filteredRows);

  useEffect(() => {
    setCurrentPage(1);
    setIsFilterPanelOpen(false);
    setStatusQuickFilter(null);
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

  const handleRowUpdate = (updated: LogisticQueryRow) => {
    setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  const handleRowDelete = (id: string | number) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className={styles.container}>
      <NotificationModal />

      <div className={styles.header}>
        <SorgularActionBar
          total={baseFilteredRows.length}
          statusCounts={statusCounts}
          statusFilter={statusQuickFilter}
          onStatusFilter={(status) => {
            setStatusQuickFilter(status);
            setCurrentPage(1);
          }}
          onNew={() => setIsNewOpen(true)}
          onOpenFilters={() => setIsFilterPanelOpen(true)}
          onImportExcel={handleImportExcel}
          onExportExcel={handleExportExcel}
          activeFilterCount={activeFilterCount}
          permChild={
            subTab === "archive"
              ? "archive"
              : subTab === "offers"
                ? "offers"
                : "active"
          }
        />
      </div>

      <div className={styles.body} style={{ position: "relative" }}>
        {!loading && (
          <SorgularTable
            rows={paginatedRows}
            onUpdate={handleRowUpdate}
            onDelete={handleRowDelete}
            permChild={
              subTab === "archive"
                ? "archive"
                : subTab === "offers"
                  ? "offers"
                  : "active"
            }
            countryOptions={countryFilterOptions}
          />
        )}
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
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
          />
        </div>
      ) : null}

      <SorgularNewModal
        isOpen={isNewOpen}
        onClose={() => setIsNewOpen(false)}
        onSubmit={handleNewSubmit}
      />

      <SorgularFilters
        open={isFilterPanelOpen}
        activeSections={activeSections}
        toggleSection={toggleSection}
        filter={filterDraft}
        onFilterChange={onFilterChange}
        companyOptions={companyOptions}
        countryOptions={countryFilterOptions}
        onClose={() => {
          setFilterDraft({ ...appliedFilter });
          setIsFilterPanelOpen(false);
        }}
        onClear={handleClear}
        onApplyFilter={handleApplyFilter}
        onSaveTemplate={handleSaveTemplate}
      />
    </div>
  );
}
