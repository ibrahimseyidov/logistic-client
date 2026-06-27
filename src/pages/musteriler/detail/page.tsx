"use client";

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft, FiPlus, FiExternalLink } from "react-icons/fi";
import { FaSyncAlt } from "react-icons/fa";
import {
  fetchCustomerDetailAction,
  updateCustomerAction,
} from "../../../common/actions/customer.actions";
import { fetchFinanceTransactionsAction } from "../../../common/actions/finance.actions";
import { fetchQueriesAction } from "../../../common/actions/query.actions";
import { fetchOrdersAction } from "../../../common/actions/order.actions";
import styles from "./musteriDetail.module.css";
import {
  fetchContactPersonsAction,
  createContactPersonAction,
} from "../../../common/actions/contact.actions";
import { useAppDispatch } from "../../../common/store/hooks";
import { showNotification } from "../../../common/store/modalSlice";
import Loading from "../../../common/components/loading/Loading";
import {
  normalizeCarrierContacts,
  formatEntityContactNames,
  contactPersonIdsFromList,
  parseCarrierDocuments,
  mapCustomerFromApi,
  resolveManagerDisplayName,
  displayFieldValue,
} from "../../../common/utils/carrierDisplay.utils";
import { buildApiUrl } from "../../../common/utils/fetch.utils";
import { fetchUsersAction } from "../../../common/actions/user.actions";
import type { UserRow } from "../../ayarlar/types/user.types";
import {
  ContactPersonFormModal,
  type ContactPersonFormData,
} from "../../../common/components/modal/ContactPersonFormModal";
import {
  getQueryCargoSummary,
  getQueryDirectionLabel,
  getQueryDetailPath,
} from "../../sorgular/lib/queryDisplay.utils";
import { matchesCustomerEntity } from "../../../common/utils/entityActivity.utils";

const TAB_ITEMS = ["Məlumatlar", "Sorğular", "Sifarişlər", "Maliyyə"];

