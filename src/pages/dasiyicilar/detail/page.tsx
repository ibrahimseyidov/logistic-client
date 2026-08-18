"use client";

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft, FiPlus, FiExternalLink } from "react-icons/fi";
import { FaSyncAlt } from "react-icons/fa";
import styles from "./dasiyiciDetail.module.css";
import {
  fetchCarrierDetailAction,
  updateCarrierAction,
} from "../../../common/actions/carrier.actions";
import { fetchQueriesAction } from "../../../common/actions/query.actions";
import { fetchOrdersAction } from "../../../common/actions/order.actions";
import {
  fetchContactPersonsAction,
  createContactPersonAction,
} from "../../../common/actions/contact.actions";
import { fetchFinanceTransactionsAction } from "../../../common/actions/finance.actions";
import { useAppDispatch } from "../../../common/store/hooks";
import { showNotification } from "../../../common/store/modalSlice";
import Loading from "../../../common/components/loading/Loading";
import { statusLabelAz } from "../../../common/components/StatusBadge";
import {
  displayFieldValue,
  getSelectedContactNames,
  mapCarrierFromApi,
  normalizeCarrierContacts,
  serializeCarrierDocuments,
} from "../../../common/utils/carrierDisplay.utils";
import Select from "../../../common/components/select/Select";
import { buildApiUrl } from "../../../common/utils/fetch.utils";
import { COUNTRY_OPTIONS } from "../../sorgular/constants/options.constants";
import {
  ContactPersonFormModal,
  type ContactPersonFormData,
} from "../../../common/components/modal/ContactPersonFormModal";
import {
  getQueryCargoSummary,
  getQueryDirectionLabel,
  getQueryDetailPath,
} from "../../sorgular/lib/queryDisplay.utils";
import {
  matchesCarrierEntity,
  queryMatchesCarrier,
} from "../../../common/utils/entityActivity.utils";
import { usePermissions } from "../../../common/hooks/usePermissions";

const TAB_ITEMS: { label: string; permChild: string }[] = [
  { label: "Məlumatlar", permChild: "detail" },
  { label: "Sorğular", permChild: "detail" },
  { label: "Sifarişlər", permChild: "detail" },
  { label: "Maliyyə", permChild: "finance" },
];

function resolveCountryValue(stored: string): string {
  const trimmed = String(stored ?? "").trim();
  if (!trimmed) return "AZ";
  const byValue = COUNTRY_OPTIONS.find((option) => option.value === trimmed);
  if (byValue) return byValue.value;
  const byLabel = COUNTRY_OPTIONS.find((option) => option.label === trimmed);
  return byLabel?.value || trimmed;
}

function getCountrySelectOptions(currentValue?: string) {
  const options = COUNTRY_OPTIONS.map((option) => ({
    value: option.value,
    label: option.label,
  }));
  const value = String(currentValue ?? "").trim();
  if (value && !options.some((option) => option.value === value || option.label === value)) {
    options.push({ value, label: value });
  }
  return options;
}

