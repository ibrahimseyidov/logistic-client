"use client";

import { useEffect, useMemo, useState } from "react";
import sorguActionBarStyles from "../../sorgular/components/SorgularActionBar.module.css";
import styles from "../maliyye.module.css";
import { fetchFinanceTransactionsAction } from "../../../common/actions/finance.actions";
import { fetchCustomersAction } from "../../../common/actions/customer.actions";
import { fetchCarriersAction } from "../../../common/actions/carrier.actions";
import { fetchOrdersAction } from "../../../common/actions/order.actions";
import Loading from "../../../common/components/loading/Loading";
import SorgularPagination from "../../sorgular/components/SorgularPagination";
import {
  isCashMovementTx,
  isIncomeTx,
  isOrderBookkeepingTx,
  resolveTxCashAzn,
} from "../lib/financeWallet.utils";
import {
  isCarrierBookkeepingTx,
  orderMatchesCarrier,
  orderMatchesCustomer,
  entityLabel,
  findCarrierForName,
  findCustomerForName,
  resolveCarrierGroup,
  resolveCustomerGroup,
} from "../lib/financePartner.utils";
import {
  resolveFinanceExpenseAzn,
  resolveFinanceRevenueAzn,
} from "../../../common/utils/currency.utils";

type ReportTab = "customers" | "carriers";

type PartnerRow = {
  key: string;
  name: string;
  owedAzn: number;
  paidAzn: number;
  balanceAzn: number;
  orderCount: number;
};

const PAGE_SIZE = 10;

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

export default function MaliyyeHesabatPage() {
  const [tab, setTab] = useState<ReportTab>("customers");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [carriers, setCarriers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchFinanceTransactionsAction(),
      fetchCustomersAction(),
      fetchCarriersAction(),
      fetchOrdersAction(),
    ])
      .then(([txs, cust, carr, ords]) => {
        setTransactions(asList(txs));
        setCustomers(asList(cust));
        setCarriers(asList(carr));
        setOrders(asList(ords));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [tab]);

  const rows = useMemo(() => {
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

    /** Yalnız real kartlara yaz — n: / naməlum id təkrar sətir yaratmasın */
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
      if (byName) {
        return { key: `c:${byName.id}`, name: entityLabel(byName) };
      }
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
      if (byName) {
        return { key: `r:${byName.id}`, name: entityLabel(byName) };
      }
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
        const group = toCustomerRow(
          resolveCustomerGroup(tx, customers, orders),
        );
        if (!group) return;
        const row = ensure(group.key, group.name);
        row.owedAzn += rev;
      });

      transactions.filter(isCashMovementTx).forEach((tx) => {
        if (!isIncomeTx(tx)) return;
        const azn = resolveTxCashAzn(tx);
        if (!(azn > 0)) return;
        const group = toCustomerRow(
          resolveCustomerGroup(tx, customers, orders),
        );
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
        const row = ensure(group.key, group.name);
        row.owedAzn += exp;
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
  }, [transactions, tab, customers, carriers, orders]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, r) => ({
          owed: acc.owed + r.owedAzn,
          paid: acc.paid + r.paidAzn,
          balance: acc.balance + r.balanceAzn,
          orders: acc.orders + r.orderCount,
        }),
        { owed: 0, paid: 0, balance: 0, orders: 0 },
      ),
    [rows],
  );

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const pagedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, currentPage]);

  const getVisiblePages = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, -1, totalPages];
    }
    if (currentPage >= totalPages - 3) {
      return [
        1,
        -1,
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }
    return [1, -1, currentPage - 1, currentPage, currentPage + 1, -1, totalPages];
  };

  if (loading) return <Loading />;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <section className={sorguActionBarStyles.wrapper}>
          <div className={sorguActionBarStyles.group} style={{ gap: "0.35rem" }}>
            <button
              type="button"
              className={`${sorguActionBarStyles.buttonBase} ${
                tab === "customers"
                  ? sorguActionBarStyles.buttonPrimary
                  : sorguActionBarStyles.buttonSecondary
              }`}
              onClick={() => setTab("customers")}
            >
              Müştəri hesabatı
            </button>
            <button
              type="button"
              className={`${sorguActionBarStyles.buttonBase} ${
                tab === "carriers"
                  ? sorguActionBarStyles.buttonPrimary
                  : sorguActionBarStyles.buttonSecondary
              }`}
              onClick={() => setTab("carriers")}
            >
              Daşıyıcı hesabatı
            </button>
          </div>

          <div className={sorguActionBarStyles.statsGroup}>
            <span className={sorguActionBarStyles.statPill} style={{ fontWeight: 700 }}>
              Borc: {fmtAzn(totals.owed)} AZN
            </span>
            <span
              className={sorguActionBarStyles.statPill}
              style={{ color: "#059669", fontWeight: 700 }}
            >
              Ödənilib: {fmtAzn(totals.paid)} AZN
            </span>
            <span
              className={sorguActionBarStyles.statPill}
              style={{
                color: totals.balance > 0 ? "#dc2626" : "#059669",
                fontWeight: 700,
              }}
            >
              Qalıq: {fmtAzn(totals.balance)} AZN
            </span>
          </div>
        </section>
        <p style={{ margin: "0.5rem 0 0", fontSize: "0.8rem", color: "#64748b" }}>
          {tab === "customers"
            ? "Müştəri kartları üzrə borc (sifariş tarifi) və kasa/bank ödənişləri — hər müştəri bir sətir."
            : "Daşıyıcı kartları üzrə borc (reys xərci) və ödənişlər — hər daşıyıcı bir sətir."}
        </p>
      </div>

      <div className={styles.pageBody}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>
                  {tab === "customers" ? "Müştəri" : "Daşıyıcı"}
                </th>
                <th className={styles.th}>Görülən iş</th>
                <th className={styles.th}>Borc (AZN)</th>
                <th className={styles.th}>Ödənilib (AZN)</th>
                <th className={styles.th}>Qalıq (AZN)</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className={styles.td}
                    style={{ textAlign: "center", padding: "2rem" }}
                  >
                    Hesabat üçün məlumat yoxdur
                  </td>
                </tr>
              ) : (
                pagedRows.map((r) => (
                  <tr key={r.key} className={styles.tr}>
                    <td className={styles.td} style={{ fontWeight: 600 }}>
                      {r.name}
                    </td>
                    <td className={styles.td}>{r.orderCount}</td>
                    <td className={styles.td}>{fmtAzn(r.owedAzn)}</td>
                    <td className={styles.td} style={{ color: "#059669", fontWeight: 600 }}>
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.pageFooter}>
        <SorgularPagination
          totalRows={rows.length}
          currentPage={currentPage}
          totalPages={totalPages}
          getVisiblePages={getVisiblePages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
