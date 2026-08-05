"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./maliyye.module.css";
import { FiFilter, FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import {
  fetchFinanceTransactionsAction,
  createFinanceTransactionAction,
  updateFinanceTransactionAction,
  deleteFinanceTransactionAction,
} from "../../common/actions/finance.actions";
import Loading from "../../common/components/loading/Loading";
import type { SelectOption } from "../../common/components/select/Select";
import FinanceModal from "./FinanceModal";
import SimpleExpenseModal from "./SimpleExpenseModal";
import MaliyyeFiltersDrawer from "./MaliyyeFiltersDrawer";
import SorgularPagination from "../sorgular/components/SorgularPagination";
import { useClientPagination } from "../../common/components/pagination";
import {
  type CashWallet,
  type WalletTab,
  SYSTEM_PARTNER_LABEL,
  isIncomeTx,
  isSimpleExpenseTx,
  isSystemBalanceAdjustment,
  resolveTxCashAzn,
  txMatchesWalletTab,
} from "./lib/financeWallet.utils";
import {
  applyMaliyyeFilters,
  countActiveMaliyyeFilters,
  emptyMaliyyeFilter,
  partnerLabel,
  resolveDocType,
  type MaliyyeFilterState,
} from "./lib/filterMaliyye";
import { usePermissions } from "../../common/hooks/usePermissions";
import { useCurrencyRates } from "../../common/hooks/useCurrencyRates";
import { FALLBACK_AZN_RATES } from "../../common/utils/currency.utils";

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("az-AZ", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDateOnly(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("az-AZ");
}

/** Sənəd tipi badge — bütün xərclər eyni rəng (kateqoriya adından asılı deyil) */
function docTypeBadgeClass(docType: string, isIncome: boolean): string {
  const t = docType.toLowerCase();
  if (t.includes("düzəliş") || t.includes("duzelis") || t.includes("balans")) {
    return "docTypeAdjustment";
  }
  // Xərc sətirləri: Kommunal, Əməkhaqqı, Ümumi xərc, Daşıyıcı ödənişi — hamısı eyni
  if (!isIncome) return "docTypeExpense";
  if (t.includes("müştəri") || t.includes("mustəri")) return "docTypeCustomer";
  if (t.includes("daşıyıcı") || t.includes("dasiyici")) return "docTypeCarrier";
  return "docTypeDefault";
}

const DEFAULT_PAGE_SIZE = 10;

export default function MaliyyePage() {
  const { canView, canCreate, canEdit, canDelete } = usePermissions();
  const { ratesData } = useCurrencyRates();
  const currencyRates = ratesData?.rates || FALLBACK_AZN_RATES;
  const canKasa = canView("maliyye", "kasa");
  const canBank = canView("maliyye", "bank");
  const canUmumi = canView("maliyye", "umumi");
  const allowCreateTx = canCreate("maliyye", "transactions");
  const allowCreateExpense = canCreate("maliyye", "expenses");
  const allowEditTx = canEdit("maliyye", "transactions");
  const allowDeleteTx = canDelete("maliyye", "transactions");
  const allowEditExpense = canEdit("maliyye", "expenses");
  const allowDeleteExpense = canDelete("maliyye", "expenses");
  const firstAllowedWallet: WalletTab = canKasa
    ? "Kasa"
    : canBank
      ? "Bank"
      : "Umumi";

  const [walletTab, setWalletTab] = useState<WalletTab>(firstAllowedWallet);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<any>(null);

  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [filterDraft, setFilterDraft] =
    useState<MaliyyeFilterState>(emptyMaliyyeFilter);
  const [appliedFilter, setAppliedFilter] =
    useState<MaliyyeFilterState>(emptyMaliyyeFilter);

  const loadData = async () => {
    setLoading(true);
    try {
      const txData = await fetchFinanceTransactionsAction();
      setTransactions(Array.isArray(txData) ? txData : []);
    } catch (err) {
      console.error("Maliyyə datası yüklənərkən xəta", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resolvedWallet: WalletTab =
    (walletTab === "Kasa" && canKasa) ||
    (walletTab === "Bank" && canBank) ||
    (walletTab === "Umumi" && canUmumi)
      ? walletTab
      : firstAllowedWallet;

  const walletTxs = useMemo(
    () => transactions.filter((tx) => txMatchesWalletTab(tx, resolvedWallet)),
    [transactions, resolvedWallet],
  );

  const filteredTxs = useMemo(
    () => applyMaliyyeFilters(walletTxs, appliedFilter, currencyRates),
    [walletTxs, appliedFilter, currencyRates],
  );

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    paginatedRows: pagedTxs,
    getVisiblePages,
  } = useClientPagination(filteredTxs, DEFAULT_PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [walletTab, appliedFilter, setCurrentPage]);

  const stats = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;

    filteredTxs.forEach((tx) => {
      const azn = resolveTxCashAzn(tx, currencyRates);
      if (!(azn > 0)) return;
      if (isIncomeTx(tx)) totalIn += azn;
      else totalOut += azn;
    });

    return {
      totalIn,
      totalOut,
      balance: totalIn - totalOut,
    };
  }, [filteredTxs, currencyRates]);

  const categoryOptions: SelectOption[] = useMemo(() => {
    const names = [
      ...new Set(
        walletTxs
          .map((tx) => String(tx.category || "").trim())
          .filter(Boolean),
      ),
    ].sort((a, b) => a.localeCompare(b, "az"));
    return [
      { value: "", label: "Hamısı" },
      ...names.map((name) => ({ value: name, label: name })),
    ];
  }, [walletTxs]);

  const knownExpenseCategories = useMemo(
    () =>
      [
        ...new Set(
          transactions
            .filter((tx) => !isIncomeTx(tx))
            .map((tx) => String(tx.category || "").trim())
            .filter(Boolean),
        ),
      ].sort((a, b) => a.localeCompare(b, "az")),
    [transactions],
  );

  const partnerOptions: SelectOption[] = useMemo(() => {
    const names = [
      ...new Set(
        walletTxs
          .map((tx) => partnerLabel(tx).trim())
          .filter((name) => name && name !== "—"),
      ),
    ].sort((a, b) => a.localeCompare(b, "az"));
    return [
      { value: "", label: "Hamısı" },
      ...names.map((name) => ({ value: name, label: name })),
    ];
  }, [walletTxs]);

  const createdByOptions: SelectOption[] = useMemo(() => {
    const names = [
      ...new Set(
        walletTxs
          .map((tx) => String(tx.createdByName || tx.user || "").trim())
          .filter(Boolean),
      ),
    ].sort((a, b) => a.localeCompare(b, "az"));
    return [
      { value: "", label: "Hamısı" },
      ...names.map((name) => ({ value: name, label: name })),
    ];
  }, [walletTxs]);

  const activeFilterCount = useMemo(
    () => countActiveMaliyyeFilters(appliedFilter),
    [appliedFilter],
  );

  const onFilterChange = useCallback(
    (field: keyof MaliyyeFilterState, value: string) => {
      setFilterDraft((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleApplyFilter = () => {
    setAppliedFilter({ ...filterDraft });
    setCurrentPage(1);
    setIsFilterPanelOpen(false);
  };

  const handleClearFilter = () => {
    const empty = emptyMaliyyeFilter();
    setFilterDraft(empty);
    setAppliedFilter(empty);
    setCurrentPage(1);
  };

  const handleSave = async (data: any) => {
    try {
      if (editingTx && isSystemBalanceAdjustment(editingTx)) {
        setIsModalOpen(false);
        setEditingTx(null);
        return;
      }
      const payload = {
        ...data,
        paymentMethod:
          data.paymentMethod ||
          (walletTab === "Umumi" ? "Kasa" : walletTab),
        amount: Number(data.amount) || 0,
        category: data.category || undefined,
      };
      if (editingTx) {
        await updateFinanceTransactionAction(editingTx.id, payload);
      } else {
        await createFinanceTransactionAction(payload);
      }
      setIsModalOpen(false);
      setIsExpenseModalOpen(false);
      setEditingTx(null);
      loadData();
    } catch {
      alert("Xəta baş verdi");
    }
  };

  const handleDelete = async (tx: any) => {
    if (isSystemBalanceAdjustment(tx)) return;
    if (!window.confirm(`#${tx.id} əməliyyatı silinsin?`)) return;
    try {
      await deleteFinanceTransactionAction(tx.id);
      loadData();
    } catch {
      alert("Silinərkən xəta baş verdi");
    }
  };

  if (loading && transactions.length === 0) return <Loading />;

  const isKasa = resolvedWallet === "Kasa";
  const isBank = resolvedWallet === "Bank";
  const isUmumi = resolvedWallet === "Umumi";
  const defaultWallet: CashWallet = isBank ? "Bank" : "Kasa";
  const fmt = (n: number) =>
    n.toLocaleString("az-AZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const emptyMessage =
    activeFilterCount > 0
      ? "Filterə uyğun əməliyyat yoxdur"
      : "Bu bölmədə əməliyyat yoxdur";

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.walletTabs}>
          {canKasa ? (
            <button
              type="button"
              className={`${styles.walletTab} ${isKasa ? styles.walletTabActive : ""}`}
              onClick={() => setWalletTab("Kasa")}
            >
              Kassam
            </button>
          ) : null}
          {canBank ? (
            <button
              type="button"
              className={`${styles.walletTab} ${isBank ? styles.walletTabActive : ""}`}
              onClick={() => setWalletTab("Bank")}
            >
              Bank hesabı
            </button>
          ) : null}
          {canUmumi ? (
            <button
              type="button"
              className={`${styles.walletTab} ${isUmumi ? styles.walletTabActive : ""}`}
              onClick={() => setWalletTab("Umumi")}
            >
              Ümumi
            </button>
          ) : null}
        </div>
      </div>

      <div className={styles.pageBody}>
        <div className={styles.kasaHeaderRow}>
          <div>
            <h2 className={styles.kasaTitle}>
              {isUmumi ? "Ümumi" : isKasa ? "Kassam" : "Bank hesabı"}
            </h2>
            <p className={styles.kasaHint}>
              {isUmumi
                ? "Kasa və bank əməliyyatlarının birgə görünüşü"
                : isKasa
                  ? "Yalnız kasaya girən, çıxan və hazırkı kassa məbləği"
                  : "Yalnız banka girən, çıxan və hazırkı bank qalığı"}
            </p>
          </div>
          <div className={styles.kasaHeaderActions}>
            <button
              type="button"
              className={styles.kasaFilterBtn}
              onClick={() => {
                setFilterDraft({ ...appliedFilter });
                setIsFilterPanelOpen(true);
              }}
            >
              <FiFilter />
              Filtrlər
              {activeFilterCount > 0 ? (
                <span className={styles.filterBadge}>{activeFilterCount}</span>
              ) : null}
            </button>
            {allowCreateExpense ? (
              <button
                type="button"
                className={styles.kasaExpenseBtn}
                onClick={() => {
                  setEditingTx(null);
                  setIsExpenseModalOpen(true);
                }}
              >
                Xərc
              </button>
            ) : null}
            {allowCreateTx ? (
              <button
                type="button"
                className={styles.kasaAddBtn}
                onClick={() => {
                  setEditingTx(null);
                  setIsModalOpen(true);
                }}
              >
                <FiPlus />
                Yeni əməliyyat
              </button>
            ) : null}
          </div>
        </div>

        <div className={styles.kasaStatsGrid}>
          <div className={`${styles.kasaStatCard} ${styles.kasaStatIn}`}>
            <div className={styles.kasaStatLabel}>
              {isUmumi ? "Ümumi girən" : isKasa ? "Kasaya girən" : "Banka girən"}
            </div>
            <div className={styles.kasaStatValue}>{fmt(stats.totalIn)} AZN</div>
            <div className={styles.kasaStatSub}>Ümumi mədaxil</div>
          </div>

          <div className={`${styles.kasaStatCard} ${styles.kasaStatOut}`}>
            <div className={styles.kasaStatLabel}>
              {isUmumi
                ? "Ümumi çıxan"
                : isKasa
                  ? "Kasadan çıxan"
                  : "Bankdan çıxan"}
            </div>
            <div className={styles.kasaStatValue}>{fmt(stats.totalOut)} AZN</div>
            <div className={styles.kasaStatSub}>Ümumi məxaric</div>
          </div>

          <div className={`${styles.kasaStatCard} ${styles.kasaStatBalance}`}>
            <div className={styles.kasaStatLabel}>
              {isUmumi
                ? "Ümumi qalıq"
                : isKasa
                  ? "Kasada olan"
                  : "Bankda olan"}
            </div>
            <div
              className={styles.kasaStatValue}
              style={{ color: stats.balance >= 0 ? "#047857" : "#b91c1c" }}
            >
              {fmt(stats.balance)} AZN
            </div>
            <div className={styles.kasaStatSub}>Cari qalıq</div>
          </div>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>ID</th>
                <th className={styles.th}>Tip / Metod</th>
                <th className={styles.th}>Məbləğ</th>
                <th className={styles.th}>Ad</th>
                <th className={styles.th}>Sənəd tipi</th>
                <th className={styles.th}>Tərəfdaş</th>
                <th className={styles.th}>Sifariş</th>
                <th className={styles.th}>Əməliyyat tarixi</th>
                <th className={styles.th}>Yaradan</th>
                <th className={styles.th}>Redaktə edən</th>
                <th className={styles.th}>Əməliyyatlar</th>
              </tr>
            </thead>
            <tbody>
              {pagedTxs.length === 0 ? (
                <tr>
                  <td className={styles.td} colSpan={11}>
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                pagedTxs.map((tx) => {
                  const income = isIncomeTx(tx);
                  const azn = resolveTxCashAzn(tx, currencyRates);
                  const isSystem = isSystemBalanceAdjustment(tx);
                  const partner = partnerLabel(tx) || "—";
                  const docType = resolveDocType(tx);
                  return (
                    <tr key={tx.id} className={styles.tr}>
                      <td className={styles.td}>#{tx.id}</td>
                      <td className={styles.td}>
                        <div className={styles.typeLabel}>
                          {income ? "Gəlir" : "Xərc"}
                        </div>
                        <div className={styles.typeMeta}>
                          {tx.paymentMethod || walletTab}
                        </div>
                      </td>
                      <td className={styles.td}>
                        <span
                          className={`${styles.amountPill} ${
                            income ? styles.amountIncome : styles.amountExpense
                          }`}
                        >
                          {income ? "+" : "-"}
                          {fmt(azn)} AZN
                        </span>
                      </td>
                      <td className={styles.td}>
                        <div className={styles.nameMain}>{tx.name || "—"}</div>
                      </td>
                      <td className={styles.td}>
                        <span
                          className={`${styles.docTypeBadge} ${styles[docTypeBadgeClass(docType, income)]}`}
                          title={docType}
                        >
                          {docType}
                        </span>
                      </td>
                      <td className={styles.td}>
                        {isSystem ? (
                          <span
                            className={styles.systemPartnerBadge}
                            title="Sistem balans düzəlişi"
                          >
                            {SYSTEM_PARTNER_LABEL}
                          </span>
                        ) : isSimpleExpenseTx(tx) ||
                          /ümumi\s*xərc/i.test(partner) ? (
                          <span
                            className={styles.expensePartnerBadge}
                            title="Birbaşa xərc"
                          >
                            {partner === "—" ? "Xərc" : partner}
                          </span>
                        ) : (
                          partner
                        )}
                      </td>
                      <td className={styles.td}>
                        {tx.orderId ? `#${tx.orderId}` : "—"}
                      </td>
                      <td className={styles.td}>
                        {formatDateOnly(tx.date || tx.costDate)}
                      </td>
                      <td className={styles.td}>
                        <div className={styles.nameMain}>
                          {tx.createdByName || tx.user || "—"}
                        </div>
                        <div className={styles.nameMeta}>
                          {formatDateTime(tx.createdAt)}
                        </div>
                      </td>
                      <td className={styles.td}>
                        {tx.updatedAt &&
                        tx.createdAt &&
                        new Date(tx.updatedAt).getTime() -
                          new Date(tx.createdAt).getTime() >
                          2000 ? (
                          <>
                            <div className={styles.nameMain}>
                              {tx.updatedByName || "—"}
                            </div>
                            <div className={styles.nameMeta}>
                              {formatDateTime(tx.updatedAt)}
                            </div>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className={styles.td}>
                        {isSystem ? (
                          <span
                            className={styles.lockedActions}
                            title="Sistem əməliyyatı redaktə/silinə bilməz"
                          >
                            —
                          </span>
                        ) : (
                          (() => {
                            const isExpense = isSimpleExpenseTx(tx);
                            const canEditRow = isExpense
                              ? allowEditExpense
                              : allowEditTx;
                            const canDeleteRow = isExpense
                              ? allowDeleteExpense
                              : allowDeleteTx;
                            if (!canEditRow && !canDeleteRow) {
                              return <span className={styles.lockedActions}>—</span>;
                            }
                            return (
                              <div style={{ display: "flex", gap: "0.4rem" }}>
                                {canEditRow ? (
                                  <button
                                    type="button"
                                    title="Redaktə"
                                    onClick={() => {
                                      setEditingTx(tx);
                                      if (isExpense) {
                                        setIsExpenseModalOpen(true);
                                      } else {
                                        setIsModalOpen(true);
                                      }
                                    }}
                                    style={{
                                      border: "none",
                                      background: "#eff6ff",
                                      color: "#2563eb",
                                      borderRadius: "0.4rem",
                                      padding: "0.35rem",
                                      cursor: "pointer",
                                    }}
                                  >
                                    <FiEdit2 size={14} />
                                  </button>
                                ) : null}
                                {canDeleteRow ? (
                                  <button
                                    type="button"
                                    title="Sil"
                                    onClick={() => handleDelete(tx)}
                                    style={{
                                      border: "none",
                                      background: "#fef2f2",
                                      color: "#dc2626",
                                      borderRadius: "0.4rem",
                                      padding: "0.35rem",
                                      cursor: "pointer",
                                    }}
                                  >
                                    <FiTrash2 size={14} />
                                  </button>
                                ) : null}
                              </div>
                            );
                          })()
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.pageFooter}>
        <SorgularPagination
          totalRows={filteredTxs.length}
          currentPage={currentPage}
          totalPages={totalPages}
          getVisiblePages={getVisiblePages}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
        />
      </div>

      <MaliyyeFiltersDrawer
        open={isFilterPanelOpen}
        filter={filterDraft}
        categoryOptions={categoryOptions}
        partnerOptions={partnerOptions}
        createdByOptions={createdByOptions}
        onFilterChange={onFilterChange}
        onClose={() => setIsFilterPanelOpen(false)}
        onClear={handleClearFilter}
        onApplyFilter={handleApplyFilter}
      />

      <FinanceModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTx(null);
        }}
        onSave={handleSave}
        initialData={editingTx}
        defaultWallet={defaultWallet}
      />
      <SimpleExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setEditingTx(null);
        }}
        onSave={handleSave}
        initialData={
          editingTx && isSimpleExpenseTx(editingTx) ? editingTx : null
        }
        knownCategories={knownExpenseCategories}
        defaultWallet={defaultWallet}
      />
    </div>
  );
}
