import {
  isCashMovementTx,
  isIncomeTx,
  isOrderBookkeepingTx,
  resolveTxCashAzn,
} from "./financeWallet.utils";
import {
  entityLabel,
  findCarrierForName,
  findCustomerForName,
  isCarrierBookkeepingTx,
  namesMatch,
  orderMatchesCarrier,
  orderMatchesCustomer,
  resolveCarrierGroup,
  resolveCustomerGroup,
} from "./financePartner.utils";
import {
  resolveFinanceExpenseAzn,
  resolveFinanceRevenueAzn,
  resolveVoyageExpenseAzn,
} from "../../../common/utils/currency.utils";
import {
  resolveOfferExpenseFallbackAzn,
  resolveOfferSalesTotalSummary,
} from "../../sifarisler/lib/offerExpense.utils";

export type ReportId =
  | "customers"
  | "carriers"
  | "queries"
  | "orders"
  | "voyages"
  | "expenses";

export type ReportFilter = {
  search: string;
  dateFrom: string;
  dateTo: string;
  status: string;
  category: string;
  method: string;
};

export function emptyReportFilter(): ReportFilter {
  return {
    search: "",
    dateFrom: "",
    dateTo: "",
    status: "",
    category: "",
    method: "",
  };
}

export type PartnerRow = {
  key: string;
  name: string;
  owedAzn: number;
  paidAzn: number;
  balanceAzn: number;
  orderCount: number;
};

export type GenericReportRow = {
  key: string;
  cells: Array<string | number>;
  raw?: any;
};

function dayStart(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function dayEnd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999);
}

