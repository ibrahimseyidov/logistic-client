"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  FiArrowLeft,
  FiClipboard,
  FiDollarSign,
  FiDownload,
  FiFileText,
  FiPackage,
  FiTruck,
  FiUsers,
  FiX,
} from "react-icons/fi";
import sorguActionBarStyles from "../../sorgular/components/SorgularActionBar.module.css";
import drawerStyles from "../../sorgular/sorgular.module.css";
import styles from "../maliyye.module.css";
import {
  createFinanceTransactionAction,
  fetchFinanceTransactionsAction,
} from "../../../common/actions/finance.actions";
import { fetchCustomersAction } from "../../../common/actions/customer.actions";
import { fetchCarriersAction } from "../../../common/actions/carrier.actions";
import { fetchOrdersAction } from "../../../common/actions/order.actions";
import { fetchQueriesAction } from "../../../common/actions/query.actions";
import Loading from "../../../common/components/loading/Loading";
import StatusBadge, {
  statusLabelAz,
} from "../../../common/components/StatusBadge";
import SorgularPagination from "../../sorgular/components/SorgularPagination";
import {
  DEFAULT_PAGE_SIZE,
  getVisiblePages as buildVisiblePages,
} from "../../../common/components/pagination";
import FinanceModal from "../FinanceModal";
import { useAppDispatch } from "../../../common/store/hooks";
import { showNotification } from "../../../common/store/modalSlice";
import { usePermissions } from "../../../common/hooks/usePermissions";
import { ENDPOINTS } from "../../../services/EndpointResources.g";
import OrderStatusPicker from "../../sifarisler/components/OrderStatusPicker";
import type { OrderStatusKind } from "../../sifarisler/types/sifaris.types";
import { findCustomerForName } from "../lib/financePartner.utils";
import { getQueryDetailPath } from "../../sorgular/lib/queryDisplay.utils";
import {
  buildExpenseRows,
  buildOrderRows,
  buildPartnerOrderLines,
  buildPartnerRows,
  buildQueryRows,
  emptyReportFilter,
  filterPartnerRows,
  uniqueCategories,
  uniqueStatuses,
  type PartnerRow,
  type ReportFilter,
  type ReportId,
} from "../lib/hesabatReports";
import {
  exportGenericReportToExcel,
  exportPartnerDetailedReportToExcel,
  exportPartnerReportToExcel,
  reportExcelFileTitle,
} from "../lib/exportHesabatExcel";

const REPORT_CARDS: {
  id: ReportId;
  title: string;
  description: string;
  icon: ReactNode;
}[] = [
  {
    id: "customers",
    title: "Müştəri hesabatı",
    description: "Müştəri kartları üzrə borc, ödəniş və qalıq",
    icon: <FiUsers size={28} />,
  },
  {
    id: "carriers",
    title: "Daşıyıcı hesabatı",
    description: "Daşıyıcı kartları üzrə borc, ödəniş və qalıq",
    icon: <FiTruck size={28} />,
  },
  {
    id: "queries",
    title: "Sorgu hesabatları",
    description: "Sorğular üzrə siyahı, status və tarix filtri",
    icon: <FiClipboard size={28} />,
  },
  {
    id: "orders",
    title: "Sifariş hesabatları",
    description: "Qiymət, xərc, ödəniş, qalıq və qazanc",
    icon: <FiPackage size={28} />,
  },
  {
    id: "expenses",
    title: "Xərc hesabatları",
    description: "Kasa/bank xərcləri — kateqoriya və metod filtri",
    icon: <FiFileText size={28} />,
  },
];

function asList(data: unknown): any[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const anyData = data as any;
    if (Array.isArray(anyData.items)) return anyData.items;
    if (Array.isArray(anyData.data)) return anyData.data;
  }
  return [];
}

