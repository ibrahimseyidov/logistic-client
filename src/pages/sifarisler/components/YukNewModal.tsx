import React, { useState, useEffect } from "react";
import { FiX, FiCalendar, FiClock, FiMapPin, FiPlus, FiMinus, FiUsers, FiTruck } from "react-icons/fi";
import { FaPlane, FaShip, FaTrain, FaTruck } from "react-icons/fa";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: {
    name: string;
    containerNumber: string;
    loadingNumber: string;
    temperature: string;
    isIncomplete: boolean;
    loadPlace: string;
    unloadPlace: string;
    weight: string;
    packagingType: string;
    quantity: string;
    ldm: string;
    volume: string;
    sender?: string;
    receiver?: string;
    loadDate?: string;
    unloadDate?: string;
    rawPayload?: any;
  }) => void;
  editLoad?: any;
}

interface LoadingPlace {
  id: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  coords: string;
  company: string;
  country: string;
  sender: string;
  city: string;
  postal: string;
  address: string;
  contact: string;
  saveTerminal: boolean;
}

interface UnloadingPlace {
  id: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  coords: string;
  company: string;
  country: string;
  receiver: string;
  city: string;
  postal: string;
  address: string;
  contact: string;
  saveTerminal: boolean;
}

interface CustomsPlace {
  id: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  coords: string;
  company: string;
  country: string;
  city: string;
  postal: string;
  address: string;
  contact: string;
  saveTerminal: boolean;
}

interface CargoParamRow {
  id: string;
  weight: string;
  packagingType: string;
  quantity: string;
  ldm: string;
  volume: string;
  length: string;
  width: string;
  height: string;
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
        gap: "0.75rem",
        background: "transparent",
        border: 0,
        padding: "0.5rem 0",
        cursor: "pointer",
        alignSelf: "flex-start",
        outline: "none",
      }}
    >
      <div
        style={{
          width: "20px",
          height: "20px",
          border: "1.5px solid #3b82f6",
          borderRadius: "4px",
          background: "#eff6ff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#3b82f6",
          fontSize: "1rem",
          fontWeight: "bold",
        }}
      >
        +
      </div>
      <span
        style={{
          fontSize: "0.9rem",
          fontWeight: 700,
          color: "#475569",
        }}
      >
        {label}
      </span>
    </button>
  );
}

