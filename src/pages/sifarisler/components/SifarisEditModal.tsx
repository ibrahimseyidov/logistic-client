import React, { useState, useEffect } from "react";
import { FiX, FiCalendar, FiSearch, FiPlus } from "react-icons/fi";
import type { SifarisOrderRow } from "../types/sifaris.types";
import styles from "../../sorgular/components/SorgularNewModal.module.css";
import { fetchUsersAction } from "../../../common/actions/user.actions";
import { fetchContactPersonsAction } from "../../../common/actions/contact.actions";
import { fetchCustomersAction } from "../../../common/actions/customer.actions";
import { fetchLookupAction, createLookupAction } from "../../../common/actions/lookup.actions";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (updatedOrder: SifarisOrderRow) => void;
  order: SifarisOrderRow;
}

export default function SifarisEditModal({
  isOpen,
  onClose,
  onConfirm,
  order,
}: Props) {
  // Local form states matching the screenshot exactly
  const [orderNumber, setOrderNumber] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [customerOrderRef, setCustomerOrderRef] = useState("");
  const [tags, setTags] = useState("");

  // Nested Modals States for Edit Modal
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [isNewContactModalOpen, setIsNewContactModalOpen] = useState(false);
  const [isNewTagModalOpen, setIsNewTagModalOpen] = useState(false);

  // New Client Form States
  const [clientActiveTab, setClientActiveTab] = useState<"general" | "contact" | "finance">("general");
  const [clientNameFull, setClientNameFull] = useState("");
  const [clientNameAbbr, setClientNameAbbr] = useState("");
  const [clientType, setClientType] = useState("Yeni müştəri");
  const [clientActivity, setClientActivity] = useState("Dəyəri seçin");
  const [clientVoen, setClientVoen] = useState("");
  const [clientEdqn, setClientEdqn] = useState("");
  const [clientBin, setClientBin] = useState("");
  const [clientVoun, setClientVoun] = useState("");
  const [clientMtut, setClientMtut] = useState("");
  const [clientUak, setClientUak] = useState("");
  const [clientVatCode, setClientVatCode] = useState("");
  const [clientDate, setClientDate] = useState("27.05.2026");
  const [clientLang, setClientLang] = useState("Dəyəri seçin");
  const [clientManagers, setClientManagers] = useState<string[]>(["Ulvi Adilzade"]);
  const [clientPermitted, setClientPermitted] = useState(true);
  const [clientInfo, setClientInfo] = useState("");

  // New Contact Form States
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  // New Tag Form States
  const [newTagName, setNewTagName] = useState("");
  const [newTagActive, setNewTagActive] = useState(true);

  // Dynamic Options lists for Select inputs
  const [usersData, setUsersData] = useState<any[]>([]);
  const [contactsData, setContactsData] = useState<any[]>([]);
  const [customersData, setCustomersData] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      Promise.all([fetchUsersAction(), fetchContactPersonsAction(), fetchCustomersAction()])
        .then(([u, c, cust]) => {
          setUsersData(u);
          setContactsData(c);
          setCustomersData(cust);
        })
        .catch((e) => console.error(e));
    }
  }, [isOpen]);
  
  // Contacts column ("Əlaqələr")
  const [customer, setCustomer] = useState("");
  const [contractNumber, setContractNumber] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [manager, setManager] = useState("");
  const [expeditor, setExpeditor] = useState("");
  const [extraManagers, setExtraManagers] = useState<string[]>([]);
  const [company, setCompany] = useState("");
  const [extraInfo, setExtraInfo] = useState("");

  // Price sheet column ("Qiymət kağızı")
  const [serviceName, setServiceName] = useState("Başlanğıc tarif");
  const [freight, setFreight] = useState("");
  const [freightWithVat, setFreightWithVat] = useState("");
  const [vatRate, setVatRate] = useState("0%");
  const [currency, setCurrency] = useState("EUR");
  const [exchangeRateDate, setExchangeRateDate] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [paymentDelayDays, setPaymentDelayDays] = useState("0");
  const [incoterms, setIncoterms] = useState("");

  // Populate fields on open
  useEffect(() => {
    if (order && isOpen) {
      setOrderNumber(order.orderNumber || "");
      setOrderDate(order.orderDate || "");
      setCustomerOrderRef(order.customerOrderRef || "");
      setTags(order.tags || "");
      
      setCustomer(order.customer || "");
      setContractNumber(order.contractNumber || "13.01.2026 - ZFAZ02/26 - Müqavilə");
      setContactPerson(order.contactPerson || "Nijat Shabanly");
      setManager(order.manager || "Ulvi Adilzade");
      setExpeditor(order.expeditor || "Ulvi Adilzade");
      setExtraManagers(order.extraManagers ? order.extraManagers.split(", ").filter(Boolean) : ["Ulvi Adilzade"]);
      setCompany(order.company || "Ziyafreight");
      setExtraInfo(order.extraInfo || "");

      // Pricing
      setServiceName(order.serviceName || "Başlanğıc tarif");
      setFreight(order.freight?.replace(/[^\d.]/g, "") || "190");
      setFreightWithVat(order.freightWithVat || "190");
      setVatRate(order.vatRate || "0%");
      setCurrency(order.currency || "EUR");
      setExchangeRateDate(order.exchangeRateDate || "26.05.2026");
      setPaymentTerms(order.paymentTerms || "B/k 30 təqvim günü.");
      setPaymentDelayDays(order.paymentDelayDays || "0");
      setIncoterms(order.incoterms || "EXW");
    }
  }, [order, isOpen]);

  // Handler for saving
  const handleSave = () => {
    const formattedFreight = `${freight} ${currency}`;
    const updated: SifarisOrderRow = {
      ...order,
      orderNumber,
      orderDate,
      customerOrderRef,
      tags,
      customer,
      contractNumber,
      contactPerson,
      manager,
      expeditor,
      extraManagers: extraManagers.join(", "),
      company,
      extraInfo,
      serviceName,
      freight: formattedFreight,
      freightWithVat,
      vatRate,
      currency,
      exchangeRateDate,
      paymentTerms,
      paymentDelayDays,
      incoterms,
    };
    onConfirm(updated);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Backdrop */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(4px)",
        }}
        onClick={onClose}
      />

      {/* Main Container Card */}
      <div
        style={{
          position: "relative",
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "1.25rem",
          width: "min(100%, 1024px)",
          height: "90vh",
          boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.15)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.25rem 2rem",
            background: "#ffffff",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "#1e293b" }}>
            Sifarişi dəyiş
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: 0,
              cursor: "pointer",
              fontSize: "1.5rem",
              color: "#94a3b8",
              display: "flex",
              alignItems: "center",
              padding: "0.25rem",
              transition: "color 0.2s ease",
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = "#0f172a")}
            onMouseOut={(e) => (e.currentTarget.style.color = "#94a3b8")}
          >
            <FiX />
          </button>
        </div>

        {/* Tabs Bar */}
        <div
          style={{
            padding: "0 2rem",
            background: "#ffffff",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            gap: "2rem",
          }}
        >
          <button
            type="button"
            style={{
              background: "transparent",
              border: 0,
              borderBottom: "2px solid #3b82f6",
              color: "#3b82f6",
              padding: "1rem 0",
              fontWeight: 600,
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            Əsas məlumatlar
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "2rem",
            background: "#ffffff",
          }}
        >
          {/* Top Row: Basic Info Fields */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "1rem",
              marginBottom: "2rem",
            }}
          >
            {/* Sifarişin nömrəsi */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8" }}>
                Sifarişin nömrəsi
              </label>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: "0.5rem",
                  padding: "0.625rem 0.85rem",
                  fontSize: "0.875rem",
                  color: "#1e293b",
                  outline: "none",
                  fontWeight: 500,
                }}
              />
            </div>

            {/* Sifarişin tarixi */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8" }}>
                Sifarişin tarixi <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  style={{
                    border: "1px solid #cbd5e1",
                    borderRadius: "0.5rem",
                    padding: "0.625rem 2.5rem 0.625rem 0.85rem",
                    fontSize: "0.875rem",
                    color: "#1e293b",
                    outline: "none",
                    width: "100%",
                    boxSizing: "border-box",
                    fontWeight: 500,
                  }}
                />
                <FiCalendar
                  style={{
                    position: "absolute",
                    right: "0.85rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                    pointerEvents: "none",
                  }}
                />
              </div>
            </div>

            {/* Müştəridə olan sifarişin nömrəsi */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8" }}>
                Müştəridə olan sifarişin nömrəsi
              </label>
              <input
                type="text"
                value={customerOrderRef}
                onChange={(e) => setCustomerOrderRef(e.target.value)}
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: "0.5rem",
                  padding: "0.625rem 0.85rem",
                  fontSize: "0.875rem",
                  color: "#1e293b",
                  outline: "none",
                  fontWeight: 500,
                }}
              />
            </div>

            {/* Teqlər */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8" }}>Teqlər</label>
                <button
                  type="button"
                  onClick={() => {
                    setNewTagName("");
                    setIsNewTagModalOpen(true);
                  }}
                  style={{
                    border: "1px solid #cbd5e1",
                    background: "#f8fafc",
                    color: "#64748b",
                    borderRadius: "0.25rem",
                    padding: "1px 4px",
                    cursor: "pointer",
                    fontSize: "0.7rem",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <FiPlus />
                </button>
              </div>
              <input
                type="text"
                value={tags}
                placeholder="Dəyəri seçin"
                onChange={(e) => setTags(e.target.value)}
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: "0.5rem",
                  padding: "0.625rem 0.85rem",
                  fontSize: "0.875rem",
                  color: "#1e293b",
                  outline: "none",
                  fontWeight: 500,
                }}
              />
            </div>
          </div>

          {/* Two-Column Form Area */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.5rem" }}>
            {/* Column 1: Əlaqələr */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "1rem" }}>
                <h4 style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                  Əlaqələr
                </h4>
                <div
                  style={{
                    width: "14px",
                    height: "14px",
                    borderRadius: "50%",
                    background: "#e2e8f0",
                    color: "#64748b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "9px",
                    fontWeight: "bold",
                    cursor: "help",
                  }}
                  title="Sorğular və əlaqədar məlumatlar"
                >
                  ?
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Müştəri */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8" }}>
                      Müştəri <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setClientNameFull("");
                        setClientNameAbbr("");
                        setClientVoen("");
                        setClientEdqn("");
                        setClientBin("");
                        setClientInfo("");
                        setIsNewClientModalOpen(true);
                      }}
                      style={{
                        border: "1px solid #cbd5e1",
                        background: "#f8fafc",
                        color: "#64748b",
                        borderRadius: "0.25rem",
                        padding: "1px 4px",
                        cursor: "pointer",
                        fontSize: "0.7rem",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <FiPlus />
                    </button>
                  </div>
                  <select
                    value={customer}
                    onChange={(e) => setCustomer(e.target.value)}
                    style={{
                      border: "1px solid #cbd5e1",
                      borderRadius: "0.5rem",
                      padding: "0.625rem 0.85rem",
                      fontSize: "0.875rem",
                      color: "#1e293b",
                      outline: "none",
                      background: "#ffffff",
                      cursor: "pointer",
                    }}
                  >
                    <option value="">Dəyəri seçin</option>
                    {customersData.map((opt) => (
                      <option key={opt.id} value={opt.id?.toString()}>
                        {opt.name || opt.companyName || opt.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Müqavilənin nömrəsi */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8" }}>
                    Müştəri ilə müqavilənin nömrəsi
                  </label>
                  <div style={{ position: "relative", display: "flex" }}>
                    <input
                      value={contractNumber}
                      onChange={(e) => setContractNumber(e.target.value)}
                      style={{
                        border: "1px solid #cbd5e1",
                        borderRadius: "0.5rem",
                        padding: "0.625rem 0.85rem",
                        fontSize: "0.875rem",
                        color: "#1e293b",
                        outline: "none",
                        width: "100%",
                        background: "#ffffff",
                      }}
                    />
                  </div>
                </div>

                {/* Əlaqədar şəxs */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8" }}>Əlaqədar şəxs</label>
                    <button
                      type="button"
                      onClick={() => {
                        setContactName("");
                        setContactPhone("");
                        setContactEmail("");
                        setIsNewContactModalOpen(true);
                      }}
                      style={{
                        border: "1px solid #cbd5e1",
                        background: "#f8fafc",
                        color: "#64748b",
                        borderRadius: "0.25rem",
                        padding: "1px 4px",
                        cursor: "pointer",
                        fontSize: "0.7rem",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <FiPlus />
                    </button>
                  </div>
                  <select
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    style={{
                      border: "1px solid #cbd5e1",
                      borderRadius: "0.5rem",
                      padding: "0.625rem 0.85rem",
                      fontSize: "0.875rem",
                      color: "#1e293b",
                      outline: "none",
                      background: "#ffffff",
                      cursor: "pointer",
                    }}
                  >
                    <option value="">Dəyəri seçin</option>
                    {contactsData.map((c: any) => (
                      <option key={c.id} value={c.id?.toString()}>{c.fullName}</option>
                    ))}
                  </select>
                </div>

                {/* Menecer */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8" }}>Menecer</label>
                  <select
                    value={manager}
                    onChange={(e) => setManager(e.target.value)}
                    style={{
                      border: "1px solid #cbd5e1",
                      borderRadius: "0.5rem",
                      padding: "0.625rem 0.85rem",
                      fontSize: "0.875rem",
                      color: "#1e293b",
                      outline: "none",
                      background: "#ffffff",
                      cursor: "pointer",
                    }}
                  >
                    <option value="">Dəyəri seçin</option>
                    {usersData.map((u: any) => (
                      <option key={u.id} value={u.id?.toString()}>{u.name}</option>
                    ))}
                  </select>
                </div>

                {/* Ekspeditor */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8" }}>Ekspeditor</label>
                  <select
                    value={expeditor}
                    onChange={(e) => setExpeditor(e.target.value)}
                    style={{
                      border: "1px solid #cbd5e1",
                      borderRadius: "0.5rem",
                      padding: "0.625rem 0.85rem",
                      fontSize: "0.875rem",
                      color: "#1e293b",
                      outline: "none",
                      background: "#ffffff",
                      cursor: "pointer",
                    }}
                  >
                    <option value="">Dəyəri seçin</option>
                    {usersData.map((u: any) => (
                      <option key={u.id} value={u.id?.toString()}>{u.name}</option>
                    ))}
                  </select>
                </div>

                {/* Əlavə menecerlər */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8" }}>Əlavə menecerlər</label>
                  <div
                    style={{
                      border: "1px solid #cbd5e1",
                      borderRadius: "0.5rem",
                      padding: "0.45rem 0.65rem",
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "0.375rem",
                      minHeight: "38px",
                      boxSizing: "border-box",
                      alignItems: "center",
                    }}
                  >
                    {extraManagers.map((m, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: "#e2e8f0",
                          borderRadius: "0.25rem",
                          padding: "2px 6px",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.375rem",
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          color: "#334155",
                        }}
                      >
                        <span
                          style={{ cursor: "pointer", fontWeight: 700 }}
                          onClick={() => setExtraManagers(extraManagers.filter((_, i) => i !== idx))}
                        >
                          ×
                        </span>
                        {m}
                      </div>
                    ))}
                    <input
                      type="text"
                      placeholder={extraManagers.length === 0 ? "Menecer əlavə edin" : ""}
                      style={{
                        border: 0,
                        outline: "none",
                        fontSize: "0.85rem",
                        flex: 1,
                        minWidth: "60px",
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.currentTarget.value.trim()) {
                          setExtraManagers([...extraManagers, e.currentTarget.value.trim()]);
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Şirkət */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8" }}>
                    Şirkət <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <select
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    style={{
                      border: "1px solid #cbd5e1",
                      borderRadius: "0.5rem",
                      padding: "0.625rem 0.85rem",
                      fontSize: "0.875rem",
                      color: "#1e293b",
                      outline: "none",
                      background: "#ffffff",
                      cursor: "pointer",
                    }}
                  >
                    <option value="Ziyafreight">Ziyafreight</option>
                    <option value="Logistra LLC">Logistra LLC</option>
                  </select>
                </div>

                {/* Əlavə məlumat */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8" }}>Əlavə məlumat</label>
                  <input
                    type="text"
                    value={extraInfo}
                    placeholder="Əlavə qeydlər"
                    onChange={(e) => setExtraInfo(e.target.value)}
                    style={{
                      border: "1px solid #cbd5e1",
                      borderRadius: "0.5rem",
                      padding: "0.625rem 0.85rem",
                      fontSize: "0.875rem",
                      color: "#1e293b",
                      outline: "none",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Column 2: Qiymət kağızı */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "1rem" }}>
                <h4 style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                  Qiymət kağızı
                </h4>
                <div
                  style={{
                    width: "14px",
                    height: "14px",
                    borderRadius: "50%",
                    background: "#e2e8f0",
                    color: "#64748b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "9px",
                    fontWeight: "bold",
                    cursor: "help",
                  }}
                  title="Maliyyə və hesab tarifləri"
                >
                  ?
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Xidmətin adı */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8" }}>Xidmətin adı</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      value={serviceName}
                      onChange={(e) => setServiceName(e.target.value)}
                      style={{
                        border: "1px solid #cbd5e1",
                        borderRadius: "0.5rem",
                        padding: "0.625rem 2.5rem 0.625rem 0.85rem",
                        fontSize: "0.875rem",
                        color: "#1e293b",
                        outline: "none",
                        width: "100%",
                        boxSizing: "border-box",
                      }}
                    />
                    <FiSearch
                      style={{
                        position: "absolute",
                        right: "0.85rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#94a3b8",
                        pointerEvents: "none",
                      }}
                    />
                  </div>
                </div>

                {/* Başlanğıc tarif */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8" }}>Başlanğıc tarif</label>
                  <input
                    type="number"
                    value={freight}
                    onChange={(e) => {
                      setFreight(e.target.value);
                      setFreightWithVat(e.target.value); // Sync if 0% VAT
                    }}
                    style={{
                      border: "1px solid #cbd5e1",
                      borderRadius: "0.5rem",
                      padding: "0.625rem 0.85rem",
                      fontSize: "0.875rem",
                      color: "#1e293b",
                      outline: "none",
                    }}
                  />
                </div>

                {/* ƏDV ilə başlanğıc tarif */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8" }}>ƏDV ilə başlanğıc tarif</label>
                  <input
                    type="number"
                    value={freightWithVat}
                    onChange={(e) => setFreightWithVat(e.target.value)}
                    style={{
                      border: "1px solid #cbd5e1",
                      borderRadius: "0.5rem",
                      padding: "0.625rem 0.85rem",
                      fontSize: "0.875rem",
                      color: "#1e293b",
                      outline: "none",
                    }}
                  />
                </div>

                {/* ƏDV-nin tarifi */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8" }}>ƏDV-nin tarifi</label>
                  <select
                    value={vatRate}
                    onChange={(e) => setVatRate(e.target.value)}
                    style={{
                      border: "1px solid #cbd5e1",
                      borderRadius: "0.5rem",
                      padding: "0.625rem 0.85rem",
                      fontSize: "0.875rem",
                      color: "#1e293b",
                      outline: "none",
                      background: "#ffffff",
                      cursor: "pointer",
                    }}
                  >
                    <option value="0%">0%</option>
                    <option value="18%">18%</option>
                  </select>
                </div>

                {/* Valyuta */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8" }}>
                    Valyuta <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    style={{
                      border: "1px solid #cbd5e1",
                      borderRadius: "0.5rem",
                      padding: "0.625rem 0.85rem",
                      fontSize: "0.875rem",
                      color: "#1e293b",
                      outline: "none",
                      background: "#ffffff",
                      cursor: "pointer",
                    }}
                  >
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="AZN">AZN</option>
                  </select>
                </div>

                {/* Məzənnənin tarixi */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8" }}>Məzənnənin tarixi</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      value={exchangeRateDate}
                      onChange={(e) => setExchangeRateDate(e.target.value)}
                      style={{
                        border: "1px solid #cbd5e1",
                        borderRadius: "0.5rem",
                        padding: "0.625rem 2.5rem 0.625rem 0.85rem",
                        fontSize: "0.875rem",
                        color: "#1e293b",
                        outline: "none",
                        width: "100%",
                        boxSizing: "border-box",
                      }}
                    />
                    <FiCalendar
                      style={{
                        position: "absolute",
                        right: "0.85rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#94a3b8",
                        pointerEvents: "none",
                      }}
                    />
                  </div>
                </div>

                {/* Ödənişlərin təxirə salınması şərtləri */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8" }}>
                    Ödənişlərin təxirə salınması şərtləri
                  </label>
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    style={{
                      border: "1px solid #cbd5e1",
                      borderRadius: "0.5rem",
                      padding: "0.625rem 0.85rem",
                      fontSize: "0.875rem",
                      color: "#1e293b",
                      outline: "none",
                      background: "#ffffff",
                      cursor: "pointer",
                    }}
                  >
                    <option value="B/k 30 təqvim günü.">B/k 30 təqvim günü.</option>
                    <option value="Nağd ödəniş">Nağd ödəniş</option>
                  </select>
                </div>

                {/* Ödənişlərin təxirə salınması (günlər) */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8" }}>
                    Ödənişlərin təxirə salınması (günlər)
                  </label>
                  <input
                    type="text"
                    value={paymentDelayDays}
                    onChange={(e) => setPaymentDelayDays(e.target.value)}
                    style={{
                      border: "1px solid #cbd5e1",
                      borderRadius: "0.5rem",
                      padding: "0.625rem 0.85rem",
                      fontSize: "0.875rem",
                      color: "#1e293b",
                      outline: "none",
                    }}
                  />
                </div>

                {/* Incoterms */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8" }}>Incoterms</label>
                  <select
                    value={incoterms}
                    onChange={(e) => setIncoterms(e.target.value)}
                    style={{
                      border: "1px solid #cbd5e1",
                      borderRadius: "0.5rem",
                      padding: "0.625rem 0.85rem",
                      fontSize: "0.875rem",
                      color: "#1e293b",
                      outline: "none",
                      background: "#ffffff",
                      cursor: "pointer",
                    }}
                  >
                    <option value="EXW">EXW</option>
                    <option value="FOB">FOB</option>
                    <option value="CIF">CIF</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "1rem 2rem",
            background: "#f8fafc",
            borderTop: "1px solid #f1f5f9",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: "0.5rem",
              padding: "0.625rem 1.25rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "#64748b",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "#f1f5f9";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "#ffffff";
            }}
          >
            Ləğv et
          </button>
          <button
            type="button"
            onClick={handleSave}
            style={{
              background: "#22c55e",
              border: "1px solid #22c55e",
              borderRadius: "0.5rem",
              padding: "0.625rem 1.5rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "#ffffff",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "#16a34a";
              e.currentTarget.style.borderColor = "#16a34a";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "#22c55e";
              e.currentTarget.style.borderColor = "#22c55e";
            }}
          >
            Yaddaşda saxlamaq
          </button>
        </div>

        {/* Yeni müştəri Modal Overlay (Screenshot 1) */}
        {isNewClientModalOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 10000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(15, 23, 42, 0.4)",
                backdropFilter: "blur(4px)",
              }}
              onClick={() => setIsNewClientModalOpen(false)}
            />
            <div
              style={{
                position: "relative",
                background: "#f4f6f8",
                border: "1px solid #cbd5e1",
                borderRadius: "0.75rem",
                width: "min(100%, 75rem)",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                maxHeight: "95vh",
                zIndex: 10001
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: "1.25rem 2rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #cbd5e1",
                  background: "#ffffff"
                }}
              >
                <div>
                  <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1e293b" }}>Yeni müştəri</span>
                  <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                    <span
                      onClick={() => setClientActiveTab("general")}
                      style={{ fontSize: "0.85rem", fontWeight: 600, color: clientActiveTab === "general" ? "#3b82f6" : "#64748b", borderBottom: clientActiveTab === "general" ? "2px solid #3b82f6" : "none", paddingBottom: "0.25rem", cursor: "pointer" }}
                    >
                      Əsas məlumatlar
                    </span>
                    <span
                      onClick={() => setClientActiveTab("contact")}
                      style={{ fontSize: "0.85rem", fontWeight: 600, color: clientActiveTab === "contact" ? "#3b82f6" : "#64748b", borderBottom: clientActiveTab === "contact" ? "2px solid #3b82f6" : "none", paddingBottom: "0.25rem", cursor: "pointer" }}
                    >
                      Əlaqə məlumatları
                    </span>
                    <span
                      onClick={() => setClientActiveTab("finance")}
                      style={{ fontSize: "0.85rem", fontWeight: 600, color: clientActiveTab === "finance" ? "#3b82f6" : "#64748b", borderBottom: clientActiveTab === "finance" ? "2px solid #3b82f6" : "none", paddingBottom: "0.25rem", cursor: "pointer" }}
                    >
                      Maliyyələr
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNewClientModalOpen(false)}
                  style={{ background: "transparent", border: 0, cursor: "pointer", fontSize: "1.5rem", color: "#0f172a" }}
                >
                  <FiX />
                </button>
              </div>

              {/* Body */}
              <div style={{ padding: "2rem", overflowY: "auto", flex: 1 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "2.5rem" }}>
                  
                  {/* Left Column: Şirkətin rekvizitləri */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#475569" }}>Şirkətin rekvizitləri</span>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", gridColumn: "span 2" }}>
                        <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>Name (full)</label>
                        <input
                          type="text"
                          placeholder="Limited liability company"
                          value={clientNameFull}
                          onChange={(e) => setClientNameFull(e.target.value)}
                          style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem 0.75rem", fontSize: "0.85rem", outline: "none", backgroundColor: "#ffffff" }}
                        />
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                        <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>Name (abbreviated) *</label>
                        <input
                          type="text"
                          placeholder="LLC Company Name"
                          value={clientNameAbbr}
                          onChange={(e) => setClientNameAbbr(e.target.value)}
                          style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem 0.75rem", fontSize: "0.85rem", outline: "none", backgroundColor: "#ffffff" }}
                        />
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                        <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>Fəaliyyət növü</label>
                        <select
                          value={clientActivity}
                          onChange={(e) => setClientActivity(e.target.value)}
                          style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem 0.75rem", fontSize: "0.85rem", outline: "none", backgroundColor: "#ffffff" }}
                        >
                          <option value="Dəyəri seçin">Dəyəri seçin</option>
                          <option value="Logistika">Logistika</option>
                        </select>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                        <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>Müştəri tipi</label>
                        <select
                          value={clientType}
                          onChange={(e) => setClientType(e.target.value)}
                          style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem 0.75rem", fontSize: "0.85rem", outline: "none", backgroundColor: "#ffffff" }}
                        >
                          <option value="Yeni müştəri">Yeni müştəri</option>
                        </select>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                        <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>VÖUN/UMTVDR/VATNº</label>
                        <input
                          type="text"
                          value={clientVoun}
                          onChange={(e) => setClientVoun(e.target.value)}
                          style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem 0.75rem", fontSize: "0.85rem", outline: "none", backgroundColor: "#ffffff" }}
                        />
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                        <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>VÖEN</label>
                        <input
                          type="text"
                          value={clientVoen}
                          onChange={(e) => setClientVoen(e.target.value)}
                          style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem 0.75rem", fontSize: "0.85rem", outline: "none", backgroundColor: "#ffffff" }}
                        />
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                        <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>MTÜT</label>
                        <input
                          type="text"
                          value={clientMtut}
                          onChange={(e) => setClientMtut(e.target.value)}
                          style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem 0.75rem", fontSize: "0.85rem", outline: "none", backgroundColor: "#ffffff" }}
                        />
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                        <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>ƏDQN</label>
                        <input
                          type="text"
                          value={clientEdqn}
                          onChange={(e) => setClientEdqn(e.target.value)}
                          style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem 0.75rem", fontSize: "0.85rem", outline: "none", backgroundColor: "#ffffff" }}
                        />
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                        <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>UAK</label>
                        <input
                          type="text"
                          value={clientUak}
                          onChange={(e) => setClientUak(e.target.value)}
                          style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem 0.75rem", fontSize: "0.85rem", outline: "none", backgroundColor: "#ffffff" }}
                        />
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                        <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>BİN</label>
                        <input
                          type="text"
                          value={clientBin}
                          onChange={(e) => setClientBin(e.target.value)}
                          style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem 0.75rem", fontSize: "0.85rem", outline: "none", backgroundColor: "#ffffff" }}
                        />
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                        <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>Ödəyicinin ƏDV kodu</label>
                        <input
                          type="text"
                          value={clientVatCode}
                          onChange={(e) => setClientVatCode(e.target.value)}
                          style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem 0.75rem", fontSize: "0.85rem", outline: "none", backgroundColor: "#ffffff" }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Client settings */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#475569" }}>Client settings</span>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                        <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>Yaradılması tarixi</label>
                        <div style={{ position: "relative" }}>
                          <input
                            type="text"
                            value={clientDate}
                            onChange={(e) => setClientDate(e.target.value)}
                            style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem 2.25rem 0.5rem 0.75rem", fontSize: "0.85rem", outline: "none", backgroundColor: "#ffffff", boxSizing: "border-box" }}
                          />
                          <FiCalendar style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                        </div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                        <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>Language of notifications</label>
                        <select
                          value={clientLang}
                          onChange={(e) => setClientLang(e.target.value)}
                          style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem 0.75rem", fontSize: "0.85rem", outline: "none", backgroundColor: "#ffffff" }}
                        >
                          <option value="Dəyəri seçin">Dəyəri seçin</option>
                          <option value="Azerbaijani">Azerbaijani</option>
                          <option value="English">English</option>
                        </select>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", gridColumn: "span 2" }}>
                        <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>Menecerlər</label>
                        <div style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.65rem", display: "flex", flexWrap: "wrap", gap: "0.375rem", backgroundColor: "#ffffff" }}>
                          {clientManagers.map((m, idx) => (
                            <span key={idx} style={{ background: "#e2e8f0", padding: "2px 6px", borderRadius: "0.25rem", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                              {m}
                              <button type="button" onClick={() => setClientManagers(clientManagers.filter((_, i) => i !== idx))} style={{ border: 0, background: "transparent", cursor: "pointer", fontSize: "0.75rem" }}>×</button>
                            </span>
                          ))}
                        </div>
                      </div>

                      <div style={{ gridColumn: "span 2", display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                        <input
                          type="checkbox"
                          checked={clientPermitted}
                          onChange={(e) => setClientPermitted(e.target.checked)}
                          style={{ width: "1.1rem", height: "1.1rem", accentColor: "#16a34a" }}
                        />
                        <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "#334155" }}>İşə icazə verilmişdir</label>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", gridColumn: "span 2" }}>
                        <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>Əlavə məlumat</label>
                        <textarea
                          value={clientInfo}
                          onChange={(e) => setClientInfo(e.target.value)}
                          rows={4}
                          style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem 0.75rem", fontSize: "0.85rem", outline: "none", backgroundColor: "#ffffff", resize: "vertical" }}
                        />
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Footer */}
              <div style={{ padding: "1.25rem 2rem", display: "flex", justifyContent: "flex-end", borderTop: "1px solid #cbd5e1", background: "#ffffff" }}>
                <button
                  type="button"
                  onClick={() => {
                    const finalName = clientNameAbbr.trim() || "Yeni Müştəri";
                    if (!customerOptions.includes(finalName)) {
                      setCustomerOptions([...customerOptions, finalName]);
                    }
                    setCustomer(finalName);
                    setIsNewClientModalOpen(false);
                  }}
                  style={{
                    background: "#22c55e",
                    color: "#ffffff",
                    border: 0,
                    borderRadius: "0.375rem",
                    padding: "0.625rem 2rem",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    cursor: "pointer"
                  }}
                >
                  Yaddaşda saxlamaq
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Yeni əlaqədar şəxs Modal Overlay (Screenshot 2) */}
        {isNewContactModalOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 10000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(15, 23, 42, 0.4)",
                backdropFilter: "blur(4px)",
              }}
              onClick={() => setIsNewContactModalOpen(false)}
            />
            <div
              style={{
                position: "relative",
                background: "#f8fafc",
                border: "1px solid #cbd5e1",
                borderRadius: "0.5rem",
                width: "min(100%, 35rem)",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                display: "flex",
                flexDirection: "column",
                padding: "2rem",
                gap: "1.5rem",
                zIndex: 10001
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#475569" }}>Yeni əlaqədar şəxs</span>
                <button
                  type="button"
                  onClick={() => setIsNewContactModalOpen(false)}
                  style={{ background: "transparent", border: 0, cursor: "pointer", fontSize: "1.5rem", color: "#0f172a" }}
                >
                  <FiX />
                </button>
              </div>

              {/* Inputs */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>Tam adı <span style={{ color: "#ef4444" }}>*</span></label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem 0.75rem", fontSize: "0.85rem", outline: "none", backgroundColor: "#ffffff" }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>Telefon nömrələri</label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem 0.75rem", fontSize: "0.85rem", outline: "none", backgroundColor: "#ffffff" }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>El.poçtu</label>
                  <input
                    type="text"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem 0.75rem", fontSize: "0.85rem", outline: "none", backgroundColor: "#ffffff" }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => {
                    if (!contactName.trim()) {
                      alert("Lütfən tam adı daxil edin!");
                      return;
                    }
                    const formatted = `${contactName.trim()}${contactPhone.trim() ? ` (${contactPhone.trim()})` : ""}`;
                    if (!contactPersonOptions.includes(formatted)) {
                      setContactPersonOptions([...contactPersonOptions, formatted]);
                    }
                    setContactPerson(formatted);
                    setIsNewContactModalOpen(false);
                  }}
                  style={{
                    background: "#22c55e",
                    color: "#ffffff",
                    border: 0,
                    borderRadius: "0.375rem",
                    padding: "0.625rem 2rem",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    cursor: "pointer"
                  }}
                >
                  Yaddaşda saxlamaq
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Əlavə et (Teq) Modal Overlay (Screenshot 3) */}
        {isNewTagModalOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 10000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(15, 23, 42, 0.4)",
                backdropFilter: "blur(4px)",
              }}
              onClick={() => setIsNewTagModalOpen(false)}
            />
            <div
              style={{
                position: "relative",
                background: "#f8fafc",
                border: "1px solid #cbd5e1",
                borderRadius: "0.5rem",
                width: "min(100%, 35rem)",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                display: "flex",
                flexDirection: "column",
                padding: "2rem",
                gap: "1.5rem",
                zIndex: 10001
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#475569" }}>Əlavə et</span>
                <button
                  type="button"
                  onClick={() => setIsNewTagModalOpen(false)}
                  style={{ background: "transparent", border: 0, cursor: "pointer", fontSize: "1.5rem", color: "#0f172a" }}
                >
                  <FiX />
                </button>
              </div>

              {/* Inputs */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>Teq <span style={{ color: "#ef4444" }}>*</span></label>
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem 0.75rem", fontSize: "0.85rem", outline: "none", backgroundColor: "#ffffff" }}
                  />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <input
                    type="checkbox"
                    checked={newTagActive}
                    onChange={(e) => setNewTagActive(e.target.checked)}
                    style={{ width: "1.1rem", height: "1.1rem", accentColor: "#16a34a" }}
                  />
                  <label style={{ fontSize: "0.85rem", color: "#475569" }}>Aktivdir</label>
                </div>
              </div>

              {/* Footer */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => {
                    if (!newTagName.trim()) {
                      alert("Lütfən teqi daxil edin!");
                      return;
                    }
                    const cleaned = newTagName.trim();
                    const updatedTags = tags ? `${tags}, ${cleaned}` : cleaned;
                    setTags(updatedTags);
                    setIsNewTagModalOpen(false);
                  }}
                  style={{
                    background: "#22c55e",
                    color: "#ffffff",
                    border: 0,
                    borderRadius: "0.375rem",
                    padding: "0.625rem 2rem",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    cursor: "pointer"
                  }}
                >
                  Yaddaşda saxlamaq
                </button>
              </div>
            </div>
          </div>
        )}
      
      {/* Footer */}
      </div>
    </div>
  );
}
