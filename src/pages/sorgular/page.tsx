"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
  SorgularOffersTable,
  SorgularEditModal,
  type NewSorguFormPayload,
} from "./components";
import {
  createQueryAction,
  fetchQueriesAction,
  updateQueryAction,
  approveQueryAction,
} from "../../common/actions/query.actions";
import { fetchCustomersAction } from "../../common/actions/customer.actions";
import { fetchLookupAction } from "../../common/actions/lookup.actions";
import { COUNTRY_OPTIONS } from "./constants/options.constants";
import PriceOfferSelectionModal from "./components/PriceOfferSelectionModal";
import { ConfirmModal } from "../../common/components/ConfirmModal";
import { useSorgularPagination } from "./hooks/useSorgularPagination";
import { applyFilters, filterByTab } from "./lib/filterSorgular";
import { countSorguStatuses, normalizeSorguStatus } from "./lib/sorguStatus";
import { isValidDigestStatusParam } from "../../common/utils/dailyQueryDigest.utils";
import { exportSorgularToExcel } from "./lib/exportExcel";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const requestedStatus = searchParams.get("status");
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
  const [statusQuickFilter, setStatusQuickFilter] = useState<string | null>(
    () =>
      isValidDigestStatusParam(requestedStatus) ? requestedStatus : null,
  );
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [rows, setRows] = useState<LogisticQueryRow[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [countriesData, setCountriesData] = useState<
    Array<{ value: string; label?: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [editRow, setEditRow] = useState<LogisticQueryRow | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  const [isPriceOfferModalOpen, setIsPriceOfferModalOpen] = useState(false);
  const [queryToApprove, setQueryToApprove] = useState<LogisticQueryRow | null>(null);
  const [pendingPayloadFields, setPendingPayloadFields] = useState<any>(null);
  const [offerToDelete, setOfferToDelete] = useState<{
    queryId: number;
    offerId: string;
  } | null>(null);
  const [isDeletingOffer, setIsDeletingOffer] = useState(false);

  useEffect(() => {
    const nextTab: SorguSubTab =
      requestedTab === "archive" || requestedTab === "offers"
        ? requestedTab
        : "active";

    setSubTab((prev) => (prev === nextTab ? prev : nextTab));
  }, [requestedTab]);

  useEffect(() => {
    setStatusQuickFilter(
      isValidDigestStatusParam(requestedStatus) ? requestedStatus : null,
    );
  }, [requestedStatus]);

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

    fetchCustomersAction()
      .then((data) => {
        if (!ignore) {
          setCustomers(data);
        }
      })
      .catch((err) => {
        console.error("Customers fetch failed", err);
      });

    fetchLookupAction("countries")
      .then((data) => {
        if (!ignore) {
          setCountriesData(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => {
        if (!ignore) {
          setCountriesData([]);
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
    if (filteredRows.length === 0) {
      dispatch(
        showNotification({
          message: "İxrac etmək üçün məlumat yoxdur.",
          type: "error",
          autoCloseDuration: 3000,
        }),
      );
      return;
    }
    
    exportSorgularToExcel(filteredRows, customers);
    
    dispatch(
      showNotification({
        message: "Excel faylı hazırlandı və endirilir.",
        type: "success",
        autoCloseDuration: 3000,
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
    setRows((prev) =>
      prev.map((r) => (String(r.id) === String(updated.id) ? updated : r)),
    );
  };

  const handleEditSubmit = async (payload: any) => {
    if (!editRow) return;

    if (payload.fields.status === "approved") {
      setQueryToApprove(editRow);
      setPendingPayloadFields(payload.fields);
      setIsEditOpen(false);
      setIsPriceOfferModalOpen(true);
      return;
    }

    try {
      const updated = await updateQueryAction(editRow.id, payload.fields);
      handleRowUpdate(updated);
      setIsEditOpen(false);
      setEditRow(null);
      dispatch(
        showNotification({
          message: "Sorğu yeniləndi.",
          type: "success",
          autoCloseDuration: 2500,
        }),
      );
    } catch {
      dispatch(
        showNotification({
          message: "Xəta baş verdi.",
          type: "error",
          autoCloseDuration: 3000,
        }),
      );
    }
  };

  const handleApproveSubmit = async (selectedOffer: any) => {
    if (!queryToApprove) return;
    try {
      // If there were other changes in the edit form, save them first
      if (pendingPayloadFields) {
         await updateQueryAction(queryToApprove.id, { ...pendingPayloadFields, status: "approved" });
      }
      
      const res = await approveQueryAction(queryToApprove.id, selectedOffer);
      
      handleRowUpdate(res.query);
      setIsPriceOfferModalOpen(false);
      setQueryToApprove(null);
      setPendingPayloadFields(null);

      dispatch(
        showNotification({
          message: "Sorğu uğurla təsdiqləndi və Sifarişlər səhifəsinə köçürüldü.",
          type: "success",
          autoCloseDuration: 4000,
        }),
      );
    } catch {
      dispatch(
        showNotification({
          message: "Sorğunu təsdiqləyərkən xəta baş verdi.",
          type: "error",
          autoCloseDuration: 3000,
        }),
      );
    }
  };

  const handleRowDelete = (id: string | number) => {
    setRows((prev) => prev.filter((r) => String(r.id) !== String(id)));
  };

  const handleEditQuery = (id: number) => {
    const row = rows.find((r) => String(r.id) === String(id));
    if (row) {
      setEditRow(row);
      setIsEditOpen(true);
    }
  };

  const handleDeleteOffer = (queryId: number, offerId: string) => {
    setOfferToDelete({ queryId, offerId });
  };

  const handleConfirmDeleteOffer = async () => {
    if (!offerToDelete) return;
    const { queryId, offerId } = offerToDelete;
    setIsDeletingOffer(true);
    try {
      const query = rows.find((r) => String(r.id) === String(queryId));
      if (!query) return;
      const currentOffers = (query as any).priceOfferItems || [];
      const updatedOffers = currentOffers.filter((o: any) => o.id !== offerId);

      const payload = {
        priceOffersJson: JSON.stringify(updatedOffers),
        priceOffers:
          updatedOffers.length > 0
            ? `${updatedOffers[0].carrierName}: ${updatedOffers[0].price} ${updatedOffers[0].currency}`
            : "",
      };

      const updated = await updateQueryAction(queryId, payload);
      setRows((prev) =>
        prev.map((r) => (String(r.id) === String(queryId) ? updated : r)),
      );
      dispatch(
        showNotification({
          message: "Qiymət təklifi silindi.",
          type: "success",
          autoCloseDuration: 2500,
        }),
      );
      setOfferToDelete(null);
    } catch (e) {
      dispatch(
        showNotification({
          message: "Xəta baş verdi.",
          type: "error",
          autoCloseDuration: 3000,
        }),
      );
    } finally {
      setIsDeletingOffer(false);
    }
  };

  const handleApproveRequest = (row: LogisticQueryRow, payloadFields: any) => {
    setQueryToApprove(row);
    setPendingPayloadFields(payloadFields);
    setIsPriceOfferModalOpen(true);
  };

  return (
    <div className={styles.container}>

      <div className={styles.header}>
        <SorgularActionBar
          total={baseFilteredRows.length}
          statusCounts={statusCounts}
          statusFilter={statusQuickFilter}
          onStatusFilter={(status) => {
            setStatusQuickFilter(status);
            setCurrentPage(1);
            const next = new URLSearchParams(searchParams);
            if (status) next.set("status", status);
            else next.delete("status");
            if (!next.get("tab")) next.set("tab", subTab);
            setSearchParams(next, { replace: true });
          }}
          onNew={() => setIsNewOpen(true)}
          onOpenFilters={() => setIsFilterPanelOpen(true)}
          onImportExcel={handleImportExcel}
          onExportExcel={handleExportExcel}
          activeFilterCount={activeFilterCount}
          permChild={subTab === "archive" ? "archive" : subTab === "offers" ? "offers" : "active"}
        />
      </div>

      <div className={styles.body} style={{ position: "relative" }}>
        {!loading && (
          subTab === "offers" ? (
            <SorgularOffersTable 
              rows={paginatedRows} 
              customers={customers}
              onDeleteOffer={handleDeleteOffer}
              onEditQuery={handleEditQuery}
            />
          ) : (
            <SorgularTable 
              rows={paginatedRows} 
              customers={customers}
              onUpdate={handleRowUpdate}
              onDelete={handleRowDelete}
              onApproveStatus={handleApproveRequest}
              permChild={subTab === "archive" ? "archive" : "active"}
              countryOptions={countryFilterOptions}
            />
          )
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

      <SorgularEditModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditRow(null);
        }}
        onSubmit={handleEditSubmit}
        initialValues={editRow || undefined}
      />

      <PriceOfferSelectionModal
        isOpen={isPriceOfferModalOpen}
        onClose={() => {
          setIsPriceOfferModalOpen(false);
          setQueryToApprove(null);
          setPendingPayloadFields(null);
        }}
        query={queryToApprove}
        onApprove={handleApproveSubmit}
      />

      <ConfirmModal
        isOpen={offerToDelete !== null}
        title="Qiymət təklifini sil"
        message="Bu qiymət təklifini silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz."
        onConfirm={handleConfirmDeleteOffer}
        onCancel={() => setOfferToDelete(null)}
        isLoading={isDeletingOffer}
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
