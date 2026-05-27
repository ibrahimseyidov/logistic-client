import React, { useState, useEffect } from "react";
import { FiX, FiCalendar, FiClock, FiMapPin, FiPlus, FiMinus } from "react-icons/fi";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: any) => void;
  editVoyage?: any;
}

// Reusable label component with inline [+] trigger
function LabelWithPlus({ label, onPlusClick }: { label: string; onPlusClick?: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: "0.25rem" }}>
      <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>{label}</span>
      {onPlusClick && (
        <button
          type="button"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "14px",
            height: "14px",
            border: "1px solid #cbd5e1",
            borderRadius: "3px",
            background: "#ffffff",
            color: "#64748b",
            fontSize: "0.75rem",
            cursor: "pointer",
            outline: "none",
            padding: 0,
            lineHeight: 1,
            fontWeight: "bold",
          }}
          title={`${label} daxil et`}
          onClick={(e) => {
            e.stopPropagation();
            onPlusClick();
          }}
        >
          +
        </button>
      )}
    </div>
  );
}

// Reusable elegant square [+] trigger for adding sections when empty
function SquarePlusTrigger({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        background: "transparent",
        border: 0,
        color: "#1e293b",
        fontSize: "0.85rem",
        fontWeight: 700,
        cursor: "pointer",
        padding: "0.25rem 0",
      }}
    >
      <div
        style={{
          width: "16px",
          height: "16px",
          borderRadius: "4px",
          background: "#3b82f6",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.8rem",
          fontWeight: "bold",
        }}
      >
        +
      </div>
      {label}
    </button>
  );
}