function fmtAzn(n: number) {
  return n.toLocaleString("az-AZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parsePartnerId(key: string): string | null {
  const m = String(key || "").match(/^[cr]:(.+)$/);
  return m ? m[1] : null;
}

export default function MaliyyeHesabatPage() {
  const dispatch = useAppDispatch();
  const { canEdit } = usePermissions();
  const allowEditOrderStatus = canEdit("sifarisler", "orders");
  const [activeReport, setActiveReport] = useState<ReportId | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [carriers, setCarriers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [queries, setQueries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentSeed, setPaymentSeed] = useState<any>(null);
  const [filter, setFilter] = useState<ReportFilter>(emptyReportFilter);
  const [exporting, setExporting] = useState(false);
  const [partnerExportType, setPartnerExportType] = useState<"summary" | "detailed">(
    "summary",
  );

  const loadData = useCallback(() => {
    setLoading(true);
    return Promise.all([
      fetchFinanceTransactionsAction(),
      fetchCustomersAction(),
      fetchCarriersAction(),
      fetchOrdersAction(),
      fetchQueriesAction(),
    ])
      .then(([txs, cust, carr, ords, qrs]) => {
        setTransactions(asList(txs));
        setCustomers(asList(cust));
        setCarriers(asList(carr));
        setOrders(asList(ords));
        setQueries(asList(qrs));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    setCurrentPage(1);
    setFilter(emptyReportFilter());
    setPartnerExportType("summary");
  }, [activeReport]);

  useEffect(() => {
    if (!activeReport) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !paymentOpen) setActiveReport(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeReport, paymentOpen]);

  const isPartnerReport =
    activeReport === "customers" || activeReport === "carriers";

  const partnerRows = useMemo(() => {
    if (!isPartnerReport || !activeReport) return [] as PartnerRow[];
    return filterPartnerRows(
      buildPartnerRows(activeReport, {
        transactions,
        customers,
        carriers,
        orders,
      }),
      filter,
    );
  }, [
    isPartnerReport,
    activeReport,
    transactions,
    customers,
    carriers,
    orders,
    filter,
  ]);

  const genericRows = useMemo(() => {
    if (!activeReport || isPartnerReport) return [];
    if (activeReport === "queries") {
      return buildQueryRows(queries, filter, { customers });
    }
    if (activeReport === "orders") {
      return buildOrderRows(orders, filter, { transactions, customers });
    }
    if (activeReport === "expenses") return buildExpenseRows(transactions, filter);
    return [];
  }, [
    activeReport,
    isPartnerReport,
    queries,
    orders,
    transactions,
    customers,
    filter,
  ]);

  const displayCount = isPartnerReport ? partnerRows.length : genericRows.length;

  const partnerTotals = useMemo(
    () =>
      partnerRows.reduce(
        (acc, r) => ({
          owed: acc.owed + r.owedAzn,
          paid: acc.paid + r.paidAzn,
          balance: acc.balance + r.balanceAzn,
        }),
        { owed: 0, paid: 0, balance: 0 },
      ),
    [partnerRows],
  );

  const expenseTotal = useMemo(() => {
    if (activeReport !== "expenses") return 0;
    return buildExpenseRows(transactions, filter).reduce((sum, r) => {
      const azn = Number(r.raw?._azn);
      if (Number.isFinite(azn)) return sum + azn;
      return sum + resolveTxCashFromCell(r.cells[4]);
    }, 0);
  }, [activeReport, transactions, filter]);

  const totalPages = Math.max(1, Math.ceil(displayCount / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const pagedPartner = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return partnerRows.slice(start, start + pageSize);
  }, [partnerRows, currentPage, pageSize]);

  const pagedGeneric = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return genericRows.slice(start, start + pageSize);
  }, [genericRows, currentPage, pageSize]);

  const getVisiblePages = () => buildVisiblePages(currentPage, totalPages);

  const handleOrderStatusChange = useCallback(
    async (orderId: string | number, nextStatus: OrderStatusKind, label: string) => {
      try {
        const res = await axios.put(
          ENDPOINTS.ORDERS.BY_ID(orderId),
          { statusKind: nextStatus, statusLabel: label },
          {
            headers: {
              Authorization: "Bearer " + localStorage.getItem("token"),
            },
          },
        );
        setOrders((prev) =>
          prev.map((o) =>
            String(o.id) === String(orderId)
              ? {
                  ...o,
                  statusKind: res.data?.statusKind || nextStatus,
                  statusLabel: res.data?.statusLabel || label,
                }
              : o,
          ),
        );
        dispatch(
          showNotification({
            message: "Sifarişin statusu yeniləndi.",
            type: "success",
            autoCloseDuration: 2500,
          }),
        );
      } catch {
        dispatch(
          showNotification({
            message: "Status yenilənərkən xəta baş verdi.",
            type: "error",
            autoCloseDuration: 3000,
          }),
        );
      }
    },
    [dispatch],
  );

  const statusOptions = useMemo(() => {
    if (activeReport === "queries") {
      return uniqueStatuses(queries, ["status"]);
    }
    if (activeReport === "orders") {
      return uniqueStatuses(orders, ["statusLabel", "statusKind"]);
    }
    return [];
  }, [activeReport, queries, orders]);

  const categoryOptions = useMemo(
    () => (activeReport === "expenses" ? uniqueCategories(transactions) : []),
    [activeReport, transactions],
  );

  const openPayment = (row: PartnerRow) => {
    const id = parsePartnerId(row.key);
    if (!id) {
      alert("Bu sətir üçün tərəfdaş kartı tapılmadı");
      return;
    }
    const forCustomer = activeReport === "customers";
    setPaymentSeed({
      partnerKind: forCustomer ? "customer" : "carrier",
      type: forCustomer ? "INCOME" : "EXPENSE",
      category: forCustomer ? "Müştəri ödənişi" : "Daşıyıcı ödənişi",
      customerId: forCustomer ? id : "",
      carrierId: forCustomer ? "" : id,
      amount: "",
      currency: "AZN",
      paymentMethod: "Kasa",
      name: "",
      orderId: "",
    });
    setPaymentOpen(true);
  };

  const openOrderRowPayment = (raw: any) => {
    const orderId = raw?.id != null ? String(raw.id) : "";
    let customerId =
      raw?.customerId != null && raw.customerId !== ""
        ? String(raw.customerId)
        : "";
    if (!customerId) {
      const found = findCustomerForName(
        customers,
        raw?._customerName || raw?.customerName || raw?.customer,
      );
      if (found?.id != null) customerId = String(found.id);
    }
    setPaymentSeed({
      partnerKind: "customer",
      type: "INCOME",
      category: "Müştəri ödənişi",
      customerId,
      carrierId: "",
      amount: "",
      currency: "AZN",
      paymentMethod: "Kasa",
      name: "",
      orderId,
    });
    setPaymentOpen(true);
  };

  const resolveOrderDetailId = (
    raw: any,
    report: ReportId | null,
    rowKey?: string,
  ) => {
    if (report !== "orders") return "";
    if (raw?.id != null && raw.id !== "") return String(raw.id);
    if (raw?._orderId != null && raw._orderId !== "") {
      return String(raw._orderId);
    }
    if (rowKey && rowKey !== "undefined" && rowKey !== "null") {
      return String(rowKey);
    }
    return "";
  };

  const handlePaymentSave = async (data: any) => {
    try {
      await createFinanceTransactionAction({
        ...data,
        amount: Number(data.amount) || 0,
        paymentMethod: data.paymentMethod || "Kasa",
      });
      setPaymentOpen(false);
      setPaymentSeed(null);
      await loadData();
    } catch {
      alert("Ödəniş saxlanılarkən xəta baş verdi");
    }
  };

  const setFilterField = (field: keyof ReportFilter, value: string) => {
    setFilter((prev) => ({ ...prev, [field]: value }));
  };

  const handleExportExcel = async () => {
    if (!activeReport) return;
    setExporting(true);
    try {
      const title = reportExcelFileTitle(activeReport);
      if (isPartnerReport) {
        const partnerLabel =
          activeReport === "customers" ? "Müştəri" : "Daşıyıcı";
        if (partnerExportType === "detailed") {
          const orderLines = buildPartnerOrderLines(
            activeReport === "carriers" ? "carriers" : "customers",
            partnerRows,
            { orders, transactions, customers, carriers },
          );
          await exportPartnerDetailedReportToExcel({
            title,
            partnerLabel,
            partners: partnerRows,
            orderLines,
          });
          return;
        }
        await exportPartnerReportToExcel({
          title,
          partnerLabel,
          rows: partnerRows,
        });
        return;
      }
      if (activeReport === "queries") {
        await exportGenericReportToExcel({
          title,
          headers: ["№", "Müştəri", "Marşrut", "Yüklər", "Status", "Tarix"],
          rows: genericRows,
        });
        return;
      }
      if (activeReport === "orders") {
        await exportGenericReportToExcel({
          title,
          headers: [
            "Sifariş",
            "Müştəri",
            "Qiymət",
            "Xərclər",
            "Ödəniş",
            "Qalıq",
            "Qazanc",
            "Status",
            "Tarix",
          ],
          rows: genericRows,
        });
        return;
      }
      await exportGenericReportToExcel({
        title,
        headers: ["ID", "Ad", "Kateqoriya", "Metod", "Məbləğ", "Tarix"],
        rows: genericRows,
        totalLabel: "Ümumi xərc",
        totalValue: expenseTotal,
        totalColumnIndex: 4,
      });
    } catch (err) {
      console.error(err);
      alert("Excel faylı hazırlanarkən xəta baş verdi");
    } finally {
      setExporting(false);
    }
  };

  if (loading && transactions.length === 0 && orders.length === 0) {
    return <Loading />;
  }

  const activeMeta = REPORT_CARDS.find((c) => c.id === activeReport) || null;
  const isCustomers = activeReport === "customers";

  const tableHeaders = (() => {
    if (isPartnerReport) {
      return [
        isCustomers ? "Müştəri" : "Daşıyıcı",
        "Görülən iş",
        "Borc (AZN)",
        "Ödənilib (AZN)",
        "Qalıq (AZN)",
        "Əməliyyat",
      ];
    }
    if (activeReport === "queries") {
      return ["№", "Müştəri", "Marşrut", "Yüklər", "Status", "Tarix"];
    }
    if (activeReport === "orders") {
      return [
        "Sifariş",
        "Müştəri",
        "Qiymət",
        "Xərclər",
        "Ödəniş",
        "Qalıq",
        "Qazanc",
        "Status",
        "Tarix",
        "Əməliyyat",
      ];
    }
    return ["ID", "Ad", "Kateqoriya", "Metod", "Məbləğ", "Tarix"];
  })();

  const hasStickyActionCol =
    isPartnerReport || activeReport === "orders";

  const hint = (() => {
    switch (activeReport) {
      case "customers":
        return "Müştəri kartları üzrə borc və ödənişlər — filtrlə axtarın";
      case "carriers":
        return "Daşıyıcı kartları üzrə borc və ödənişlər — filtrlə axtarın";
      case "queries":
        return "Sorğular üzrə hesabat — tarix, status və axtarış";
      case "orders":
        return "Sifarişlər üzrə qiymət, xərc, ödəniş, qalıq və qazanc";
      case "expenses":
        return "Xərc əməliyyatları — kateqoriya, metod və tarix filtri";
      default:
        return "";
    }
  })();

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.kasaHeaderRow} style={{ marginBottom: 0 }}>
          <div>
            <h2 className={styles.kasaTitle}>Hesabatlar</h2>
            <p className={styles.kasaHint}>
              Hesabat növünü seçin — cədvəl ayrıca pəncərədə açılır
            </p>
          </div>
        </div>
      </div>

      <div className={styles.pageBody}>
        <div className={styles.reportCardsGrid}>
          {REPORT_CARDS.map((card) => (
            <button
              key={card.id}
              type="button"
              className={styles.reportCard}
              onClick={() => setActiveReport(card.id)}
            >
              <span className={styles.reportCardIcon}>{card.icon}</span>
              <span className={styles.reportCardTitle}>{card.title}</span>
              <span className={styles.reportCardDesc}>{card.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div
        className={`${drawerStyles.overlay} ${activeReport ? drawerStyles.overlayOpen : ""}`}
        aria-hidden={!activeReport}
        onClick={() => {
          if (!paymentOpen) setActiveReport(null);
        }}
      />
      <aside
        className={`${drawerStyles.drawer} ${activeReport ? drawerStyles.drawerOpen : ""} ${styles.reportDrawer}`}
        aria-hidden={!activeReport}
      >
        <div className={styles.reportDrawerHeader}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
            <button
              type="button"
              className={styles.reportBackBtn}
              onClick={() => setActiveReport(null)}
              title="Geri"
            >
              <FiArrowLeft />
            </button>
            <div>
              <h3 className={styles.reportDrawerTitle}>
                {activeMeta?.title || "Hesabat"}
              </h3>
              <p className={styles.reportDrawerHint}>{hint}</p>
            </div>
          </div>
          <button
            type="button"
            className={styles.reportCloseBtn}
            onClick={() => setActiveReport(null)}
            aria-label="Bağla"
          >
            <FiX />
          </button>
        </div>

        <div className={styles.reportFilters}>
          <label className={styles.reportFilterField}>
            <span>Axtarış</span>
            <input
              value={filter.search}
              onChange={(e) => setFilterField("search", e.target.value)}
              placeholder="Ad, №, status..."
            />
          </label>
          {isPartnerReport ? (
            <label className={styles.reportFilterField}>
              <span>Excel tipi</span>
              <select
                value={partnerExportType}
                onChange={(e) =>
                  setPartnerExportType(
                    e.target.value === "detailed" ? "detailed" : "summary",
                  )
                }
              >
                <option value="summary">
                  {activeReport === "carriers"
                    ? "Adi — daşıyıcı borcları"
                    : "Adi — müştəri borcları"}
                </option>
                <option value="detailed">
                  {activeReport === "carriers"
                    ? "Detallı — daşıyıcı + sifarişlər"
                    : "Detallı — müştəri + sifarişlər"}
                </option>
              </select>
            </label>
          ) : null}
          {!isPartnerReport ? (
            <>
              <label className={styles.reportFilterField}>
                <span>Başlanğıc</span>
                <input
                  type="date"
                  value={filter.dateFrom}
                  onChange={(e) => setFilterField("dateFrom", e.target.value)}
                />
              </label>
              <label className={styles.reportFilterField}>
                <span>Bitiş</span>
                <input
                  type="date"
                  value={filter.dateTo}
                  onChange={(e) => setFilterField("dateTo", e.target.value)}
                />
              </label>
            </>
          ) : null}
          {!isPartnerReport && activeReport !== "expenses" ? (
            <label className={styles.reportFilterField}>
              <span>Status</span>
              <select
                value={filter.status}
                onChange={(e) => setFilterField("status", e.target.value)}
              >
                <option value="">Hamısı</option>
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {activeReport === "queries" || activeReport === "orders"
                      ? statusLabelAz(s)
                      : s}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {activeReport === "expenses" ? (
            <>
              <label className={styles.reportFilterField}>
                <span>Kateqoriya</span>
                <select
                  value={filter.category}
                  onChange={(e) => setFilterField("category", e.target.value)}
                >
                  <option value="">Hamısı</option>
                  {categoryOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.reportFilterField}>
                <span>Metod</span>
                <select
                  value={filter.method}
                  onChange={(e) => setFilterField("method", e.target.value)}
                >
                  <option value="">Hamısı</option>
                  <option value="Kasa">Kasa</option>
                  <option value="Bank">Bank</option>
                </select>
              </label>
            </>
          ) : null}
          <button
            type="button"
            className={styles.reportFilterClear}
            onClick={() => setFilter(emptyReportFilter())}
          >
            Təmizlə
          </button>
          <button
            type="button"
            className={styles.reportFilterExcel}
            onClick={() => void handleExportExcel()}
            disabled={exporting || displayCount === 0}
            title="Cədvəli Excel-ə çıxar"
          >
            <FiDownload size={14} />
            {exporting ? "Hazırlanır..." : "Excel-ə çıxar"}
          </button>
        </div>

        <div className={styles.reportDrawerToolbar}>
          <div className={sorguActionBarStyles.statsGroup}>
            {isPartnerReport ? (
              <>
                <span className={sorguActionBarStyles.statPill} style={{ fontWeight: 700 }}>
                  Borc: {fmtAzn(partnerTotals.owed)} AZN
                </span>
                <span
                  className={sorguActionBarStyles.statPill}
                  style={{ color: "#059669", fontWeight: 700 }}
                >
                  Ödənilib: {fmtAzn(partnerTotals.paid)} AZN
                </span>
                <span
                  className={sorguActionBarStyles.statPill}
                  style={{
                    color: partnerTotals.balance > 0 ? "#dc2626" : "#059669",
                    fontWeight: 700,
                  }}
                >
                  Qalıq: {fmtAzn(partnerTotals.balance)} AZN
                </span>
              </>
            ) : activeReport === "expenses" ? (
              <span
                className={sorguActionBarStyles.statPill}
                style={{ color: "#b91c1c", fontWeight: 700 }}
              >
                Ümumi xərc: {fmtAzn(expenseTotal)} AZN
              </span>
            ) : (
              <span className={sorguActionBarStyles.statPill} style={{ fontWeight: 700 }}>
                Sətir: {displayCount}
              </span>
            )}
          </div>
        </div>

        <div className={styles.reportDrawerBody}>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {tableHeaders.map((h, hi) => (
                    <th
                      key={h}
                      className={`${styles.th}${
                        hasStickyActionCol && hi === tableHeaders.length - 1
                          ? ` ${styles.reportActionTh}`
                          : ""
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayCount === 0 ? (
                  <tr>
                    <td
                      colSpan={tableHeaders.length}
                      className={styles.td}
                      style={{ textAlign: "center", padding: "2rem" }}
                    >
                      Filterə uyğun məlumat yoxdur
                    </td>
                  </tr>
                ) : isPartnerReport ? (
                  pagedPartner.map((r) => (
                    <tr key={r.key} className={styles.tr}>
                      <td className={styles.td} style={{ fontWeight: 600 }}>
                        {r.name}
                      </td>
                      <td className={styles.td}>{r.orderCount}</td>
                      <td className={styles.td}>{fmtAzn(r.owedAzn)}</td>
                      <td
                        className={styles.td}
                        style={{ color: "#059669", fontWeight: 600 }}
                      >
                        {fmtAzn(r.paidAzn)}
                      </td>
                      <td
                        className={styles.td}
                        style={{
                          color: r.balanceAzn > 0 ? "#dc2626" : "#059669",
                          fontWeight: 700,
                        }}
                      >
                        {fmtAzn(r.balanceAzn)}
                      </td>
                      <td className={`${styles.td} ${styles.reportActionTd}`}>
                        <button
                          type="button"
                          className={styles.reportPayBtn}
                          onClick={() => openPayment(r)}
                          title="Ödəniş"
                        >
                          <FiDollarSign size={14} />
                          Ödəniş
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  pagedGeneric.map((r) => {
                    const orderDetailId = resolveOrderDetailId(
                      r.raw,
                      activeReport,
                      r.key,
                    );
                    const queryDetailPath =
                      activeReport === "queries"
                        ? getQueryDetailPath(r.raw || { id: r.key })
                        : "";
                    const showOrderLink = activeReport === "orders";
                    const showQueryLink =
                      activeReport === "queries" &&
                      Boolean(queryDetailPath) &&
                      queryDetailPath !== "/sorgular";
                    const showPayBtn = activeReport === "orders";

                    return (
                    <tr key={r.key} className={styles.tr}>
                      {r.cells.map((cell, idx) => {
                        const fin = r.raw?._finance as
                          | {
                              balanceAzn?: number;
                              profitAzn?: number;
                            }
                          | undefined;
                        let cellStyle: CSSProperties | undefined =
                          idx === 0 ? { fontWeight: 600 } : undefined;

                        if (activeReport === "expenses" && idx === 4) {
                          cellStyle = { color: "#b91c1c", fontWeight: 600 };
                        }

                        if (activeReport === "orders") {
                          if (idx === 3) {
                            cellStyle = { color: "#b91c1c", fontWeight: 600 };
                          } else if (idx === 4) {
                            cellStyle = { color: "#059669", fontWeight: 600 };
                          } else if (idx === 5) {
                            const bal = Number(fin?.balanceAzn) || 0;
                            cellStyle = {
                              color: bal > 0 ? "#dc2626" : "#059669",
                              fontWeight: 700,
                            };
                          } else if (idx === 6) {
                            const profit = Number(fin?.profitAzn) || 0;
                            cellStyle = {
                              color: profit >= 0 ? "#059669" : "#dc2626",
                              fontWeight: 700,
                            };
                          }
                        }

                        const isStatusBadge =
                          (activeReport === "queries" && idx === 4) ||
                          (activeReport === "orders" && idx === 7);

                        if (activeReport === "queries" && idx === 3) {
                          cellStyle = {
                            ...cellStyle,
                            whiteSpace: "normal",
                            maxWidth: 280,
                            fontSize: "0.78rem",
                            color: "#475569",
                            fontWeight: 500,
                          };
                        }

                        const isOrderLink =
                          showOrderLink &&
                          idx === 0 &&
                          Boolean(orderDetailId) &&
                          String(cell || "").trim() !== "—";

                        const isQueryLink =
                          showQueryLink &&
                          idx === 0 &&
                          String(cell || "").trim() !== "—";

                        return (
                          <td
                            key={`${r.key}-${idx}`}
                            className={styles.td}
                            style={cellStyle}
                          >
                            {activeReport === "orders" && idx === 7 ? (
                              <OrderStatusPicker
                                value={String(r.raw?.statusKind || "")}
                                disabled={!allowEditOrderStatus}
                                onChange={(kind, label) =>
                                  handleOrderStatusChange(
                                    r.raw?.id ?? r.key,
                                    kind,
                                    label,
                                  )
                                }
                              />
                            ) : isStatusBadge ? (
                              <StatusBadge
                                label={String(cell || "—")}
                                kind={undefined}
                              />
                            ) : isOrderLink ? (
                              <Link
                                to={`/sifarisler/${orderDetailId}`}
                                className={styles.reportOrderLink}
                                title="Sifarişə keç"
                              >
                                {cell}
                              </Link>
                            ) : isQueryLink ? (
                              <Link
                                to={queryDetailPath}
                                className={styles.reportOrderLink}
                                title="Sorğuya keç"
                              >
                                {cell}
                              </Link>
                            ) : (
                              cell
                            )}
                          </td>
                        );
                      })}
                      {showPayBtn ? (
                        <td className={`${styles.td} ${styles.reportActionTd}`}>
                          <button
                            type="button"
                            className={styles.reportPayBtn}
                            onClick={() => openOrderRowPayment(r.raw)}
                            title="Ödəniş"
                          >
                            <FiDollarSign size={14} />
                            Ödəniş
                          </button>
                        </td>
                      ) : null}
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.reportDrawerFooter}>
          <SorgularPagination
            totalRows={displayCount}
            currentPage={currentPage}
            totalPages={totalPages}
            getVisiblePages={getVisiblePages}
            onPageChange={setCurrentPage}
            pageSize={pageSize}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        </div>
      </aside>

      <FinanceModal
        isOpen={paymentOpen}
        onClose={() => {
          setPaymentOpen(false);
          setPaymentSeed(null);
        }}
        onSave={handlePaymentSave}
        initialData={paymentSeed}
        defaultWallet="Kasa"
      />
    </div>
  );
}

function resolveTxCashFromCell(cell: string | number): number {
  const n = Number.parseFloat(String(cell).replace(/[^\d.,-]/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}