function parseMoney(value: string | number | undefined | null): number {
  if (value == null || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const cleaned = String(value).replace(/[^0-9.-]/g, "");
  const parsed = parseFloat(cleaned);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export default function DasiyiciDetailPage() {
  const navigate = useNavigate();
  const { carrierId } = useParams();
  const dispatch = useAppDispatch();
  const { canView, canCreate } = usePermissions();
  const canCreateContact = canCreate("dasiyicilar", "contacts");

  const [carrier, setCarrier] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("Məlumatlar");
  const [queries, setQueries] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [contactPersons, setContactPersons] = useState<any[]>([]);
  const [financeTransactions, setFinanceTransactions] = useState<any[]>([]);

  // Contact modal state
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // Edit drawer state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeEditTab, setActiveEditTab] = useState<"main" | "contact">("main");
  const [editForm, setEditForm] = useState({
    company: "",
    shortName: "",
    carrierType: "",
    activityType: "",
    voen: "",
    contactInfo: "",
    address: "",
    country: "",
    salesGroup: "",
    contactPersons: [] as string[],
  });

  const visibleTabs = useMemo(
    () => TAB_ITEMS.filter((t) => canView("dasiyicilar", t.permChild)),
    [canView],
  );

  useEffect(() => {
    if (visibleTabs.length === 0) return;
    if (!visibleTabs.some((t) => t.label === activeTab)) {
      setActiveTab(visibleTabs[0].label);
    }
  }, [visibleTabs, activeTab]);

  const loadData = async () => {
    if (!carrierId) return;
    setLoading(true);
    try {
      const [custData, allQueries, carrierContacts, financeData, allOrders] = await Promise.all([
        fetchCarrierDetailAction(carrierId),
        fetchQueriesAction(),
        fetchContactPersonsAction({ entityType: "carrier", entityId: carrierId }),
        fetchFinanceTransactionsAction({ carrierId }),
        fetchOrdersAction(),
      ]);

      const mappedCarrier = mapCarrierFromApi(custData);
      setCarrier(mappedCarrier);
      setContactPersons(carrierContacts);
      setFinanceTransactions(financeData || []);

      const entity = {
        id: String(mappedCarrier.id),
        company: mappedCarrier.company || mappedCarrier.name || "",
        name: mappedCarrier.name || mappedCarrier.company || "",
      };

      const carrierQueries = allQueries.filter((q: any) =>
        queryMatchesCarrier(q, entity),
      );
      setQueries(carrierQueries);

      const carrierOrders = allOrders.filter((order: any) =>
        matchesCarrierEntity(order, entity),
      );
      setOrders(carrierOrders);
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

  const displayedContacts = useMemo(
    () => normalizeCarrierContacts(carrier?.contactPersons, contactPersons),
    [carrier?.contactPersons, contactPersons],
  );

  const primaryContactLabel = useMemo(
    () => getSelectedContactNames(carrier, displayedContacts),
    [carrier, displayedContacts],
  );

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

    const alinmisAzn = financeTransactions.reduce((sum, tx) => {
      const name = String(tx.name || "");
      if (!name.startsWith("Alınmış hesab")) return sum;
      return (
        sum +
        (parseMoney(tx.mesarifAzn) ||
          parseMoney(tx.edvliMesarifAzn) ||
          parseMoney(String(tx.amount ?? 0)) ||
          0)
      );
    }, 0);
    if (alinmisAzn > 0) {
      expenses = alinmisAzn;
      profit = sales - expenses;
    }

    return {
      count: orders.length,
      sales,
      expenses,
      profit,
    };
  }, [orders, financeTransactions]);

  // Dynamic Finance Info — daşıyıcı YALNIZ "Alınmış hesab" ilə borclanır
  const financeStats = useMemo(() => {
    const payments: any[] = [];
    let totalPaid = 0;
    let outstandingDebt = 0;

    financeTransactions.forEach((tx) => {
      const name = String(tx.name || "");
      const isAlinmis =
        name.startsWith("Alınmış hesab") ||
        (tx.category === "ORDER_BOOK" &&
          (parseMoney(tx.mesarifAzn) > 0 || parseMoney(tx.mesarifPrice) > 0) &&
          !(parseMoney(tx.tarifAzn) > 0 || parseMoney(tx.tarifPrice) > 0));

      // İrəli hesab / müştəri tarifi daşıyıcıya düşməsin
      if (name.startsWith("İrəli hesab") || !isAlinmis) {
        if (tx.type === "INCOME") {
          const paid = parseMoney(String(tx.amount ?? 0));
          if (paid > 0) {
            totalPaid += paid;
            payments.push({
              date: tx.date || tx.costDate || new Date().toISOString(),
              purpose: name || "Ödəniş",
              amount: paid,
              currency: tx.currency || "AZN",
              status: "Mədaxil",
              type: "INCOME",
            });
          }
        }
        return;
      }

      const azn =
        parseMoney(tx.mesarifAzn) ||
        parseMoney(tx.edvliMesarifAzn) ||
        parseMoney(String(tx.amount ?? 0));
      const orig =
        parseMoney(tx.mesarifPrice) ||
        parseMoney(tx.edvliMesarifPrice) ||
        azn;
      if (!(azn > 0) && !(orig > 0)) return;

      payments.push({
        date: tx.date || tx.costDate || new Date().toISOString(),
        purpose: name || "Alınmış hesab",
        amount: orig > 0 ? orig : azn,
        currency: tx.mesarifCurrency || tx.currency || "AZN",
        status: "Ödənilməyib",
        type: "EXPENSE",
      });
      outstandingDebt += azn > 0 ? azn : orig;
    });

    return {
      totalPaid,
      outstandingDebt,
      overpayment: 0,
      payments,
    };
  }, [financeTransactions]);

  const openEditModal = () => {
    if (!carrier) return;
    setEditForm({
      company: carrier.name || carrier.company || "",
      shortName: carrier.shortName || carrier.name || "",
      carrierType: carrier.carrierType || "Yeni daşıyıcı",
      activityType: carrier.activityType || "",
      voen: carrier.voen || "",
      contactInfo: carrier.phone || "",
      address: carrier.address || "",
      country: resolveCountryValue(carrier.country || "AZ"),
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
        phone: editForm.contactInfo.trim(),
        address: editForm.address.trim(),
        country: editForm.country.trim(),
        salesGroup: editForm.salesGroup.trim(),
        contactPersons: editForm.contactPersons,
        documents: serializeCarrierDocuments(carrier?.documents || []),
      };

      const updated = await updateCarrierAction(carrierId, payload);
      setCarrier(mapCarrierFromApi(updated));
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
  const handleCreateContactPerson = async (data: ContactPersonFormData) => {
    if (!carrier || !carrierId) return;
    try {
      const newContact = await createContactPersonAction({
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        position: data.position,
        company: data.company || carrier.company || "",
        entityType: "carrier",
        entityId: carrierId,
      });

      setContactPersons((prev) => [newContact, ...prev]);

      const updatedContactPersons = [...displayedContacts, newContact];

      await updateCarrierAction(carrierId, {
        contactPersons: updatedContactPersons,
      });

      setCarrier((prev: any) => ({
        ...prev,
        contactPersons: updatedContactPersons,
      }));

      setIsContactModalOpen(false);
      dispatch(
        showNotification({
          message: "Yeni daşıyıcı əlaqədar şəxs əlavə edildi",
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
        <div className={styles.companyName} title={carrier.company}>
          {carrier.company}
        </div>
        <div className={styles.tabs}>
          {visibleTabs.map((tab) => (
            <button
              key={tab.label}
              type="button"
              onClick={() => setActiveTab(tab.label)}
              className={`${styles.tabButton} ${activeTab === tab.label ? styles.activeTab : ""}`}
            >
              {tab.label}
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
      </div>

      <div className={styles.content}>
        {/* Left Side: General Carrier Details Panel */}
        <aside className={styles.sidePanel}>
          <div className={styles.sideSection}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1e293b", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px", marginBottom: "12px" }}>
              Ümumi daşıyıcı detalları
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ margin: 0, fontSize: "0.78rem", color: "#334155" }}>
                <span style={{ color: "#64748b", fontWeight: 600 }}>Şirkət adı:</span>
                <div style={{ marginTop: "2px", fontWeight: 700, color: "#0f172a" }}>{carrier.company}</div>
              </div>
              
              <div style={{ margin: 0, fontSize: "0.78rem", color: "#334155" }}>
                <span style={{ color: "#64748b", fontWeight: 600 }}>Daşıyıcı tipi:</span>
                <div style={{ marginTop: "2px", fontWeight: 500 }}>{displayFieldValue(carrier.carrierType)}</div>
              </div>

              <div style={{ margin: 0, fontSize: "0.78rem", color: "#334155" }}>
                <span style={{ color: "#64748b", fontWeight: 600 }}>Fəaliyyət növü:</span>
                <div style={{ marginTop: "2px", fontWeight: 500 }}>{displayFieldValue(carrier.activityType)}</div>
              </div>

              <div style={{ margin: 0, fontSize: "0.78rem", color: "#334155" }}>
                <span style={{ color: "#64748b", fontWeight: 600 }}>Əlaqədar şəxs:</span>
                <div style={{ marginTop: "2px", fontWeight: 500 }}>{primaryContactLabel}</div>
              </div>

              <div style={{ margin: 0, fontSize: "0.78rem", color: "#334155" }}>
                <span style={{ color: "#64748b", fontWeight: 600 }}>Telefon:</span>
                <div style={{ marginTop: "2px", fontWeight: 500 }}>{carrier.phone || "-"}</div>
              </div>
              
              <div style={{ margin: 0, fontSize: "0.78rem", color: "#334155" }}>
                <span style={{ color: "#64748b", fontWeight: 600 }}>Tax (VÖEN):</span>
                <div style={{ marginTop: "2px", fontWeight: 500 }}>{displayFieldValue(carrier.voen)}</div>
              </div>
              
              <div style={{ margin: 0, fontSize: "0.78rem", color: "#334155" }}>
                <span style={{ color: "#64748b", fontWeight: 600 }}>Ünvan:</span>
                <div style={{ marginTop: "2px", fontWeight: 500 }}>{carrier.address || "-"}</div>
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
                <div style={{ marginTop: "2px", fontWeight: 500 }}>{displayFieldValue(carrier.carrierType)}</div>
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
                  <h3 style={{ margin: 0, borderBottom: "none", fontSize: "0.76rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#475569" }}>Daşıyıcı əlaqədar şəxsləri</h3>
                  {canCreateContact ? (
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
                  ) : null}
                </div>
                
                <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "10px" }}>
                  {displayedContacts.length === 0 ? (
                    <p style={{ color: "#94a3b8", fontSize: "0.8rem", fontStyle: "italic", margin: 0 }}>
                      Heç bir daşıyıcı əlaqədar şəxs əlavə edilməyib.
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
                    <span>Şirkət adı:</span> {carrier.company}
                  </p>
                  <p>
                    <span>Fəaliyyət növü:</span> {displayFieldValue(carrier.activityType)}
                  </p>
                  <p>
                    <span>VÖEN:</span> {displayFieldValue(carrier.voen)}
                  </p>
                  <p>
                    <span>Hüquqi ünvan:</span> {carrier.address}
                  </p>
                  <p>
                    <span>Ölkə:</span> {carrier.country}
                  </p>
                  <p>
                    <span>Telefon:</span> {carrier.phone || "-"}
                  </p>
                  <p>
                    <span>Daşıyıcı tipi:</span> {displayFieldValue(carrier.carrierType)}
                  </p>
                </div>
              </div>

              <div className={styles.infoCard}>
                <h3>Sənədlər</h3>
                <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {(!carrier.documents || carrier.documents.length === 0) ? (
                    <p style={{ color: "#94a3b8", fontSize: "0.8rem", fontStyle: "italic", margin: 0 }}>
                      Heç bir sənəd əlavə edilməyib.
                    </p>
                  ) : (
                    carrier.documents.map((doc: any, idx: number) => (
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
                              {statusLabelAz(String(q.status || ""))}
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
                <h4>Satış</h4>
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
                    <Select
                      value={editForm.country}
                      options={getCountrySelectOptions(editForm.country)}
                      placeholder="-"
                      onChange={(value) =>
                        setEditForm((prev) => ({ ...prev, country: value }))
                      }
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
        initialValues={{ company: carrier?.company }}
      />
    </div>
  );
}
