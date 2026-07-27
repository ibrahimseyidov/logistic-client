"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./maliyye.module.css";
import { FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import {
  fetchFinanceTransactionsAction,
  createFinanceTransactionAction,
  updateFinanceTransactionAction,
  deleteFinanceTransactionAction,
} from "../../common/actions/finance.actions";
import Loading from "../../common/components/loading/Loading";
import FinanceModal from "./FinanceModal";
import SorgularPagination from "../sorgular/components/SorgularPagination";
import {
  type CashWallet,
  SYSTEM_PARTNER_LABEL,
  isIncomeTx,
  isSystemBalanceAdjustment,
  resolveTxCashAzn,
  txMatchesWallet,
} from "./lib/financeWallet.utils";

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

const PAGE_SIZE = 10;

export default function MaliyyePage() {
  const [walletTab, setWalletTab] = useState<CashWallet>("Kasa");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<any>(null);

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

  const walletTxs = useMemo(
    () => transactions.filter((tx) => txMatchesWallet(tx, walletTab)),
    [transactions, walletTab],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [walletTab]);

  const totalPages = Math.max(1, Math.ceil(walletTxs.length / PAGE_SIZE));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const pagedTxs = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return walletTxs.slice(start, start + PAGE_SIZE);
  }, [walletTxs, currentPage]);

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

  const stats = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;

    walletTxs.forEach((tx) => {
      const azn = resolveTxCashAzn(tx);
      if (!(azn > 0)) return;
      if (isIncomeTx(tx)) totalIn += azn;
      else totalOut += azn;
    });

    return {
      totalIn,
      totalOut,
      balance: totalIn - totalOut,
    };
  }, [walletTxs]);

  const handleSave = async (data: any) => {
    try {
      if (editingTx && isSystemBalanceAdjustment(editingTx)) {
        setIsModalOpen(false);
        setEditingTx(null);
        return;
      }
      const payload = {
        ...data,
        paymentMethod: data.paymentMethod || walletTab,
        amount: Number(data.amount) || 0,
        category: data.category || undefined,
      };
      if (editingTx) {
        await updateFinanceTransactionAction(editingTx.id, payload);
      } else {
        await createFinanceTransactionAction(payload);
      }
      setIsModalOpen(false);
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

  const isKasa = walletTab === "Kasa";
  const fmt = (n: number) =>
    n.toLocaleString("az-AZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.walletTabs}>
          <button
            type="button"
            className={`${styles.walletTab} ${isKasa ? styles.walletTabActive : ""}`}
            onClick={() => setWalletTab("Kasa")}
          >
            Kassam
          </button>
          <button
            type="button"
            className={`${styles.walletTab} ${!isKasa ? styles.walletTabActive : ""}`}
            onClick={() => setWalletTab("Bank")}
          >
            Bank hesabı
          </button>
        </div>
      </div>

      <div className={styles.pageBody}>
        <div className={styles.kasaHeaderRow}>
          <div>
            <h2 className={styles.kasaTitle}>
              {isKasa ? "Kassam" : "Bank hesabı"}
            </h2>
            <p className={styles.kasaHint}>
              {isKasa
                ? "Yalnız kasaya girən, çıxan və hazırkı kassa məbləği"
                : "Yalnız banka girən, çıxan və hazırkı bank qalığı"}
            </p>
          </div>
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
        </div>

        <div className={styles.kasaStatsGrid}>
          <div className={`${styles.kasaStatCard} ${styles.kasaStatIn}`}>
            <div className={styles.kasaStatLabel}>
              {isKasa ? "Kasaya girən" : "Banka girən"}
            </div>
            <div className={styles.kasaStatValue}>{fmt(stats.totalIn)} AZN</div>
            <div className={styles.kasaStatSub}>Ümumi mədaxil</div>
          </div>

          <div className={`${styles.kasaStatCard} ${styles.kasaStatOut}`}>
            <div className={styles.kasaStatLabel}>
              {isKasa ? "Kasadan çıxan" : "Bankdan çıxan"}
            </div>
            <div className={styles.kasaStatValue}>{fmt(stats.totalOut)} AZN</div>
            <div className={styles.kasaStatSub}>Ümumi məxaric</div>
          </div>

          <div className={`${styles.kasaStatCard} ${styles.kasaStatBalance}`}>
            <div className={styles.kasaStatLabel}>
              {isKasa ? "Kasada olan" : "Bankda olan"}
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
                <th className={styles.th}>Ad / Kateqoriya</th>
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
                  <td className={styles.td} colSpan={10}>
                    Bu bölmədə əməliyyat yoxdur
                  </td>
                </tr>
              ) : (
                pagedTxs.map((tx) => {
                  const income = isIncomeTx(tx);
                  const azn = resolveTxCashAzn(tx);
                  const isSystem = isSystemBalanceAdjustment(tx);
                  const partner = isSystem
                    ? SYSTEM_PARTNER_LABEL
                    : tx.customer?.name ||
                      tx.customer?.company ||
                      tx.carrier?.name ||
                      tx.carrier?.companyName ||
                      tx.partner ||
                      "—";
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
                        {tx.category ? (
                          <div className={styles.nameMeta}>{tx.category}</div>
                        ) : null}
                      </td>
                      <td className={styles.td}>
                        {isSystem ? (
                          <span
                            className={styles.systemPartnerBadge}
                            title="Sistem balans düzəlişi"
                          >
                            {SYSTEM_PARTNER_LABEL}
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
                          <div style={{ display: "flex", gap: "0.4rem" }}>
                            <button
                              type="button"
                              title="Redaktə"
                              onClick={() => {
                                setEditingTx(tx);
                                setIsModalOpen(true);
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
                          </div>
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
          totalRows={walletTxs.length}
          currentPage={currentPage}
          totalPages={totalPages}
          getVisiblePages={getVisiblePages}
          onPageChange={setCurrentPage}
        />
      </div>

      <FinanceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingTx}
        defaultWallet={walletTab}
      />
    </div>
  );
}
