"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  FiAlertCircle,
  FiClipboard,
  FiCreditCard,
  FiDollarSign,
  FiFileText,
  FiPackage,
  FiRefreshCw,
  FiTrendingDown,
  FiTrendingUp,
  FiTruck,
  FiUsers,
} from "react-icons/fi";
import Loading from "../../common/components/loading/Loading";
import StatusBadge from "../../common/components/StatusBadge";
import { usePermissions } from "../../common/hooks/usePermissions";
import { useCurrencyRates } from "../../common/hooks/useCurrencyRates";
import { fetchQueriesAction } from "../../common/actions/query.actions";
import { fetchOrdersAction } from "../../common/actions/order.actions";
import { fetchCustomersAction } from "../../common/actions/customer.actions";
import { fetchCarriersAction } from "../../common/actions/carrier.actions";
import {
  fetchFinanceTransactionsAction,
  fetchInvoicesAction,
} from "../../common/actions/finance.actions";
import { fetchTasksAction } from "../../common/actions/task.actions";
import { ENDPOINTS } from "../../services/EndpointResources.g";
import {
  countSorguStatuses,
  isSorguActiveStatus,
  SORGU_STATUS_OPTIONS,
} from "../sorgular/lib/sorguStatus";
import { getQueryCargoSummary, getQueryDetailPath, getQueryDirectionLabel, getQueryTransportLabel } from "../sorgular/lib/queryDisplay.utils";
import { formatDateOnly } from "../sifarisler/lib/formatDate";
import { SIFARIS_STATUS_PILLS, STATUS_OPTIONS } from "../sifarisler/constants/sifaris.constants";
import { countSifarisStatuses } from "../sifarisler/lib/filterSifarisler";
import {
  isAlinmisInvoiceFinanceName,
  isIreliInvoiceFinanceName,
} from "../sifarisler/lib/offerExpense.utils";
import {
  isCashMovementTx,
  isIncomeTx,
  resolveTxCashAzn,
} from "../maliyye/lib/financeWallet.utils";
import {
  FALLBACK_AZN_RATES,
  resolveFinanceExpenseAzn,
  resolveFinanceRevenueAzn,
} from "../../common/utils/currency.utils";
import {
  asArray,
  dash,
  financeTypeLabel,
  fmtAzn,
  fmtInt,
  includesSearch,
  invoiceTypeLabel,
  joinList,
  moneyPair,
  parseMoney,
  taskStatusLabel,
  yesNo,
} from "./lib/dashboardFormat";
import {
  addToBucket,
  lastMonthKeys,
  monthKey,
  monthLabel,
  pickRowDate,
  seriesFromBuckets,
  topN,
  TONE_HEX,
} from "./lib/dashboardCharts";
import {
  ChartCard,
  DonutChart,
  GroupedBarChart,
  HBarChart,
} from "./components/DashboardCharts";
import styles from "./dashboard.module.css";

type SectionId =
  | "all"
  | "queries"
  | "offers"
  | "orders"
  | "voyages"
  | "loads"
  | "finance"
  | "invoices"
  | "customers"
  | "carriers"
  | "tasks";

const SECTION_TABS: { id: SectionId; label: string }[] = [
  { id: "all", label: "Hamısı" },
  { id: "queries", label: "Sorğular" },
  { id: "offers", label: "Təkliflər" },
  { id: "orders", label: "Sifarişlər" },
  { id: "voyages", label: "Reyslər" },
  { id: "loads", label: "Yüklər" },
  { id: "finance", label: "Maliyyə" },
  { id: "invoices", label: "Hesablar" },
  { id: "customers", label: "Müştərilər" },
  { id: "carriers", label: "Daşıyıcılar" },
  { id: "tasks", label: "Tapşırıqlar" },
];

function partnerName(row: any): string {
  return dash(row?.name || row?.company || row?.companyName || row?.shortName);
}