export default function YukNewModal({ isOpen, onClose, onConfirm, editLoad }: Props) {
  // General Info
  const [name, setName] = useState("");
  const [containerNumber, setContainerNumber] = useState("Dəyəri seçin");
  const [loadingNumber, setLoadingNumber] = useState("");
  const [temperature, setTemperature] = useState("");
  const [isIncomplete, setIsIncomplete] = useState(false);

  // Dynamic state arrays
  const [loadingPlaces, setLoadingPlaces] = useState<LoadingPlace[]>([
    {
      id: "lp-1",
      startDate: "", endDate: "", startTime: "", endTime: "", coords: "",
      company: "Limon Dental MMC", country: "Azerbaijan", sender: "Azerbaijan",
      city: "Bakı", postal: "", address: "Samad Vurgun, Baku", contact: "", saveTerminal: false
    }
  ]);

  const [unloadingPlaces, setUnloadingPlaces] = useState<UnloadingPlace[]>([
    {
      id: "up-1",
      startDate: "", endDate: "", startTime: "", endTime: "", coords: "",
      company: "", country: "Dəyəri seçin", receiver: "Dəyəri seçin",
      city: "", postal: "", address: "", contact: "", saveTerminal: false
    }
  ]);

  const [loadingCustoms, setLoadingCustoms] = useState<CustomsPlace[]>([]);
  const [unloadingCustoms, setUnloadingCustoms] = useState<CustomsPlace[]>([
    {
      id: "uc-1",
      startDate: "", endDate: "", startTime: "", endTime: "", coords: "",
      company: "", country: "Dəyəri seçin",
      city: "", postal: "", address: "", contact: "", saveTerminal: false
    }
  ]);

  const [parameters, setParameters] = useState<CargoParamRow[]>([
    {
      id: "param-1",
      weight: "",
      packagingType: "Dəyəri seçin",
      quantity: "",
      ldm: "",
      volume: "",
      length: "",
      width: "",
      height: "",
    }
  ]);

  useEffect(() => {
    if (isOpen && editLoad) {
      setName(editLoad.name || "");
      setContainerNumber(editLoad.containerNumber || "Dəyəri seçin");
      setLoadingNumber(editLoad.rawPayload?.loadingNumber || editLoad.loadingNumber || "");
      setTemperature(editLoad.rawPayload?.temperature || editLoad.temperature || "");
      setIsIncomplete(editLoad.rawPayload?.isIncomplete || editLoad.isIncomplete || false);
      if (editLoad.rawPayload?.loadingPlaces) {
        setLoadingPlaces(editLoad.rawPayload.loadingPlaces);
      } else {
        setLoadingPlaces([
          {
            id: "lp-1",
            startDate: editLoad.loadDate !== "—" ? editLoad.loadDate : "", endDate: "", startTime: "", endTime: "", coords: "",
            company: editLoad.sender !== "—" ? editLoad.sender : "", country: "Dəyəri seçin", sender: "Dəyəri seçin",
            city: "", postal: "", address: editLoad.loadPlace !== "—" ? editLoad.loadPlace : "", contact: "", saveTerminal: false
          }
        ]);
      }
      if (editLoad.rawPayload?.unloadingPlaces) {
        setUnloadingPlaces(editLoad.rawPayload.unloadingPlaces);
      } else {
        setUnloadingPlaces([
          {
            id: "up-1",
            startDate: editLoad.unloadDate !== "—" ? editLoad.unloadDate : "", endDate: "", startTime: "", endTime: "", coords: "",
            company: editLoad.receiver !== "—" ? editLoad.receiver : "", country: "Dəyəri seçin", receiver: "Dəyəri seçin",
            city: "", postal: "", address: editLoad.unloadPlace !== "—" ? editLoad.unloadPlace : "", contact: "", saveTerminal: false
          }
        ]);
      }
      if (editLoad.rawPayload?.loadingCustoms) {
        setLoadingCustoms(editLoad.rawPayload.loadingCustoms);
      }
      if (editLoad.rawPayload?.unloadingCustoms) {
        setUnloadingCustoms(editLoad.rawPayload.unloadingCustoms);
      }
      if (editLoad.rawPayload?.parameters) {
        setParameters(editLoad.rawPayload.parameters);
      }
    } else if (isOpen && !editLoad) {
      setName("");
      setContainerNumber("Dəyəri seçin");
      setLoadingNumber("");
      setTemperature("");
      setIsIncomplete(false);
      setLoadingPlaces([
        {
          id: "lp-1",
          startDate: "", endDate: "", startTime: "", endTime: "", coords: "",
          company: "Limon Dental MMC", country: "Azerbaijan", sender: "Azerbaijan",
          city: "Bakı", postal: "", address: "Samad Vurgun, Baku", contact: "", saveTerminal: false
        }
      ]);
      setUnloadingPlaces([
        {
          id: "up-1",
          startDate: "", endDate: "", startTime: "", endTime: "", coords: "",
          company: "", country: "Dəyəri seçin", receiver: "Dəyəri seçin",
          city: "", postal: "", address: "", contact: "", saveTerminal: false
        }
      ]);
      setLoadingCustoms([]);
      setUnloadingCustoms([
        {
          id: "uc-1",
          startDate: "", endDate: "", startTime: "", endTime: "", coords: "",
          company: "", country: "Dəyəri seçin",
          city: "", postal: "", address: "", contact: "", saveTerminal: false
        }
      ]);
      setParameters([
        {
          id: "param-1",
          weight: "",
          packagingType: "Dəyəri seçin",
          quantity: "",
          ldm: "",
          volume: "",
          length: "",
          width: "",
          height: "",
        }
      ]);
    }
  }, [isOpen, editLoad]);

  // Option lists
  const [countries, setCountries] = useState<string[]>(["Germany", "Azerbaijan", "Turkey", "Georgia"]);
  const [senders, setSenders] = useState<string[]>(["Ziyafreight Sender", "Limon Dental MMC", "Baku Express"]);
  const [receivers, setReceivers] = useState<string[]>(["Ziyafreight Receiver", "Baku Retail Group", "Azeri Logistics"]);

  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [activeTransport, setActiveTransport] = useState<string>("truck");

  // Add Handlers
  const addLoadingPlace = () => {
    const newLp: LoadingPlace = {
      id: `lp-${Date.now()}`,
      startDate: "", endDate: "", startTime: "", endTime: "", coords: "",
      company: "", country: "Dəyəri seçin", sender: "Dəyəri seçin",
      city: "", postal: "", address: "", contact: "", saveTerminal: false
    };
    setLoadingPlaces([...loadingPlaces, newLp]);
  };

  const addUnloadingPlace = () => {
    const newUp: UnloadingPlace = {
      id: `up-${Date.now()}`,
      startDate: "", endDate: "", startTime: "", endTime: "", coords: "",
      company: "", country: "Dəyəri seçin", receiver: "Dəyəri seçin",
      city: "", postal: "", address: "", contact: "", saveTerminal: false
    };
    setUnloadingPlaces([...unloadingPlaces, newUp]);
  };

  const addLoadingCustoms = () => {
    const newCustoms: CustomsPlace = {
      id: `lc-${Date.now()}`,
      startDate: "", endDate: "", startTime: "", endTime: "", coords: "",
      company: "", country: "Dəyəri seçin",
      city: "", postal: "", address: "", contact: "", saveTerminal: false
    };
    setLoadingCustoms([...loadingCustoms, newCustoms]);
  };

  const addUnloadingCustoms = () => {
    const newCustoms: CustomsPlace = {
      id: `uc-${Date.now()}`,
      startDate: "", endDate: "", startTime: "", endTime: "", coords: "",
      company: "", country: "Dəyəri seçin",
      city: "", postal: "", address: "", contact: "", saveTerminal: false
    };
    setUnloadingCustoms([...unloadingCustoms, newCustoms]);
  };

  const addParameter = () => {
    const newParam: CargoParamRow = {
      id: `param-${Date.now()}`,
      weight: "",
      packagingType: "Dəyəri seçin",
      quantity: "",
      ldm: "",
      volume: "",
      length: "",
      width: "",
      height: "",
    };
    setParameters([...parameters, newParam]);
  };

  // State modification helper functions
  const updateLoadingPlace = (id: string, key: keyof LoadingPlace, val: any) => {
    setLoadingPlaces(loadingPlaces.map(item => item.id === id ? { ...item, [key]: val } : item));
  };

  const updateUnloadingPlace = (id: string, key: keyof UnloadingPlace, val: any) => {
    setUnloadingPlaces(unloadingPlaces.map(item => item.id === id ? { ...item, [key]: val } : item));
  };

  const updateLoadingCustoms = (id: string, key: keyof CustomsPlace, val: any) => {
    setLoadingCustoms(loadingCustoms.map(item => item.id === id ? { ...item, [key]: val } : item));
  };

  const updateUnloadingCustoms = (id: string, key: keyof CustomsPlace, val: any) => {
    setUnloadingCustoms(unloadingCustoms.map(item => item.id === id ? { ...item, [key]: val } : item));
  };

  const updateParameter = (id: string, key: keyof CargoParamRow, val: any) => {
    setParameters(parameters.map(item => item.id === id ? { ...item, [key]: val } : item));
  };

  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [countryModalTarget, setCountryModalTarget] = useState<{ itemId: string; isCustoms: boolean; isUnloading: boolean } | null>(null);

  // Form fields for Yarat modal (Country Yarat)
  const [newCountryName, setNewCountryName] = useState("");
  const [newCountryIso, setNewCountryIso] = useState("");
  const [isEurope, setIsEurope] = useState(false);
  const [isDefault, setIsDefault] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [parentCountry, setParentCountry] = useState("Dəyəri seçin");

  const handleAddCountry = (itemId: string, isCustoms: boolean, isUnloading: boolean) => {
    setCountryModalTarget({ itemId, isCustoms, isUnloading });
    setNewCountryName("");
    setNewCountryIso("");
    setIsEurope(false);
    setIsDefault(false);
    setIsActive(true);
    setParentCountry("Dəyəri seçin");
    setIsCountryModalOpen(true);
  };

  const [partnerMenuTarget, setPartnerMenuTarget] = useState<{ itemId: string; isReceiver: boolean } | null>(null);
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [partnerModalType, setPartnerModalType] = useState<"client" | "carrier">("client");
  const [partnerActiveTab, setPartnerActiveTab] = useState<"general" | "contact" | "finance">("general");

  // General Tab States
  const [partnerFullName, setPartnerFullName] = useState("");
  const [partnerAbbrevName, setPartnerAbbrevName] = useState("");
  const [partnerType, setPartnerType] = useState("Yeni müştəri");
  const [partnerVoen, setPartnerVoen] = useState("");
  const [partnerEdqn, setPartnerEdqn] = useState("");
  const [partnerBin, setPartnerBin] = useState("");
  const [partnerActivityType, setPartnerActivityType] = useState("Dəyəri seçin");
  const [partnerVoun, setPartnerVoun] = useState("");
  const [partnerMtut, setPartnerMtut] = useState("");
  const [partnerUak, setPartnerUak] = useState("");
  const [partnerVatCode, setPartnerVatCode] = useState("");
  const [partnerCreationDate, setPartnerCreationDate] = useState("27.05.2026");
  const [partnerLang, setPartnerLang] = useState("Dəyəri seçin");
  const [partnerManagers, setPartnerManagers] = useState<string[]>(["Ulvi Adilzade"]);
  const [partnerPermitted, setPartnerPermitted] = useState(true);
  const [partnerExtraInfo, setPartnerExtraInfo] = useState("");

  // Contact Tab States
  const [legalCountry, setLegalCountry] = useState("Dəyəri seçin");
  const [legalCity, setLegalCity] = useState("");
  const [legalStreet, setLegalStreet] = useState("");
  const [legalZip, setLegalZip] = useState("");
  const [legalTel, setLegalTel] = useState("");
  const [legalFax, setLegalFax] = useState("");
  const [legalEmail, setLegalEmail] = useState("");
  const [legalWeb, setLegalWeb] = useState("");

  const [postalCountry, setPostalCountry] = useState("Dəyəri seçin");
  const [postalCity, setPostalCity] = useState("");
  const [postalStreet, setPostalStreet] = useState("");
  const [postalZip, setPostalZip] = useState("");
  const [postalTel, setPostalTel] = useState("");
  const [postalFax, setPostalFax] = useState("");
  const [postalEmail, setPostalEmail] = useState("");
  const [postalWeb, setPostalWeb] = useState("");

  // Finance Tab States
  const [financeCurrency, setFinanceCurrency] = useState("Dəyəri seçin");
  const [financeAccount, setFinanceAccount] = useState("");
  const [financeBank, setFinanceBank] = useState("Dəyəri seçin");
  const [financeTransitAccount, setFinanceTransitAccount] = useState("");
  const [financeCorrBank, setFinanceCorrBank] = useState("Dəyəri seçin");
  const [financeCorrAccount, setFinanceCorrAccount] = useState("");
  const [financeDelay, setFinanceDelay] = useState("");
  const [financeDelayTerms, setFinanceDelayTerms] = useState("B/k 30 təqvim günü.");
  const [financeDocTerms, setFinanceDocTerms] = useState("Hesabın, aktın və qəbul edən tərəfindən təsdiqlənmiş CMR-in orijinallarını aldıqdan sonra 30 təq");
  const [financeCreditLimit, setFinanceCreditLimit] = useState("");
  const [financeEmailDocs, setFinanceEmailDocs] = useState("");
  const [financeSendReminders, setFinanceSendReminders] = useState(true);

  // Bank Add Sub-modal States
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [bankInformalName, setBankInformalName] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankBranch, setBankBranch] = useState("");
  const [bankMmt, setBankMmt] = useState("");
  const [bankSwift, setBankSwift] = useState("");
  const [bankCountry, setBankCountry] = useState("Dəyəri seçin");
  const [bankCity, setBankCity] = useState("");
  const [bankAddress, setBankAddress] = useState("");
  const [bankZip, setBankZip] = useState("");

  const [banks, setBanks] = useState<string[]>(["AccessBank", "Pasha Bank", "Kapital Bank", "ABB"]);

  const handleAddSender = (itemId: string) => {
    setPartnerMenuTarget({ itemId, isReceiver: false });
  };

  const handleAddReceiver = (itemId: string) => {
    setPartnerMenuTarget({ itemId, isReceiver: true });
  };

  const handleOpenPartnerModal = (type: "client" | "carrier") => {
    setPartnerModalType(type);
    setPartnerActiveTab("general");

    // Clear all states
    setPartnerFullName("");
    setPartnerAbbrevName("");
    setPartnerType(type === "client" ? "Yeni müştəri" : "Yeni daşıyıcı");
    setPartnerVoen("");
    setPartnerEdqn("");
    setPartnerBin("");
    setPartnerActivityType("Dəyəri seçin");
    setPartnerVoun("");
    setPartnerMtut("");
    setPartnerUak("");
    setPartnerVatCode("");
    setPartnerCreationDate("27.05.2026");
    setPartnerLang("Dəyəri seçin");
    setPartnerManagers(["Ulvi Adilzade"]);
    setPartnerPermitted(true);
    setPartnerExtraInfo("");

    setLegalCountry("Dəyəri seçin");
    setLegalCity("");
    setLegalStreet("");
    setLegalZip("");
    setLegalTel("");
    setLegalFax("");
    setLegalEmail("");
    setLegalWeb("");

    setPostalCountry("Dəyəri seçin");
    setPostalCity("");
    setPostalStreet("");
    setPostalZip("");
    setPostalTel("");
    setPostalFax("");
    setPostalEmail("");
    setPostalWeb("");

    setFinanceCurrency("Dəyəri seçin");
    setFinanceAccount("");
    setFinanceBank("Dəyəri seçin");
    setFinanceTransitAccount("");
    setFinanceCorrBank("Dəyəri seçin");
    setFinanceCorrAccount("");
    setFinanceDelay("");
    setFinanceDelayTerms("B/k 30 təqvim günü.");
    setFinanceDocTerms("Hesabın, aktın və qəbul edən tərəfindən təsdiqlənmiş CMR-in orijinallarını aldıqdan sonra 30 təq");
    setFinanceCreditLimit("");
    setFinanceEmailDocs("");
    setFinanceSendReminders(true);

    setIsPartnerModalOpen(true);
    setPartnerMenuTarget(null);
  };

  const handleSaveCountry = () => {
    if (!newCountryName.trim()) {
      alert("Adı mütləq daxil edilməlidir!");
      return;
    }
    const trimmed = newCountryName.trim();
    if (!countries.includes(trimmed)) {
      setCountries([...countries, trimmed]);
    }
    if (countryModalTarget) {
      const { itemId, isCustoms, isUnloading } = countryModalTarget;
      if (isCustoms) {
        if (isUnloading) {
          updateUnloadingCustoms(itemId, "country", trimmed);
        } else {
          updateLoadingCustoms(itemId, "country", trimmed);
        }
      } else {
        if (isUnloading) {
          updateUnloadingPlace(itemId, "country", trimmed);
        } else {
          updateLoadingPlace(itemId, "country", trimmed);
        }
      }
    }
    setIsCountryModalOpen(false);
  };

  const handleSaveBank = () => {
    if (!bankName.trim()) {
      alert("Bank adı mütləq daxil edilməlidir!");
      return;
    }
    const bankVal = bankName.trim();
    if (!banks.includes(bankVal)) {
      setBanks([...banks, bankVal]);
    }
    setFinanceBank(bankVal);
    setIsBankModalOpen(false);
  };

  const handleSavePartner = () => {
    const finalName = partnerAbbrevName.trim() || partnerFullName.trim();
    if (!finalName) {
      alert("Adı (qısaldılmış və ya tam) mütləq daxil edilməlidir!");
      return;
    }

    if (partnerMenuTarget) {
      const { itemId, isReceiver } = partnerMenuTarget;
      if (isReceiver) {
        if (!receivers.includes(finalName)) {
          setReceivers([...receivers, finalName]);
        }
        updateUnloadingPlace(itemId, "receiver", finalName);
      } else {
        if (!senders.includes(finalName)) {
          setSenders([...senders, finalName]);
        }
        updateLoadingPlace(itemId, "sender", finalName);
      }
    }
    setIsPartnerModalOpen(false);
  };

  const handleSave = () => {
    const firstLp = loadingPlaces[0];
    const firstUp = unloadingPlaces[0];
    const firstParam = parameters[0];

    const loadAddressString = firstLp?.company
      ? `${firstLp.company}, ${firstLp.address || firstLp.city || "Germany"}`
      : "Germany, Rietheim-Weilheim, DE 78604 Rietheim-Weilheim";

    const unloadAddressString = firstUp?.company
      ? `${firstUp.company}, ${firstUp.address || firstUp.city || "Baku"}`
      : "Azerbaijan, Baku";

    onConfirm({
      name: name || "General cargo",
      containerNumber: containerNumber !== "Dəyəri seçin" ? containerNumber : "—",
      loadingNumber: loadingNumber || "—",
      temperature: temperature || "—",
      isIncomplete,
      loadPlace: loadAddressString,
      unloadPlace: unloadAddressString,
      weight: firstParam?.weight || "4",
      packagingType: firstParam?.packagingType !== "Dəyəri seçin" ? firstParam.packagingType : "General cargo",
      quantity: firstParam?.quantity || "1",
      ldm: firstParam?.ldm || "4",
      volume: firstParam?.volume || "0.0219",
      sender: firstLp?.company || "Limon Dental MMC",
      receiver: firstUp?.company || "Samad Vurgun, Baku",
      loadDate: firstLp?.startDate || "—",
      unloadDate: firstUp?.startDate || "—",
    });
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
      {/* Backdrop blur overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(15, 23, 42, 0.35)",
          backdropFilter: "blur(4px)",
        }}
        onClick={onClose}
      />

      {/* Main Container */}
      <div
        style={{
          position: "relative",
          background: "#ffffff",
          border: "1px solid #cbd5e1",
          borderRadius: "0.75rem",
          width: "min(96%, 1240px)",
          height: "92vh",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
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
          <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "#1e293b" }}>
            Yeni yük
          </h3>
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
              transition: "color 0.2s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = "#1e293b")}
            onMouseOut={(e) => (e.currentTarget.style.color = "#64748b")}
          >
            <FiX />
          </button>
        </div>

        {/* Tab Selection */}
        <div style={{ padding: "0 1.75rem", background: "#ffffff", borderBottom: "1px solid #f1f5f9" }}>
          <button
            type="button"
            style={{
              background: "transparent",
              border: 0,
              borderBottom: "3px solid #3b82f6",
              color: "#3b82f6",
              padding: "0.75rem 0.25rem",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            Əsas məlumatlar
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "1.5rem 1.75rem",
            background: "#ffffff",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
          }}
        >
          {/* Section 1: General Information Row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.3fr 1fr 1fr 0.8fr auto",
              gap: "1rem",
              alignItems: "end",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b" }}>
                Yükün adı <span style={{ cursor: "help", color: "#94a3b8", fontWeight: 700 }} title="Yük adı haqqında köməkçi məlumat">?</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", color: "#1e293b", outline: "none", width: "100%", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b" }}>Konteynerin nömrəsi</label>
              <select
                value={containerNumber}
                onChange={(e) => setContainerNumber(e.target.value)}
                style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", color: "#1e293b", outline: "none", background: "#ffffff", width: "100%", height: "32px", boxSizing: "border-box" }}
              >
                <option value="Dəyəri seçin">Dəyəri seçin</option>
                <option value="40FT-CONT">40FT Container</option>
                <option value="20FT-CONT">20FT Container</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b" }}>Yükləmə nömrəsi</label>
              <input
                type="text"
                value={loadingNumber}
                onChange={(e) => setLoadingNumber(e.target.value)}
                style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", color: "#1e293b", outline: "none", width: "100%", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b" }}>Temperatur</label>
              <input
                type="text"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", color: "#1e293b", outline: "none", width: "100%", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", paddingBottom: "0.5rem" }}>
              <input
                type="checkbox"
                id="incomplete_box"
                checked={isIncomplete}
                onChange={(e) => setIsIncomplete(e.target.checked)}
                style={{ width: "1rem", height: "1rem", cursor: "pointer" }}
              />
              <label htmlFor="incomplete_box" style={{ fontSize: "0.8rem", fontWeight: 600, color: "#1e293b", cursor: "pointer" }}>
                Natamam yük
              </label>
            </div>
          </div>

          <hr style={{ border: 0, borderBottom: "1px solid #f1f5f9", margin: 0 }} />

          {/* Section 2: Loading Places (Yükləmə Yeri) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#475569" }}>
                  Yükləmə yeri
                </span>
                <span style={{ color: "#3b82f6", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>
                  Müştərinin məlumatları
                </span>
              </div>
              {loadingPlaces.length > 0 && (
                <button
                  type="button"
                  onClick={addLoadingPlace}
                  style={{
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    borderRadius: "4px",
                    padding: "0.25rem 0.5rem",
                    color: "#3b82f6",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem"
                  }}
                >
                  <FiPlus /> Əlavə et
                </button>
              )}
            </div>

            {loadingPlaces.length === 0 ? (
              <SquarePlusTrigger label="Yükləmə yeri" onClick={addLoadingPlace} />
            ) : (
              loadingPlaces.map((lp) => (
                <div key={lp.id} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", background: "#f8fafc", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #f1f5f9" }}>
                  {/* Delete button (Solid Red circle with minus) */}
                  <button
                    type="button"
                    onClick={() => setLoadingPlaces(loadingPlaces.filter(item => item.id !== lp.id))}
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
                      marginTop: "1.5rem",
                      padding: 0,
                      fontSize: "0.75rem",
                      flexShrink: 0,
                    }}
                    title="Sil"
                  >
                    <FiMinus />
                  </button>

                  {/* 4 Column Layout Grid */}
                  <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1.2fr 1fr 0.9fr 1.5fr", gap: "1rem" }}>
                    {/* Column 1 */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Tarix</label>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.375rem" }}>
                          <div style={{ position: "relative" }}>
                            <input
                              type="text"
                              placeholder="Tarixindən"
                              value={lp.startDate}
                              onChange={(e) => updateLoadingPlace(lp.id, "startDate", e.target.value)}
                              style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.5rem 0.45rem 1.85rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }}
                            />
                            <FiCalendar style={{ position: "absolute", left: "0.55rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "0.9rem" }} />
                          </div>
                          <div style={{ position: "relative" }}>
                            <input
                              type="text"
                              placeholder="Tarixinə qədər"
                              value={lp.endDate}
                              onChange={(e) => updateLoadingPlace(lp.id, "endDate", e.target.value)}
                              style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.5rem 0.45rem 1.85rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }}
                            />
                            <FiCalendar style={{ position: "absolute", left: "0.55rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "0.9rem" }} />
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Vaxt</label>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.375rem" }}>
                          <div style={{ position: "relative" }}>
                            <input
                              type="text"
                              placeholder="Tarixindən"
                              value={lp.startTime}
                              onChange={(e) => updateLoadingPlace(lp.id, "startTime", e.target.value)}
                              style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.5rem 0.45rem 1.85rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }}
                            />
                            <FiClock style={{ position: "absolute", left: "0.55rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "0.9rem" }} />
                          </div>
                          <div style={{ position: "relative" }}>
                            <input
                              type="text"
                              placeholder="Tarixinə qədər"
                              value={lp.endTime}
                              onChange={(e) => updateLoadingPlace(lp.id, "endTime", e.target.value)}
                              style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.5rem 0.45rem 1.85rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }}
                            />
                            <FiClock style={{ position: "absolute", left: "0.55rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "0.9rem" }} />
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Coordinates</label>
                        <div style={{ position: "relative" }}>
                          <input
                            type="text"
                            value={lp.coords}
                            onChange={(e) => updateLoadingPlace(lp.id, "coords", e.target.value)}
                            style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 1.85rem 0.45rem 0.625rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }}
                          />
                          <FiMapPin style={{ position: "absolute", right: "0.55rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "0.9rem" }} />
                        </div>
                      </div>
                    </div>

                    {/* Column 2 */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Yer / Şirkət</label>
                        <input
                          type="text"
                          value={lp.company}
                          onChange={(e) => updateLoadingPlace(lp.id, "company", e.target.value)}
                          style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }}
                        />
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <LabelWithPlus label="Ölkə" onPlusClick={() => handleAddCountry(lp.id, false, false)} />
                        <select
                          value={lp.country}
                          onChange={(e) => updateLoadingPlace(lp.id, "country", e.target.value)}
                          style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", background: "#ffffff", outline: "none", boxSizing: "border-box" }}
                        >
                          <option value="Dəyəri seçin">Dəyəri seçin</option>
                          {countries.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <LabelWithPlus label="Göndərən" onPlusClick={() => handleAddSender(lp.id)} />
                        <select
                          value={lp.sender}
                          onChange={(e) => updateLoadingPlace(lp.id, "sender", e.target.value)}
                          style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", background: "#ffffff", outline: "none", boxSizing: "border-box" }}
                        >
                          <option value="Dəyəri seçin">Dəyəri seçin</option>
                          {senders.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Column 3 */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Şəhər</label>
                        <input
                          type="text"
                          value={lp.city}
                          onChange={(e) => updateLoadingPlace(lp.id, "city", e.target.value)}
                          style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }}
                        />
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Poçt kodu</label>
                        <input
                          type="text"
                          value={lp.postal}
                          onChange={(e) => updateLoadingPlace(lp.id, "postal", e.target.value)}
                          style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }}
                        />
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "1rem" }}>
                        <input
                          type="checkbox"
                          id={`lp-term-${lp.id}`}
                          checked={lp.saveTerminal}
                          onChange={(e) => updateLoadingPlace(lp.id, "saveTerminal", e.target.checked)}
                          style={{ width: "0.95rem", height: "0.95rem", cursor: "pointer" }}
                        />
                        <label htmlFor={`lp-term-${lp.id}`} style={{ fontSize: "0.75rem", fontWeight: 600, color: "#1e293b", display: "inline-flex", alignItems: "center", gap: "0.25rem", cursor: "pointer" }}>
                          Terminalı yaddaşda saxla
                          <span
                            style={{
                              cursor: "help",
                              color: "#94a3b8",
                              fontWeight: 600,
                              background: "#f1f5f9",
                              borderRadius: "50%",
                              width: "14px",
                              height: "14px",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.65rem",
                            }}
                            title="Terminalı bazada yadda saxla"
                          >
                            ?
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Column 4 */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Ünvan</label>
                        <input
                          type="text"
                          value={lp.address}
                          onChange={(e) => updateLoadingPlace(lp.id, "address", e.target.value)}
                          style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }}
                        />
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem", height: "100%" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Əlaqədar şəxs və telefon</label>
                        <div style={{ position: "relative", height: "100%" }}>
                          <textarea
                            value={lp.contact}
                            onChange={(e) => updateLoadingPlace(lp.id, "contact", e.target.value)}
                            style={{
                              border: "1px solid #cbd5e1",
                              borderRadius: "0.375rem",
                              padding: "0.45rem 0.75rem",
                              fontSize: "0.8rem",
                              width: "100%",
                              height: "76px",
                              boxSizing: "border-box",
                              outline: "none",
                              resize: "vertical",
                              fontFamily: "inherit",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Section 2B: Collapsible Yükləmə Yerinin Gömrüyü */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <SquarePlusTrigger label="Yükləmə yerinin gömrüyü" onClick={addLoadingCustoms} />

            {loadingCustoms.map((lc) => (
              <div key={lc.id} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", background: "#f1f5f9", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0" }}>
                <button
                  type="button"
                  onClick={() => setLoadingCustoms(loadingCustoms.filter(item => item.id !== lc.id))}
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
                    marginTop: "1.5rem",
                    padding: 0,
                    fontSize: "0.75rem",
                    flexShrink: 0,
                  }}
                  title="Sil"
                >
                  <FiMinus />
                </button>

                <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1.2fr 1fr 0.9fr 1.5fr", gap: "1rem" }}>
                  {/* Column 1 */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Tarix</label>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.375rem" }}>
                        <input type="text" placeholder="Tarixindən" value={lc.startDate} onChange={(e) => updateLoadingCustoms(lc.id, "startDate", e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.5rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                        <input type="text" placeholder="Tarixinə qədər" value={lc.endDate} onChange={(e) => updateLoadingCustoms(lc.id, "endDate", e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.5rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Vaxt</label>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.375rem" }}>
                        <input type="text" placeholder="Tarixindən" value={lc.startTime} onChange={(e) => updateLoadingCustoms(lc.id, "startTime", e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.5rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                        <input type="text" placeholder="Tarixinə qədər" value={lc.endTime} onChange={(e) => updateLoadingCustoms(lc.id, "endTime", e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.5rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Coordinates</label>
                      <input type="text" value={lc.coords} onChange={(e) => updateLoadingCustoms(lc.id, "coords", e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.5rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                    </div>
                  </div>

                  {/* Column 2 */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Yer / Şirkət</label>
                      <input type="text" value={lc.company} onChange={(e) => updateLoadingCustoms(lc.id, "company", e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                      <LabelWithPlus label="Ölkə" onPlusClick={() => handleAddCountry(lc.id, true, false)} />
                      <select value={lc.country} onChange={(e) => updateLoadingCustoms(lc.id, "country", e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", background: "#ffffff", outline: "none", boxSizing: "border-box" }}>
                        <option value="Dəyəri seçin">Dəyəri seçin</option>
                        {countries.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "1rem" }}>
                      <input type="checkbox" id={`lc-term-${lc.id}`} checked={lc.saveTerminal} onChange={(e) => updateLoadingCustoms(lc.id, "saveTerminal", e.target.checked)} style={{ width: "0.9rem", height: "0.9rem", cursor: "pointer" }} />
                      <label htmlFor={`lc-term-${lc.id}`} style={{ fontSize: "0.75rem", fontWeight: 600, color: "#1e293b", display: "inline-flex", alignItems: "center", gap: "0.25rem", cursor: "pointer" }}>
                        Terminalı yaddaşda saxla
                      </label>
                    </div>
                  </div>

                  {/* Column 3 */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Şəhər</label>
                      <input type="text" value={lc.city} onChange={(e) => updateLoadingCustoms(lc.id, "city", e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Poçt kodu</label>
                      <input type="text" value={lc.postal} onChange={(e) => updateLoadingCustoms(lc.id, "postal", e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                    </div>
                  </div>

                  {/* Column 4 */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Ünvan</label>
                      <input type="text" value={lc.address} onChange={(e) => updateLoadingCustoms(lc.id, "address", e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Əlaqədar şəxs və telefon</label>
                      <input type="text" value={lc.contact} onChange={(e) => updateLoadingCustoms(lc.id, "contact", e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <hr style={{ border: 0, borderBottom: "1px solid #f1f5f9", margin: 0 }} />

          {/* Section 3: Unloading Places (Boşaltma Yeri) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#475569" }}>
                  Boşaltma yeri
                </span>
                <span style={{ color: "#3b82f6", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>
                  Müştərinin məlumatları
                </span>
              </div>
              {unloadingPlaces.length > 0 && (
                <button
                  type="button"
                  onClick={addUnloadingPlace}
                  style={{
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    borderRadius: "4px",
                    padding: "0.25rem 0.5rem",
                    color: "#3b82f6",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem"
                  }}
                >
                  <FiPlus /> Əlavə et
                </button>
              )}
            </div>

            {unloadingPlaces.length === 0 ? (
              <SquarePlusTrigger label="Boşaltma yeri" onClick={addUnloadingPlace} />
            ) : (
              unloadingPlaces.map((up) => (
                <div key={up.id} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", background: "#f8fafc", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #f1f5f9" }}>
                  <button
                    type="button"
                    onClick={() => setUnloadingPlaces(unloadingPlaces.filter(item => item.id !== up.id))}
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
                      marginTop: "1.5rem",
                      padding: 0,
                      fontSize: "0.75rem",
                      flexShrink: 0,
                    }}
                    title="Sil"
                  >
                    <FiMinus />
                  </button>

                  <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1.2fr 1fr 0.9fr 1.5fr", gap: "1rem" }}>
                    {/* Column 1 */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Tarix</label>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.375rem" }}>
                          <div style={{ position: "relative" }}>
                            <input
                              type="text"
                              placeholder="Tarixindən"
                              value={up.startDate}
                              onChange={(e) => updateUnloadingPlace(up.id, "startDate", e.target.value)}
                              style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.5rem 0.45rem 1.85rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }}
                            />
                            <FiCalendar style={{ position: "absolute", left: "0.55rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "0.9rem" }} />
                          </div>
                          <div style={{ position: "relative" }}>
                            <input
                              type="text"
                              placeholder="Tarixinə qədər"
                              value={up.endDate}
                              onChange={(e) => updateUnloadingPlace(up.id, "endDate", e.target.value)}
                              style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.5rem 0.45rem 1.85rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }}
                            />
                            <FiCalendar style={{ position: "absolute", left: "0.55rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "0.9rem" }} />
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Vaxt</label>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.375rem" }}>
                          <div style={{ position: "relative" }}>
                            <input
                              type="text"
                              placeholder="Tarixindən"
                              value={up.startTime}
                              onChange={(e) => updateUnloadingPlace(up.id, "startTime", e.target.value)}
                              style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.5rem 0.45rem 1.85rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }}
                            />
                            <FiClock style={{ position: "absolute", left: "0.55rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "0.9rem" }} />
                          </div>
                          <div style={{ position: "relative" }}>
                            <input
                              type="text"
                              placeholder="Tarixinə qədər"
                              value={up.endTime}
                              onChange={(e) => updateUnloadingPlace(up.id, "endTime", e.target.value)}
                              style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.5rem 0.45rem 1.85rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }}
                            />
                            <FiClock style={{ position: "absolute", left: "0.55rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "0.9rem" }} />
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Coordinates</label>
                        <div style={{ position: "relative" }}>
                          <input
                            type="text"
                            value={up.coords}
                            onChange={(e) => updateUnloadingPlace(up.id, "coords", e.target.value)}
                            style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 1.85rem 0.45rem 0.625rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }}
                          />
                          <FiMapPin style={{ position: "absolute", right: "0.55rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "0.9rem" }} />
                        </div>
                      </div>
                    </div>

                    {/* Column 2 */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Yer / Şirkət</label>
                        <input
                          type="text"
                          value={up.company}
                          onChange={(e) => updateUnloadingPlace(up.id, "company", e.target.value)}
                          style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }}
                        />
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <LabelWithPlus label="Ölkə" onPlusClick={() => handleAddCountry(up.id, false, true)} />
                        <select
                          value={up.country}
                          onChange={(e) => updateUnloadingPlace(up.id, "country", e.target.value)}
                          style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", background: "#ffffff", outline: "none", boxSizing: "border-box" }}
                        >
                          <option value="Dəyəri seçin">Dəyəri seçin</option>
                          {countries.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <LabelWithPlus label="Alıcı" onPlusClick={() => handleAddReceiver(up.id)} />
                        <select
                          value={up.receiver}
                          onChange={(e) => updateUnloadingPlace(up.id, "receiver", e.target.value)}
                          style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", background: "#ffffff", outline: "none", boxSizing: "border-box" }}
                        >
                          <option value="Dəyəri seçin">Dəyəri seçin</option>
                          {receivers.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Column 3 */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Şəhər</label>
                        <input
                          type="text"
                          value={up.city}
                          onChange={(e) => updateUnloadingPlace(up.id, "city", e.target.value)}
                          style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }}
                        />
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Poçt kodu</label>
                        <input
                          type="text"
                          value={up.postal}
                          onChange={(e) => updateUnloadingPlace(up.id, "postal", e.target.value)}
                          style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }}
                        />
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "1rem" }}>
                        <input
                          type="checkbox"
                          id={`up-term-${up.id}`}
                          checked={up.saveTerminal}
                          onChange={(e) => updateUnloadingPlace(up.id, "saveTerminal", e.target.checked)}
                          style={{ width: "0.95rem", height: "0.95rem", cursor: "pointer" }}
                        />
                        <label htmlFor={`up-term-${up.id}`} style={{ fontSize: "0.75rem", fontWeight: 600, color: "#1e293b", display: "inline-flex", alignItems: "center", gap: "0.25rem", cursor: "pointer" }}>
                          Terminalı yaddaşda saxla
                          <span
                            style={{
                              cursor: "help",
                              color: "#94a3b8",
                              fontWeight: 600,
                              background: "#f1f5f9",
                              borderRadius: "50%",
                              width: "14px",
                              height: "14px",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.65rem",
                            }}
                            title="Terminalı bazada yadda saxla"
                          >
                            ?
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Column 4 */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Ünvan</label>
                        <input
                          type="text"
                          value={up.address}
                          onChange={(e) => updateUnloadingPlace(up.id, "address", e.target.value)}
                          style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }}
                        />
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem", height: "100%" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Əlaqədar şəxs və telefon</label>
                        <div style={{ position: "relative", height: "100%" }}>
                          <textarea
                            value={up.contact}
                            onChange={(e) => updateUnloadingPlace(up.id, "contact", e.target.value)}
                            style={{
                              border: "1px solid #cbd5e1",
                              borderRadius: "0.375rem",
                              padding: "0.45rem 0.75rem",
                              fontSize: "0.8rem",
                              width: "100%",
                              height: "76px",
                              boxSizing: "border-box",
                              outline: "none",
                              resize: "vertical",
                              fontFamily: "inherit",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Section 3B: Collapsible Boşaltma Yerinin Gömrüyü */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <SquarePlusTrigger label="Boşaltma yerinin gömrüyü" onClick={addUnloadingCustoms} />
            </div>

            {unloadingCustoms.map((uc) => (
              <div key={uc.id} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", background: "#f1f5f9", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1" }}>
                <button
                  type="button"
                  onClick={() => setUnloadingCustoms(unloadingCustoms.filter(item => item.id !== uc.id))}
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
                    marginTop: "1.5rem",
                    padding: 0,
                    fontSize: "0.75rem",
                    flexShrink: 0,
                  }}
                  title="Sil"
                >
                  <FiMinus />
                </button>

                <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1.2fr 1fr 0.9fr 1.5fr", gap: "1rem" }}>
                  {/* Column 1 */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Tarix</label>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.375rem" }}>
                        <input type="text" placeholder="Tarixindən" value={uc.startDate} onChange={(e) => updateUnloadingCustoms(uc.id, "startDate", e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.5rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                        <input type="text" placeholder="Tarixinə qədər" value={uc.endDate} onChange={(e) => updateUnloadingCustoms(uc.id, "endDate", e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.5rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Vaxt</label>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.375rem" }}>
                        <input type="text" placeholder="Tarixindən" value={uc.startTime} onChange={(e) => updateUnloadingCustoms(uc.id, "startTime", e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.5rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                        <input type="text" placeholder="Tarixinə qədər" value={uc.endTime} onChange={(e) => updateUnloadingCustoms(uc.id, "endTime", e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.5rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Coordinates</label>
                      <input type="text" value={uc.coords} onChange={(e) => updateUnloadingCustoms(uc.id, "coords", e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.5rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                    </div>
                  </div>

                  {/* Column 2 */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Yer / Şirkət</label>
                      <input type="text" value={uc.company} onChange={(e) => updateUnloadingCustoms(uc.id, "company", e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                      <LabelWithPlus label="Ölkə" onPlusClick={() => handleAddCountry(uc.id, true, true)} />
                      <select value={uc.country} onChange={(e) => updateUnloadingCustoms(uc.id, "country", e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", background: "#ffffff", outline: "none", boxSizing: "border-box" }}>
                        <option value="Dəyəri seçin">Dəyəri seçin</option>
                        {countries.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "1rem" }}>
                      <input type="checkbox" id={`uc-term-${uc.id}`} checked={uc.saveTerminal} onChange={(e) => updateUnloadingCustoms(uc.id, "saveTerminal", e.target.checked)} style={{ width: "0.9rem", height: "0.9rem", cursor: "pointer" }} />
                      <label htmlFor={`uc-term-${uc.id}`} style={{ fontSize: "0.75rem", fontWeight: 600, color: "#1e293b", display: "inline-flex", alignItems: "center", gap: "0.25rem", cursor: "pointer" }}>
                        Terminalı yaddaşda saxla
                      </label>
                    </div>
                  </div>

                  {/* Column 3 */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Şəhər</label>
                      <input type="text" value={uc.city} onChange={(e) => updateUnloadingCustoms(uc.id, "city", e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Poçt kodu</label>
                      <input type="text" value={uc.postal} onChange={(e) => updateUnloadingCustoms(uc.id, "postal", e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                    </div>
                  </div>

                  {/* Column 4 */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Ünvan</label>
                      <input type="text" value={uc.address} onChange={(e) => updateUnloadingCustoms(uc.id, "address", e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Əlaqədar şəxs və telefon</label>
                      <input type="text" value={uc.contact} onChange={(e) => updateUnloadingCustoms(uc.id, "contact", e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <hr style={{ border: 0, borderBottom: "1px solid #f1f5f9", margin: 0 }} />

          {/* Section 4: Cargo Parameters (Yükün parametrləri) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <SquarePlusTrigger label="Yükün parametrləri" onClick={addParameter} />
            </div>

            {parameters.length === 0 ? (
              <div style={{ padding: "0.5rem 0", color: "#64748b", fontStyle: "italic", fontSize: "0.8rem" }}>
                Heç bir yük parametrləri təyin edilməyib.
              </div>
            ) : (
              parameters.map((param) => (
                <div key={param.id} style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={() => setParameters(parameters.filter(item => item.id !== param.id))}
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
                    title="Sil"
                  >
                    <FiMinus />
                  </button>

                  <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1.5fr 1fr 1fr 1fr 1fr 1fr 1fr", gap: "0.5rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                      <label style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600 }}>Çəkisi</label>
                      <input type="text" value={param.weight} onChange={(e) => updateParameter(param.id, "weight", e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.4rem 0.5rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                      <label style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600 }}>Qablaşdırmanın növü</label>
                      <select value={param.packagingType} onChange={(e) => updateParameter(param.id, "packagingType", e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.4rem 0.5rem", fontSize: "0.8rem", width: "100%", background: "#ffffff", outline: "none", boxSizing: "border-box" }}>
                        <option value="Dəyəri seçin">Dəyəri seçin</option>
                        <option value="Box">Box</option>
                        <option value="Palet">Palet</option>
                      </select>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                      <label style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600 }}>Sayı</label>
                      <input type="text" value={param.quantity} onChange={(e) => updateParameter(param.id, "quantity", e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.4rem 0.5rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                      <label style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600 }}>LDM (m)</label>
                      <input type="text" value={param.ldm} onChange={(e) => updateParameter(param.id, "ldm", e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.4rem 0.5rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                      <label style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600 }}>Həcmi (m3)</label>
                      <input type="text" value={param.volume} onChange={(e) => updateParameter(param.id, "volume", e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.4rem 0.5rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                      <label style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600 }}>Uzunluğu (m)</label>
                      <input type="text" value={param.length} onChange={(e) => updateParameter(param.id, "length", e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.4rem 0.5rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                      <label style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600 }}>Eni (m)</label>
                      <input type="text" value={param.width} onChange={(e) => updateParameter(param.id, "width", e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.4rem 0.5rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                      <label style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600 }}>Hündürlüyü (m)</label>
                      <input type="text" value={param.height} onChange={(e) => updateParameter(param.id, "height", e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.4rem 0.5rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <hr style={{ border: 0, borderBottom: "1px solid #f1f5f9", margin: 0 }} />

          {/* Section 5: Additional Info trigger */}
          <button
            type="button"
            style={{
              background: "transparent",
              border: 0,
              color: "#3b82f6",
              fontWeight: 600,
              fontSize: "0.8rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              alignSelf: "flex-start",
              padding: 0,
            }}
          >
            Yük haqqında əlavə məlumat
            <span
              style={{
                color: "#94a3b8",
                fontWeight: 700,
                background: "#f1f5f9",
                borderRadius: "50%",
                width: "14px",
                height: "14px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.65rem",
              }}
            >
              ?
            </span>
          </button>
        </div>

        {/* Separator Line */}
        <div style={{ padding: "0 1.75rem" }}>
          <div style={{ borderBottom: "1px dashed #bfdbfe", width: "100%" }} />
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "1rem 1.75rem",
            background: "#ffffff",
            borderTop: "1px solid #f1f5f9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* Left: Template checkbox */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input
              type="checkbox"
              id="template_check"
              checked={saveAsTemplate}
              onChange={(e) => setSaveAsTemplate(e.target.checked)}
              style={{ width: "1rem", height: "1rem", cursor: "pointer" }}
            />
            <label htmlFor="template_check" style={{ fontSize: "0.8rem", fontWeight: 600, color: "#1e293b", cursor: "pointer" }}>
              Şablon kimi yaddaşda saxla
            </label>
          </div>

          {/* Right: Actions and Transport options */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button
              type="button"
              onClick={handleSave}
              style={{
                background: "#3b82f6",
                border: "1px solid #3b82f6",
                borderRadius: "0.375rem",
                padding: "0.55rem 1.5rem",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "#ffffff",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "#2563eb")}
              onMouseOut={(e) => (e.currentTarget.style.background = "#3b82f6")}
            >
              Yaddaşda saxlamaq
            </button>

            {/* Transport Icon Grid */}
            <div style={{ display: "flex", gap: "0.375rem" }}>
              {[
                { id: "plane", icon: <FaPlane /> },
                { id: "ship", icon: <FaShip /> },
                { id: "train", icon: <FaTrain /> },
                { id: "truck", icon: <FaTruck /> },
              ].map((mode) => {
                const isActive = activeTransport === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setActiveTransport(mode.id)}
                    style={{
                      border: "1px solid #cbd5e1",
                      background: isActive ? "#eff6ff" : "#ffffff",
                      color: isActive ? "#3b82f6" : "#64748b",
                      borderRadius: "0.375rem",
                      padding: "0.5rem",
                      fontSize: "0.9rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {mode.icon}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Sub-modal for Country Creation ("Yarat") */}
      {isCountryModalOpen && (
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
          {/* Backdrop blur */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(15, 23, 42, 0.4)",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setIsCountryModalOpen(false)}
          />

          {/* Centered Modal Card */}
          <div
            style={{
              position: "relative",
              background: "#f8fafc",
              border: "1px solid #cbd5e1",
              borderRadius: "0.75rem",
              width: "min(92%, 580px)",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.05)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              fontFamily: "inherit",
              padding: "1.5rem 1.75rem",
              gap: "1.25rem",
              boxSizing: "border-box",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#475569" }}>Yarat</span>
              <button
                type="button"
                onClick={() => setIsCountryModalOpen(false)}
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

            {/* Inputs: Adı and ISO Kodu side-by-side */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748b" }}>
                  Adı <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Daxil edin"
                  value={newCountryName}
                  onChange={(e) => setNewCountryName(e.target.value)}
                  style={{
                    border: "1px solid #cbd5e1",
                    borderRadius: "0.375rem",
                    padding: "0.55rem 0.75rem",
                    fontSize: "0.85rem",
                    outline: "none",
                    background: "#ffffff",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748b" }}>
                  ISO kodu <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Daxil edin"
                  value={newCountryIso}
                  onChange={(e) => setNewCountryIso(e.target.value)}
                  style={{
                    border: "1px solid #cbd5e1",
                    borderRadius: "0.375rem",
                    padding: "0.55rem 0.75rem",
                    fontSize: "0.85rem",
                    outline: "none",
                    background: "#ffffff",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* Checkboxes Row */}
            <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", marginTop: "0.25rem" }}>
              {/* Avropa ölkələri */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }} onClick={() => setIsEurope(!isEurope)}>
                <div style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "4px",
                  border: "1.5px solid #cbd5e1",
                  background: isEurope ? "#3b82f6" : "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontSize: "0.7rem",
                  fontWeight: "bold",
                }}>
                  {isEurope && "✓"}
                </div>
                <span style={{ fontSize: "0.8rem", color: "#1e293b", fontWeight: 600 }}>Avropa ölkələri</span>
              </div>

              {/* Susmaya görə ölkə */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }} onClick={() => setIsDefault(!isDefault)}>
                <div style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "4px",
                  border: "1.5px solid #cbd5e1",
                  background: isDefault ? "#3b82f6" : "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontSize: "0.7rem",
                  fontWeight: "bold",
                }}>
                  {isDefault && "✓"}
                </div>
                <span style={{ fontSize: "0.8rem", color: "#1e293b", fontWeight: 600 }}>Susmaya görə ölkə</span>
              </div>

              {/* Aktiv */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }} onClick={() => setIsActive(!isActive)}>
                <div style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "4px",
                  border: isActive ? "1.5px solid #22c55e" : "1.5px solid #cbd5e1",
                  background: isActive ? "#22c55e" : "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontSize: "0.7rem",
                  fontWeight: "bold",
                }}>
                  {isActive && "✓"}
                </div>
                <span style={{ fontSize: "0.8rem", color: "#1e293b", fontWeight: 600 }}>Aktiv</span>
              </div>
            </div>

            {/* Ölkələr select field */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", width: "60%" }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748b" }}>Ölkələr</label>
              <select
                value={parentCountry}
                onChange={(e) => setParentCountry(e.target.value)}
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: "0.375rem",
                  padding: "0.5rem 0.75rem",
                  fontSize: "0.85rem",
                  outline: "none",
                  background: "#ffffff",
                  color: "#1e293b",
                  width: "100%",
                }}
              >
                <option value="Dəyəri seçin">Dəyəri seçin</option>
                {countries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Action buttons at the bottom of Yarat sub-modal */}
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
              <button
                type="button"
                onClick={() => setIsCountryModalOpen(false)}
                style={{
                  background: "transparent",
                  border: "1px solid #cbd5e1",
                  borderRadius: "0.375rem",
                  padding: "0.5rem 1.25rem",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "#64748b",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
              >
                Ləğv et
              </button>

              <button
                type="button"
                onClick={handleSaveCountry}
                style={{
                  background: "#3b82f6",
                  border: "1px solid #3b82f6",
                  borderRadius: "0.375rem",
                  padding: "0.5rem 1.5rem",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "#ffffff",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = "#2563eb")}
                onMouseOut={(e) => (e.currentTarget.style.background = "#3b82f6")}
              >
                Yadda saxla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Popover Dropdown Selection Menu (Photo 1) */}
      {partnerMenuTarget && (
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
          {/* Backdrop */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(15, 23, 42, 0.15)",
            }}
            onClick={() => setPartnerMenuTarget(null)}
          />

          {/* Floating Dropdown Context Box */}
          <div
            style={{
              position: "relative",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "0.5rem",
              width: "280px",
              boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              padding: "0.5rem 0",
              fontFamily: "inherit",
            }}
          >
            {/* Create a client Option */}
            <button
              type="button"
              onClick={() => handleOpenPartnerModal("client")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                background: "transparent",
                border: 0,
                padding: "0.75rem 1.25rem",
                width: "100%",
                textAlign: "left",
                cursor: "pointer",
                color: "#475569",
                fontSize: "1.05rem",
                fontWeight: 600,
                transition: "background-color 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <FiUsers style={{ fontSize: "1.45rem", color: "#64748b" }} />
              Create a client
            </button>

            {/* Create a carrier Option */}
            <button
              type="button"
              onClick={() => handleOpenPartnerModal("carrier")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                background: "transparent",
                border: 0,
                padding: "0.75rem 1.25rem",
                width: "100%",
                textAlign: "left",
                cursor: "pointer",
                color: "#475569",
                fontSize: "1.05rem",
                fontWeight: 600,
                transition: "background-color 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <FiTruck style={{ fontSize: "1.45rem", color: "#64748b" }} />
              Create a carrier
            </button>
          </div>
        </div>
      )}

      {/* Dynamic 3-Tab Master Modal for Client & Carrier Creation (Photo 2, 3, 4) */}
      {isPartnerModalOpen && (
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
          {/* Backdrop blur */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(15, 23, 42, 0.4)",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setIsPartnerModalOpen(false)}
          />

          {/* Centered Modal Card */}
          <div
            style={{
              position: "relative",
              background: "#f8fafc",
              border: "1px solid #cbd5e1",
              borderRadius: "0.75rem",
              width: "min(96%, 1120px)",
              height: "88vh",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              fontFamily: "inherit",
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
                {partnerModalType === "client" ? "Yeni müştəri" : "Yeni daşıyıcı"}
              </span>
              <button
                type="button"
                onClick={() => setIsPartnerModalOpen(false)}
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
                { id: "contact", label: "Əlaqə məlumatları" },
                { id: "finance", label: "Maliyyələr" },
              ].map((tab) => {
                const isActive = partnerActiveTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPartnerActiveTab(tab.id as any)}
                    style={{
                      background: "transparent",
                      border: 0,
                      borderBottom: isActive ? "3px solid #3b82f6" : "3px solid transparent",
                      color: isActive ? "#3b82f6" : "#64748b",
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
              }}
            >
              {/* TAB 1: Əsas Məlumatlar (Photo 2) */}
              {partnerActiveTab === "general" && (
                <div style={{ display: "grid", gridTemplateColumns: "1.1fr auto 1fr", gap: "1.5rem", alignItems: "stretch" }}>
                  {/* Left Column: Şirkətin rekvizitləri */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <h4 style={{ margin: "0 0 0.25rem 0", fontSize: "0.9rem", fontWeight: 700, color: "#475569" }}>
                      Şirkətin rekvizitləri
                    </h4>

                    {/* Name full */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Name (full)</label>
                      <input
                        type="text"
                        placeholder="Limited liability company"
                        value={partnerFullName}
                        onChange={(e) => setPartnerFullName(e.target.value)}
                        style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none", background: "#ffffff" }}
                      />
                    </div>

                    {/* Name abbreviated and Fəaliyyət növü side-by-side */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>
                          Name (abbreviated) <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="LLC Company Name"
                          value={partnerAbbrevName}
                          onChange={(e) => setPartnerAbbrevName(e.target.value)}
                          style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none", background: "#ffffff" }}
                        />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Fəaliyyət növü</label>
                        <select
                          value={partnerActivityType}
                          onChange={(e) => setPartnerActivityType(e.target.value)}
                          style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", background: "#ffffff", outline: "none", boxSizing: "border-box" }}
                        >
                          <option value="Dəyəri seçin">Dəyəri seçin</option>
                          <option value="Logistika">Logistika</option>
                          <option value="İstehsalat">İstehsalat</option>
                        </select>
                      </div>
                    </div>

                    {/* Müştəri tipi and VÖUN/UMTVDR/VATNº side-by-side */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Müştəri tipi</label>
                        <select
                          value={partnerType}
                          onChange={(e) => setPartnerType(e.target.value)}
                          style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", background: "#ffffff", outline: "none", boxSizing: "border-box" }}
                        >
                          <option value="Yeni müştəri">Yeni müştəri</option>
                          <option value="Daimi müştəri">Daimi müştəri</option>
                        </select>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>VÖUN/UMTVDR/VATNº</label>
                        <input
                          type="text"
                          value={partnerVoun}
                          onChange={(e) => setPartnerVoun(e.target.value)}
                          style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none", background: "#ffffff" }}
                        />
                      </div>
                    </div>

                    {/* VÖEN and MTÜT side-by-side */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>VÖEN</label>
                        <input
                          type="text"
                          value={partnerVoen}
                          onChange={(e) => setPartnerVoen(e.target.value)}
                          style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none", background: "#ffffff" }}
                        />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>MTÜT</label>
                        <input
                          type="text"
                          value={partnerMtut}
                          onChange={(e) => setPartnerMtut(e.target.value)}
                          style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none", background: "#ffffff" }}
                        />
                      </div>
                    </div>

                    {/* ƏDQN and UAK side-by-side */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>ƏDQN</label>
                        <input
                          type="text"
                          value={partnerEdqn}
                          onChange={(e) => setPartnerEdqn(e.target.value)}
                          style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none", background: "#ffffff" }}
                        />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>UAK</label>
                        <input
                          type="text"
                          value={partnerUak}
                          onChange={(e) => setPartnerUak(e.target.value)}
                          style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none", background: "#ffffff" }}
                        />
                      </div>
                    </div>

                    {/* BİN and Ödəyicinin ƏDV kodu side-by-side */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>BİN</label>
                        <input
                          type="text"
                          value={partnerBin}
                          onChange={(e) => setPartnerBin(e.target.value)}
                          style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none", background: "#ffffff" }}
                        />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Ödəyicinin ƏDV kodu</label>
                        <input
                          type="text"
                          value={partnerVatCode}
                          onChange={(e) => setPartnerVatCode(e.target.value)}
                          style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none", background: "#ffffff" }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Vertical dashed divider */}
                  <div style={{ borderLeft: "1px dashed #cbd5e1", margin: "0 0.5rem" }} />

                  {/* Right Column: Client settings */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <h4 style={{ margin: "0 0 0.25rem 0", fontSize: "0.9rem", fontWeight: 700, color: "#475569" }}>
                      {partnerModalType === "client" ? "Client settings" : "Carrier settings"}
                    </h4>

                    {/* Yaradılması tarixi and Language side-by-side */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Yaradılması tarixi</label>
                        <div style={{ position: "relative" }}>
                          <input
                            type="text"
                            value={partnerCreationDate}
                            onChange={(e) => setPartnerCreationDate(e.target.value)}
                            style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 2rem 0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none", background: "#ffffff" }}
                          />
                          <FiCalendar style={{ position: "absolute", right: "0.6rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Language of notifications</label>
                        <select
                          value={partnerLang}
                          onChange={(e) => setPartnerLang(e.target.value)}
                          style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", background: "#ffffff", outline: "none", boxSizing: "border-box" }}
                        >
                          <option value="Dəyəri seçin">Dəyəri seçin</option>
                          <option value="Azerbaijan">Azerbaijan</option>
                          <option value="English">English</option>
                        </select>
                      </div>
                    </div>

                    {/* Menecerlər tag pill list */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Menecerlər</label>
                      <div
                        style={{
                          border: "1px solid #cbd5e1",
                          borderRadius: "0.375rem",
                          padding: "0.35rem 0.5rem",
                          background: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          minHeight: "32px",
                        }}
                      >
                        <div style={{ display: "flex", gap: "0.25rem" }}>
                          {partnerManagers.map((m) => (
                            <span
                              key={m}
                              style={{
                                background: "#f1f5f9",
                                border: "1px solid #cbd5e1",
                                borderRadius: "4px",
                                padding: "1px 6px",
                                fontSize: "0.75rem",
                                color: "#475569",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.25rem",
                              }}
                            >
                              <span style={{ cursor: "pointer", fontWeight: "bold" }} onClick={() => setPartnerManagers([])}>×</span>
                              {m}
                            </span>
                          ))}
                        </div>
                        <span style={{ fontSize: "0.75rem", color: "#94a3b8", cursor: "pointer", padding: "0 0.25rem" }} onClick={() => setPartnerManagers([])}>×</span>
                      </div>
                    </div>

                    {/* İşə icazə verilmişdir Checkbox */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem", cursor: "pointer" }} onClick={() => setPartnerPermitted(!partnerPermitted)}>
                      <div
                        style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "4px",
                          border: partnerPermitted ? "1.5px solid #22c55e" : "1.5px solid #cbd5e1",
                          background: partnerPermitted ? "#22c55e" : "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#ffffff",
                          fontSize: "0.7rem",
                          fontWeight: "bold",
                        }}
                      >
                        {partnerPermitted && "✓"}
                      </div>
                      <span style={{ fontSize: "0.8rem", color: "#1e293b", fontWeight: 600 }}>
                        İşə icazə verilmişdir
                      </span>
                    </div>

                    {/* Əlavə məlumat */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", marginTop: "0.25rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Əlavə məlumat</label>
                      <textarea
                        value={partnerExtraInfo}
                        onChange={(e) => setPartnerExtraInfo(e.target.value)}
                        style={{
                          border: "1px solid #cbd5e1",
                          borderRadius: "0.375rem",
                          padding: "0.45rem 0.75rem",
                          fontSize: "0.8rem",
                          width: "100%",
                          height: "100px",
                          boxSizing: "border-box",
                          outline: "none",
                          background: "#ffffff",
                          resize: "none",
                          fontFamily: "inherit",
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Əlaqə məlumatları (Photo 3) */}
              {partnerActiveTab === "contact" && (
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
                        <select value={legalCountry} onChange={(e) => setLegalCountry(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.4rem 0.5rem", fontSize: "0.8rem", width: "100%", background: "#ffffff", outline: "none", boxSizing: "border-box" }}>
                          <option value="Dəyəri seçin">Dəyəri seçin</option>
                          {countries.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Şəhər</label>
                        <input type="text" value={legalCity} onChange={(e) => setLegalCity(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.4rem 0.5rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Ünvan</label>
                        <input type="text" value={legalStreet} onChange={(e) => setLegalStreet(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.4rem 0.5rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Poçt kodu</label>
                        <input type="text" value={legalZip} onChange={(e) => setLegalZip(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.4rem 0.5rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Telefon</label>
                        <input type="text" value={legalTel} onChange={(e) => setLegalTel(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.4rem 0.5rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Faks</label>
                        <input type="text" value={legalFax} onChange={(e) => setLegalFax(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.4rem 0.5rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>El.poçt</label>
                        <input type="text" value={legalEmail} onChange={(e) => setLegalEmail(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.4rem 0.5rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Sayt</label>
                        <input type="text" value={legalWeb} onChange={(e) => setLegalWeb(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.4rem 0.5rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
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
                        <select value={postalCountry} onChange={(e) => setPostalCountry(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.4rem 0.5rem", fontSize: "0.8rem", width: "100%", background: "#ffffff", outline: "none", boxSizing: "border-box" }}>
                          <option value="Dəyəri seçin">Dəyəri seçin</option>
                          {countries.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Şəhər</label>
                        <input type="text" value={postalCity} onChange={(e) => setPostalCity(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.4rem 0.5rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Ünvan</label>
                        <input type="text" value={postalStreet} onChange={(e) => setPostalStreet(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.4rem 0.5rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Poçt kodu</label>
                        <input type="text" value={postalZip} onChange={(e) => setPostalZip(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.4rem 0.5rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Telefon</label>
                        <input type="text" value={postalTel} onChange={(e) => setPostalTel(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.4rem 0.5rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Faks</label>
                        <input type="text" value={postalFax} onChange={(e) => setPostalFax(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.4rem 0.5rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>El.poçt</label>
                        <input type="text" value={postalEmail} onChange={(e) => setPostalEmail(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.4rem 0.5rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Sayt</label>
                        <input type="text" value={postalWeb} onChange={(e) => setPostalWeb(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.4rem 0.5rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Maliyyələr (Photo 4) */}
              {partnerActiveTab === "finance" && (
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
                          <select value={financeCurrency} onChange={(e) => setFinanceCurrency(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.4rem 0.5rem", fontSize: "0.8rem", width: "100%", background: "#ffffff", outline: "none", boxSizing: "border-box" }}>
                            <option value="Dəyəri seçin">Dəyəri ...</option>
                            <option value="AZN">AZN</option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                          </select>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                          <label style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600 }}>Hesablaşma hesabı</label>
                          <input type="text" value={financeAccount} onChange={(e) => setFinanceAccount(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.4rem 0.5rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                          <LabelWithPlus label="Bank" onPlusClick={() => setIsBankModalOpen(true)} />
                          <select value={financeBank} onChange={(e) => setFinanceBank(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.4rem 0.5rem", fontSize: "0.8rem", width: "100%", background: "#ffffff", outline: "none", boxSizing: "border-box" }}>
                            <option value="Dəyəri seçin">Dəyəri seçin</option>
                            {banks.map((b) => <option key={b} value={b}>{b}</option>)}
                          </select>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                          <label style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600 }}>Tranzit hesab</label>
                          <input type="text" value={financeTransitAccount} onChange={(e) => setFinanceTransitAccount(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.4rem 0.5rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                          <LabelWithPlus label="Müxbir bank" onPlusClick={() => setIsBankModalOpen(true)} />
                          <select value={financeCorrBank} onChange={(e) => setFinanceCorrBank(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.4rem 0.5rem", fontSize: "0.8rem", width: "100%", background: "#ffffff", outline: "none", boxSizing: "border-box" }}>
                            <option value="Dəyəri seçin">Dəyəri seçin</option>
                            {banks.map((b) => <option key={b} value={b}>{b}</option>)}
                          </select>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                          <label style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600 }}>Müxbir hesab</label>
                          <input type="text" value={financeCorrAccount} onChange={(e) => setFinanceCorrAccount(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.4rem 0.5rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none" }} />
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
                        <input type="text" value={financeDelay} onChange={(e) => setFinanceDelay(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none", background: "#ffffff" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Ödənişlərin təxirə salınması şərtləri</label>
                        <select value={financeDelayTerms} onChange={(e) => setFinanceDelayTerms(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", background: "#ffffff", outline: "none", boxSizing: "border-box" }}>
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
                      value={financeDocTerms}
                      onChange={(e) => setFinanceDocTerms(e.target.value)}
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

                  {/* Credit limit, Email, Checkbox */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1.3fr", gap: "1rem", alignItems: "end" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Kredit limiti</label>
                      <input type="text" value={financeCreditLimit} onChange={(e) => setFinanceCreditLimit(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none", background: "#ffffff" }} />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Sənədlərin göndərilməsi üçün el.poçt</label>
                        <span style={{ cursor: "help", color: "#94a3b8", fontWeight: 700, fontSize: "0.7rem" }} title="Maliyyə sənədlərinin gedəcəyi ünvan">?</span>
                      </div>
                      <input type="text" value={financeEmailDocs} onChange={(e) => setFinanceEmailDocs(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box", outline: "none", background: "#ffffff" }} />
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", paddingBottom: "0.5rem" }} onClick={() => setFinanceSendReminders(!financeSendReminders)}>
                      <div
                        style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "4px",
                          border: financeSendReminders ? "1.5px solid #22c55e" : "1.5px solid #cbd5e1",
                          background: financeSendReminders ? "#22c55e" : "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#ffffff",
                          fontSize: "0.7rem",
                          fontWeight: "bold",
                        }}
                      >
                        {financeSendReminders && "✓"}
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
                onClick={() => setIsPartnerModalOpen(false)}
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
                onClick={handleSavePartner}
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
        </div>
      )}

      {/* Dynamic Sub-modal for Bank Addition (Photo 5) */}
      {isBankModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10002,
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
            onClick={() => setIsBankModalOpen(false)}
          />

          {/* Centered Modal Card */}
          <div
            style={{
              position: "relative",
              background: "#f8fafc",
              border: "1px solid #cbd5e1",
              borderRadius: "0.75rem",
              width: "min(92%, 580px)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              fontFamily: "inherit",
              padding: "1.5rem 1.75rem",
              gap: "1.25rem",
              boxSizing: "border-box",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#475569" }}>Bankı əlavə et</span>
              <button
                type="button"
                onClick={() => setIsBankModalOpen(false)}
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

            {/* Form Fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {/* Qeyri-rəsmi adı */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748b" }}>Qeyri-rəsmi adı</label>
                <input
                  type="text"
                  value={bankInformalName}
                  onChange={(e) => setBankInformalName(e.target.value)}
                  style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem 0.75rem", fontSize: "0.85rem", outline: "none", background: "#ffffff", width: "100%", boxSizing: "border-box" }}
                />
              </div>

              {/* Adı and Filial side-by-side */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748b" }}>
                    Adı <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem 0.75rem", fontSize: "0.85rem", outline: "none", background: "#ffffff", width: "100%", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748b" }}>Filial</label>
                  <input
                    type="text"
                    value={bankBranch}
                    onChange={(e) => setBankBranch(e.target.value)}
                    style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem 0.75rem", fontSize: "0.85rem", outline: "none", background: "#ffffff", width: "100%", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              {/* MMT and SWIFT side-by-side */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748b" }}>MMT (BİK, BLZ)</label>
                  <input
                    type="text"
                    value={bankMmt}
                    onChange={(e) => setBankMmt(e.target.value)}
                    style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem 0.75rem", fontSize: "0.85rem", outline: "none", background: "#ffffff", width: "100%", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748b" }}>SWIFT</label>
                  <input
                    type="text"
                    value={bankSwift}
                    onChange={(e) => setBankSwift(e.target.value)}
                    style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem 0.75rem", fontSize: "0.85rem", outline: "none", background: "#ffffff", width: "100%", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              {/* Ölkə and Şəhər side-by-side */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748b" }}>Ölkə</label>
                  <select
                    value={bankCountry}
                    onChange={(e) => setBankCountry(e.target.value)}
                    style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem 0.75rem", fontSize: "0.85rem", outline: "none", background: "#ffffff", width: "100%", boxSizing: "border-box", height: "36px" }}
                  >
                    <option value="Dəyəri seçin">Dəyəri seçin</option>
                    {countries.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748b" }}>Şəhər</label>
                  <input
                    type="text"
                    value={bankCity}
                    onChange={(e) => setBankCity(e.target.value)}
                    style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem 0.75rem", fontSize: "0.85rem", outline: "none", background: "#ffffff", width: "100%", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              {/* Ünvan and Poçt kodu side-by-side */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748b" }}>Ünvan</label>
                  <input
                    type="text"
                    value={bankAddress}
                    onChange={(e) => setBankAddress(e.target.value)}
                    style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem 0.75rem", fontSize: "0.85rem", outline: "none", background: "#ffffff", width: "100%", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748b" }}>Poçt kodu</label>
                  <input
                    type="text"
                    value={bankZip}
                    onChange={(e) => setBankZip(e.target.value)}
                    style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem 0.75rem", fontSize: "0.85rem", outline: "none", background: "#ffffff", width: "100%", boxSizing: "border-box" }}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
              <button
                type="button"
                onClick={() => setIsBankModalOpen(false)}
                style={{
                  background: "transparent",
                  border: "1px solid #cbd5e1",
                  borderRadius: "0.375rem",
                  padding: "0.5rem 1.25rem",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "#64748b",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
              >
                Ləğv et
              </button>

              <button
                type="button"
                onClick={handleSaveBank}
                style={{
                  background: "#22c55e",
                  border: "1px solid #22c55e",
                  borderRadius: "0.375rem",
                  padding: "0.5rem 1.5rem",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "#ffffff",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = "#16a34a")}
                onMouseOut={(e) => (e.currentTarget.style.background = "#22c55e")}
              >
                Yaddaşda saxlamaq
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
