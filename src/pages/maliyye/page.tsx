"use client";

import { useEffect, useState, useMemo } from "react";
import styles from "./maliyye.module.css";
import sorguTableStyles from "../sorgular/components/SorgularTable.module.css";
import sorguLayoutStyles from "../sorgular/sorgular.module.css";
import sorguActionBarStyles from "../sorgular/components/SorgularActionBar.module.css";
import { FaEdit, FaTrash } from "react-icons/fa";
import { FiPlus, FiFilter } from "react-icons/fi";
import { fetchFinanceTransactionsAction, fetchInvoicesAction, createFinanceTransactionAction, updateFinanceTransactionAction, deleteFinanceTransactionAction } from "../../common/actions/finance.actions";
import Loading from "../../common/components/loading/Loading";
import FinanceModal from "./FinanceModal";

export default function MaliyyePage() {
  const [activeTab, setActiveTab] = useState<"transactions" | "invoices">("transactions");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [txData, invData] = await Promise.all([
        fetchFinanceTransactionsAction(),
        fetchInvoicesAction()
      ]);
      setTransactions(txData);
      setInvoices(invData);
    } catch (err) {
      console.error("Maliyyə datası yüklənərkən xəta", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(tx => {
      // Use generic amount if present, fallback to profit/prices
      let profitVal = parseFloat(tx.profit || "0");
      if (tx.amount) {
         if (tx.type === "INCOME") totalIncome += parseFloat(tx.amount);
         else totalExpense += parseFloat(tx.amount);
      } else {
         if (profitVal > 0) totalIncome += profitVal;
         else totalExpense += Math.abs(profitVal);
      }
    });

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense
    };
  }, [transactions]);

  const handleSave = async (data: any) => {
    try {
      if (editingTx) {
        await updateFinanceTransactionAction(editingTx.id, data);
      } else {
        await createFinanceTransactionAction(data);
      }
      setIsModalOpen(false);
      setEditingTx(null);
      loadData();
    } catch (err) {
      alert("Xəta baş verdi");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Silmək istədiyinizə əminsiniz?")) return;
    try {
      await deleteFinanceTransactionAction(id);
      loadData();
    } catch (err) {
      alert("Xəta baş verdi");
    }
  };

  if (loading && transactions.length === 0) return <Loading />;

  return (
    <div className={sorguLayoutStyles.container}>
      <div className={sorguLayoutStyles.header}>
        <section className={sorguActionBarStyles.wrapper}>
          <div className={sorguActionBarStyles.group}>
            <button
              type="button"
              className={`${sorguActionBarStyles.buttonBase} ${sorguActionBarStyles.buttonPrimary}`}
              onClick={() => { setEditingTx(null); setIsModalOpen(true); }}
            >
              <FiPlus />
              Yeni Tranzaksiya
            </button>
            <button
              type="button"
              className={`${sorguActionBarStyles.buttonBase} ${sorguActionBarStyles.buttonSecondary}`}
              onClick={() => setActiveTab(activeTab === "transactions" ? "invoices" : "transactions")}
            >
              <FiFilter />
              {activeTab === "transactions" ? "Hesab-fakturalara keç" : "Tranzaksiyalara keç"}
            </button>
          </div>

          <div className={sorguActionBarStyles.statsGroup}>
            <span className={sorguActionBarStyles.statPill} style={{ color: "#059669", fontWeight: "bold" }}>Gəlir: {stats.totalIncome.toLocaleString("az-AZ")} AZN</span>
            <span className={sorguActionBarStyles.statPill} style={{ color: "#dc2626", fontWeight: "bold" }}>Xərc: {stats.totalExpense.toLocaleString("az-AZ")} AZN</span>
            <span className={sorguActionBarStyles.statPill} style={{ color: stats.balance >= 0 ? "#059669" : "#dc2626", fontWeight: "bold" }}>
              Balans: {stats.balance.toLocaleString("az-AZ")} AZN
            </span>
          </div>

          <div className={sorguActionBarStyles.group}>
            <button
              type="button"
              className={`${sorguActionBarStyles.buttonBase} ${sorguActionBarStyles.buttonSecondary}`}
            >
              Excel-dən idxal et
            </button>
            <button
              type="button"
              className={`${sorguActionBarStyles.buttonBase} ${sorguActionBarStyles.buttonSecondary}`}
            >
              Excel-ə ixrac et
            </button>
          </div>
        </section>
      </div>

      <div className={sorguLayoutStyles.body}>
          {activeTab === "transactions" && (
            <div style={{ overflowX: "auto" }}>
              <table className={sorguTableStyles.table}>
                <thead className={sorguTableStyles.head}>
                  <tr>
                    <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min80}`}>ID</th>
                    <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min120}`}>Tip / Metod</th>
                    <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min120}`}>Məbləğ</th>
                    <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min150}`}>Ad / Kateqoriya</th>
                    <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min170}`}>Tərəfdaş (Müştəri / Daşıyıcı)</th>
                    <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min100}`}>Sifariş ID</th>
                    <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min120}`}>Tarix</th>
                    <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min100}`}>Əməliyyatlar</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`} style={{ textAlign: "center", padding: "2rem" }}>Heç bir tranzaksiya tapılmadı</td>
                    </tr>
                  ) : (
                    transactions.map((tx: any, index: number) => {
                      const isIncome = tx.type === "INCOME" || parseFloat(tx.profit || "0") >= 0;
                      const amountStr = tx.amount ? `${tx.amount} ${tx.currency}` : `${tx.tarifPrice || tx.profit || "0"} ${tx.tarifCurrency || "AZN"}`;
                      const partnerName = tx.customer ? tx.customer.name : (tx.carrier ? tx.carrier.name : (tx.partner || "-"));
                      return (
                        <tr key={tx.id} className={index % 2 === 0 ? sorguTableStyles.rowEven : sorguTableStyles.rowOdd}>
                          <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>#{tx.id}</td>
                          <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>
                            <span className={isIncome ? styles.success : styles.danger} style={{ fontWeight: 600 }}>
                              {tx.type === "INCOME" ? "Gəlir" : "Xərc"}
                            </span>
                            {tx.paymentMethod && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{tx.paymentMethod}</div>}
                          </td>
                          <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>
                            <span className={isIncome ? styles.success : styles.danger} style={{ fontWeight: 700 }}>
                              {amountStr}
                            </span>
                          </td>
                          <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>
                            <div style={{ fontWeight: 600 }}>{tx.name}</div>
                            {tx.category && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{tx.category}</div>}
                          </td>
                          <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>{partnerName}</td>
                          <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>{tx.orderId || "-"}</td>
                          <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>{new Date(tx.date || tx.createdAt).toLocaleDateString("az-AZ")}</td>
                          <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>
                            <div className={sorguTableStyles.actionRow}>
                              <button
                                type="button"
                                className={`${sorguTableStyles.iconButton} ${sorguTableStyles.detailsButton}`}
                                onClick={() => { setEditingTx(tx); setIsModalOpen(true); }}
                                aria-label="Redaktə et"
                                title="Redaktə et"
                              >
                                <FaEdit />
                              </button>
                              <button
                                type="button"
                                className={`${sorguTableStyles.iconButton} ${sorguTableStyles.deleteButton}`}
                                onClick={() => handleDelete(tx.id)}
                                aria-label="Sil"
                                title="Sil"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "invoices" && (
            <div style={{ overflowX: "auto" }}>
              <table className={sorguTableStyles.table}>
                <thead className={sorguTableStyles.head}>
                  <tr>
                    <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min100}`}>Nömrə</th>
                    <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min100}`}>Sifariş ID</th>
                    <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min150}`}>Ödəyici</th>
                    <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min120}`}>Məbləğ</th>
                    <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min120}`}>Status</th>
                    <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min150}`}>Son Ödəmə Tarixi</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`} style={{ textAlign: "center", padding: "2rem" }}>Heç bir hesab-faktura tapılmadı</td>
                    </tr>
                  ) : (
                    invoices.map((inv: any, index: number) => (
                      <tr key={inv.id} className={index % 2 === 0 ? sorguTableStyles.rowEven : sorguTableStyles.rowOdd}>
                        <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`} style={{ fontWeight: 600 }}>{inv.number}</td>
                        <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>{inv.orderId}</td>
                        <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>{inv.payer}</td>
                        <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`} style={{ fontWeight: 700 }}>{inv.amount} {inv.currency}</td>
                        <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>
                          <span className={`${styles.statusPill} ${inv.status === "Ödənilib" ? styles.statusSuccess : styles.statusPending}`}>
                            {inv.status || "Gözləmədə"}
                          </span>
                        </td>
                        <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>{inv.payUntil ? new Date(inv.payUntil).toLocaleDateString("az-AZ") : "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
      </div>
      
      <FinanceModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingTx}
      />
    </div>
  );
}