function offerItemsOf(query: any): any[] {
  if (Array.isArray(query?.priceOfferItems) && query.priceOfferItems.length) {
    return query.priceOfferItems;
  }
  const raw = query?.priceOffersJson;
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function flattenOffers(queries: any[]): any[] {
  const out: any[] = [];
  queries.forEach((q) => {
    offerItemsOf(q).forEach((item: any, idx: number) => {
      out.push({
        ...item,
        query: q,
        queryId: q.id,
        queryNumber: q.number,
        _key: `${q.id}-${item?.id ?? idx}`,
      });
    });
  });
  return out;
}

function containerNumbers(row: any): string {
  const loads = Array.isArray(row?.loads) ? row.loads : [];
  return joinList(loads.map((l: any) => l.containerNumber));
}

function orderCargoParams(row: any): string {
  return joinList([
    row?.cargoParams,
    row?.weightKg ? `${row.weightKg} kq` : "",
    row?.volumeM3 ? `${row.volumeM3} m³` : "",
    row?.ldm ? `LDM ${row.ldm}` : "",
  ]);
}

function orderDocSummary(row: any): string {
  const n = Array.isArray(row?.orderDocuments) ? row.orderDocuments.length : 0;
  return joinList([
    row?.hasSentInvoice ? "İrəli hesab" : "",
    row?.hasReceivedInvoice ? "Alınmış hesab" : "",
    row?.hasTransportDoc ? "Nəqliyyat sənədi" : "",
    row?.hasHandoverAct ? "Təhvil aktı" : "",
    n ? `${n} sənəd` : dash(row?.documents),
  ]);
}

function payrollSum(row: any): string {
  const list = Array.isArray(row?.payrolls) ? row.payrolls : [];
  const sum = list.reduce((s: number, p: any) => s + (Number(p.amountAzn) || 0), 0);
  return sum ? fmtAzn(sum) : "—";
}

const PERIODS: { id: 6 | 12 | "ytd"; label: string }[] = [
  { id: 6, label: "Son 6 ay" },
  { id: 12, label: "Son 12 ay" },
  { id: "ytd", label: "Bu il" },
];

function KpiCard({
  label,
  value,
  hint,
  icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: ReactNode;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className={styles.kpi}>
      <div className={styles.kpiIcon} style={{ background: iconBg, color: iconColor }}>
        {icon}
      </div>
      <div className={styles.kpiBody}>
        <div className={styles.kpiLabel}>{label}</div>
        <div className={styles.kpiValue}>{value}</div>
        {hint ? <div className={styles.kpiHint}>{hint}</div> : null}
      </div>
    </div>
  );
}

function orderStatusLabel(kind: unknown): string {
  const found = STATUS_OPTIONS.find((o) => o.value === String(kind || ""));
  return found?.label || dash(kind);
}

function DataTable({
  headers,
  rows,
  empty,
  expanded,
}: {
  headers: string[];
  rows: Array<{ key: string; cells: Array<ReactNode> }>;
  empty: string;
  expanded?: boolean;
}) {
  if (rows.length === 0) {
    return <div className={styles.empty}>{empty}</div>;
  }
  return (
    <div className={`${styles.tableWrap} ${expanded ? styles.tableWrapFull : ""}`}>
      <table className={styles.table}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={`${h}-${i}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key}>
              {r.cells.map((cell, i) => (
                <td
                  key={`${r.key}-${i}`}
                  title={typeof cell === "string" ? cell : undefined}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DashboardPage() {
  const { canView } = usePermissions();
  const { ratesData } = useCurrencyRates();
  const rates = ratesData?.rates || FALLBACK_AZN_RATES;

  const showQueries = canView("sorgular", "active") || canView("sorgular", "archive");
  const showOffers = canView("sorgular", "offers") || showQueries;
  const showOrders = canView("sifarisler", "orders");
  const showVoyages = canView("sifarisler", "voyages") || showOrders;
  const showLoads = canView("sifarisler", "loads") || showOrders;
  const showFinance = canView("maliyye") || canView("sifarisler", "finance");
  const showInvoices = canView("sifarisler", "invoices") || showFinance;
  const showCustomers = canView("musteriler", "list");
  const showCarriers = canView("dasiyicilar", "list");
  const showTasks = canView("tapshiriqlar", "board");

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<6 | 12 | "ytd">(12);
  const [section, setSection] = useState<SectionId>("all");
  const [queries, setQueries] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [voyages, setVoyages] = useState<any[]>([]);
  const [loads, setLoads] = useState<any[]>([]);
  const [finance, setFinance] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [carriers, setCarriers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const [
        q,
        o,
        vRes,
        lRes,
        f,
        inv,
        cu,
        ca,
        t,
      ] = await Promise.all([
        showQueries || showOffers
          ? fetchQueriesAction().catch(() => [])
          : Promise.resolve([]),
        showOrders ? fetchOrdersAction().catch(() => []) : Promise.resolve([]),
        showVoyages
          ? axios.get(ENDPOINTS.VOYAGES.BASE, { headers }).catch(() => ({ data: [] }))
          : Promise.resolve({ data: [] }),
        showLoads
          ? axios.get(ENDPOINTS.LOADS.BASE, { headers }).catch(() => ({ data: [] }))
          : Promise.resolve({ data: [] }),
        showFinance
          ? fetchFinanceTransactionsAction().catch(() => [])
          : Promise.resolve([]),
        showInvoices ? fetchInvoicesAction().catch(() => []) : Promise.resolve([]),
        showCustomers ? fetchCustomersAction().catch(() => []) : Promise.resolve([]),
        showCarriers ? fetchCarriersAction().catch(() => []) : Promise.resolve([]),
        showTasks ? fetchTasksAction().catch(() => []) : Promise.resolve([]),
      ]);
      setQueries(asArray(q));
      setOrders(asArray(o));
      setVoyages(asArray(vRes.data));
      setLoads(asArray(lRes.data));
      setFinance(asArray(f));
      setInvoices(asArray(inv));
      setCustomers(asArray(cu));
      setCarriers(asArray(ca));
      setTasks(asArray(t));
    } finally {
      setLoading(false);
    }
  }, [
    showQueries,
    showOffers,
    showOrders,
    showVoyages,
    showLoads,
    showFinance,
    showInvoices,
    showCustomers,
    showCarriers,
    showTasks,
  ]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const q = search.trim();
  const filteredQueries = useMemo(
    () => queries.filter((r) => includesSearch(r, q)),
    [queries, q],
  );
  const offerRows = useMemo(() => flattenOffers(queries), [queries]);
  const filteredOffers = useMemo(
    () => offerRows.filter((r) => includesSearch(r, q)),
    [offerRows, q],
  );
  const filteredOrders = useMemo(
    () => orders.filter((r) => includesSearch(r, q)),
    [orders, q],
  );
  const filteredVoyages = useMemo(
    () => voyages.filter((r) => includesSearch(r, q)),
    [voyages, q],
  );
  const filteredLoads = useMemo(
    () => loads.filter((r) => includesSearch(r, q)),
    [loads, q],
  );
  const filteredFinance = useMemo(
    () => finance.filter((r) => includesSearch(r, q)),
    [finance, q],
  );
  const filteredInvoices = useMemo(
    () => invoices.filter((r) => includesSearch(r, q)),
    [invoices, q],
  );
  const filteredCustomers = useMemo(
    () => customers.filter((r) => includesSearch(r, q)),
    [customers, q],
  );
  const filteredCarriers = useMemo(
    () => carriers.filter((r) => includesSearch(r, q)),
    [carriers, q],
  );
  const filteredTasks = useMemo(
    () => tasks.filter((r) => includesSearch(r, q)),
    [tasks, q],
  );

  const kpis = useMemo(() => {
    const activeQueries = queries.filter((r) => isSorguActiveStatus(r.status)).length;
    const freightAzn = orders.reduce(
      (s, o) => s + (Number(o.freightAzn) || parseMoney(o.freight)),
      0,
    );
    const extraAzn = orders.reduce((s, o) => s + parseMoney(o.extraCosts), 0);
    const profitAzn = orders.reduce(
      (s, o) => s + (Number(o.profitAzn) || parseMoney(o.profit)),
      0,
    );

    let cashIn = 0;
    let cashOut = 0;
    let customerDebt = 0;
    let carrierDebt = 0;
    finance.forEach((tx) => {
      if (isCashMovementTx(tx)) {
        const azn = resolveTxCashAzn(tx, rates);
        if (isIncomeTx(tx)) cashIn += azn;
        else cashOut += azn;
      }
      const name = tx.name;
      if (isIreliInvoiceFinanceName(name)) {
        customerDebt += resolveFinanceRevenueAzn(tx, rates);
      }
      if (isAlinmisInvoiceFinanceName(name)) {
        carrierDebt += resolveFinanceExpenseAzn(tx, rates);
      }
    });

    const openTasks = tasks.filter((t) => {
      const st = String(t.status || "").toLowerCase();
      return st !== "done" && st !== "completed" && st !== "tamamlandı";
    }).length;

    return {
      queries: queries.length,
      activeQueries,
      offers: offerRows.length,
      orders: orders.length,
      voyages: voyages.length,
      loads: loads.length,
      customers: customers.length,
      carriers: carriers.length,
      invoices: invoices.length,
      tasks: tasks.length,
      openTasks,
      freightAzn,
      extraAzn,
      profitAzn,
      cashIn,
      cashOut,
      cashNet: cashIn - cashOut,
      customerDebt,
      carrierDebt,
    };
  }, [queries, offerRows, orders, voyages, loads, customers, carriers, invoices, tasks, finance, rates]);

  const monthKeys = useMemo(() => {
    if (period === "ytd") {
      const now = new Date();
      return lastMonthKeys(now.getMonth() + 1);
    }
    return lastMonthKeys(period);
  }, [period]);

  const chartData = useMemo(() => {
    const freight: Record<string, number> = {};
    const extra: Record<string, number> = {};
    const profit: Record<string, number> = {};
    const cashInB: Record<string, number> = {};
    const cashOutB: Record<string, number> = {};
    const byCustomer: Record<string, number> = {};
    const byCarrier: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    orders.forEach((o) => {
      const d = pickRowDate(o, ["orderDate", "createdAt"]);
      const key = d ? monthKey(d) : "";
      const f = Number(o.freightAzn) || parseMoney(o.freight);
      const e = parseMoney(o.extraCosts);
      const p = Number(o.profitAzn) || parseMoney(o.profit);
      if (key) {
        addToBucket(freight, key, f);
        addToBucket(extra, key, e);
        addToBucket(profit, key, p);
      }
      addToBucket(byCustomer, String(o.customerName || o.customer || "").trim(), f);
    });

    voyages.forEach((v) => {
      addToBucket(
        byCarrier,
        String(v.carrier || "").trim(),
        Number(v.valueAzn) || parseMoney(v.price || v.tripPrice),
      );
    });

    finance.forEach((tx) => {
      if (!isCashMovementTx(tx)) return;
      const d = pickRowDate(tx, ["costDate", "date", "createdAt"]);
      const key = d ? monthKey(d) : "";
      const azn = resolveTxCashAzn(tx, rates);
      if (key) {
        if (isIncomeTx(tx)) addToBucket(cashInB, key, azn);
        else addToBucket(cashOutB, key, azn);
      }
      if (!isIncomeTx(tx)) {
        addToBucket(byCategory, String(tx.category || tx.name || "Digər").trim(), azn);
      }
    });

    const qCounts = countSorguStatuses(queries);
    const oCounts = countSifarisStatuses(
      orders.map((o) => ({
        ...o,
        statusKind: o.statusKind || "planned",
      })) as any,
    );

    const taskMap: Record<string, number> = {};
    tasks.forEach((t) => {
      const lab = taskStatusLabel(t.status);
      taskMap[lab] = (taskMap[lab] || 0) + 1;
    });
    const taskColors: Record<string, string> = {
      Gözləmə: TONE_HEX.slate,
      "Ediləcək": TONE_HEX.sky,
      İcrada: TONE_HEX.amber,
      Yoxlama: TONE_HEX.violet,
      Tamamlandı: TONE_HEX.emerald,
    };

    return {
      labels: monthKeys.map(monthLabel),
      periodHint: PERIODS.find((p) => p.id === period)?.label || "",
      financeSeries: [
        { name: "Fraxt", color: TONE_HEX.blue, values: seriesFromBuckets(monthKeys, freight) },
        { name: "Xərc", color: TONE_HEX.amber, values: seriesFromBuckets(monthKeys, extra) },
        { name: "Mənfəət", color: TONE_HEX.emerald, values: seriesFromBuckets(monthKeys, profit) },
      ],
      cashSeries: [
        { name: "Mədaxil", color: TONE_HEX.emerald, values: seriesFromBuckets(monthKeys, cashInB) },
        { name: "Məxaric", color: TONE_HEX.rose, values: seriesFromBuckets(monthKeys, cashOutB) },
      ],
      querySlices: SORGU_STATUS_OPTIONS.map((opt) => ({
        label: opt.label,
        value: qCounts[opt.value] || 0,
        color: TONE_HEX[opt.tone] || TONE_HEX.slate,
      })),
      orderSlices: SIFARIS_STATUS_PILLS.map((opt) => ({
        label: opt.label,
        value: oCounts[opt.value] || 0,
        color: TONE_HEX[opt.tone] || TONE_HEX.slate,
      })),
      invSlices: [
        { id: "ireli", label: "İrəli", color: TONE_HEX.sky },
        { id: "ilkin", label: "İlkin", color: TONE_HEX.amber },
        { id: "alinmis", label: "Alınmış", color: TONE_HEX.violet },
      ].map((x) => ({
        label: x.label,
        color: x.color,
        value: invoices.filter((i) => String(i.type || "").toLowerCase() === x.id).length,
      })),
      taskSlices: Object.entries(taskMap).map(([label, value]) => ({
        label,
        value,
        color: taskColors[label] || TONE_HEX.slate,
      })),
      topCustomers: topN(byCustomer, 8).map((x, i) => ({
        ...x,
        color: i === 0 ? TONE_HEX.blue : TONE_HEX.sky,
      })),
      topCarriers: topN(byCarrier, 8).map((x) => ({ ...x, color: TONE_HEX.violet })),
      topCategories: topN(byCategory, 8).map((x) => ({ ...x, color: TONE_HEX.amber })),
    };
  }, [orders, voyages, finance, queries, invoices, tasks, rates, monthKeys, period]);

  const expanded = section !== "all";
  const show = (id: SectionId) => section === "all" || section === id;

  if (loading) return <Loading />;

  return (
    <div className={styles.page}>
      <div className={styles.body}>
        <div className={styles.toolbar}>
          <input
            className={styles.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Bütün məlumatlarda axtar (nömrə, müştəri, daşıyıcı, məbləğ…)"
          />
          <div className={styles.periodRow}>
            {PERIODS.map((p) => (
              <button
                key={String(p.id)}
                type="button"
                className={`${styles.periodBtn} ${period === p.id ? styles.periodBtnActive : ""}`}
                onClick={() => setPeriod(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button type="button" className={styles.refreshBtn} onClick={() => void loadAll()}>
            <FiRefreshCw /> Yenilə
          </button>
        </div>

        <div className={styles.kpiGrid}>
          {showQueries ? (
            <KpiCard
              label="Sorğular"
              value={fmtInt(kpis.queries)}
              hint={`Aktiv: ${fmtInt(kpis.activeQueries)}`}
              icon={<FiClipboard />}
              iconBg="#e0f2fe"
              iconColor="#0284c7"
            />
          ) : null}
          {showOffers ? (
            <KpiCard
              label="Qiymət təklifləri"
              value={fmtInt(kpis.offers)}
              icon={<FiFileText />}
              iconBg="#eef2ff"
              iconColor="#4f46e5"
            />
          ) : null}
          {showOrders ? (
            <KpiCard
              label="Sifarişlər"
              value={fmtInt(kpis.orders)}
              hint={`Reys ${fmtInt(kpis.voyages)} · Yük ${fmtInt(kpis.loads)}`}
              icon={<FiPackage />}
              iconBg="#dbeafe"
              iconColor="#2563eb"
            />
          ) : null}
          {showOrders ? (
            <KpiCard
              label="Fraxt"
              value={fmtAzn(kpis.freightAzn)}
              icon={<FiDollarSign />}
              iconBg="#ecfeff"
              iconColor="#0d9488"
            />
          ) : null}
          {showOrders ? (
            <KpiCard
              label="Xərclər"
              value={fmtAzn(kpis.extraAzn)}
              icon={<FiTrendingDown />}
              iconBg="#fff7ed"
              iconColor="#d97706"
            />
          ) : null}
          {showOrders ? (
            <KpiCard
              label="Mənfəət"
              value={fmtAzn(kpis.profitAzn)}
              icon={<FiTrendingUp />}
              iconBg={kpis.profitAzn < 0 ? "#fff1f2" : "#ecfdf5"}
              iconColor={kpis.profitAzn < 0 ? "#e11d48" : "#059669"}
            />
          ) : null}
          {showFinance ? (
            <KpiCard
              label="Kasa/Bank mədaxil"
              value={fmtAzn(kpis.cashIn)}
              hint={`Məxaric: ${fmtAzn(kpis.cashOut)}`}
              icon={<FiCreditCard />}
              iconBg="#ecfdf5"
              iconColor="#059669"
            />
          ) : null}
          {showFinance ? (
            <KpiCard
              label="Kasa/Bank qalıq"
              value={fmtAzn(kpis.cashNet)}
              icon={<FiCreditCard />}
              iconBg="#f0fdfa"
              iconColor="#0f766e"
            />
          ) : null}
          {showFinance ? (
            <KpiCard
              label="Müştəri borcu"
              value={fmtAzn(kpis.customerDebt)}
              icon={<FiAlertCircle />}
              iconBg="#fff1f2"
              iconColor="#e11d48"
            />
          ) : null}
          {showFinance ? (
            <KpiCard
              label="Daşıyıcı borcu"
              value={fmtAzn(kpis.carrierDebt)}
              icon={<FiAlertCircle />}
              iconBg="#fdf2f8"
              iconColor="#db2777"
            />
          ) : null}
          {showCustomers ? (
            <KpiCard
              label="Müştərilər"
              value={fmtInt(kpis.customers)}
              icon={<FiUsers />}
              iconBg="#f5f3ff"
              iconColor="#7c3aed"
            />
          ) : null}
          {showCarriers ? (
            <KpiCard
              label="Daşıyıcılar"
              value={fmtInt(kpis.carriers)}
              icon={<FiTruck />}
              iconBg="#f8fafc"
              iconColor="#475569"
            />
          ) : null}
          {showInvoices ? (
            <KpiCard
              label="Hesablar"
              value={fmtInt(kpis.invoices)}
              icon={<FiFileText />}
              iconBg="#eef2ff"
              iconColor="#4338ca"
            />
          ) : null}
          {showTasks ? (
            <KpiCard
              label="Tapşırıqlar"
              value={fmtInt(kpis.tasks)}
              hint={`Açıq: ${fmtInt(kpis.openTasks)}`}
              icon={<FiClipboard />}
              iconBg="#f1f5f9"
              iconColor="#334155"
            />
          ) : null}
        </div>

        <div className={styles.chartGrid}>
          {showOrders ? (
            <ChartCard title="Fraxt, xərc və mənfəət" hint={chartData.periodHint} wide>
              <GroupedBarChart labels={chartData.labels} series={chartData.financeSeries} />
            </ChartCard>
          ) : null}
          {showFinance ? (
            <ChartCard title="Kasa/Bank hərəkəti" hint={chartData.periodHint} wide>
              <GroupedBarChart labels={chartData.labels} series={chartData.cashSeries} />
            </ChartCard>
          ) : null}
          {showQueries ? (
            <ChartCard title="Sorğu statusları">
              <DonutChart
                slices={chartData.querySlices}
                centerLabel="Sorğu"
                centerValue={fmtInt(kpis.queries)}
              />
            </ChartCard>
          ) : null}
          {showOrders ? (
            <ChartCard title="Sifariş statusları">
              <DonutChart
                slices={chartData.orderSlices}
                centerLabel="Sifariş"
                centerValue={fmtInt(kpis.orders)}
              />
            </ChartCard>
          ) : null}
          {showOrders ? (
            <ChartCard title="Top müştərilər (fraxt)">
              <HBarChart items={chartData.topCustomers} />
            </ChartCard>
          ) : null}
          {showVoyages ? (
            <ChartCard title="Top daşıyıcılar (reys)">
              <HBarChart items={chartData.topCarriers} />
            </ChartCard>
          ) : null}
          {showFinance ? (
            <ChartCard title="Xərc kateqoriyaları">
              <HBarChart items={chartData.topCategories} />
            </ChartCard>
          ) : null}
          {showInvoices ? (
            <ChartCard title="Hesab tipləri">
              <DonutChart
                slices={chartData.invSlices}
                centerLabel="Hesab"
                centerValue={fmtInt(kpis.invoices)}
              />
            </ChartCard>
          ) : null}
          {showTasks ? (
            <ChartCard title="Tapşırıq statusları">
              <DonutChart
                slices={chartData.taskSlices}
                centerLabel="Tapşırıq"
                centerValue={fmtInt(kpis.tasks)}
              />
            </ChartCard>
          ) : null}
        </div>

        <div className={styles.sectionTabs}>
          {SECTION_TABS.filter((tab) => {
            if (tab.id === "all") return true;
            if (tab.id === "queries") return showQueries;
            if (tab.id === "offers") return showOffers;
            if (tab.id === "orders") return showOrders;
            if (tab.id === "voyages") return showVoyages;
            if (tab.id === "loads") return showLoads;
            if (tab.id === "finance") return showFinance;
            if (tab.id === "invoices") return showInvoices;
            if (tab.id === "customers") return showCustomers;
            if (tab.id === "carriers") return showCarriers;
            if (tab.id === "tasks") return showTasks;
            return false;
          }).map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`${styles.tab} ${section === tab.id ? styles.tabActive : ""}`}
              onClick={() => setSection(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {showQueries && show("queries") ? (
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Sorğular</h2>
              <span className={styles.sectionMeta}>{fmtInt(filteredQueries.length)} sətir</span>
              <Link className={styles.link} to="/sorgular">
                Səhifəyə keç
              </Link>
            </div>
            <DataTable
              expanded={expanded}
              empty="Sorğu yoxdur"
              headers={[
                "Nömrə",
                "Status",
                "Yaradıldı",
                "Müştəri",
                "Şirkət",
                "Satıcı",
                "İstiqamət",
                "Yükləmə tarixi",
                "Boşaltma tarixi",
                "Göndərən",
                "Alıcı",
                "Yük",
                "Nəqliyyat",
                "Incoterms",
                "Əlaqə",
                "Menecer",
                "Loqist",
                "Təkliflər",
                "Referans",
              ]}
              rows={filteredQueries.map((row) => ({
                key: String(row.id),
                cells: [
                  <Link key="n" className={styles.rowLink} to={getQueryDetailPath(row)}>
                    {dash(row.number)}
                  </Link>,
                  <StatusBadge key="s" label={String(row.status || "")} />,
                  formatDateOnly(row.createdAt || row.statusAssignedAt),
                  dash(row.customer || row.customerName),
                  dash(row.company),
                  dash(row.seller || row.createdByName),
                  getQueryDirectionLabel(row) || "—",
                  formatDateOnly(row.loadDate),
                  formatDateOnly(row.unloadDate),
                  dash(row.sender || row.loadPlaceCompany),
                  dash(row.recipient || row.unloadPlaceCompany),
                  getQueryCargoSummary(row) || dash(row.cargoInfo),
                  getQueryTransportLabel(row),
                  dash(row.incoterms),
                  dash(row.contactPerson),
                  dash(row.manager || row.user),
                  dash(row.logist),
                  String(offerItemsOf(row).length),
                  dash(row.customerOrderRef || row.contractNumber),
                ],
              }))}
            />
          </section>
        ) : null}

        {showOffers && show("offers") ? (
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Qiymət təklifləri</h2>
              <span className={styles.sectionMeta}>{fmtInt(filteredOffers.length)} sətir</span>
              <Link className={styles.link} to="/sorgular?tab=offers">
                Səhifəyə keç
              </Link>
            </div>
            <DataTable
              expanded={expanded}
              empty="Təklif yoxdur"
              headers={[
                "Sorğu",
                "Daşıyıcı",
                "Alış",
                "Valyuta",
                "Satış",
                "Qazanc",
                "Müştəri",
                "Satıcı",
                "Yükləmə",
                "Qeyd",
                "Tarix",
              ]}
              rows={filteredOffers.map((item) => {
                const qRow = item.query || {};
                return {
                  key: String(item._key),
                  cells: [
                    <Link
                      key="n"
                      className={styles.rowLink}
                      to={getQueryDetailPath(qRow)}
                    >
                      {dash(item.queryNumber || qRow.number)}
                    </Link>,
                    dash(item.carrierName || item.carrier),
                    dash(item.price || item.purchasePrice),
                    dash(item.currency),
                    dash(item.salesPrice || item.salePrice),
                    dash(item.profit || item.gain),
                    dash(qRow.customer || qRow.customerName),
                    dash(qRow.seller || qRow.createdByName),
                    getQueryDirectionLabel(qRow) || dash(qRow.loadPlace),
                    dash(item.note || item.comment),
                    formatDateOnly(item.createdAt || qRow.createdAt),
                  ],
                };
              })}
            />
          </section>
        ) : null}

        {showOrders && show("orders") ? (
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Sifarişlər</h2>
              <span className={styles.sectionMeta}>{fmtInt(filteredOrders.length)} sətir</span>
              <Link className={styles.link} to="/sifarisler">
                Səhifəyə keç
              </Link>
            </div>
            <DataTable
              expanded={expanded}
              empty="Sifariş yoxdur"
              headers={[
                "Nömrə",
                "Sorğu",
                "Konteyner",
                "Sorğu tarixi",
                "Sifariş tarixi",
                "Status",
                "Müştəri",
                "Daşıyıcılar",
                "Marşrut",
                "Yük parametrləri",
                "Fraxt",
                "Xərc",
                "Mənfəət",
                "Əməkhaqqı",
                "Sənədlər",
                "Menecer",
                "Ekspeditor",
                "Valyuta",
                "Incoterms",
                "Müqavilə",
              ]}
              rows={filteredOrders.map((row) => {
                const voyages = Array.isArray(row.voyages) ? row.voyages : [];
                const route =
                  voyages
                    .map((v: any) => `${v.loading || "—"} → ${v.unloading || "—"}`)
                    .join(" | ") || dash(row.route);
                const carriers =
                  voyages.map((v: any) => v.carrier).filter(Boolean).join(", ") ||
                  dash(row.carriers);
                return {
                  key: String(row.id),
                  cells: [
                    <Link
                      key="n"
                      className={styles.rowLink}
                      to={`/sifarisler/${row.id}`}
                    >
                      {dash(row.orderNumber)}
                    </Link>,
                    dash(row.query?.number || row.queryNumber),
                    containerNumbers(row),
                    formatDateOnly(row.query?.createdAt || row.queryDate),
                    formatDateOnly(row.orderDate),
                    orderStatusLabel(row.statusKind || row.status),
                    dash(row.customerName || row.customer),
                    carriers,
                    route,
                    orderCargoParams(row),
                    dash(row.freight),
                    dash(row.extraCosts),
                    dash(row.profit),
                    payrollSum(row),
                    orderDocSummary(row),
                    dash(row.manager),
                    dash(row.expeditor),
                    dash(row.currency),
                    dash(row.incoterms),
                    dash(row.contractNumber || row.customerOrderRef),
                  ],
                };
              })}
            />
          </section>
        ) : null}

        {showVoyages && show("voyages") ? (
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Reyslər</h2>
              <span className={styles.sectionMeta}>{fmtInt(filteredVoyages.length)} sətir</span>
              <Link className={styles.link} to="/sifarisler?tab=voyages">
                Səhifəyə keç
              </Link>
            </div>
            <DataTable
              expanded={expanded}
              empty="Reys yoxdur"
              headers={[
                "Reys",
                "Sifariş",
                "Status",
                "Müştəri",
                "Daşıyıcı",
                "Yükləmə",
                "Boşaltma",
                "Göndərən",
                "Alıcı",
                "Qiymət",
                "AZN",
                "Nəqliyyat",
                "Yük",
                "Yükləmə tarixi",
                "Boşaltma tarixi",
                "Şirkət",
                "Etiketlər",
              ]}
              rows={filteredVoyages.map((row) => ({
                key: String(row.id),
                cells: [
                  dash(row.number || row.tripRef || (row.id ? `R-${row.id}` : "")),
                  row.orderId ? (
                    <Link className={styles.rowLink} to={`/sifarisler/${row.orderId}`}>
                      {dash(row.order?.orderNumber || row.orderId)}
                    </Link>
                  ) : (
                    dash(row.order?.orderNumber)
                  ),
                  dash(row.tripStatus || row.tripStatusKind),
                  dash(row.customer),
                  dash(row.carrier),
                  dash(row.loading),
                  dash(row.unloading),
                  dash(row.sender),
                  dash(row.receiver),
                  dash(row.price || row.tripPrice),
                  row.valueAzn != null ? fmtAzn(Number(row.valueAzn) || 0) : "—",
                  dash(row.transportMode || row.vehicleInfo),
                  dash(row.cargoInfo),
                  formatDateOnly(row.loadDate || row.tripDateIso || row.createdAt),
                  formatDateOnly(row.unloadDate),
                  dash(row.company),
                  dash(row.tags),
                ],
              }))}
            />
          </section>
        ) : null}

        {showLoads && show("loads") ? (
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Yüklər</h2>
              <span className={styles.sectionMeta}>{fmtInt(filteredLoads.length)} sətir</span>
              <Link className={styles.link} to="/sifarisler?tab=loads">
                Səhifəyə keç
              </Link>
            </div>
            <DataTable
              expanded={expanded}
              empty="Yük yoxdur"
              headers={[
                "ID",
                "Sifariş",
                "Reys",
                "İzləmə",
                "Konteyner",
                "Yük adı",
                "Göndərən",
                "Alıcı",
                "Yükləmə yeri",
                "Boşaltma yeri",
                "Çəki",
                "Həcm",
                "LDM",
                "Miqdar",
                "Qablaşdırma",
                "Temp.",
                "Status",
                "Yükləmə tarixi",
                "Boşaltma tarixi",
              ]}
              rows={filteredLoads.map((row) => ({
                key: String(row.id),
                cells: [
                  dash(row.id ? `Y-${row.id}` : ""),
                  row.orderId ? (
                    <Link className={styles.rowLink} to={`/sifarisler/${row.orderId}`}>
                      {dash(row.order?.orderNumber || row.orderId)}
                    </Link>
                  ) : (
                    "—"
                  ),
                  dash(row.voyage?.tripRef || row.voyageId),
                  dash(row.trackingNumber || row.loadingNumber),
                  dash(row.containerNumber),
                  dash(row.cargoName),
                  dash(row.sender),
                  dash(row.receiver || row.recipient),
                  dash(row.loadPlace),
                  dash(row.unloadPlace),
                  dash(row.weightKg),
                  dash(row.volumeM3),
                  dash(row.ldm),
                  dash(row.quantity),
                  dash(row.packagingType),
                  dash(row.temperature),
                  dash(row.status),
                  formatDateOnly(row.loadDate),
                  formatDateOnly(row.unloadDate),
                ],
              }))}
            />
          </section>
        ) : null}

        {showFinance && show("finance") ? (
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Maliyyə əməliyyatları</h2>
              <span className={styles.sectionMeta}>{fmtInt(filteredFinance.length)} sətir</span>
              <Link className={styles.link} to="/maliyye">
                Səhifəyə keç
              </Link>
            </div>
            <DataTable
              expanded={expanded}
              empty="Əməliyyat yoxdur"
              headers={[
                "Ad",
                "Tip",
                "Kontragent",
                "Tarif",
                "Tarif AZN",
                "Məsarif",
                "Məsarif AZN",
                "Mənfəət",
                "Məbləğ",
                "Metod",
                "Kateqoriya",
                "Hesab yazılıb",
                "Hesab alınıb",
                "Sifariş",
                "Tarix",
                "İstifadəçi",
              ]}
              rows={filteredFinance.map((tx) => ({
                key: String(tx.id),
                cells: [
                  dash(tx.name),
                  financeTypeLabel(tx.type),
                  dash(tx.partner || tx.customer?.name || tx.carrier?.name),
                  moneyPair(tx.tarifPrice, tx.tarifCurrency),
                  dash(tx.tarifAzn),
                  moneyPair(tx.mesarifPrice, tx.mesarifCurrency),
                  dash(tx.mesarifAzn),
                  dash(tx.profit),
                  moneyPair(tx.amount, tx.currency || "AZN"),
                  dash(tx.paymentMethod),
                  dash(tx.category),
                  yesNo(tx.invoiceWritten),
                  yesNo(tx.invoiceReceived),
                  tx.orderId ? (
                    <Link className={styles.rowLink} to={`/sifarisler/${tx.orderId}`}>
                      {dash(tx.order?.orderNumber || tx.orderId)}
                    </Link>
                  ) : (
                    "—"
                  ),
                  formatDateOnly(tx.costDate || tx.date || tx.createdAt),
                  dash(tx.user || tx.createdByName),
                ],
              }))}
            />
          </section>
        ) : null}

        {showInvoices && show("invoices") ? (
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Hesablar</h2>
              <span className={styles.sectionMeta}>{fmtInt(filteredInvoices.length)} sətir</span>
              <Link className={styles.link} to="/sifarisler">
                Sifarişlərə keç
              </Link>
            </div>
            <DataTable
              expanded={expanded}
              empty="Hesab yoxdur"
              headers={[
                "Nömrə",
                "Tip",
                "Məbləğ",
                "Valyuta",
                "Ödəyici",
                "Status",
                "Sifariş",
                "Müqavilə",
                "Tarix",
                "Ödənişədək",
                "Gecikmə",
                "ƏDV",
                "İcraçı",
                "Hazırlayan",
                "Dil",
                "Şablon",
              ]}
              rows={filteredInvoices.map((inv) => ({
                key: String(inv.id),
                cells: [
                  dash(inv.number),
                  invoiceTypeLabel(inv.type),
                  dash(inv.amount),
                  dash(inv.currency),
                  dash(inv.payer),
                  dash(inv.status),
                  inv.orderId ? (
                    <Link className={styles.rowLink} to={`/sifarisler/${inv.orderId}`}>
                      {dash(inv.order?.orderNumber || inv.orderNumber || inv.orderId)}
                    </Link>
                  ) : (
                    dash(inv.orderNumber)
                  ),
                  dash(inv.contract),
                  formatDateOnly(inv.date || inv.createdAt),
                  formatDateOnly(inv.payUntil),
                  dash(inv.delayDays),
                  joinList([
                    inv.vatIncluded ? "daxildir" : "",
                    inv.vatExempt ? "azad" : "",
                  ]),
                  dash(inv.executor),
                  dash(inv.creator),
                  dash(inv.lang),
                  dash(inv.template),
                ],
              }))}
            />
          </section>
        ) : null}

        {showCustomers && show("customers") ? (
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Müştərilər</h2>
              <span className={styles.sectionMeta}>{fmtInt(filteredCustomers.length)} sətir</span>
              <Link className={styles.link} to="/musteriler">
                Səhifəyə keç
              </Link>
            </div>
            <DataTable
              expanded={expanded}
              empty="Müştəri yoxdur"
              headers={[
                "Ad",
                "Qısa ad / şirkət",
                "VÖEN",
                "Telefon",
                "E-poçt",
                "Ünvan",
                "Ölkə",
                "Əlaqə",
                "Menecer",
                "Tip",
                "Fəaliyyət",
                "Kredit limiti",
              ]}
              rows={filteredCustomers.map((row) => ({
                key: String(row.id),
                cells: [
                  <Link className={styles.rowLink} to={`/musteriler/${row.id}`}>
                    {partnerName(row)}
                  </Link>,
                  dash(row.shortName || row.company),
                  dash(row.voen || row.taxNumber),
                  dash(row.phone || row.contactInfo),
                  dash(row.email),
                  dash(row.address),
                  dash(row.country),
                  dash(row.contactPerson),
                  dash(row.manager),
                  dash(row.customerType || row.type),
                  dash(row.activityType),
                  dash(row.creditLimit),
                ],
              }))}
            />
          </section>
        ) : null}

        {showCarriers && show("carriers") ? (
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Daşıyıcılar</h2>
              <span className={styles.sectionMeta}>{fmtInt(filteredCarriers.length)} sətir</span>
              <Link className={styles.link} to="/dasiyicilar">
                Səhifəyə keç
              </Link>
            </div>
            <DataTable
              expanded={expanded}
              empty="Daşıyıcı yoxdur"
              headers={[
                "Ad",
                "Qısa ad / şirkət",
                "VÖEN",
                "Telefon",
                "E-poçt",
                "Ünvan",
                "Ölkə",
                "Əlaqə",
                "Menecer",
                "Tip",
                "Fəaliyyət",
                "Kredit limiti",
              ]}
              rows={filteredCarriers.map((row) => ({
                key: String(row.id),
                cells: [
                  <Link className={styles.rowLink} to={`/dasiyicilar/${row.id}`}>
                    {partnerName(row)}
                  </Link>,
                  dash(row.shortName || row.company),
                  dash(row.voen || row.taxNumber),
                  dash(row.phone || row.contactInfo),
                  dash(row.email),
                  dash(row.address),
                  dash(row.country),
                  dash(row.contactPerson),
                  dash(row.manager),
                  dash(row.carrierType || row.type),
                  dash(row.activityType),
                  dash(row.creditLimit),
                ],
              }))}
            />
          </section>
        ) : null}

        {showTasks && show("tasks") ? (
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Tapşırıqlar</h2>
              <span className={styles.sectionMeta}>{fmtInt(filteredTasks.length)} sətir</span>
              <Link className={styles.link} to="/tapshiriqlar">
                Səhifəyə keç
              </Link>
            </div>
            <DataTable
              expanded={expanded}
              empty="Tapşırıq yoxdur"
              headers={[
                "Ad",
                "Status",
                "Təsvir",
                "İcraçılar",
                "Kontragent",
                "Son tarix",
                "Vaxt",
                "Təkrar",
                "Sifariş",
                "Sorğu",
                "Checklist",
                "Fayllar",
                "Müəllif",
                "Yaradıldı",
              ]}
              rows={filteredTasks.map((row) => ({
                key: String(row.id),
                cells: [
                  dash(row.title),
                  taskStatusLabel(row.status),
                  dash(row.description),
                  Array.isArray(row.executors)
                    ? joinList(row.executors.map((e: any) => e.name))
                    : "—",
                  dash(row.counterparty),
                  formatDateOnly(row.deadlineDate || row.deadlineUntil),
                  dash(row.deadlineTime),
                  yesNo(row.recurring),
                  row.orderId ? (
                    <Link className={styles.rowLink} to={`/sifarisler/${row.orderId}`}>
                      {dash(row.orderNumber || row.orderId)}
                    </Link>
                  ) : (
                    "—"
                  ),
                  row.queryId ? (
                    <Link className={styles.rowLink} to={`/sorgular/${row.queryId}`}>
                      {dash(row.queryNumber || row.queryId)}
                    </Link>
                  ) : (
                    "—"
                  ),
                  Array.isArray(row.checklist) ? String(row.checklist.length) : "0",
                  Array.isArray(row.files) ? String(row.files.length) : "0",
                  dash(row.author?.name),
                  formatDateOnly(row.createdAt),
                ],
              }))}
            />
          </section>
        ) : null}
      </div>
    </div>
  );
}
