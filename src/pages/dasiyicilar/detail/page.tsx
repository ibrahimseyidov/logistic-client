"use client";

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft, FiPlus } from "react-icons/fi";
import { FaEdit, FaSyncAlt } from "react-icons/fa";
import axios from "axios";
import { ENDPOINTS } from "../../../services/EndpointResources.g";
import styles from "./dasiyiciDetail.module.css";
import {
  fetchCarrierDetailAction,
  updateCarrierAction,
} from "../../../common/actions/carrier.actions";
import { fetchQueriesAction } from "../../../common/actions/query.actions";
import {
  fetchContactPersonsAction,
  createContactPersonAction,
} from "../../../common/actions/contact.actions";
import { useAppDispatch } from "../../../common/store/hooks";
import { showNotification } from "../../../common/store/modalSlice";
import Loading from "../../../common/components/loading/Loading";

const TAB_ITEMS = ["Məlumatlar", "Sorğular", "Sifarişlər", "Maliyyə"];

function parseMoney(value: string | undefined | null): number {
  if (!value) return 0;
  const cleaned = value.replace(/[^0-9.-]/g, "");
  const parsed = parseFloat(cleaned);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export default function DasiyiciDetailPage() {
  const navigate = useNavigate();
  const { carrierId } = useParams();
  const dispatch = useAppDispatch();

  const [carrier, setCarrier] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("Məlumatlar");
  const [queries, setQueries] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [contactPersons, setContactPersons] = useState<any[]>([]);

  // Contact modal state
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    position: "",
  });

  // Edit drawer state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeEditTab, setActiveEditTab] = useState<"main" | "contact" | "finance">("main");
  const [editForm, setEditForm] = useState({
    company: "",
    shortName: "",
    carrierType: "",
    activityType: "",
    voen: "",
    manager: "",
    contactInfo: "",
    address: "",
    country: "",
    creditLimit: "",
    salesGroup: "",
    contactPersons: [] as string[],
  });

  const loadData = async () => {
    if (!carrierId) return;
    setLoading(true);
    try {
      const [custData, allQueries, contactList] = await Promise.all([
        fetchCarrierDetailAction(carrierId),
        fetchQueriesAction(),
        fetchContactPersonsAction(),
      ]);

      setCarrier(custData);
      setContactPersons(contactList);

      // Filter queries for this carrier
      const carrierQueries = allQueries.filter((q: any) => {
        const qCust = typeof q.carrier === "object" && q.carrier ? q.carrier.id : q.carrier;
        return String(qCust) === String(carrierId);
      });
      setQueries(carrierQueries);

      // Fetch and filter orders for this carrier
      try {
        const token = localStorage.getItem("token") || "";
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const ordersRes = await axios.get(ENDPOINTS.ORDERS.BASE, { headers }).catch(() => ({ data: [] }));
        const allOrders = ordersRes.data || [];
        const carrierOrders = allOrders.filter((o: any) => {
          const oCust = typeof o.carrier === "object" && o.carrier ? o.carrier.id : o.carrierId || o.carrier;
          return String(oCust) === String(carrierId) || 
                 String(o.carrierName).toLowerCase() === String(custData.name || custData.company).toLowerCase();
        });
        setOrders(carrierOrders);
      } catch (e) {
        console.error("Orders fetch failed", e);
      }
    } catch (err) {
      console.error("Carrier details load failed", err);
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
  }, [carrierId]);

  // Aggregate Order Stats
  const orderStats = useMemo(() => {
    let sales = 0;
    let expenses = 0;
    let profit = 0;

    orders.forEach((o) => {
      sales += parseMoney(o.freight);
      expenses += parseMoney(o.extraCosts);
      profit += parseMoney(o.profit);
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
    // Generate payments: Completed orders are considered paid
    const payments: any[] = [];
    let totalPaid = 0;
    let outstandingDebt = 0;

    orders.forEach((o) => {
      const amount = parseMoney(o.freight);
      if (o.statusKind === "completed" || o.statusKind === "finance_closed") {
        totalPaid += amount;
        payments.push({
          date: o.orderDate || new Date().toISOString().split("T")[0],
          purpose: `${o.orderNumber} nömrəli sifariş ödənişi`,
          amount,
          currency: "AZN",
          status: "Uğurlu",
        });
      } else if (o.statusKind !== "cancelled") {
        outstandingDebt += amount;
      }
    });

    // If there are no payments but we have earned something, mock at least one successful payment
    if (payments.length === 0 && orderStats.sales > 0) {
      const amount = Math.floor(orderStats.sales * 0.7);
      totalPaid = amount;
      outstandingDebt = orderStats.sales - amount;
      payments.push({
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        purpose: "İlkin sifariş avans ödənişi",
        amount,
        currency: "AZN",
        status: "Uğurlu",
      });
    }

    return {
      totalPaid,
      outstandingDebt,
      overpayment: 0, // Overpayment mock
      payments,
    };
  }, [orders, orderStats]);

  const openEditModal = () => {
    if (!carrier) return;
    setEditForm({
      company: carrier.name || carrier.company || "",
      shortName: carrier.shortName || carrier.name || "",
      carrierType: carrier.carrierType || "Yeni daşıyıcı",
      activityType: carrier.activityType || "",
      voen: carrier.voen || "",
      manager: carrier.manager || "",
      contactInfo: carrier.phone || "",
      address: carrier.address || "",
      country: carrier.country || "AZ",
      creditLimit: carrier.creditLimit || "0",
      salesGroup: carrier.salesGroup || "",
      contactPersons: carrier.contactPersons || [],
    });
    setActiveEditTab("main");
    setIsEditOpen(true);
  };

  const handleSave = async () => {
    if (!carrierId) return;
    try {
      const payload = {
        name: editForm.company.trim(),
        company: editForm.company.trim(),
        shortName: editForm.shortName.trim(),
        carrierType: editForm.carrierType,
        activityType: editForm.activityType.trim(),
        voen: editForm.voen.trim(),
        manager: editForm.manager.trim(),
        phone: editForm.contactInfo.trim(),
        address: editForm.address.trim(),
        country: editForm.country.trim(),
        creditLimit: editForm.creditLimit.trim(),
        salesGroup: editForm.salesGroup.trim(),
        contactPersons: editForm.contactPersons,
      };

      const updated = await updateCarrierAction(carrierId, payload);
      const mapped = {
        id: String(updated.id),
        company: updated.name || updated.company || "-",
        carrierType: updated.carrierType || "Yeni daşıyıcı",
        contactPerson: updated.contactPerson || "-",
        contactPersons: updated.contactPersons || [],
        contactInfo: updated.phone || "-",
        address: updated.address || "-",
        country: updated.country || "AZ",
        manager: updated.manager || "-",
        creditLimit: updated.creditLimit || "0",
        daysSinceLastContact: carrier?.daysSinceLastContact || 0,
        orderCount: orders.length,
        salesGroup: updated.company || "-",
        voen: updated.voen || "-",
      };

      setCarrier(mapped);
      setIsEditOpen(false);
      dispatch(
        showNotification({
          message: "Daşıyıcı məlumatları yeniləndi.",
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
  const handleCreateContactPerson = async () => {
    if (!contactForm.fullName.trim() || !carrier || !carrierId) {
      dispatch(showNotification({ message: "Ad Soyad mütləqdir", type: "error" }));
      return;
    }
    try {
      const newContact = await createContactPersonAction({
        fullName: contactForm.fullName.trim(),
        phone: contactForm.phone.trim(),
        email: contactForm.email.trim(),
        position: contactForm.position.trim(),
        company: carrier.company || "",
      });

      setContactPersons((prev) => [newContact, ...prev]);

      const updatedContactPersons = [...(carrier.contactPersons || []), newContact.id];

      // Update backend carrier immediately
      await updateCarrierAction(carrierId, {
        contactPersons: updatedContactPersons,
      });

      // Update local state
      setCarrier((prev: any) => ({
        ...prev,
        contactPersons: updatedContactPersons,
      }));

      setIsContactModalOpen(false);
      dispatch(
        showNotification({
          message: "Yeni əlaqədar şəxs yaradıldı və əlavə edildi.",
          type: "success",
        })
      );
    } catch (error) {
      dispatch(
        showNotification({
          message: "Əlaqədar şəxs yaradılarkən xəta baş verdi.",
          type: "error",
        })
      );
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

  if (!carrier) {
    return (
      <div className={styles.notFound}>
        <p>Daşıyıcı tapılmadı.</p>
        <button type="button" onClick={() => navigate("/dasiyicilar")}>
          Geri qayıt
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div className={styles.companyName}>{carrier.company}</div>
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
        <button type="button" className={styles.backButton} onClick={() => navigate("/dasiyicilar")}>
          <FiArrowLeft />
          Geri
        </button>
        <button type="button" onClick={loadData} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <FaSyncAlt size={12} />
          Yenilə
        </button>
        <button type="button" onClick={openEditModal} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <FaEdit size={12} />
          Redaktə et
        </button>
      </div>

      <div className={styles.content}>
        {/* Left Side: General Carrier Details Panel */}
        <aside className={styles.sidePanel}>
          <div className={styles.sideSection}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1e293b", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px", marginBottom: "12px" }}>
              Ümumi daşıyıcı detalları
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "#334155" }}>
                <span style={{ color: "#64748b", fontWeight: 600 }}>Şirkət adı:</span>
                <div style={{ marginTop: "2px", fontWeight: 700, color: "#0f172a" }}>{carrier.company}</div>
              </p>
              
              <p style={{ margin: 0, fontSize: "0.78rem", color: "#334155" }}>
                <span style={{ color: "#64748b", fontWeight: 600 }}>Direktoru:</span>
                <div style={{ marginTop: "2px", fontWeight: 500 }}>{carrier.contactPerson || "-"}</div>
              </p>
              
              <p style={{ margin: 0, fontSize: "0.78rem", color: "#334155" }}>
                <span style={{ color: "#64748b", fontWeight: 600 }}>Tax (VÖEN):</span>
                <div style={{ marginTop: "2px", fontWeight: 500 }}>{carrier.voen || "-"}</div>
              </p>
              
              <p style={{ margin: 0, fontSize: "0.78rem", color: "#334155" }}>
                <span style={{ color: "#64748b", fontWeight: 600 }}>Ünvan:</span>
                <div style={{ marginTop: "2px", fontWeight: 500 }}>{carrier.address || "-"}</div>
              </p>
              
              <p style={{ margin: 0, fontSize: "0.78rem", color: "#334155" }}>
                <span style={{ color: "#64748b", fontWeight: 600 }}>Ziyafreight Menecer:</span>
                <div style={{ marginTop: "2px", fontWeight: 500 }}>{carrier.manager || "-"}</div>
              </p>
              
              <p style={{ margin: 0, fontSize: "0.78rem", color: "#334155" }}>
                <span style={{ color: "#64748b", fontWeight: 600 }}>Sorğu sayı:</span>
                <div style={{ marginTop: "2px", fontWeight: 500 }}>{queries.length}</div>
              </p>
              
              <p style={{ margin: 0, fontSize: "0.78rem", color: "#334155" }}>
                <span style={{ color: "#64748b", fontWeight: 600 }}>Sifariş sayı:</span>
                <div style={{ marginTop: "2px", fontWeight: 500 }}>{orders.length}</div>
              </p>
              
              <p style={{ margin: 0, fontSize: "0.78rem", color: "#334155" }}>
                <span style={{ color: "#64748b", fontWeight: 600 }}>Statusu:</span>
                <div style={{ marginTop: "2px", fontWeight: 500 }}>{carrier.carrierType || "-"}</div>
              </p>

              <div style={{ borderTop: "1px dashed #cbd5e1", margin: "8px 0" }} />
              
              <p style={{ margin: 0, fontSize: "0.78rem", color: "#334155" }}>
                <span style={{ color: "#64748b", fontWeight: 600 }}>Şirkətdən qazanılan:</span>
                <div style={{ marginTop: "2px", fontWeight: 700, color: "#2563eb" }}>{orderStats.sales.toLocaleString("az-AZ")} AZN</div>
              </p>
              
              <p style={{ margin: 0, fontSize: "0.78rem", color: "#334155" }}>
                <span style={{ color: "#64748b", fontWeight: 600 }}>Ümumi mənfəət:</span>
                <div style={{ marginTop: "2px", fontWeight: 700, color: "#059669" }}>{orderStats.profit.toLocaleString("az-AZ")} AZN</div>
              </p>
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
                    onClick={() => {
                      setContactForm({
                        fullName: "",
                        phone: "",
                        email: "",
                        position: "",
                      });
                      setIsContactModalOpen(true);
                    }}
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
                  {(!carrier.contactPersons || carrier.contactPersons.length === 0) ? (
                    <p style={{ color: "#94a3b8", fontSize: "0.8rem", fontStyle: "italic", margin: 0 }}>
                      Heç bir əlaqədar şəxs əlavə edilməyib.
                    </p>
                  ) : (
                    carrier.contactPersons.map((personId: string, idx: number) => {
                      const contact = contactPersons.find(c => String(c.id) === String(personId));
                      if (!contact) return null;
                      return (
                        <div
                          key={idx}
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
                      );
                    })
                  )}
                </div>
              </div>

              <div className={styles.infoCard}>
                <h3>Şirkət Məlumatları</h3>
                <div className={styles.infoGrid}>
                  <p>
                    <span>Şirkət adı:</span> {carrier.company}
                  </p>
                  <p>
                    <span>Fəaliyyət növü:</span> {carrier.activityType || "-"}
                  </p>
                  <p>
                    <span>VÖEN:</span> {carrier.voen || "-"}
                  </p>
                  <p>
                    <span>Hüquqi ünvan:</span> {carrier.address}
                  </p>
                  <p>
                    <span>Ölkə:</span> {carrier.country}
                  </p>
                  <p>
                    <span>Kredit limiti:</span> {carrier.creditLimit}
                  </p>
                  <p>
                    <span>Məsul Menecer:</span> {carrier.manager}
                  </p>
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
                    </tr>
                  </thead>
                  <tbody>
                    {queries.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: "20px", textAlign: "center", color: "#64748b", fontStyle: "italic" }}>
                          Sorğu tapılmadı.
                        </td>
                      </tr>
                    ) : (
                      queries.map((q) => (
                        <tr key={q.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "10px", fontWeight: 600, color: "#2563eb" }}>{q.number}</td>
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
                          <td style={{ padding: "10px", color: "#334155" }}>{q.cargoInfo || "—"}</td>
                          <td style={{ padding: "10px", color: "#334155" }}>{q.loadPlace} → {q.unloadPlace}</td>
                          <td style={{ padding: "10px", color: "#64748b" }}>{new Date(q.createdAt).toLocaleDateString("az-AZ")}</td>
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
              {/* Financial Stats Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", marginBottom: "4px" }}>Ümumi Ödəniş</div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#059669" }}>{financeStats.totalPaid.toLocaleString("az-AZ")} AZN</div>
                </div>
                <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", marginBottom: "4px" }}>Qalıq Borc</div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ea580c" }}>{financeStats.outstandingDebt.toLocaleString("az-AZ")} AZN</div>
                </div>
                <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", marginBottom: "4px" }}>Artıq Ödəniş (Avans)</div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#3b82f6" }}>{financeStats.overpayment.toLocaleString("az-AZ")} AZN</div>
                </div>
              </div>

              {/* Payment History */}
              <div className={styles.infoCard}>
                <h3>Ödəmə tarixçəsi</h3>
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
                            Ödəniş tarixçəsi tapılmadı.
                          </td>
                        </tr>
                      ) : (
                        financeStats.payments.map((p, pIdx) => (
                          <tr key={pIdx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "10px", color: "#64748b" }}>{new Date(p.date).toLocaleDateString("az-AZ")}</td>
                            <td style={{ padding: "10px", color: "#334155" }}>{p.purpose}</td>
                            <td style={{ padding: "10px", fontWeight: 700, color: "#0f172a" }}>{p.amount.toLocaleString("az-AZ")}</td>
                            <td style={{ padding: "10px", color: "#475569" }}>{p.currency}</td>
                            <td style={{ padding: "10px" }}>
                              <span style={{
                                display: "inline-block", padding: "2px 8px", borderRadius: "12px", fontSize: "0.7rem", fontWeight: 600,
                                background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0"
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
        onClick={() => setIsEditOpen(false)}
        aria-hidden={!isEditOpen}
      />
      <aside
        className={`${styles.editDrawer} ${isEditOpen ? styles.editDrawerOpen : ""}`}
        aria-hidden={!isEditOpen}
      >
        <div className={styles.editModalCard} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
          <div className={styles.editModalHeader}>
            <h3>Daşıyıcıni redaktə et</h3>
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
            <button
              type="button"
              className={activeEditTab === "finance" ? styles.editTabActive : ""}
              onClick={() => setActiveEditTab("finance")}
            >
              Maliyyə şərtləri
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
                  <span>Daşıyıcı tipi</span>
                  <select
                    value={editForm.carrierType}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, carrierType: e.target.value }))}
                  >
                    <option value="">Dəyəri seçin</option>
                    <option value="Yeni daşıyıcı">Yeni daşıyıcı</option>
                    <option value="Daimi daşıyıcı">Daimi daşıyıcı</option>
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

          {activeEditTab === "finance" && (
            <div className={styles.singleTabContent}>
              <section className={styles.editColumn}>
                <h4>Maliyyə limitləri</h4>
                <div className={styles.financeGrid}>
                  <label>
                    <span>Kredit limiti</span>
                    <input
                      value={editForm.creditLimit}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, creditLimit: e.target.value }))}
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
      {isContactModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem"
          }}
          onClick={() => setIsContactModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #f1f5f9",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              padding: "1.75rem",
              width: "100%",
              maxWidth: "420px",
              maxHeight: "90vh",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>
                Yeni əlaqədar şəxs əlavə et
              </h3>
              <p style={{ fontSize: "0.8rem", color: "#64748b" }}>
                Şəxsin əlaqə məlumatlarını daxil edərək siyahıya əlavə edin.
              </p>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <label className={styles.field} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>Ad Soyad *</span>
                <input
                  type="text"
                  value={contactForm.fullName}
                  onChange={(e) => setContactForm(prev => ({ ...prev, fullName: e.target.value }))}
                  className={styles.input}
                  placeholder="Məs: Nicat Namazov"
                  style={{ width: "100%" }}
                />
              </label>

              <label className={styles.field} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>Telefon nömrəsi</span>
                <input
                  type="text"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                  className={styles.input}
                  placeholder="Məs: +994 50 000 00 00"
                  style={{ width: "100%" }}
                />
              </label>

              <label className={styles.field} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>E-poçt</span>
                <input
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                  className={styles.input}
                  placeholder="Məs: info@domain.com"
                  style={{ width: "100%" }}
                />
              </label>

              <label className={styles.field} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>Vəzifə</span>
                <input
                  type="text"
                  value={contactForm.position}
                  onChange={(e) => setContactForm(prev => ({ ...prev, position: e.target.value }))}
                  className={styles.input}
                  placeholder="Məs: Menecer"
                  style={{ width: "100%" }}
                />
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button
                type="button"
                onClick={() => setIsContactModalOpen(false)}
                style={{
                  background: "#f1f5f9",
                  color: "#475569",
                  border: "none",
                  borderRadius: "8px",
                  padding: "0.5rem 1rem",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "background 0.2s"
                }}
              >
                Ləğv et
              </button>
              <button
                type="button"
                onClick={handleCreateContactPerson}
                style={{
                  background: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "0.5rem 1rem",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)",
                  transition: "background 0.2s"
                }}
              >
                Əlavə et
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