function parseMoney(value: string | number | undefined | null): number {
  if (value == null || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const cleaned = String(value).replace(/[^0-9.-]/g, "");
  const parsed = parseFloat(cleaned);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function resolveCustomerTransactionStatus(tx: any): string {
  if (tx.type === "INCOME") return "Mədaxil";

  const receivableAmount =
    parseMoney(tx.tarifAzn) ||
    parseMoney(tx.tarifPrice) ||
    parseMoney(tx.edvliTarifAzn) ||
    parseMoney(tx.edvliTarifPrice);

  if (receivableAmount > 0) {
    return tx.invoiceReceived ? "Ödənilib" : "Ödənilməyib";
  }

  return "Məxaric";
}

function getFinanceStatusStyle(status: string) {
  switch (status) {
    case "Məxaric":
      return { background: "#fef2f2", color: "#b91c1c", border: "#fecaca" };
    case "Gözləmədə":
      return { background: "#fffbeb", color: "#b45309", border: "#fde68a" };
    case "Ödənilməyib":
      return { background: "#fff7ed", color: "#ea580c", border: "#fed7aa" };
    case "Ödənilib":
    case "Mədaxil":
    case "Mənfəət":
      return { background: "#ecfdf5", color: "#047857", border: "#a7f3d0" };
    default:
      return { background: "#f1f5f9", color: "#475569", border: "#cbd5e1" };
  }
}

export default function MusteriDetailPage() {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const dispatch = useAppDispatch();

  const [customer, setCustomer] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("Məlumatlar");
  const [queries, setQueries] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [contactPersons, setContactPersons] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [usersData, setUsersData] = useState<UserRow[]>([]);

  // Contact modal state
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // Edit drawer state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeEditTab, setActiveEditTab] = useState<"main" | "contact">("main");
  const [editForm, setEditForm] = useState({
    company: "",
    shortName: "",
    customerType: "",
    activityType: "",
    voen: "",
    manager: "",
    contactInfo: "",
    address: "",
    country: "",
    salesGroup: "",
    contactPersons: [] as any[],
  });

  const displayedContacts = useMemo(
    () => normalizeCarrierContacts(customer?.contactPersons, contactPersons),
    [customer?.contactPersons, contactPersons],
  );

  const customerDocuments = useMemo(
    () => parseCarrierDocuments(customer?.documents ?? customer?.documentsJson),
    [customer?.documents, customer?.documentsJson],
  );

  const managerLabel = useMemo(
    () => resolveManagerDisplayName(customer?.manager, usersData),
    [customer?.manager, usersData],
  );

  const loadData = async () => {
    if (!customerId) return;
    setLoading(true);
    try {
      const [custData, allQueries, contactList, users, allOrders] = await Promise.all([
        fetchCustomerDetailAction(customerId),
        fetchQueriesAction(),
        fetchContactPersonsAction({ entityType: "customer", entityId: customerId }),
        fetchUsersAction().catch(() => []),
        fetchOrdersAction(),
      ]);

      const mappedCustomer = mapCustomerFromApi(custData);
      setCustomer(mappedCustomer);
      setUsersData(users);
      setContactPersons(contactList);

      const entity = {
        id: String(mappedCustomer.id),
        company: mappedCustomer.company || mappedCustomer.name || "",
        name: mappedCustomer.name || mappedCustomer.company || "",
      };

      const customerQueries = allQueries.filter((q: any) =>
        matchesCustomerEntity(q, entity),
      );

      const customerQueryIds = new Set(customerQueries.map((q: any) => String(q.id)));
      const customerOrders = allOrders.filter(
        (order: any) =>
          matchesCustomerEntity(order, entity) ||
          (order.queryId != null && customerQueryIds.has(String(order.queryId))),
      );

      const [directTx, allFinanceTx] = await Promise.all([
        fetchFinanceTransactionsAction({ customerId }),
        fetchFinanceTransactionsAction(),
      ]);
      const orderIds = new Set(customerOrders.map((order: any) => String(order.id)));
      const orderLinkedTx = allFinanceTx.filter(
        (tx: any) => tx.orderId != null && orderIds.has(String(tx.orderId)),
      );
      const txMap = new Map<number, any>();
      [...directTx, ...orderLinkedTx].forEach((tx: any) => {
        if (tx?.id != null) txMap.set(tx.id, tx);
      });

      setQueries(customerQueries);
      setOrders(customerOrders);
      setTransactions([...txMap.values()]);
    } catch (err) {
      console.error("Customer details load failed", err);
      dispatch(
        showNotification({
          message: "Məlumatlar yüklənərkən xəta baş verdi.",
          type: "error",
        })
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [customerId]);

  // Aggregate Order Stats
  const orderStats = useMemo(() => {
    let sales = 0;
    let expenses = 0;
    let profit = 0;

    orders.forEach((o) => {
      sales += parseMoney(o.freightAzn) || parseMoney(o.freight);
      expenses += parseMoney(o.extraCosts);
      profit += parseMoney(o.profitAzn) || parseMoney(o.profit);
    });

    return {
      count: orders.length,
      sales,
      expenses,
      profit,
    };
  }, [orders]);

  // Dynamic Finance Info
  const financeStats = useMemo(() => {
    const payments: any[] = [];
    let totalPaid = 0;
    let outstandingDebt = 0;
    let overpayment = 0;

    const orderIdsWithTx = new Set(
      transactions
        .filter((tx) => tx.orderId != null)
        .map((tx) => String(tx.orderId)),
    );

    transactions.forEach((tx) => {
      const amount =
        parseMoney(String(tx.amount ?? "")) ||
        parseMoney(tx.tarifAzn) ||
        parseMoney(tx.tarifPrice) ||
        parseMoney(tx.mesarifPrice);
      const isIncome = tx.type === "INCOME";

      payments.push({
        id: `tx-${tx.id}`,
        date: tx.date || tx.costDate || tx.createdAt,
        purpose:
          tx.name ||
          tx.category ||
          (tx.orderId ? `${tx.orderId} nömrəli sifariş əməliyyatı` : "Maliyyə əməliyyatı"),
        amount: isIncome ? amount : -amount,
        currency: tx.currency || tx.tarifCurrency || "AZN",
        status: resolveCustomerTransactionStatus(tx),
      });

      if (isIncome) totalPaid += amount;
      else outstandingDebt += amount;
    });

    orders.forEach((order) => {
      const freight =
        parseMoney(order.freightAzn) || parseMoney(order.freight);
      const profit =
        parseMoney(order.profitAzn) || parseMoney(order.profit);

      if (orderIdsWithTx.has(String(order.id))) {
        return;
      }

      if (
        order.statusKind === "completed" ||
        order.statusKind === "finance_closed"
      ) {
        if (freight > 0) {
          totalPaid += freight;
          payments.push({
            id: `order-${order.id}-freight`,
            date: order.orderDate || order.createdAt,
            purpose: `${order.orderNumber} — sifariş gəliri`,
            amount: freight,
            currency: "AZN",
            status: "Ödənilib",
          });
        }
      } else if (order.statusKind !== "cancelled" && freight > 0) {
        outstandingDebt += freight;
        payments.push({
          id: `order-${order.id}-pending`,
          date: order.orderDate || order.createdAt,
          purpose: `${order.orderNumber} — gözlənilən ödəniş`,
          amount: freight,
          currency: "AZN",
          status: "Gözləmədə",
        });
      }

      if (profit > 0 && Math.abs(profit - freight) > 0.01) {
        payments.push({
          id: `order-${order.id}-profit`,
          date: order.orderDate || order.createdAt,
          purpose: `${order.orderNumber} — mənfəət`,
          amount: profit,
          currency: "AZN",
          status: "Mənfəət",
        });
      }
    });

    const totalExpectedFreight = orders
      .filter((order) => order.statusKind !== "cancelled")
      .reduce(
        (sum, order) =>
          sum + (parseMoney(order.freightAzn) || parseMoney(order.freight)),
        0,
      );

    const netDebt = totalExpectedFreight - totalPaid;
    if (netDebt < 0) {
      overpayment = Math.abs(netDebt);
    } else if (outstandingDebt < netDebt) {
      outstandingDebt = netDebt;
    }

    payments.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    return {
      totalPaid,
      outstandingDebt,
      overpayment,
      payments,
      totalSales: orderStats.sales,
      totalProfit: orderStats.profit,
    };
  }, [orders, orderStats, transactions]);

  const openEditModal = () => {
    if (!customer) return;
    setEditForm({
      company: customer.name || customer.company || "",
      shortName: customer.shortName || customer.name || "",
      customerType: customer.customerType || "Yeni müştəri",
      activityType: customer.activityType || "",
      voen: customer.voen || "",
      manager: customer.manager || "",
      contactInfo: customer.phone || "",
      address: customer.address || "",
      country: customer.country || "AZ",
      salesGroup: customer.salesGroup || "",
      contactPersons: customer.contactPersons || [],
    });
    setActiveEditTab("main");
    setIsEditOpen(true);
  };

  const handleSave = async () => {
    if (!customerId) return;
    try {
      const payload = {
        name: editForm.company.trim(),
        company: editForm.company.trim(),
        shortName: editForm.shortName.trim(),
        customerType: editForm.customerType,
        activityType: editForm.activityType.trim(),
        taxNumber: editForm.voen.trim(),
        manager: editForm.manager.trim(),
        phone: editForm.contactInfo.trim(),
        address: editForm.address.trim(),
        country: editForm.country.trim(),
        salesGroup: editForm.salesGroup.trim(),
        contactPersons: editForm.contactPersons,
      };

      const updated = await updateCustomerAction(customerId, payload);
      setCustomer(mapCustomerFromApi(updated));
      setIsEditOpen(false);
      dispatch(
        showNotification({
          message: "Müştəri məlumatları yeniləndi.",
          type: "success",
        })
      );
    } catch (e) {
      dispatch(
        showNotification({
          message: "Redaktə zamanı xəta baş verdi.",
          type: "error",
        })
      );
    }
  };

  // Inline contact person creation handler
  const handleCreateContactPerson = async (data: ContactPersonFormData) => {
    if (!customer || !customerId) return;
    try {
      const newContact = await createContactPersonAction({
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        position: data.position,
        company: data.company || customer.company || "",
        entityType: "customer",
        entityId: customerId,
      });

      setContactPersons((prev) => [newContact, ...prev]);

      const updatedContactPersons = normalizeCarrierContacts(
        customer.contactPersons,
        [newContact],
      );

      await updateCustomerAction(customerId, {
        contactPersons: updatedContactPersons,
        contactPerson: contactPersonIdsFromList(updatedContactPersons),
      });

      setCustomer((prev: any) => ({
        ...prev,
        contactPersons: updatedContactPersons,
        contactPerson: contactPersonIdsFromList(updatedContactPersons),
      }));

      setIsContactModalOpen(false);
      dispatch(
        showNotification({
          message: "Yeni müştəri əlaqədar şəxs əlavə edildi",
          type: "added",
        })
      );
    } catch (error) {
      dispatch(
        showNotification({
          message: "Əlaqədar şəxs yaradılarkən xəta baş verdi.",
          type: "error",
        })
      );
      throw error;
    }
  };

  useEffect(() => {
    if (!isEditOpen) return undefined;
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, [isEditOpen]);

  if (loading) {
    return (
      <div style={{ position: "relative", minHeight: "320px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loading />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className={styles.notFound}>
        <p>Müştəri tapılmadı.</p>
        <button type="button" onClick={() => navigate("/musteriler")}>
          Geri qayıt
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div className={styles.companyName}>{customer.company}</div>
        <div className={styles.tabs}>
          {TAB_ITEMS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`${styles.tabButton} ${activeTab === tab ? styles.activeTab : ""}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.quickActions}>
        <button type="button" className={styles.backButton} onClick={() => navigate("/musteriler")}>
          <FiArrowLeft />
          Geri
        </button>
        <button type="button" onClick={loadData} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <FaSyncAlt size={12} />
          Yenilə
        </button>
      </div>

      <div className={styles.content}>
        {/* Left Side: General Customer Details Panel */}
        <aside className={styles.sidePanel}>
          <div className={styles.sideSection}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1e293b", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px", marginBottom: "12px" }}>
              Ümumi müştəri detalları
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ margin: 0, fontSize: "0.78rem", color: "#334155" }}>
                <span style={{ color: "#64748b", fontWeight: 600 }}>Şirkət adı:</span>
                <div style={{ marginTop: "2px", fontWeight: 700, color: "#0f172a" }}>{customer.company}</div>
              </div>
              
              <div style={{ margin: 0, fontSize: "0.78rem", color: "#334155" }}>
                <span style={{ color: "#64748b", fontWeight: 600 }}>Direktoru:</span>
                <div style={{ marginTop: "2px", fontWeight: 500 }}>
                  {formatEntityContactNames(displayedContacts)}
                </div>
              </div>
              
              <div style={{ margin: 0, fontSize: "0.78rem", color: "#334155" }}>
                <span style={{ color: "#64748b", fontWeight: 600 }}>Tax (VÖEN):</span>
                <div style={{ marginTop: "2px", fontWeight: 500 }}>{displayFieldValue(customer.voen)}</div>
              </div>
              
              <div style={{ margin: 0, fontSize: "0.78rem", color: "#334155" }}>
                <span style={{ color: "#64748b", fontWeight: 600 }}>Ünvan:</span>
                <div style={{ marginTop: "2px", fontWeight: 500 }}>{customer.address || "-"}</div>
              </div>
              
              <div style={{ margin: 0, fontSize: "0.78rem", color: "#334155" }}>
                <span style={{ color: "#64748b", fontWeight: 600 }}>Ziyafreight Menecer:</span>
                <div style={{ marginTop: "2px", fontWeight: 500 }}>{managerLabel}</div>
              </div>
              
              <div style={{ margin: 0, fontSize: "0.78rem", color: "#334155" }}>
                <span style={{ color: "#64748b", fontWeight: 600 }}>Sorğu sayı:</span>
                <div style={{ marginTop: "2px", fontWeight: 500 }}>{queries.length}</div>
              </div>
              
              <div style={{ margin: 0, fontSize: "0.78rem", color: "#334155" }}>
                <span style={{ color: "#64748b", fontWeight: 600 }}>Sifariş sayı:</span>
                <div style={{ marginTop: "2px", fontWeight: 500 }}>{orders.length}</div>
              </div>
              
              <div style={{ margin: 0, fontSize: "0.78rem", color: "#334155" }}>
                <span style={{ color: "#64748b", fontWeight: 600 }}>Statusu:</span>
                <div style={{ marginTop: "2px", fontWeight: 500 }}>{customer.customerType || "-"}</div>
              </div>

              <div style={{ borderTop: "1px dashed #cbd5e1", margin: "8px 0" }} />
              
              <div style={{ margin: 0, fontSize: "0.78rem", color: "#334155" }}>
                <span style={{ color: "#64748b", fontWeight: 600 }}>Şirkətdən qazanılan:</span>
                <div style={{ marginTop: "2px", fontWeight: 700, color: "#2563eb" }}>{orderStats.sales.toLocaleString("az-AZ")} AZN</div>
              </div>
              
              <div style={{ margin: 0, fontSize: "0.78rem", color: "#334155" }}>
                <span style={{ color: "#64748b", fontWeight: 600 }}>Ümumi mənfəət:</span>
                <div style={{ marginTop: "2px", fontWeight: 700, color: "#059669" }}>{orderStats.profit.toLocaleString("az-AZ")} AZN</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Side: Tab Contents */}
        <section className={styles.mainPanel}>
          {/* Məlumatlar Tab */}
          {activeTab === "Məlumatlar" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className={styles.infoCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "0 12px", minHeight: "44px", borderBottom: "1px solid #e7edf5" }}>
                  <h3 style={{ margin: 0, borderBottom: "none", fontSize: "0.76rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#475569" }}>Əlaqədar şəxslər</h3>
                  <button
                    type="button"
                    onClick={() => setIsContactModalOpen(true)}
                    style={{
                      background: "#e0f2fe",
                      border: "1px solid #bae6fd",
                      borderRadius: "6px",
                      cursor: "pointer",
                      padding: "4px 10px",
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      color: "#0369a1",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    <FiPlus />
                    Yeni əlaqədar şəxs
                  </button>
                </div>
                
                <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "10px" }}>
                  {displayedContacts.length === 0 ? (
                    <p style={{ color: "#94a3b8", fontSize: "0.8rem", fontStyle: "italic", margin: 0 }}>
                      Heç bir əlaqədar şəxs əlavə edilməyib.
                    </p>
                  ) : (
                    displayedContacts.map((contact) => (
                      <div
                        key={contact.id}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                          background: "#f8fafc",
                          padding: "10px 14px",
                          borderRadius: "10px",
                          border: "1px solid #e2e8f0"
                        }}
                      >
                        <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#1e293b" }}>
                          {contact.fullName}
                          {contact.position && (
                            <span style={{ fontWeight: 500, fontSize: "0.75rem", color: "#64748b", marginLeft: "8px" }}>
                              ({contact.position})
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "#475569" }}>
                          {contact.phone && <span>Telefon: {contact.phone}</span>}
                          {contact.email && <span style={{ marginLeft: "14px" }}>E-poçt: {contact.email}</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className={styles.infoCard}>
                <h3>Şirkət Məlumatları</h3>
                <div className={styles.infoGrid}>
                  <p>
                    <span>Şirkət adı:</span> {customer.company}
                  </p>
                  <p>
                    <span>Faaliyyət növü:</span> {displayFieldValue(customer.activityType)}
                  </p>
                  <p>
                    <span>VÖEN:</span> {displayFieldValue(customer.voen)}
                  </p>
                  <p>
                    <span>Hüquqi ünvan:</span> {customer.address}
                  </p>
                  <p>
                    <span>Ölkə:</span> {customer.country}
                  </p>
                  <p>
                    <span>Məsul Menecer:</span> {managerLabel}
                  </p>
                </div>
              </div>

              <div className={styles.infoCard}>
                <h3>Sənədlər</h3>
                <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {customerDocuments.length === 0 ? (
                    <p style={{ color: "#94a3b8", fontSize: "0.8rem", fontStyle: "italic", margin: 0 }}>
                      Heç bir sənəd əlavə edilməyib.
                    </p>
                  ) : (
                    customerDocuments.map((doc, idx) => (
                      <div
                        key={doc.id || idx}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "12px",
                          padding: "10px 14px",
                          borderRadius: "10px",
                          border: "1px solid #e2e8f0",
                          background: "#f8fafc",
                          fontSize: "0.82rem",
                        }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0, flex: 1, overflow: "hidden" }}>
                          <span
                            title={doc.number}
                            style={{
                              fontWeight: 600,
                              color: "#0f172a",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {doc.number}
                          </span>
                          {doc.documentType ? (
                            <span
                              title={doc.documentType}
                              style={{
                                color: "#475569",
                                fontSize: "0.75rem",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {doc.documentType}
                            </span>
                          ) : null}
                          {doc.fileName ? (
                            <span
                              title={doc.fileName}
                              style={{
                                color: "#0369a1",
                                fontSize: "0.75rem",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {doc.fileName}
                            </span>
                          ) : null}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                          <span style={{ color: "#64748b" }}>{doc.date}</span>
                          {doc.fileUrl ? (
                            <a
                              href={buildApiUrl(doc.fileUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: "#2563eb",
                                fontWeight: 600,
                                fontSize: "0.75rem",
                                textDecoration: "none",
                              }}
                            >
                              Bax
                            </a>
                          ) : null}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Sorğular Tab */}
          {activeTab === "Sorğular" && (
            <div className={styles.infoCard}>
              <h3>Bu şirkətə aid sorğular</h3>
              <div style={{ padding: "0.5rem", overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                      <th style={{ padding: "10px", textAlign: "left", color: "#475569", fontWeight: 700 }}>Sorğu №</th>
                      <th style={{ padding: "10px", textAlign: "left", color: "#475569", fontWeight: 700 }}>Status</th>
                      <th style={{ padding: "10px", textAlign: "left", color: "#475569", fontWeight: 700 }}>Yük</th>
                      <th style={{ padding: "10px", textAlign: "left", color: "#475569", fontWeight: 700 }}>İstiqamət</th>
                      <th style={{ padding: "10px", textAlign: "left", color: "#475569", fontWeight: 700 }}>Tarix</th>
                      <th style={{ padding: "10px", textAlign: "left", color: "#475569", fontWeight: 700 }}>Əməliyyat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queries.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: "20px", textAlign: "center", color: "#64748b", fontStyle: "italic" }}>
                          Sorğu tapılmadı.
                        </td>
                      </tr>
                    ) : (
                      queries.map((q) => (
                        <tr key={q.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "10px", fontWeight: 600 }}>
                            <Link
                              to={getQueryDetailPath(q)}
                              style={{ color: "#2563eb", textDecoration: "none" }}
                            >
                              {q.number}
                            </Link>
                          </td>
                          <td style={{ padding: "10px" }}>
                            <span style={{
                              display: "inline-block", padding: "2px 8px", borderRadius: "12px", fontSize: "0.7rem", fontWeight: 600,
                              background: q.status === "approved" ? "#ecfdf5" : q.status === "cancelled" ? "#fef2f2" : "#fffbeb",
                              color: q.status === "approved" ? "#047857" : q.status === "cancelled" ? "#b91c1c" : "#b45309",
                              border: `1px solid ${q.status === "approved" ? "#a7f3d0" : q.status === "cancelled" ? "#fecaca" : "#fde68a"}`
                            }}>
                              {q.status === "pending" ? "Gözləmədə" : q.status === "approved" ? "Təsdiq edildi" : q.status === "cancelled" ? "Ləğv edildi" : q.status}
                            </span>
                          </td>
                          <td style={{ padding: "10px", color: "#334155", maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={getQueryCargoSummary(q)}>
                            {getQueryCargoSummary(q)}
                          </td>
                          <td style={{ padding: "10px", color: "#334155", maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={getQueryDirectionLabel(q)}>
                            {getQueryDirectionLabel(q)}
                          </td>
                          <td style={{ padding: "10px", color: "#64748b" }}>{new Date(q.createdAt).toLocaleDateString("az-AZ")}</td>
                          <td style={{ padding: "10px" }}>
                            <Link
                              to={getQueryDetailPath(q)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "4px 10px",
                                borderRadius: "6px",
                                background: "#e0f2fe",
                                border: "1px solid #bae6fd",
                                color: "#0369a1",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                textDecoration: "none",
                              }}
                            >
                              <FiExternalLink size={12} />
                              Detala keç
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sifarişlər Tab */}
          {activeTab === "Sifarişlər" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Financial aggregates for orders */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
                <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", marginBottom: "4px" }}>Total Sayı</div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1e293b" }}>{orderStats.count}</div>
                </div>
                <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", marginBottom: "4px" }}>Total Satış Qiyməti</div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#2563eb" }}>{orderStats.sales.toLocaleString("az-AZ")} AZN</div>
                </div>
                <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", marginBottom: "4px" }}>Total Xərci</div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ea580c" }}>{orderStats.expenses.toLocaleString("az-AZ")} AZN</div>
                </div>
                <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", marginBottom: "4px" }}>Total Qazancı</div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#059669" }}>{orderStats.profit.toLocaleString("az-AZ")} AZN</div>
                </div>
              </div>

              <div className={styles.infoCard}>
                <h3>Bu şirkətə aid sifarişlər</h3>
                <div style={{ padding: "0.5rem", overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                        <th style={{ padding: "10px", textAlign: "left", color: "#475569", fontWeight: 700 }}>Sifariş №</th>
                        <th style={{ padding: "10px", textAlign: "left", color: "#475569", fontWeight: 700 }}>Status</th>
                        <th style={{ padding: "10px", textAlign: "left", color: "#475569", fontWeight: 700 }}>Marşrut</th>
                        <th style={{ padding: "10px", textAlign: "left", color: "#475569", fontWeight: 700 }}>Yük məlumatı</th>
                        <th style={{ padding: "10px", textAlign: "left", color: "#475569", fontWeight: 700 }}>Gəlir</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ padding: "20px", textAlign: "center", color: "#64748b", fontStyle: "italic" }}>
                            Sifariş tapılmadı.
                          </td>
                        </tr>
                      ) : (
                        orders.map((o) => (
                          <tr key={o.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "10px", fontWeight: 600, color: "#2563eb" }}>{o.orderNumber}</td>
                            <td style={{ padding: "10px" }}>
                              <span style={{
                                display: "inline-block", padding: "2px 8px", borderRadius: "12px", fontSize: "0.7rem", fontWeight: 600,
                                background: o.statusKind === "completed" ? "#ecfdf5" : o.statusKind === "progress" ? "#eff6ff" : "#f1f5f9",
                                color: o.statusKind === "completed" ? "#047857" : o.statusKind === "progress" ? "#1d4ed8" : "#475569",
                                border: `1px solid ${o.statusKind === "completed" ? "#a7f3d0" : o.statusKind === "progress" ? "#bfdbfe" : "#cbd5e1"}`
                              }}>
                                {o.statusLabel || o.statusKind}
                              </span>
                            </td>
                            <td style={{ padding: "10px", color: "#334155" }}>{o.route}</td>
                            <td style={{ padding: "10px", color: "#334155" }}>{o.cargoParams}</td>
                            <td style={{ padding: "10px", color: "#059669", fontWeight: 700 }}>{o.profit || "—"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Maliyyə Tab */}
          {activeTab === "Maliyyə" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px" }}>
                <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", marginBottom: "4px" }}>Ümumi Ödəniş</div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#059669" }}>{financeStats.totalPaid.toLocaleString("az-AZ")} AZN</div>
                </div>
                <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", marginBottom: "4px" }}>Qalıq Borc</div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ea580c" }}>{financeStats.outstandingDebt.toLocaleString("az-AZ")} AZN</div>
                </div>
                <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", marginBottom: "4px" }}>Artıq Ödəniş</div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#3b82f6" }}>{financeStats.overpayment.toLocaleString("az-AZ")} AZN</div>
                </div>
                <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", marginBottom: "4px" }}>Satış (sifariş)</div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#2563eb" }}>{financeStats.totalSales.toLocaleString("az-AZ")} AZN</div>
                </div>
                <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", marginBottom: "4px" }}>Mənfəət</div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#059669" }}>{financeStats.totalProfit.toLocaleString("az-AZ")} AZN</div>
                </div>
              </div>

              <div className={styles.infoCard}>
                <h3>Maliyyə tarixçəsi</h3>
                <div style={{ padding: "0.5rem", overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                        <th style={{ padding: "10px", textAlign: "left", color: "#475569", fontWeight: 700 }}>Tarix</th>
                        <th style={{ padding: "10px", textAlign: "left", color: "#475569", fontWeight: 700 }}>Təyinat</th>
                        <th style={{ padding: "10px", textAlign: "left", color: "#475569", fontWeight: 700 }}>Məbləğ</th>
                        <th style={{ padding: "10px", textAlign: "left", color: "#475569", fontWeight: 700 }}>Valyuta</th>
                        <th style={{ padding: "10px", textAlign: "left", color: "#475569", fontWeight: 700 }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {financeStats.payments.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ padding: "20px", textAlign: "center", color: "#64748b", fontStyle: "italic" }}>
                            Maliyyə əməliyyatı tapılmadı.
                          </td>
                        </tr>
                      ) : (
                        financeStats.payments.map((p) => (
                          <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "10px", color: "#64748b" }}>
                              {p.date ? new Date(p.date).toLocaleDateString("az-AZ") : "—"}
                            </td>
                            <td style={{ padding: "10px", color: "#334155" }}>{p.purpose}</td>
                            <td
                              style={{
                                padding: "10px",
                                fontWeight: 700,
                                color: p.amount >= 0 ? "#059669" : "#dc2626",
                              }}
                            >
                              {p.amount >= 0 ? "+" : ""}
                              {p.amount.toLocaleString("az-AZ")}
                            </td>
                            <td style={{ padding: "10px", color: "#475569" }}>{p.currency}</td>
                            <td style={{ padding: "10px" }}>
                              <span style={{
                                display: "inline-block", padding: "2px 8px", borderRadius: "12px", fontSize: "0.7rem", fontWeight: 600,
                                background: getFinanceStatusStyle(p.status).background,
                                color: getFinanceStatusStyle(p.status).color,
                                border: `1px solid ${getFinanceStatusStyle(p.status).border}`,
                              }}>
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Edit Drawer Modal */}
      <div
        className={`${styles.editModalOverlay} ${isEditOpen ? styles.editModalOverlayOpen : ""}`}
        aria-hidden={!isEditOpen}
      />
      <aside
        className={`${styles.editDrawer} ${isEditOpen ? styles.editDrawerOpen : ""}`}
        aria-hidden={!isEditOpen}
      >
        <div className={styles.editModalCard} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
          <div className={styles.editModalHeader}>
            <h3>Müştərini redaktə et</h3>
            <button type="button" onClick={() => setIsEditOpen(false)}>
              x
            </button>
          </div>
          <div className={styles.editTabs}>
            <button
              type="button"
              className={activeEditTab === "main" ? styles.editTabActive : ""}
              onClick={() => setActiveEditTab("main")}
            >
              Əsas məlumatlar
            </button>
            <button
              type="button"
              className={activeEditTab === "contact" ? styles.editTabActive : ""}
              onClick={() => setActiveEditTab("contact")}
            >
              Əlaqə məlumatları
            </button>
          </div>

          {activeEditTab === "main" && (
            <div className={styles.editModalGrid}>
              <section className={styles.editColumn}>
                <h4>Şirkətin rekvizitləri</h4>
                <label>
                  <span>Şirkətin adı *</span>
                  <input
                    value={editForm.company}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, company: e.target.value }))}
                  />
                </label>
                <label>
                  <span>Müştəri tipi</span>
                  <select
                    value={editForm.customerType}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, customerType: e.target.value }))}
                  >
                    <option value="">Dəyəri seçin</option>
                    <option value="Yeni müştəri">Yeni müştəri</option>
                    <option value="Daimi müştəri">Daimi müştəri</option>
                    <option value="Korporativ">Korporativ</option>
                  </select>
                </label>
                <label>
                  <span>Fəaliyyət növü</span>
                  <input
                    value={editForm.activityType}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, activityType: e.target.value }))}
                    placeholder="Məs: Logistika"
                  />
                </label>
                <label>
                  <span>VÖEN</span>
                  <input
                    value={editForm.voen}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, voen: e.target.value }))}
                  />
                </label>
              </section>

              <section className={styles.editColumn}>
                <h4>Məsul şəxslər</h4>
                <label>
                  <span>Məsul menecer</span>
                  <input
                    value={editForm.manager}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, manager: e.target.value }))}
                  />
                </label>
                <label>
                  <span>Satışlar qrupu</span>
                  <input
                    value={editForm.salesGroup}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, salesGroup: e.target.value }))}
                  />
                </label>
              </section>
            </div>
          )}

          {activeEditTab === "contact" && (
            <div className={styles.singleTabContent}>
              <section className={styles.editColumn}>
                <h4>Əlaqə məlumatları</h4>
                <div className={styles.contactGrid}>
                  <label>
                    <span>Ölkə</span>
                    <input
                      value={editForm.country}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, country: e.target.value }))}
                    />
                  </label>
                  <label>
                    <span>Ünvan</span>
                    <input
                      value={editForm.address}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, address: e.target.value }))}
                    />
                  </label>
                  <label>
                    <span>Telefon</span>
                    <input
                      value={editForm.contactInfo}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, contactInfo: e.target.value }))}
                    />
                  </label>
                </div>
              </section>
            </div>
          )}

          <div className={styles.editModalFooter}>
            <button type="button" className={styles.modalCancel} onClick={() => setIsEditOpen(false)}>
              Ləğv et
            </button>
            <button type="button" className={styles.modalSave} onClick={handleSave}>
              Yaddaşda saxlamaq
            </button>
          </div>
        </div>
      </aside>

      {/* Inline Contact Person Creation Modal */}
      <ContactPersonFormModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        onSubmit={handleCreateContactPerson}
        initialValues={{ company: customer?.company }}
      />
    </div>
  );
}