export function parseDateValue(raw?: string | Date | null): Date | null {
  if (!raw) return null;
  const d = raw instanceof Date ? raw : new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function inDateRange(
  raw: string | Date | null | undefined,
  filter: ReportFilter,
): boolean {
  if (!filter.dateFrom && !filter.dateTo) return true;
  const d = parseDateValue(raw);
  if (!d) return false;
  if (filter.dateFrom && d < dayStart(filter.dateFrom)) return false;
  if (filter.dateTo && d > dayEnd(filter.dateTo)) return false;
  return true;
}

export function matchesSearch(haystack: string, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return haystack.toLowerCase().includes(q);
}

export function buildPartnerRows(
  tab: "customers" | "carriers",
  params: {
    transactions: any[];
    customers: any[];
    carriers: any[];
    orders: any[];
  },
): PartnerRow[] {
  const { transactions, customers, carriers, orders } = params;
  const map = new Map<string, PartnerRow>();

  const ensure = (key: string, name: string) => {
    if (!map.has(key)) {
      map.set(key, {
        key,
        name,
        owedAzn: 0,
        paidAzn: 0,
        balanceAzn: 0,
        orderCount: 0,
      });
    }
    return map.get(key)!;
  };

  const toCustomerRow = (
    group: { key: string; name: string } | null,
  ): { key: string; name: string } | null => {
    if (!group) return null;
    if (group.key.startsWith("c:")) {
      const id = group.key.slice(2);
      const c = customers.find((x) => String(x.id) === String(id));
      if (c) return { key: `c:${c.id}`, name: entityLabel(c) || group.name };
    }
    const byName = findCustomerForName(customers, group.name);
    if (byName) return { key: `c:${byName.id}`, name: entityLabel(byName) };
    return null;
  };

  const toCarrierRow = (
    group: { key: string; name: string } | null,
  ): { key: string; name: string } | null => {
    if (!group) return null;
    if (group.key.startsWith("r:")) {
      const id = group.key.slice(2);
      const c = carriers.find((x) => String(x.id) === String(id));
      if (c) return { key: `r:${c.id}`, name: entityLabel(c) || group.name };
    }
    const byName = findCarrierForName(carriers, group.name);
    if (byName) return { key: `r:${byName.id}`, name: entityLabel(byName) };
    return null;
  };

  if (tab === "customers") {
    customers.forEach((c) => {
      const name = entityLabel(c);
      if (!name) return;
      ensure(`c:${c.id}`, name);
    });

    transactions.filter(isOrderBookkeepingTx).forEach((tx) => {
      const rev = resolveFinanceRevenueAzn(tx);
      if (!(rev > 0)) return;
      const group = toCustomerRow(resolveCustomerGroup(tx, customers, orders));
      if (!group) return;
      ensure(group.key, group.name).owedAzn += rev;
    });

    transactions.filter(isCashMovementTx).forEach((tx) => {
      if (!isIncomeTx(tx)) return;
      const azn = resolveTxCashAzn(tx);
      if (!(azn > 0)) return;
      const group = toCustomerRow(resolveCustomerGroup(tx, customers, orders));
      if (!group) return;
      ensure(group.key, group.name).paidAzn += azn;
    });

    customers.forEach((c) => {
      const row = map.get(`c:${c.id}`);
      if (!row) return;
      row.orderCount = orders.filter((o) =>
        orderMatchesCustomer(o, c, transactions),
      ).length;
    });
  } else {
    carriers.forEach((c) => {
      const name = entityLabel(c);
      if (!name) return;
      ensure(`r:${c.id}`, name);
    });

    transactions.filter(isOrderBookkeepingTx).forEach((tx) => {
      if (!isCarrierBookkeepingTx(tx)) return;
      const exp = resolveFinanceExpenseAzn(tx);
      if (!(exp > 0)) return;
      const group = toCarrierRow(
        resolveCarrierGroup(tx, carriers, { allowNameFallback: true }),
      );
      if (!group) return;
      ensure(group.key, group.name).owedAzn += exp;
    });

    transactions.filter(isCashMovementTx).forEach((tx) => {
      if (isIncomeTx(tx)) return;
      const azn = resolveTxCashAzn(tx);
      if (!(azn > 0)) return;
      const group = toCarrierRow(
        resolveCarrierGroup(tx, carriers, { allowNameFallback: true }),
      );
      if (!group) return;
      ensure(group.key, group.name).paidAzn += azn;
    });

    carriers.forEach((c) => {
      const row = map.get(`r:${c.id}`);
      if (!row) return;
      row.orderCount = orders.filter((o) =>
        orderMatchesCarrier(o, c, transactions),
      ).length;
    });
  }

  const list = Array.from(map.values()).map((r) => ({
    ...r,
    balanceAzn: r.owedAzn - r.paidAzn,
  }));
  list.sort((a, b) => {
    const aActive = a.owedAzn > 0 || a.paidAzn > 0 ? 1 : 0;
    const bActive = b.owedAzn > 0 || b.paidAzn > 0 ? 1 : 0;
    if (bActive !== aActive) return bActive - aActive;
    if (b.balanceAzn !== a.balanceAzn) return b.balanceAzn - a.balanceAzn;
    return a.name.localeCompare(b.name, "az");
  });
  return list;
}

export function filterPartnerRows(
  rows: PartnerRow[],
  filter: ReportFilter,
): PartnerRow[] {
  return rows.filter((r) => {
    if (!matchesSearch(`${r.name} ${r.key}`, filter.search)) return false;
    return true;
  });
}

export function buildQueryRows(
  queries: any[],
  filter: ReportFilter,
  opts: { customers?: any[] } = {},
): GenericReportRow[] {
  const customers = opts.customers || [];

  const resolveQueryCustomerName = (q: any): string => {
    const customer = q?.customer;
    if (customer && typeof customer === "object") {
      const label = entityLabel(customer);
      if (label) return label;
    }
    const customerText = String(
      typeof customer === "string" || typeof customer === "number"
        ? customer
        : q?.customerName || q?.customerId || "",
    ).trim();
    if (!customerText) return "—";

    const byId = customers.find((c) => String(c.id) === customerText);
    if (byId) {
      const label = entityLabel(byId);
      if (label) return label;
    }
    const byName = findCustomerForName(customers, customerText);
    if (byName) {
      const label = entityLabel(byName);
      if (label) return label;
    }
    return customerText;
  };

  return queries
    .filter((q) => {
      const status = String(q.status || q.statusLabel || "");
      if (filter.status && status !== filter.status) return false;
      if (
        !inDateRange(
          q.loadDate || q.createdAt || q.statusAssignedAt,
          filter,
        )
      ) {
        return false;
      }
      const customerName = resolveQueryCustomerName(q);
      const hay = [
        q.number,
        customerName,
        q.customer,
        q.manager,
        q.loadPlace,
        q.unloadPlace,
        q.transportType,
        status,
      ]
        .filter(Boolean)
        .join(" ");
      return matchesSearch(hay, filter.search);
    })
    .map((q) => {
      const customerName = resolveQueryCustomerName(q);
      const status = String(q.status || q.statusLabel || "—");
      return {
        key: String(q.id),
        cells: [
          q.number || "—",
          customerName,
          [q.loadPlace, q.unloadPlace].filter(Boolean).join(" → ") || "—",
          q.transportType || "—",
          status,
          formatShortDate(q.loadDate || q.createdAt),
        ],
        raw: { ...q, _customerName: customerName, _status: status },
      };
    });
}

function fmtAznAmount(n: number): string {
  return `${n.toLocaleString("az-AZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} AZN`;
}

function resolveOrderCustomerFullName(order: any, customers: any[]): string {
  if (order?.customerId != null && order.customerId !== "") {
    const byId = customers.find((c) => String(c.id) === String(order.customerId));
    if (byId) {
      const label = entityLabel(byId);
      if (label) return label;
    }
  }
  const rawName = order?.customerName || order?.customer || "";
  const byName = findCustomerForName(customers, rawName);
  if (byName) {
    const label = entityLabel(byName);
    if (label) return label;
  }
  const fallback = String(rawName || "").trim();
  return fallback || "—";
}

/** Sifariş üzrə qiymət / xərc / ödəniş / qalıq / qazanc (AZN) */
export function summarizeOrderReportFinance(
  order: any,
  transactions: any[],
): {
  priceAzn: number;
  expenseAzn: number;
  paidAzn: number;
  balanceAzn: number;
  profitAzn: number;
} {
  const oid = String(order?.id ?? "");
  const orderTxs = (transactions || []).filter(
    (tx) => String(tx.orderId) === oid,
  );
  const voyages = Array.isArray(order?.voyages) ? order.voyages : [];

  let priceAzn = 0;
  let bookExpenseAzn = 0;
  let paidAzn = 0;

  orderTxs.forEach((tx) => {
    if (isOrderBookkeepingTx(tx)) {
      priceAzn += resolveFinanceRevenueAzn(tx);
      bookExpenseAzn += resolveFinanceExpenseAzn(tx);
      return;
    }
    if (!isCashMovementTx(tx)) return;
    if (!isIncomeTx(tx)) return;
    const azn = resolveTxCashAzn(tx);
    if (azn > 0) paidAzn += azn;
  });

  let voyageExpAzn = 0;
  voyages.forEach((v: any) => {
    voyageExpAzn += resolveVoyageExpenseAzn(v);
  });

  let expenseAzn = bookExpenseAzn;
  // Uçotda reys məsarifi ayrıca varsa voyage ilə ikiqat sayma
  if (!(bookExpenseAzn > 0) && voyageExpAzn > 0) {
    expenseAzn = voyageExpAzn;
  } else if (bookExpenseAzn > 0 && voyageExpAzn > 0) {
    // Reys sətirləri bookExpense-də ola bilər; əlavə voyage yalnız book boşdursa
    expenseAzn = bookExpenseAzn;
  }

  if (!(expenseAzn > 0)) {
    expenseAzn = resolveOfferExpenseFallbackAzn({
      order,
      voyages,
      financeTransactions: orderTxs,
    });
  }

  if (!(priceAzn > 0)) {
    const offer = resolveOfferSalesTotalSummary({
      order,
      voyages,
      financeTransactions: orderTxs,
    });
    if (offer && offer.salesAzn > 0) {
      priceAzn = offer.salesAzn;
    } else {
      priceAzn = Number(order?.freightAzn) || 0;
    }
  }

  if (!(expenseAzn > 0)) {
    const offer = resolveOfferSalesTotalSummary({
      order,
      voyages,
      financeTransactions: orderTxs,
    });
    if (offer && offer.totalAzn > 0) expenseAzn = offer.totalAzn;
  }

  const profitFromOrder =
    Number(order?.profitAzn) ||
    Number.parseFloat(String(order?.profit || "").replace(/[^\d.,-]/g, "").replace(",", ".")) ||
    0;

  const profitAzn =
    priceAzn > 0 || expenseAzn > 0
      ? priceAzn - expenseAzn
      : Number.isFinite(profitFromOrder)
        ? profitFromOrder
        : 0;

  return {
    priceAzn,
    expenseAzn,
    paidAzn,
    balanceAzn: Math.max(0, priceAzn - paidAzn),
    profitAzn,
  };
}

export function buildOrderRows(
  orders: any[],
  filter: ReportFilter,
  opts: { transactions?: any[]; customers?: any[] } = {},
): GenericReportRow[] {
  const transactions = opts.transactions || [];
  const customers = opts.customers || [];

  return orders
    .filter((o) => {
      const status = String(o.statusLabel || o.statusKind || "");
      if (filter.status && status !== filter.status && o.statusKind !== filter.status) {
        return false;
      }
      if (!inDateRange(o.orderDate || o.createdAt, filter)) return false;
      const customerName = resolveOrderCustomerFullName(o, customers);
      const hay = [
        o.orderNumber,
        customerName,
        o.customerName,
        o.manager,
        o.route,
        o.carriers,
        status,
      ]
        .filter(Boolean)
        .join(" ");
      return matchesSearch(hay, filter.search);
    })
    .map((o) => {
      const customerName = resolveOrderCustomerFullName(o, customers);
      const fin = summarizeOrderReportFinance(o, transactions);
      return {
        key: String(o.id),
        cells: [
          o.orderNumber || "—",
          customerName,
          fmtAznAmount(fin.priceAzn),
          fmtAznAmount(fin.expenseAzn),
          fmtAznAmount(fin.paidAzn),
          fmtAznAmount(fin.balanceAzn),
          fmtAznAmount(fin.profitAzn),
          o.statusLabel || o.statusKind || "—",
          formatShortDate(o.orderDate || o.createdAt),
        ],
        raw: { ...o, _finance: fin, _customerName: customerName },
      };
    });
}

export function flattenVoyages(orders: any[]): any[] {
  const out: any[] = [];
  orders.forEach((o) => {
    const voyages = Array.isArray(o.voyages) ? o.voyages : [];
    voyages.forEach((v: any) => {
      out.push({
        ...v,
        orderNumber: o.orderNumber,
        orderId: o.id,
        orderCustomer: o.customerName,
        orderCustomerId: o.customerId,
        _order: o,
      });
    });
  });
  return out;
}

function resolveVoyageCarrierName(voyage: any, carriers: any[]): string {
  if (voyage?.carrierId != null && voyage.carrierId !== "") {
    const byId = carriers.find((c) => String(c.id) === String(voyage.carrierId));
    if (byId) {
      const label = entityLabel(byId);
      if (label) return label;
    }
  }
  const raw = String(voyage?.carrier || "").trim();
  if (!raw || raw === "—") return "—";
  const byName = findCarrierForName(carriers, raw);
  if (byName) {
    const label = entityLabel(byName);
    if (label) return label;
  }
  return raw;
}

function resolveVoyageCustomerName(
  voyage: any,
  customers: any[],
): string {
  const order = voyage?._order;
  if (order) {
    return resolveOrderCustomerFullName(order, customers);
  }
  const raw = String(voyage?.customer || voyage?.orderCustomer || "").trim();
  if (!raw) return "—";
  const byName = findCustomerForName(customers, raw);
  if (byName) {
    const label = entityLabel(byName);
    if (label) return label;
  }
  return raw;
}

/** Reys üzrə qiymət / xərc / ödəniş / qalıq / qazanc (AZN) */
export function summarizeVoyageReportFinance(
  voyage: any,
  transactions: any[],
): {
  priceAzn: number;
  expenseAzn: number;
  paidAzn: number;
  balanceAzn: number;
  profitAzn: number;
} {
  const order = voyage?._order || null;
  const oid = String(voyage?.orderId ?? order?.id ?? "");
  const voyageId = String(voyage?.id ?? "");
  const tripRef = String(voyage?.tripRef || (voyageId ? `R-${voyageId}` : "")).trim();
  const carrierName = String(voyage?.carrier || "").trim();
  const orderTxs = (transactions || []).filter(
    (tx) => String(tx.orderId) === oid,
  );

  let expenseAzn = resolveVoyageExpenseAzn(voyage);
  if (!(expenseAzn > 0)) {
    orderTxs.forEach((tx) => {
      if (!isOrderBookkeepingTx(tx)) return;
      const name = String(tx.name || "").trim();
      const matchesReys =
        (tripRef && namesMatch(name, `Reys ${tripRef}`)) ||
        (voyageId && /^Reys R-/i.test(name) && name.includes(voyageId));
      if (!matchesReys && !namesMatch(tx.partner, carrierName)) return;
      if (matchesReys || (carrierName && namesMatch(tx.partner, carrierName))) {
        expenseAzn += resolveFinanceExpenseAzn(tx);
      }
    });
  }

  let priceAzn = 0;
  let paidAzn = 0;
  if (order) {
    const orderFin = summarizeOrderReportFinance(order, transactions);
    const voyageCount = Array.isArray(order.voyages)
      ? Math.max(1, order.voyages.length)
      : 1;
    // Qiymət / ödəniş — sifariş gəliri və müştəri ödənişi (reys sayına bölünür)
    priceAzn =
      voyageCount > 1 && orderFin.priceAzn > 0
        ? orderFin.priceAzn / voyageCount
        : orderFin.priceAzn;
    paidAzn =
      voyageCount > 1 && orderFin.paidAzn > 0
        ? orderFin.paidAzn / voyageCount
        : orderFin.paidAzn;
  }
  if (!(priceAzn > 0)) {
    priceAzn = expenseAzn;
  }

  return {
    priceAzn,
    expenseAzn, // yalnız məlumat — qalıq hesablamasına daxil deyil
    paidAzn,
    // Qalıq = Qiymət − Ödəniş
    balanceAzn: Math.max(0, priceAzn - paidAzn),
    profitAzn: priceAzn - expenseAzn,
  };
}

export function buildVoyageRows(
  voyages: any[],
  filter: ReportFilter,
  opts: {
    transactions?: any[];
    customers?: any[];
    carriers?: any[];
  } = {},
): GenericReportRow[] {
  const transactions = opts.transactions || [];
  const customers = opts.customers || [];
  const carriers = opts.carriers || [];

  return voyages
    .filter((v) => {
      const status = String(v.tripStatus || v.tripStatusKind || "");
      if (filter.status && status !== filter.status && v.tripStatusKind !== filter.status) {
        return false;
      }
      if (!inDateRange(v.tripDateIso || v.loadDate || v.createdAt, filter)) {
        return false;
      }
      const carrierName = resolveVoyageCarrierName(v, carriers);
      const customerName = resolveVoyageCustomerName(v, customers);
      const hay = [
        v.tripRef,
        v.orderNumber,
        carrierName,
        customerName,
        v.carrier,
        v.customer || v.orderCustomer,
        v.vehicleInfo,
        v.loading,
        v.unloading,
        status,
      ]
        .filter(Boolean)
        .join(" ");
      return matchesSearch(hay, filter.search);
    })
    .map((v) => {
      const carrierName = resolveVoyageCarrierName(v, carriers);
      const customerName = resolveVoyageCustomerName(v, customers);
      const fin = summarizeVoyageReportFinance(v, transactions);
      const status = String(v.tripStatus || v.tripStatusKind || "—");
      return {
        key: String(v.id),
        cells: [
          v.tripRef || `#${v.id}`,
          v.orderNumber || "—",
          customerName,
          fmtAznAmount(fin.priceAzn),
          fmtAznAmount(fin.expenseAzn),
          fmtAznAmount(fin.paidAzn),
          fmtAznAmount(fin.balanceAzn),
          fmtAznAmount(fin.profitAzn),
          status,
          formatShortDate(v.tripDateIso || v.loadDate || v.createdAt),
        ],
        raw: {
          ...v,
          _finance: fin,
          _carrierName: carrierName,
          _customerName: customerName,
          _status: status,
        },
      };
    });
}

export function buildExpenseRows(
  transactions: any[],
  filter: ReportFilter,
): GenericReportRow[] {
  return transactions
    .filter((tx) => isCashMovementTx(tx) && !isIncomeTx(tx))
    .filter((tx) => {
      if (filter.category) {
        const cat = String(tx.category || "");
        if (cat !== filter.category && !cat.toLowerCase().includes(filter.category.toLowerCase())) {
          return false;
        }
      }
      if (filter.method) {
        const method = String(tx.paymentMethod || "");
        if (!method.toLowerCase().includes(filter.method.toLowerCase())) {
          return false;
        }
      }
      if (!inDateRange(tx.date || tx.costDate || tx.createdAt, filter)) {
        return false;
      }
      const hay = [
        tx.id,
        tx.name,
        tx.category,
        tx.partner,
        tx.paymentMethod,
        tx.createdByName,
        tx.user,
      ]
        .filter(Boolean)
        .join(" ");
      return matchesSearch(hay, filter.search);
    })
    .map((tx) => {
      const azn = resolveTxCashAzn(tx);
      return {
        key: String(tx.id),
        cells: [
          `#${tx.id}`,
          tx.name || "—",
          tx.category || "—",
          tx.paymentMethod || "—",
          `${azn.toLocaleString("az-AZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AZN`,
          formatShortDate(tx.date || tx.costDate || tx.createdAt),
        ],
        raw: { ...tx, _azn: azn },
      };
    });
}

export function uniqueStatuses(items: any[], keys: string[]): string[] {
  const set = new Set<string>();
  items.forEach((item) => {
    for (const k of keys) {
      const v = String(item?.[k] || "").trim();
      if (v) set.add(v);
    }
  });
  return [...set].sort((a, b) => a.localeCompare(b, "az"));
}

export function uniqueCategories(transactions: any[]): string[] {
  const set = new Set<string>();
  transactions
    .filter((tx) => isCashMovementTx(tx) && !isIncomeTx(tx))
    .forEach((tx) => {
      const c = String(tx.category || "").trim();
      if (c) set.add(c);
    });
  return [...set].sort((a, b) => a.localeCompare(b, "az"));
}

function formatShortDate(raw?: string | Date | null): string {
  const d = parseDateValue(raw);
  if (!d) return "—";
  return d.toLocaleDateString("az-AZ");
}