export default function ReysEditModal({ isOpen, onClose, onConfirm, editVoyage }: Props) {
  const [activeTab, setActiveTab] = useState<"general" | "routes">("general");

  // Tab 1: General States
  const [expeditor, setExpeditor] = useState("Ulvi Adilzade");
  const [carrierCompany, setCarrierCompany] = useState("Makeasy");
  const [contactPerson, setContactPerson] = useState("Dəyəri seçin");
  const [carrierContract, setCarrierContract] = useState("Dəyəri seçin");

  const [voyageNumber, setVoyageNumber] = useState("ZF26094-1");
  const [tags, setTags] = useState("Dəyəri seçin");
  const [price, setPrice] = useState("1205");
  const [currency, setCurrency] = useState("USD");
  const [exchangeDate, setExchangeDate] = useState("25.05.2026");
  const [priceWithVat, setPriceWithVat] = useState("1205");
  const [vatRate, setVatRate] = useState("0%");
  const [paymentTerms, setPaymentTerms] = useState("Dəyəri seçin");
  const [paymentDelay, setPaymentDelay] = useState("");

  const [vehicleNumber, setVehicleNumber] = useState("");
  const [trailerNumber, setTrailerNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("Dəyəri seçin");
  const [loadingMethod, setLoadingMethod] = useState("Dəyəri seçin");

  const [driverName, setDriverName] = useState("");
  const [driverSurname, setDriverSurname] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [driverPassport, setDriverPassport] = useState("");

  // Tab 2: Collapsible Places States
  const [isLpOpen, setIsLpOpen] = useState(false);
  const [isUpOpen, setIsUpOpen] = useState(false);
  const [isRpOpen, setIsRpOpen] = useState(false);

  const [lpStartDate, setLpStartDate] = useState("");
  const [lpEndDate, setLpEndDate] = useState("");
  const [lpCompany, setLpCompany] = useState("");
  const [lpCity, setLpCity] = useState("");
  const [lpAddress, setLpAddress] = useState("");
  const [lpCountry, setLpCountry] = useState("Dəyəri seçin");
  const [lpSender, setLpSender] = useState("Dəyəri seçin");

  const [upStartDate, setUpStartDate] = useState("");
  const [upEndDate, setUpEndDate] = useState("");
  const [upCompany, setUpCompany] = useState("");
  const [upCity, setUpCity] = useState("");
  const [upAddress, setUpAddress] = useState("");
  const [upCountry, setUpCountry] = useState("Dəyəri seçin");
  const [upReceiver, setUpReceiver] = useState("Dəyəri seçin");

  // Option lists states so we can dynamically add values
  const [carrierOptions, setCarrierOptions] = useState<string[]>(["Makeasy", "Baku Express"]);
  const [contactOptions, setContactOptions] = useState<string[]>(["Dəyəri seçin", "Gavin"]);
  const [tagOptions, setTagOptions] = useState<string[]>(["Dəyəri seçin", "Dental"]);
  const [vehicleTypeOptions, setVehicleTypeOptions] = useState<string[]>(["Dəyəri seçin", "Volvo FH16"]);
  const [loadingMethodOptions, setLoadingMethodOptions] = useState<string[]>(["Dəyəri seçin", "Tent"]);

  // Sub-modal triggers
  const [isCarrierModalOpen, setIsCarrierModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [isVehicleTypeModalOpen, setIsVehicleTypeModalOpen] = useState(false);
  const [isLoadingMethodModalOpen, setIsLoadingMethodModalOpen] = useState(false);

  // 1. Yeni Daşıyıcı Form State
  const [carrierModalName, setCarrierModalName] = useState("");
  const [carrierModalAbbrName, setCarrierModalAbbrName] = useState("");
  const [carrierModalType, setCarrierModalType] = useState("Yeni");
  const [carrierModalVoen, setCarrierModalVoen] = useState("");
  const [carrierModalVoun, setCarrierModalVoun] = useState("");
  const [carrierModalMtut, setCarrierModalMtut] = useState("");
  const [carrierModalEdqn, setCarrierModalEdqn] = useState("");
  const [carrierModalUak, setCarrierModalUak] = useState("");
  const [carrierModalBin, setCarrierModalBin] = useState("");
  const [carrierModalVatCode, setCarrierModalVatCode] = useState("");
  const [carrierModalDate, setCarrierModalDate] = useState("27.05.2026");
  const [carrierModalLang, setCarrierModalLang] = useState("Dəyəri seçin");
  const [carrierModalManager, setCarrierModalManager] = useState("Ulvi Adilzade");
  const [carrierModalApproved, setCarrierModalApproved] = useState(true);
  const [carrierModalNotes, setCarrierModalNotes] = useState("");
  const [carrierActiveTab, setCarrierActiveTab] = useState<"info" | "contact" | "finance">("info");

  // Carrier Contact Tab States
  const [carrierLegalCountry, setCarrierLegalCountry] = useState("Dəyəri seçin");
  const [carrierLegalCity, setCarrierLegalCity] = useState("");
  const [carrierLegalStreet, setCarrierLegalStreet] = useState("");
  const [carrierLegalZip, setCarrierLegalZip] = useState("");
  const [carrierLegalTel, setCarrierLegalTel] = useState("");
  const [carrierLegalFax, setCarrierLegalFax] = useState("");
  const [carrierLegalEmail, setCarrierLegalEmail] = useState("");
  const [carrierLegalWeb, setCarrierLegalWeb] = useState("");

  const [carrierPostalCountry, setCarrierPostalCountry] = useState("Dəyəri seçin");
  const [carrierPostalCity, setCarrierPostalCity] = useState("");
  const [carrierPostalStreet, setCarrierPostalStreet] = useState("");
  const [carrierPostalZip, setCarrierPostalZip] = useState("");
  const [carrierPostalTel, setCarrierPostalTel] = useState("");
  const [carrierPostalFax, setCarrierPostalFax] = useState("");
  const [carrierPostalEmail, setCarrierPostalEmail] = useState("");
  const [carrierPostalWeb, setCarrierPostalWeb] = useState("");

  // Carrier Finance Tab States
  const [carrierFinanceCurrency, setCarrierFinanceCurrency] = useState("Dəyəri seçin");
  const [carrierFinanceAccount, setCarrierFinanceAccount] = useState("");
  const [carrierFinanceBank, setCarrierFinanceBank] = useState("Dəyəri seçin");
  const [carrierFinanceTransitAccount, setCarrierFinanceTransitAccount] = useState("");
  const [carrierFinanceCorrBank, setCarrierFinanceCorrBank] = useState("Dəyəri seçin");
  const [carrierFinanceCorrAccount, setCarrierFinanceCorrAccount] = useState("");
  
  const [carrierFinanceDelay, setCarrierFinanceDelay] = useState("");
  const [carrierFinanceDelayTerms, setCarrierFinanceDelayTerms] = useState("B/k 30 təqvim günü.");
  const [carrierFinanceDocTerms, setCarrierFinanceDocTerms] = useState("Hesab, aktın və qəbul edən tərəfindən təsdiqlənmiş CMR-in orijinallarını aldıqdan sonra 30 təq");
  const [carrierFinanceCreditLimit, setCarrierFinanceCreditLimit] = useState("");
  const [carrierFinanceEmailDocs, setCarrierFinanceEmailDocs] = useState("");
  const [carrierFinanceSendDebtReminders, setCarrierFinanceSendDebtReminders] = useState(true);

  const countries = ["Azerbaijan", "Georgia", "Turkey", "Russia", "Germany"];
  const banks = ["AccessBank", "Pasha Bank", "Kapital Bank", "ABB"];

  // 2. Yeni Əlaqədar Şəxs Form State
  const [contactModalName, setContactModalName] = useState("");
  const [contactModalPhone, setContactModalPhone] = useState("");
  const [contactModalEmail, setContactModalEmail] = useState("");

  // 3. Nəqliyyatın Yeni Tipi Form State
  const [vehicleTypeModalName, setVehicleTypeModalName] = useState("");
  const [vehicleTypeModalType, setVehicleTypeModalType] = useState("Avtoreyslər");
  const [vehicleTypeModalActive, setVehicleTypeModalActive] = useState(true);
  const [vehicleTypeActiveTab, setVehicleTypeActiveTab] = useState<"general" | "translations">("general");

  // 4. Əlavə Et (Teq) Form State
  const [tagModalName, setTagModalName] = useState("");
  const [tagModalActive, setTagModalActive] = useState(true);

  // 5. Yeni Yükləmə Üsulu Form State
  const [loadMethodModalName, setLoadMethodModalName] = useState("");
  const [loadMethodModalActive, setLoadMethodModalActive] = useState(true);

  useEffect(() => {
    if (isOpen && editVoyage) {
      const payload = editVoyage.rawPayload || {};
      setExpeditor(payload.expeditor || "Ulvi Adilzade");
      setCarrierCompany(payload.carrierCompany || "Makeasy");
      setContactPerson(payload.contactPerson || "Dəyəri seçin");
      setCarrierContract(payload.carrierContract || "Dəyəri seçin");
      setVoyageNumber(editVoyage.number || "ZF26094-1");
      setTags(payload.tags || "Dəyəri seçin");
      setPrice(payload.price || "1205");
      setCurrency(payload.currency || "USD");
      setExchangeDate(payload.exchangeDate || "25.05.2026");
      setPriceWithVat(payload.priceWithVat || "1205");
      setVatRate(payload.vatRate || "0%");
      setPaymentTerms(payload.paymentTerms || "Dəyəri seçin");
      setPaymentDelay(payload.paymentDelay || "");
      setVehicleNumber(payload.vehicleNumber || "");
      setTrailerNumber(payload.trailerNumber || "");
      setVehicleType(payload.vehicleType || "Dəyəri seçin");
      setLoadingMethod(payload.loadingMethod || "Dəyəri seçin");
      setDriverName(payload.driverName || "");
      setDriverSurname(payload.driverSurname || "");
      setDriverPhone(payload.driverPhone || "");
      setDriverPassport(payload.driverPassport || "");

      // Dynamically add loaded options to lists if missing
      if (payload.carrierCompany && !carrierOptions.includes(payload.carrierCompany)) {
        setCarrierOptions(prev => [...prev, payload.carrierCompany]);
      }
      if (payload.contactPerson && !contactOptions.includes(payload.contactPerson)) {
        setContactOptions(prev => [...prev, payload.contactPerson]);
      }
      if (payload.tags && !tagOptions.includes(payload.tags)) {
        setTagOptions(prev => [...prev, payload.tags]);
      }
      if (payload.vehicleType && !vehicleTypeOptions.includes(payload.vehicleType)) {
        setVehicleTypeOptions(prev => [...prev, payload.vehicleType]);
      }
      if (payload.loadingMethod && !loadingMethodOptions.includes(payload.loadingMethod)) {
        setLoadingMethodOptions(prev => [...prev, payload.loadingMethod]);
      }

      if (payload.loadingPlaces?.[0]) {
        const lp = payload.loadingPlaces[0];
        setLpStartDate(lp.startDate || "");
        setLpEndDate(lp.endDate || "");
        setLpCompany(lp.company || "");
        setLpCity(lp.city || "");
        setLpAddress(lp.address || "");
        setLpCountry(lp.country || "Dəyəri seçin");
        setLpSender(lp.sender || "Dəyəri seçin");
      }
      if (payload.unloadingPlaces?.[0]) {
        const up = payload.unloadingPlaces[0];
        setUpStartDate(up.startDate || "");
        setUpEndDate(up.endDate || "");
        setUpCompany(up.company || "");
        setUpCity(up.city || "");
        setUpAddress(up.address || "");
        setUpCountry(up.country || "Dəyəri seçin");
        setUpReceiver(up.receiver || "Dəyəri seçin");
      }
    } else if (isOpen && !editVoyage) {
      // Clear values to defaults
      setExpeditor("Ulvi Adilzade");
      setCarrierCompany("Makeasy");
      setContactPerson("Dəyəri seçin");
      setCarrierContract("Dəyəri seçin");
      setVoyageNumber(`ZF26094-${Date.now().toString().slice(-3)}`);
      setTags("Dəyəri seçin");
      setPrice("1205");
      setCurrency("USD");
      setExchangeDate("25.05.2026");
      setPriceWithVat("1205");
      setVatRate("0%");
      setPaymentTerms("Dəyəri seçin");
      setPaymentDelay("");
      setVehicleNumber("");
      setTrailerNumber("");
      setVehicleType("Dəyəri seçin");
      setLoadingMethod("Dəyəri seçin");
      setDriverName("");
      setDriverSurname("");
      setDriverPhone("");
      setDriverPassport("");
      setLpStartDate(""); setLpEndDate(""); setLpCompany(""); setLpCity(""); setLpAddress(""); setLpCountry("Dəyəri seçin"); setLpSender("Dəyəri seçin");
      setUpStartDate(""); setUpEndDate(""); setUpCompany(""); setUpCity(""); setUpAddress(""); setUpCountry("Dəyəri seçin"); setUpReceiver("Dəyəri seçin");
    }
  }, [isOpen, editVoyage]);

  // 1. Yeni Daşıyıcı Save Handler
  const handleSaveCarrier = () => {
    if (!carrierModalAbbrName.trim()) {
      alert("Name (abbreviated) mütləq daxil edilməlidir!");
      return;
    }
    const newCarrier = carrierModalAbbrName.trim();
    if (!carrierOptions.includes(newCarrier)) {
      setCarrierOptions(prev => [...prev, newCarrier]);
    }
    setCarrierCompany(newCarrier);
    setIsCarrierModalOpen(false);
    
    // Clear state
    setCarrierModalName("");
    setCarrierModalAbbrName("");
    setCarrierModalType("Yeni");
    setCarrierModalVoen("");
    setCarrierModalVoun("");
    setCarrierModalMtut("");
    setCarrierModalEdqn("");
    setCarrierModalUak("");
    setCarrierModalBin("");
    setCarrierModalVatCode("");
    setCarrierModalNotes("");
  };

  // 2. Yeni Əlaqədar Şəxs Save Handler
  const handleSaveContact = () => {
    if (!contactModalName.trim()) {
      alert("Tam adı mütləq daxil edilməlidir!");
      return;
    }
    const newContact = contactModalName.trim();
    if (!contactOptions.includes(newContact)) {
      setContactOptions(prev => [...prev, newContact]);
    }
    setContactPerson(newContact);
    setIsContactModalOpen(false);
    
    // Clear state
    setContactModalName("");
    setContactModalPhone("");
    setContactModalEmail("");
  };

  // 3. Nəqliyyatın Yeni Tipi Save Handler
  const handleSaveVehicleType = () => {
    if (!vehicleTypeModalName.trim()) {
      alert("Adı mütləq daxil edilməlidir!");
      return;
    }
    const newType = vehicleTypeModalName.trim();
    if (!vehicleTypeOptions.includes(newType)) {
      setVehicleTypeOptions(prev => [...prev, newType]);
    }
    setVehicleType(newType);
    setIsVehicleTypeModalOpen(false);
    
    // Clear state
    setVehicleTypeModalName("");
  };

  // 4. Əlavə et (Teq) Save Handler
  const handleSaveTag = () => {
    if (!tagModalName.trim()) {
      alert("Teq mütləq daxil edilməlidir!");
      return;
    }
    const newTag = tagModalName.trim();
    if (!tagOptions.includes(newTag)) {
      setTagOptions(prev => [...prev, newTag]);
    }
    setTags(newTag);
    setIsTagModalOpen(false);
    
    // Clear state
    setTagModalName("");
  };

  // 5. Yeni Yükləmə Üsulu Save Handler
  const handleSaveLoadingMethod = () => {
    if (!loadMethodModalName.trim()) {
      alert("Adı mütləq daxil edilməlidir!");
      return;
    }
    const newMethod = loadMethodModalName.trim();
    if (!loadingMethodOptions.includes(newMethod)) {
      setLoadingMethodOptions(prev => [...prev, newMethod]);
    }
    setLoadingMethod(newMethod);
    setIsLoadingMethodModalOpen(false);
    
    // Clear state
    setLoadMethodModalName("");
  };

  const handleSave = () => {
    if (!voyageNumber.trim()) {
      alert("Reysin nömrəsi mütləq daxil edilməlidir!");
      return;
    }

    const calculatedAznPrice = (parseFloat(price) * 1.7).toFixed(2);
    const formattedPriceString = `${price} ${currency} ƏDV ilə (${calculatedAznPrice} AZN ƏDV ilə)`;

    onConfirm({
      number: voyageNumber.trim(),
      tags: tags !== "Dəyəri seçin" ? tags : "",
      sender: lpCompany || "—",
      loadPlace: lpAddress || lpCity || "—",
      receiver: upCompany || "—",
      unloadPlace: upAddress || upCity || "—",
      status: "Planlaşdırılıb",
      loadDate: lpStartDate || "—",
      unloadDate: upStartDate || "—",
      price: formattedPriceString,
      carrier: carrierCompany,
      carNumber: vehicleNumber || "—",
      expeditor,
      invoices: "",
      loads: `${voyageNumber.trim()} - Dental Goods`,
      rawPayload: {
        expeditor,
        carrierCompany,
        contactPerson,
        carrierContract,
        voyageNumber: voyageNumber.trim(),
        tags,
        price,
        currency,
        exchangeDate,
        priceWithVat,
        vatRate,
        paymentTerms,
        paymentDelay,
        vehicleNumber,
        trailerNumber,
        vehicleType,
        loadingMethod,
        driverName,
        driverSurname,
        driverPhone,
        driverPassport,
        loadingPlaces: [
          {
            startDate: lpStartDate,
            endDate: lpEndDate,
            company: lpCompany,
            city: lpCity,
            address: lpAddress,
            country: lpCountry,
            sender: lpSender,
          }
        ],
        unloadingPlaces: [
          {
            startDate: upStartDate,
            endDate: upEndDate,
            company: upCompany,
            city: upCity,
            address: upAddress,
            country: upCountry,
            receiver: upReceiver,
          }
        ]
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10001,
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

      {/* Centered Modal Card */}
      <div
        style={{
          position: "relative",
          background: "#f8fafc",
          border: "1px solid #cbd5e1",
          borderRadius: "0.75rem",
          width: "min(96%, 1160px)",
          height: "90vh",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1rem 1.75rem",
            background: "#ffffff",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: "1.15rem", fontWeight: 700, color: "#1e293b" }}>
            {editVoyage ? "Reysi dəyiş" : "Reys əlavə et"}
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: 0,
              cursor: "pointer",
              fontSize: "1.25rem",
              color: "#64748b",
              display: "flex",
              alignItems: "center",
              padding: "0.25rem",
            }}
          >
            <FiX />
          </button>
        </div>

        {/* Modal Tabs Bar */}
        <div
          style={{
            padding: "0 1.75rem",
            background: "#ffffff",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            gap: "1.5rem",
          }}
        >
          {[
            { id: "general", label: "Əsas məlumatlar" },
            { id: "routes", label: "Yüklər və Marşrutlar" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  background: "transparent",
                  border: 0,
                  borderBottom: isActive ? "3px solid #22c55e" : "3px solid transparent",
                  color: isActive ? "#22c55e" : "#64748b",
                  padding: "0.75rem 0.25rem",
                  fontWeight: isActive ? 700 : 500,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Form Scrollable Body */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "1.5rem 1.75rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
            boxSizing: "border-box",
          }}
        >
          {/* TAB 1: Əsas Məlumatlar (Photo 2) */}
          {activeTab === "general" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.1fr auto 1fr", gap: "1.5rem" }}>
                {/* Left Side fields */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>
                      Ekspeditor <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <select
                      value={expeditor}
                      onChange={(e) => setExpeditor(e.target.value)}
                      style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", background: "#ffffff", outline: "none", boxSizing: "border-box" }}
                    >
                      <option value="Ulvi Adilzade">Ulvi Adilzade</option>
                      <option value="Nijat Shabanly">Nijat Shabanly</option>
                    </select>
                  </div>

                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#475569", marginTop: "0.5rem" }}>Daşıyıcının məlumatları</span>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <LabelWithPlus label="Daşıyıcının şirkəti" onPlusClick={() => setIsCarrierModalOpen(true)} />
                    <select
                      value={carrierCompany}
                      onChange={(e) => setCarrierCompany(e.target.value)}
                      style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", background: "#ffffff", outline: "none", boxSizing: "border-box" }}
                    >
                      {carrierOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <LabelWithPlus label="Əlaqədar şəxs" onPlusClick={() => setIsContactModalOpen(true)} />
                    <select
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", background: "#ffffff", outline: "none", boxSizing: "border-box" }}
                    >
                      {contactOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Daşıyıcı ilə müqavilənin nömrəsi</label>
                    <select
                      value={carrierContract}
                      onChange={(e) => setCarrierContract(e.target.value)}
                      style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", background: "#ffffff", outline: "none", boxSizing: "border-box" }}
                    >
                      <option value="Dəyəri seçin">Dəyəri seçin</option>
                      <option value="AGR-2026-09">AGR-2026-09</option>
                    </select>
                  </div>
                </div>

                {/* Vertical dashed line */}
                <div style={{ borderLeft: "1px dashed #cbd5e1", margin: "0 0.25rem" }} />

                {/* Right Side fields */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Reysin nömrəsi</label>
                      <input
                        type="text"
                        value={voyageNumber}
                        onChange={(e) => setVoyageNumber(e.target.value)}
                        style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none", background: "#ffffff" }}
                      />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <LabelWithPlus label="Teqlər" onPlusClick={() => setIsTagModalOpen(true)} />
                      <select
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", background: "#ffffff", outline: "none", boxSizing: "border-box" }}
                      >
                        {tagOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  </div>

                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#475569", marginTop: "0.5rem" }}>Dəyəri</span>

                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "1rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Qiymət</label>
                      <input
                        type="text"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none", background: "#ffffff" }}
                      />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Valyuta *</label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", background: "#ffffff", outline: "none", boxSizing: "border-box" }}
                      >
                        <option value="USD">USD</option>
                        <option value="AZN">AZN</option>
                        <option value="EUR">EUR</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Məzənnənin tarixi</label>
                      <div style={{ position: "relative" }}>
                        <input
                          type="text"
                          value={exchangeDate}
                          onChange={(e) => setExchangeDate(e.target.value)}
                          style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 2rem 0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none", background: "#ffffff" }}
                        />
                        <FiCalendar style={{ position: "absolute", right: "0.6rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>ƏDV ilə qiymət</label>
                      <input
                        type="text"
                        value={priceWithVat}
                        onChange={(e) => setPriceWithVat(e.target.value)}
                        style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none", background: "#ffffff" }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>ƏDV-nin tarifi *</label>
                      <select
                        value={vatRate}
                        onChange={(e) => setVatRate(e.target.value)}
                        style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", background: "#ffffff", outline: "none", boxSizing: "border-box" }}
                      >
                        <option value="0%">0%</option>
                        <option value="18%">18%</option>
                        <option value="20%">20%</option>
                      </select>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Ödənişin müddəti və şərtləri</label>
                      <select
                        value={paymentTerms}
                        onChange={(e) => setPaymentTerms(e.target.value)}
                        style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", background: "#ffffff", outline: "none", boxSizing: "border-box" }}
                      >
                        <option value="Dəyəri seçin">Dəyəri seçin</option>
                        <option value="30 təqvim günü">30 təqvim günü</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Ödənişin təxirə salınması</label>
                    <input
                      type="text"
                      value={paymentDelay}
                      onChange={(e) => setPaymentDelay(e.target.value)}
                      style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none", background: "#ffffff" }}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Row: Nəqliyyat & Sürücü */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.5rem", marginTop: "1rem" }}>
                {/* Nəqliyyat section */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#475569" }}>Nəqliyyat</span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Nəqliyyat vasitəsinin nömrəsi</label>
                      <input type="text" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Qoşqunun nömrəsi</label>
                      <input type="text" value={trailerNumber} onChange={(e) => setTrailerNumber(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <LabelWithPlus label="Nəqliyyatın tipi" onPlusClick={() => setIsVehicleTypeModalOpen(true)} />
                      <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", background: "#ffffff", outline: "none" }}>
                        {vehicleTypeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <LabelWithPlus label="Yükləmənin üsulu" onPlusClick={() => setIsLoadingMethodModalOpen(true)} />
                      <select value={loadingMethod} onChange={(e) => setLoadingMethod(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", background: "#ffffff", outline: "none" }}>
                        {loadingMethodOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Sürücü section */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#475569" }}>Sürücü</span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Adı</label>
                      <input type="text" value={driverName} onChange={(e) => setDriverName(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Soyadı</label>
                      <input type="text" value={driverSurname} onChange={(e) => setDriverSurname(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Telefon</label>
                      <input type="text" value={driverPhone} onChange={(e) => setDriverPhone(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Pasportun nömrəsi</label>
                      <input type="text" value={driverPassport} onChange={(e) => setDriverPassport(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Yüklər və Marşrutlar (Photo 3) */}
          {activeTab === "routes" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Checked Cargo Table */}
              <div style={{ border: "1px solid #e2e8f0", borderRadius: "0.5rem", background: "#ffffff", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", textAlign: "left" }}>
                  <thead>
                    <tr style={{ background: "#eff6ff", borderBottom: "1px solid #e2e8f0" }}>
                      <th style={{ padding: "0.6rem 0.85rem" }}><input type="checkbox" defaultChecked /></th>
                      <th style={{ padding: "0.6rem 0.85rem", color: "#475569", fontWeight: 600 }}>Yükün adı</th>
                      <th style={{ padding: "0.6rem 0.85rem", color: "#475569", fontWeight: 600 }}>Yükün nömrəsi</th>
                      <th style={{ padding: "0.6rem 0.85rem", color: "#475569", fontWeight: 600 }}>Konteynerin nömrəsi</th>
                      <th style={{ padding: "0.6rem 0.85rem", color: "#475569", fontWeight: 600 }}>Qabaritləri</th>
                      <th style={{ padding: "0.6rem 0.85rem", color: "#475569", fontWeight: 600 }}>Qablaşdırma</th>
                      <th style={{ padding: "0.6rem 0.85rem", color: "#475569", fontWeight: 600 }}>Sifariş</th>
                      <th style={{ padding: "0.6rem 0.85rem", color: "#475569", fontWeight: 600 }}>Marşrut</th>
                      <th style={{ padding: "0.6rem 0.85rem", color: "#475569", fontWeight: 600 }}>Yükün statusu</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <td style={{ padding: "0.6rem 0.85rem" }}><input type="checkbox" defaultChecked /></td>
                      <td style={{ padding: "0.6rem 0.85rem", color: "#3b82f6", fontWeight: 700 }}>Dental Goods</td>
                      <td style={{ padding: "0.6rem 0.85rem", fontWeight: 600 }}>ZF26094-1</td>
                      <td style={{ padding: "0.6rem 0.85rem" }}>—</td>
                      <td style={{ padding: "0.6rem 0.85rem", fontWeight: 600 }}>0 m3 / 533 kq</td>
                      <td style={{ padding: "0.6rem 0.85rem" }}>—</td>
                      <td style={{ padding: "0.6rem 0.85rem", color: "#9333ea", fontWeight: 700 }}>ZF26094</td>
                      <td style={{ padding: "0.6rem 0.85rem" }}>CN, Changzhou...</td>
                      <td style={{ padding: "0.6rem 0.85rem", color: "#475569" }}>Yüklənmədə</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Action and metrics row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button
                  type="button"
                  style={{
                    background: "#22c55e",
                    border: 0,
                    borderRadius: "0.25rem",
                    color: "#ffffff",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    padding: "0.5rem 1.25rem",
                    cursor: "pointer",
                  }}
                >
                  Marşrutu yükdən köçürtmək
                </button>

                <span style={{ fontSize: "0.8rem", color: "#475569", fontWeight: 600 }}>
                  Ümumi ölçü: <span style={{ fontWeight: 700 }}>Çəkisi: 533; LDM: 0 m; Həcmi: 0 m3</span>
                </span>
              </div>

              {/* Collapsible inputs grid */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {/* 1. Yükləmə yeri collapsible */}
                <div style={{ border: "1px solid #e2e8f0", borderRadius: "0.375rem", background: "#ffffff" }}>
                  <button
                    type="button"
                    onClick={() => setIsLpOpen(!isLpOpen)}
                    style={{
                      width: "100%",
                      background: "transparent",
                      border: 0,
                      padding: "0.65rem 1rem",
                      textAlign: "left",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      color: "#475569",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                      outline: "none"
                    }}
                  >
                    <span>{isLpOpen ? "−" : "+"} Yükləmə yeri</span>
                  </button>

                  {isLpOpen && (
                    <div style={{ padding: "1rem", borderTop: "1px solid #e2e8f0", display: "grid", gridTemplateColumns: "1.2fr 1fr 0.9fr 1.5fr", gap: "1rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Tarix</label>
                        <input type="text" placeholder="Tarixindən" value={lpStartDate} onChange={(e) => setLpStartDate(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.5rem", fontSize: "0.8rem" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Yer / Şirkət</label>
                        <input type="text" value={lpCompany} onChange={(e) => setLpCompany(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.5rem", fontSize: "0.8rem" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Şəhər</label>
                        <input type="text" value={lpCity} onChange={(e) => setLpCity(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.5rem", fontSize: "0.8rem" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Ünvan</label>
                        <input type="text" value={lpAddress} onChange={(e) => setLpAddress(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.5rem", fontSize: "0.8rem" }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Boşaltma yeri collapsible */}
                <div style={{ border: "1px solid #e2e8f0", borderRadius: "0.375rem", background: "#ffffff" }}>
                  <button
                    type="button"
                    onClick={() => setIsUpOpen(!isUpOpen)}
                    style={{
                      width: "100%",
                      background: "transparent",
                      border: 0,
                      padding: "0.65rem 1rem",
                      textAlign: "left",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      color: "#475569",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                      outline: "none"
                    }}
                  >
                    <span>{isUpOpen ? "−" : "+"} Boşaltma yeri</span>
                  </button>

                  {isUpOpen && (
                    <div style={{ padding: "1rem", borderTop: "1px solid #e2e8f0", display: "grid", gridTemplateColumns: "1.2fr 1fr 0.9fr 1.5fr", gap: "1rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Tarix</label>
                        <input type="text" placeholder="Tarixindən" value={upStartDate} onChange={(e) => setUpStartDate(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.5rem", fontSize: "0.8rem" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Yer / Şirkət</label>
                        <input type="text" value={upCompany} onChange={(e) => setUpCompany(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.5rem", fontSize: "0.8rem" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Şəhər</label>
                        <input type="text" value={upCity} onChange={(e) => setUpCity(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.5rem", fontSize: "0.8rem" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Ünvan</label>
                        <input type="text" value={upAddress} onChange={(e) => setUpAddress(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.5rem", fontSize: "0.8rem" }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Route point collapsible */}
                <div style={{ border: "1px solid #e2e8f0", borderRadius: "0.375rem", background: "#ffffff" }}>
                  <button
                    type="button"
                    onClick={() => setIsRpOpen(!isRpOpen)}
                    style={{
                      width: "100%",
                      background: "transparent",
                      border: 0,
                      padding: "0.65rem 1rem",
                      textAlign: "left",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      color: "#475569",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                      outline: "none"
                    }}
                  >
                    <span>{isRpOpen ? "−" : "+"} Route point</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "1rem 1.75rem",
            background: "#f8fafc",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.75rem",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "1px solid #cbd5e1",
              borderRadius: "0.375rem",
              padding: "0.55rem 1.5rem",
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "#475569",
              cursor: "pointer",
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
              borderRadius: "0.375rem",
              padding: "0.55rem 1.75rem",
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "#ffffff",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#16a34a")}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#22c55e")}
          >
            Yaddaşda saxlamaq
          </button>
        </div>
      </div>

      {/* Sub-modal 1: Yeni daşıyıcı (Photo 1) */}
      {isCarrierModalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10006, display: "flex", justifyContent: "center", alignItems: "center" }}>
          {/* Backdrop blur */}
          <div style={{ position: "absolute", inset: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)" }} onClick={() => setIsCarrierModalOpen(false)} />
          {/* Card */}
          <div style={{ position: "relative", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "0.75rem", width: "min(96%, 1120px)", height: "88vh", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "inherit", boxSizing: "border-box" }}>
            {/* Header */}
            <div style={{ padding: "1rem 1.75rem", background: "#ffffff", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "1.15rem", fontWeight: 700, color: "#1e293b" }}>Yeni daşıyıcı</span>
              <button type="button" onClick={() => setIsCarrierModalOpen(false)} style={{ background: "transparent", border: 0, cursor: "pointer", fontSize: "1.25rem", color: "#64748b", display: "flex", alignItems: "center", padding: "0.25rem" }}><FiX /></button>
            </div>
            {/* Sub-tabs */}
            <div style={{ padding: "0 1.75rem", background: "#ffffff", borderBottom: "1px solid #f1f5f9", display: "flex", gap: "1.5rem" }}>
              {[
                { id: "info", label: "Əsas məlumatlar" },
                { id: "contact", label: "Əlaqə məlumatları" },
                { id: "finance", label: "Maliyyələr" }
              ].map(tab => {
                const isActive = carrierActiveTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setCarrierActiveTab(tab.id as any)}
                    style={{ background: "transparent", border: 0, borderBottom: isActive ? "3px solid #3b82f6" : "3px solid transparent", color: isActive ? "#3b82f6" : "#64748b", padding: "0.75rem 0.25rem", fontWeight: isActive ? 700 : 500, fontSize: "0.85rem", cursor: "pointer", transition: "all 0.2s ease" }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
            {/* Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem 1.75rem", boxSizing: "border-box" }}>
              {/* Tab 1: Əsas məlumatlar */}
              {carrierActiveTab === "info" && (
                <div style={{ display: "grid", gridTemplateColumns: "1.1fr auto 1fr", gap: "1.5rem", alignItems: "stretch" }}>
                  {/* Left Column: Şirkətin rekvizitləri */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#475569", marginBottom: "0.25rem" }}>Şirkətin rekvizitləri</span>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Name (full)</label>
                      <input type="text" placeholder="Limited liability company" value={carrierModalName} onChange={(e) => setCarrierModalName(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", background: "#ffffff", outline: "none" }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Name (abbreviated) <span style={{ color: "#ef4444" }}>*</span></label>
                        <input type="text" placeholder="LLC Company Name" value={carrierModalAbbrName} onChange={(e) => setCarrierModalAbbrName(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", background: "#ffffff", outline: "none" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Daşıyıcının növü</label>
                        <select value={carrierModalType} onChange={(e) => setCarrierModalType(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", background: "#ffffff", outline: "none", boxSizing: "border-box" }}>
                          <option value="Yeni">Yeni</option>
                          <option value="Daimi">Daimi</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>VÖUN/UMTVDR/VATNº</label>
                        <input type="text" value={carrierModalVoun} onChange={(e) => setCarrierModalVoun(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", background: "#ffffff", outline: "none" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>VÖEN</label>
                        <input type="text" value={carrierModalVoen} onChange={(e) => setCarrierModalVoen(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", background: "#ffffff", outline: "none" }} />
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>MTÜT</label>
                        <input type="text" value={carrierModalMtut} onChange={(e) => setCarrierModalMtut(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", background: "#ffffff", outline: "none" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>ƏDQN</label>
                        <input type="text" value={carrierModalEdqn} onChange={(e) => setCarrierModalEdqn(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", background: "#ffffff", outline: "none" }} />
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>UAK</label>
                        <input type="text" value={carrierModalUak} onChange={(e) => setCarrierModalUak(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", background: "#ffffff", outline: "none" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>BİN</label>
                        <input type="text" value={carrierModalBin} onChange={(e) => setCarrierModalBin(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", background: "#ffffff", outline: "none" }} />
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Ödəyicinin ƏDV kodu</label>
                      <input type="text" value={carrierModalVatCode} onChange={(e) => setCarrierModalVatCode(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", background: "#ffffff", outline: "none" }} />
                    </div>
                  </div>

                  {/* Vertical dashed divider */}
                  <div style={{ borderLeft: "1px dashed #cbd5e1", margin: "0 0.5rem" }} />

                  {/* Right Column: Carrier settings */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#475569", marginBottom: "0.25rem" }}>Carrier settings</span>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Yaradılması tarixi</label>
                        <div style={{ position: "relative" }}>
                          <input type="text" value={carrierModalDate} onChange={(e) => setCarrierModalDate(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 2rem 0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", background: "#ffffff", outline: "none" }} />
                          <FiCalendar style={{ position: "absolute", right: "0.6rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Language of notifications</label>
                        <select value={carrierModalLang} onChange={(e) => setCarrierModalLang(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", background: "#ffffff", outline: "none", boxSizing: "border-box" }}>
                          <option value="Dəyəri seçin">Dəyəri seçin</option>
                          <option value="Azerbaijan">Azerbaijan</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Menecerlərin siyahısı</label>
                      <div style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.35rem 0.75rem", background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "0.8rem", color: "#334155", background: "#e2e8f0", padding: "0.15rem 0.45rem", borderRadius: "0.25rem", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                          <span style={{ color: "#64748b", cursor: "pointer", fontWeight: "bold" }}>×</span> {carrierModalManager}
                        </span>
                        <span style={{ color: "#64748b", fontSize: "0.85rem", cursor: "pointer", fontWeight: "bold" }}>×</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem", cursor: "pointer" }} onClick={() => setCarrierModalApproved(!carrierModalApproved)}>
                      <div style={{ width: "18px", height: "18px", borderRadius: "4px", border: carrierModalApproved ? "1.5px solid #22c55e" : "1.5px solid #cbd5e1", background: carrierModalApproved ? "#22c55e" : "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontSize: "0.7rem", fontWeight: "bold" }}>
                        {carrierModalApproved && "✓"}
                      </div>
                      <span style={{ fontSize: "0.8rem", color: "#1e293b", fontWeight: 600 }}>İşə icazə verilmişdir</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", marginTop: "0.25rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Əlavə məlumat</label>
                      <textarea value={carrierModalNotes} onChange={(e) => setCarrierModalNotes(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem 0.75rem", fontSize: "0.8rem", width: "100%", height: "96px", boxSizing: "border-box", outline: "none", background: "#ffffff", resize: "none", fontFamily: "inherit" }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Əlaqə məlumatları (Photo 1) */}
              {carrierActiveTab === "contact" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  {/* Hüquqi ünvan */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#475569" }}>Hüquqi ünvan</span>
                      <span style={{ cursor: "help", color: "#94a3b8", fontWeight: 700, fontSize: "0.8rem" }} title="Qeydiyyatda olan hüquqi ünvan">?</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <LabelWithPlus label="Ölkə" onPlusClick={() => { }} />
                        <select value={carrierLegalCountry} onChange={(e) => setCarrierLegalCountry(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.4rem 0.5rem", fontSize: "0.8rem", width: "100%", background: "#ffffff", outline: "none", boxSizing: "border-box" }}>
                          <option value="Dəyəri seçin">Dəyəri seçin</option>
                          {countries.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Şəhər</label>
                        <input type="text" value={carrierLegalCity} onChange={(e) => setCarrierLegalCity(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.4rem 0.5rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Ünvan</label>
                        <input type="text" value={carrierLegalStreet} onChange={(e) => setCarrierLegalStreet(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.4rem 0.5rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Poçt kodu</label>
                        <input type="text" value={carrierLegalZip} onChange={(e) => setCarrierLegalZip(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.4rem 0.5rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Telefon</label>
                        <input type="text" value={carrierLegalTel} onChange={(e) => setCarrierLegalTel(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.4rem 0.5rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Faks</label>
                        <input type="text" value={carrierLegalFax} onChange={(e) => setCarrierLegalFax(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.4rem 0.5rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>El.poçt</label>
                        <input type="text" value={carrierLegalEmail} onChange={(e) => setCarrierLegalEmail(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.4rem 0.5rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Sayt</label>
                        <input type="text" value={carrierLegalWeb} onChange={(e) => setCarrierLegalWeb(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.4rem 0.5rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                      </div>
                    </div>
                  </div>

                  {/* Poçt ünvanı */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#475569" }}>Poçt ünvanı</span>
                      <span style={{ cursor: "help", color: "#94a3b8", fontWeight: 700, fontSize: "0.8rem" }} title="Poçt sənədlərinin göndəriləcəyi ünvan">?</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <LabelWithPlus label="Ölkə" onPlusClick={() => { }} />
                        <select value={carrierPostalCountry} onChange={(e) => setCarrierPostalCountry(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.4rem 0.5rem", fontSize: "0.8rem", width: "100%", background: "#ffffff", outline: "none", boxSizing: "border-box" }}>
                          <option value="Dəyəri seçin">Dəyəri seçin</option>
                          {countries.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Şəhər</label>
                        <input type="text" value={carrierPostalCity} onChange={(e) => setCarrierPostalCity(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.4rem 0.5rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Ünvan</label>
                        <input type="text" value={carrierPostalStreet} onChange={(e) => setCarrierPostalStreet(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.4rem 0.5rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Poçt kodu</label>
                        <input type="text" value={carrierPostalZip} onChange={(e) => setCarrierPostalZip(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.4rem 0.5rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Telefon</label>
                        <input type="text" value={carrierPostalTel} onChange={(e) => setCarrierPostalTel(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.4rem 0.5rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Faks</label>
                        <input type="text" value={carrierPostalFax} onChange={(e) => setCarrierPostalFax(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.4rem 0.5rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>El.poçt</label>
                        <input type="text" value={carrierPostalEmail} onChange={(e) => setCarrierPostalEmail(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.4rem 0.5rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Sayt</label>
                        <input type="text" value={carrierPostalWeb} onChange={(e) => setCarrierPostalWeb(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.4rem 0.5rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Maliyyələr (Photo 2) */}
              {carrierActiveTab === "finance" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  {/* Bank Accounts section */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <SquarePlusTrigger label="Bank accounts" onClick={() => { }} />
                    </div>

                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                      <button
                        type="button"
                        style={{
                          background: "#ef4444",
                          border: 0,
                          borderRadius: "50%",
                          width: "16px",
                          height: "16px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#ffffff",
                          cursor: "pointer",
                          padding: 0,
                          fontSize: "0.75rem",
                          flexShrink: 0,
                        }}
                      >
                        <FiMinus />
                      </button>

                      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "0.7fr 1.3fr 1.3fr 1.3fr 1.3fr 1fr", gap: "0.5rem" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                          <label style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600 }}>
                            Valyuta <span style={{ color: "#ef4444" }}>*</span>
                          </label>
                          <select value={carrierFinanceCurrency} onChange={(e) => setCarrierFinanceCurrency(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.4rem 0.5rem", fontSize: "0.8rem", width: "100%", background: "#ffffff", outline: "none", boxSizing: "border-box" }}>
                            <option value="Dəyəri seçin">Dəyəri ...</option>
                            <option value="AZN">AZN</option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                          </select>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                          <label style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600 }}>Hesablaşma hesabı</label>
                          <input type="text" value={carrierFinanceAccount} onChange={(e) => setCarrierFinanceAccount(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.4rem 0.5rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                          <LabelWithPlus label="Bank" onPlusClick={() => {}} />
                          <select value={carrierFinanceBank} onChange={(e) => setCarrierFinanceBank(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.4rem 0.5rem", fontSize: "0.8rem", width: "100%", background: "#ffffff", outline: "none", boxSizing: "border-box" }}>
                            <option value="Dəyəri seçin">Dəyəri seçin</option>
                            {banks.map((b) => <option key={b} value={b}>{b}</option>)}
                          </select>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                          <label style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600 }}>Tranzit hesab</label>
                          <input type="text" value={carrierFinanceTransitAccount} onChange={(e) => setCarrierFinanceTransitAccount(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.4rem 0.5rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                          <LabelWithPlus label="Müxbir bank" onPlusClick={() => {}} />
                          <select value={carrierFinanceCorrBank} onChange={(e) => setCarrierFinanceCorrBank(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.4rem 0.5rem", fontSize: "0.8rem", width: "100%", background: "#ffffff", outline: "none", boxSizing: "border-box" }}>
                            <option value="Dəyəri seçin">Dəyəri seçin</option>
                            {banks.map((b) => <option key={b} value={b}>{b}</option>)}
                          </select>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                          <label style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600 }}>Müxbir hesab</label>
                          <input type="text" value={carrierFinanceCorrAccount} onChange={(e) => setCarrierFinanceCorrAccount(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.4rem 0.5rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Financial terms */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#475569" }}>Financial terms</span>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Ödənişin təxirə salınması</label>
                        <input type="text" value={carrierFinanceDelay} onChange={(e) => setCarrierFinanceDelay(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none", background: "#ffffff" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Ödənişlərin təxirə salınması şərtləri</label>
                        <select value={carrierFinanceDelayTerms} onChange={(e) => setCarrierFinanceDelayTerms(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", background: "#ffffff", outline: "none", boxSizing: "border-box" }}>
                          <option value="B/k 30 təqvim günü.">B/k 30 təqvim günü.</option>
                          <option value="B/k 15 təqvim günü.">B/k 15 təqvim günü.</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Document terms text */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Document terms text</label>
                    <textarea
                      value={carrierFinanceDocTerms}
                      onChange={(e) => setCarrierFinanceDocTerms(e.target.value)}
                      style={{
                        border: "1px solid #cbd5e1",
                        borderRadius: "0.375rem",
                        padding: "0.5rem 0.75rem",
                        fontSize: "0.8rem",
                        width: "100%",
                        height: "56px",
                        boxSizing: "border-box",
                        outline: "none",
                        background: "#ffffff",
                        resize: "none",
                        fontFamily: "inherit",
                      }}
                    />
                  </div>

                  {/* Kredit limiti and Email side-by-side */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr auto", gap: "1rem", alignItems: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Kredit limiti</label>
                      <input type="text" value={carrierFinanceCreditLimit} onChange={(e) => setCarrierFinanceCreditLimit(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none", background: "#ffffff" }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Sənədlərin göndərilməsi üçün el.poçt</label>
                        <span style={{ cursor: "help", color: "#94a3b8", fontWeight: 700, fontSize: "0.8rem" }} title="Sənədlərin nüsxələrini göndərmək üçün poçt qutusu">?</span>
                      </div>
                      <input type="text" value={carrierFinanceEmailDocs} onChange={(e) => setCarrierFinanceEmailDocs(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none", background: "#ffffff" }} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "1rem", cursor: "pointer" }} onClick={() => setCarrierFinanceSendDebtReminders(!carrierFinanceSendDebtReminders)}>
                      <div
                        style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "4px",
                          border: carrierFinanceSendDebtReminders ? "1.5px solid #22c55e" : "1.5px solid #cbd5e1",
                          background: carrierFinanceSendDebtReminders ? "#22c55e" : "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#ffffff",
                          fontSize: "0.7rem",
                          fontWeight: "bold",
                        }}
                      >
                        {carrierFinanceSendDebtReminders && "✓"}
                      </div>
                      <span style={{ fontSize: "0.8rem", color: "#1e293b", fontWeight: 600 }}>
                        Borclar haqqında xatırlatmaları göndər
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Footer */}
            <div style={{ padding: "1rem 1.25rem", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button type="button" onClick={() => setIsCarrierModalOpen(false)} style={{ background: "transparent", border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem 1.25rem", fontSize: "0.8rem", fontWeight: 600, color: "#475569", cursor: "pointer" }}>Ləğv et</button>
              <button type="button" onClick={handleSaveCarrier} style={{ background: "#22c55e", border: "1px solid #22c55e", borderRadius: "0.375rem", padding: "0.5rem 1.5rem", fontSize: "0.8rem", fontWeight: 600, color: "#ffffff", cursor: "pointer" }}>Yaddaşda saxlamaq</button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-modal 2: Yeni əlaqədar şəxs (Photo 2) */}
      {isContactModalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10006, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)" }} onClick={() => setIsContactModalOpen(false)} />
          <div style={{ position: "relative", background: "#f1f5f9", width: "min(96%, 480px)", borderRadius: "0.5rem", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "inherit", boxSizing: "border-box" }}>
            {/* Header */}
            <div style={{ background: "#ffffff", padding: "0.85rem 1.25rem", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#475569" }}>Yeni əlaqədar şəxs</span>
              <button type="button" onClick={() => setIsContactModalOpen(false)} style={{ background: "transparent", border: 0, cursor: "pointer", fontSize: "1.25rem", color: "#64748b", display: "flex", alignItems: "center", padding: "0.25rem" }}><FiX /></button>
            </div>
            {/* Body */}
            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", boxSizing: "border-box" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Tam adı <span style={{ color: "#ef4444" }}>*</span></label>
                <input type="text" value={contactModalName} onChange={(e) => setContactModalName(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", background: "#ffffff", outline: "none" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Telefon nömrələri</label>
                <input type="text" value={contactModalPhone} onChange={(e) => setContactModalPhone(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", background: "#ffffff", outline: "none" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>El.poçtu</label>
                <input type="text" value={contactModalEmail} onChange={(e) => setContactModalEmail(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", background: "#ffffff", outline: "none" }} />
              </div>
            </div>
            {/* Footer */}
            <div style={{ padding: "1rem 1.25rem", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button type="button" onClick={() => setIsContactModalOpen(false)} style={{ background: "transparent", border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem 1.25rem", fontSize: "0.8rem", fontWeight: 600, color: "#475569", cursor: "pointer" }}>Ləğv et</button>
              <button type="button" onClick={handleSaveContact} style={{ background: "#22c55e", border: "1px solid #22c55e", borderRadius: "0.375rem", padding: "0.5rem 1.5rem", fontSize: "0.8rem", fontWeight: 600, color: "#ffffff", cursor: "pointer" }}>Yaddaşda saxlamaq</button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-modal 3: Nəqliyyatın yeni tipi (Photo 3) */}
      {isVehicleTypeModalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10006, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)" }} onClick={() => setIsVehicleTypeModalOpen(false)} />
          <div style={{ position: "relative", background: "#f1f5f9", width: "min(96%, 480px)", borderRadius: "0.5rem", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "inherit", boxSizing: "border-box" }}>
            {/* Header */}
            <div style={{ background: "#ffffff", padding: "0.85rem 1.25rem", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#475569" }}>Nəqliyyatın yeni tipi</span>
              <button type="button" onClick={() => setIsVehicleTypeModalOpen(false)} style={{ background: "transparent", border: 0, cursor: "pointer", fontSize: "1.25rem", color: "#64748b", display: "flex", alignItems: "center", padding: "0.25rem" }}><FiX /></button>
            </div>
            {/* Sub-tabs */}
            <div style={{ background: "#ffffff", padding: "0 1.25rem", borderBottom: "1px solid #e2e8f0", display: "flex", gap: "1.25rem" }}>
              {[
                { id: "general", label: "Əsas" },
                { id: "translations", label: "Translations" }
              ].map(tab => {
                const isActive = vehicleTypeActiveTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setVehicleTypeActiveTab(tab.id as any)}
                    style={{ background: "transparent", border: 0, borderBottom: isActive ? "3px solid #3b82f6" : "3px solid transparent", color: isActive ? "#3b82f6" : "#64748b", padding: "0.65rem 0.15rem", fontWeight: isActive ? 700 : 500, fontSize: "0.8rem", cursor: "pointer" }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
            {/* Body */}
            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", boxSizing: "border-box" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Adı <span style={{ color: "#ef4444" }}>*</span></label>
                <input type="text" value={vehicleTypeModalName} onChange={(e) => setVehicleTypeModalName(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", background: "#ffffff", outline: "none" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Nəqliyyatın tipi <span style={{ color: "#ef4444" }}>*</span></label>
                <select value={vehicleTypeModalType} onChange={(e) => setVehicleTypeModalType(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", background: "#ffffff", outline: "none", boxSizing: "border-box" }}>
                  <option value="Avtoreyslər">Avtoreyslər</option>
                  <option value="Dəmiryolu">Dəmiryolu</option>
                </select>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.25rem", cursor: "pointer" }} onClick={() => setVehicleTypeModalActive(!vehicleTypeModalActive)}>
                <div style={{ width: "18px", height: "18px", borderRadius: "4px", border: vehicleTypeModalActive ? "1.5px solid #22c55e" : "1.5px solid #cbd5e1", background: vehicleTypeModalActive ? "#22c55e" : "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontSize: "0.7rem", fontWeight: "bold" }}>
                  {vehicleTypeModalActive && "✓"}
                </div>
                <span style={{ fontSize: "0.8rem", color: "#1e293b", fontWeight: 600 }}>Aktiv</span>
              </div>
            </div>
            {/* Footer */}
            <div style={{ padding: "1rem 1.25rem", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button type="button" onClick={() => setIsVehicleTypeModalOpen(false)} style={{ background: "transparent", border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem 1.25rem", fontSize: "0.8rem", fontWeight: 600, color: "#475569", cursor: "pointer" }}>Ləğv et</button>
              <button type="button" onClick={handleSaveVehicleType} style={{ background: "#22c55e", border: "1px solid #22c55e", borderRadius: "0.375rem", padding: "0.5rem 1.5rem", fontSize: "0.8rem", fontWeight: 600, color: "#ffffff", cursor: "pointer" }}>Yaddaşda saxlamaq</button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-modal 4: Əlavə et - Teq (Photo 4) */}
      {isTagModalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10006, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)" }} onClick={() => setIsTagModalOpen(false)} />
          <div style={{ position: "relative", background: "#f1f5f9", width: "min(96%, 420px)", borderRadius: "0.5rem", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "inherit", boxSizing: "border-box" }}>
            {/* Header */}
            <div style={{ background: "#ffffff", padding: "0.85rem 1.25rem", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#475569" }}>Əlavə et</span>
              <button type="button" onClick={() => setIsTagModalOpen(false)} style={{ background: "transparent", border: 0, cursor: "pointer", fontSize: "1.25rem", color: "#64748b", display: "flex", alignItems: "center", padding: "0.25rem" }}><FiX /></button>
            </div>
            {/* Body */}
            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", boxSizing: "border-box" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Teq <span style={{ color: "#ef4444" }}>*</span></label>
                <input type="text" value={tagModalName} onChange={(e) => setTagModalName(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", background: "#ffffff", outline: "none" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.25rem", cursor: "pointer" }} onClick={() => setTagModalActive(!tagModalActive)}>
                <div style={{ width: "18px", height: "18px", borderRadius: "4px", border: tagModalActive ? "1.5px solid #22c55e" : "1.5px solid #cbd5e1", background: tagModalActive ? "#22c55e" : "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontSize: "0.7rem", fontWeight: "bold" }}>
                  {tagModalActive && "✓"}
                </div>
                <span style={{ fontSize: "0.8rem", color: "#1e293b", fontWeight: 600 }}>Aktivdir</span>
              </div>
            </div>
            {/* Footer */}
            <div style={{ padding: "1rem 1.25rem", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button type="button" onClick={() => setIsTagModalOpen(false)} style={{ background: "transparent", border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem 1.25rem", fontSize: "0.8rem", fontWeight: 600, color: "#475569", cursor: "pointer" }}>Ləğv et</button>
              <button type="button" onClick={handleSaveTag} style={{ background: "#22c55e", border: "1px solid #22c55e", borderRadius: "0.375rem", padding: "0.5rem 1.5rem", fontSize: "0.8rem", fontWeight: 600, color: "#ffffff", cursor: "pointer" }}>Yaddaşda saxlamaq</button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-modal 5: Yeni yükləmə üsulu (Photo 5) */}
      {isLoadingMethodModalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10006, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)" }} onClick={() => setIsLoadingMethodModalOpen(false)} />
          <div style={{ position: "relative", background: "#f1f5f9", width: "min(96%, 420px)", borderRadius: "0.5rem", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "inherit", boxSizing: "border-box" }}>
            {/* Header */}
            <div style={{ background: "#ffffff", padding: "0.85rem 1.25rem", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#475569" }}>Yeni yükləmə üsulu</span>
              <button type="button" onClick={() => setIsLoadingMethodModalOpen(false)} style={{ background: "transparent", border: 0, cursor: "pointer", fontSize: "1.25rem", color: "#64748b", display: "flex", alignItems: "center", padding: "0.25rem" }}><FiX /></button>
            </div>
            {/* Body */}
            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", boxSizing: "border-box" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Adı <span style={{ color: "#ef4444" }}>*</span></label>
                <input type="text" value={loadMethodModalName} onChange={(e) => setLoadMethodModalName(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", background: "#ffffff", outline: "none" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.25rem", cursor: "pointer" }} onClick={() => setLoadMethodModalActive(!loadMethodModalActive)}>
                <div style={{ width: "18px", height: "18px", borderRadius: "4px", border: loadMethodModalActive ? "1.5px solid #22c55e" : "1.5px solid #cbd5e1", background: loadMethodModalActive ? "#22c55e" : "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontSize: "0.7rem", fontWeight: "bold" }}>
                  {loadMethodModalActive && "✓"}
                </div>
                <span style={{ fontSize: "0.8rem", color: "#1e293b", fontWeight: 600 }}>Aktiv</span>
              </div>
            </div>
            {/* Footer */}
            <div style={{ padding: "1rem 1.25rem", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button type="button" onClick={() => setIsLoadingMethodModalOpen(false)} style={{ background: "transparent", border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem 1.25rem", fontSize: "0.8rem", fontWeight: 600, color: "#475569", cursor: "pointer" }}>Ləğv et</button>
              <button type="button" onClick={handleSaveLoadingMethod} style={{ background: "#22c55e", border: "1px solid #22c55e", borderRadius: "0.375rem", padding: "0.5rem 1.5rem", fontSize: "0.8rem", fontWeight: 600, color: "#ffffff", cursor: "pointer" }}>Yaddaşda saxlamaq</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
