"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import * as Popover from "@radix-ui/react-popover";
import {
  FiArrowLeft,
  FiBox,
  FiTruck,
  FiDollarSign,
  FiFileText,
  FiFile,
  FiMessageSquare,
  FiCheckSquare,
  FiClock,
  FiTrash2,
  FiPaperclip,
  FiBookOpen,
  FiCopy,
  FiEye,
  FiUser,
  FiCheck,
  FiPlus,
  FiCalendar,
  FiX
} from "react-icons/fi";
import axios from "axios";
import { ENDPOINTS } from "../../../services/EndpointResources.g";
import type { SifarisOrderRow, OrderStatusKind } from "../types/sifaris.types";
import SifarisEditModal from "../components/SifarisEditModal";
import YukNewModal from "../components/YukNewModal";
import YukViewModal from "../components/YukViewModal";
import ReysViewModal from "../components/ReysViewModal";
import ReysEditModal from "../components/ReysEditModal";
import ReysDeleteModal from "../components/ReysDeleteModal";
import styles from "./page.module.css";

// Helper components for key-value layout
function DlRow({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) {
  return (
    <div className={styles.dlRow}>
      <span className={styles.dlLabel}>{label}</span>
      <span className={styles.dlValue}>
        {value === undefined || value === null || value === "" ? (
          <span style={{ color: "#cbd5e1" }}>—</span>
        ) : (
          value
        )}
      </span>
    </div>
  );
}

const countries = ["Azerbaijan", "Germany", "Turkey", "Georgia", "Russia"];
const banks = ["ABB Bank", "Kapital Bank", "Pasha Bank", "Unibank"];

const LabelWithPlus = ({ label, onPlusClick }: { label: string; onPlusClick?: () => void }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
    <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>{label}</span>
    {onPlusClick && (
      <button type="button" onClick={onPlusClick} style={{ background: "transparent", border: 0, padding: 0, color: "#3b82f6", cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold" }}>+</button>
    )}
  </div>
);

export default function SifarisDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<SifarisOrderRow[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isYukModalOpen, setIsYukModalOpen] = useState(false);

  const [loadsList, setLoadsList] = useState<Array<{
    id: string;
    number: string;
    name: string;
    containerNumber: string;
    params: string;
    sender: string;
    loadPlace: string;
    loadDate: string;
    receiver: string;
    unloadPlace: string;
    unloadDate: string;
    voyage: string;
    rawPayload?: any;
  }>>([]);

  const [selectedLoadForView, setSelectedLoadForView] = useState<any | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedLoadForEdit, setSelectedLoadForEdit] = useState<any | null>(null);
  const [isYukEditModalOpen, setIsYukEditModalOpen] = useState(false);

  // Finance States
  const [financeTransactions, setFinanceTransactions] = useState<Array<{
    id: string;
    name: string;
    partner: string;
    tarifPrice: string;
    tarifCurrency: string;
    tarifAzn: string;
    edvliTarifPrice: string;
    edvliTarifCurrency: string;
    edvliTarifAzn: string;
    mesarifPrice: string;
    mesarifCurrency: string;
    edvliMesarifPrice: string;
    edvliMesarifCurrency: string;
    profit: string;
    user: string;
    invoiceWritten: boolean;
    invoiceReceived: boolean;
    costDate: string;
  }>>([]);

  const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] = useState(false);
  const [selectedTxForEdit, setSelectedTxForEdit] = useState<any | null>(null);

  // Nested Finance Modals States
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isExpenseCategoryModalOpen, setIsExpenseCategoryModalOpen] = useState(false);
  const [isPartnerMenuOpen, setIsPartnerMenuOpen] = useState(false);
  const [partnerMenuCoords, setPartnerMenuCoords] = useState<{ x: number; y: number } | null>(null);
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [newCountryName, setNewCountryName] = useState("");
  const [newCountryIso, setNewCountryIso] = useState("");
  const [isEuropeCountry, setIsEuropeCountry] = useState(false);
  const [isDefaultCountry, setIsDefaultCountry] = useState(false);
  const [isActiveCountry, setIsActiveCountry] = useState(true);
  const [parentCountry, setParentCountry] = useState("Dəyəri seçin");
  const [partnerModalType, setPartnerModalType] = useState<"client" | "carrier">("client");
  const [partnerActiveTab, setPartnerActiveTab] = useState<"general" | "contact" | "finance">("general");

  // High-fidelity Documents Sub-tabs and lists
  const [docsActiveSubTab, setDocsActiveSubTab] = useState<"aktlar" | "fotos" | "requested">("aktlar");
  const [isNewActModalOpen, setIsNewActModalOpen] = useState(false);
  const [isNewDocModalOpen, setIsNewDocModalOpen] = useState(false);
  const [isEditDocModalOpen, setIsEditDocModalOpen] = useState(false);
  const [selectedDocForEdit, setSelectedDocForEdit] = useState<any | null>(null);
  const [docToDelete, setDocToDelete] = useState<any | null>(null);
  const [isDocDeleteConfirmOpen, setIsDocDeleteConfirmOpen] = useState(false);

  // Acts (Aktlar) List
  const [aktlarList, setAktlarList] = useState<Array<{
    id: string;
    company: string;
    type: string;
    template: string;
    number: string;
    date: string;
    name: string;
    hasValidity: boolean;
    isContract: boolean;
    isSendNotif: boolean;
    noSeals: boolean;
    provideAccess: boolean;
    comments: string;
  }>>([
    {
      id: "1",
      company: "Ziyafreight",
      type: "Sənədin şablonu",
      template: "Dəyəri seçin",
      number: "ACT-001",
      date: "27.05.2026",
      name: "Təhvil-təslim aktı",
      hasValidity: false,
      isContract: true,
      isSendNotif: false,
      noSeals: false,
      provideAccess: false,
      comments: ""
    }
  ]);

  // Photos (Fotoşəkillər) List
  const [fotosList, setFotosList] = useState<Array<{
    id: string;
    name: string;
    url: string;
    size: string;
    createdAt: string;
  }>>([]);

  // Requested Documents List
  const [requestedDocsList, setRequestedDocsList] = useState<Array<{
    id: string;
    name: string;
    comments: string;
    createdAt: string;
    isAvailableToCustomer: boolean;
    isAvailableToCarrier: boolean;
    sendNotif: boolean;
    type: string;
    template: string;
  }>>([
    {
      id: "1",
      name: "Daşıma məlumatları",
      comments: "",
      createdAt: "21.05.2026",
      isAvailableToCustomer: false,
      isAvailableToCarrier: false,
      sendNotif: false,
      type: "Sənədin şablonu",
      template: "Dəyəri seçin"
    }
  ]);

  // Form states for New Act Modal
  const [newActCompany, setNewActCompany] = useState("Ziyafreight");
  const [newActType, setNewActType] = useState("Sənədin şablonu");
  const [newActTemplate, setNewActTemplate] = useState("Dəyəri seçin");
  const [newActNumber, setNewActNumber] = useState("");
  const [newActDate, setNewActDate] = useState("27.05.2026");
  const [newActName, setNewActName] = useState("");
  const [newActHasValidity, setNewActHasValidity] = useState(false);
  const [newActIsContract, setNewActIsContract] = useState(true);
  const [newActIsSendNotif, setNewActIsSendNotif] = useState(false);
  const [newActNoSeals, setNewActNoSeals] = useState(false);
  const [newActProvideAccess, setNewActProvideAccess] = useState(false);
  const [newActComments, setNewActComments] = useState("");

  // Form states for New Document Modal
  const [newDocName, setNewDocName] = useState("");
  const [newDocDate, setNewDocDate] = useState("27.05.2026");
  const [newDocProvideAccessCustomer, setNewDocProvideAccessCustomer] = useState(false);
  const [newDocProvideAccessCarrier, setNewDocProvideAccessCarrier] = useState(false);
  const [newDocComments, setNewDocComments] = useState("");
  const [newDocLink, setNewDocLink] = useState("");

  // Form states for Edit Document Modal
  const [editDocType, setEditDocType] = useState("Sənədin şablonu");
  const [editDocTemplate, setEditDocTemplate] = useState("Dəyəri seçin");
  const [editDocName, setEditDocName] = useState("");
  const [editDocProvideAccessCustomer, setEditDocProvideAccessCustomer] = useState(false);
  const [editDocProvideAccessCarrier, setEditDocProvideAccessCarrier] = useState(false);
  const [editDocSendNotif, setEditDocSendNotif] = useState(false);
  const [editDocComments, setEditDocComments] = useState("");

  // Full-fidelity partner modal states
  const [partnerFullName, setPartnerFullName] = useState("");
  const [partnerAbbrevName, setPartnerAbbrevName] = useState("");
  const [partnerType, setPartnerType] = useState("Yeni müştəri");
  const [partnerActivityType, setPartnerActivityType] = useState("Dəyəri seçin");
  const [partnerVoun, setPartnerVoun] = useState("");
  const [partnerVoen, setPartnerVoen] = useState("");
  const [partnerMtut, setPartnerMtut] = useState("");
  const [partnerEdqn, setPartnerEdqn] = useState("");
  const [partnerUak, setPartnerUak] = useState("");
  const [partnerBin, setPartnerBin] = useState("");
  const [partnerVatCode, setPartnerVatCode] = useState("");
  const [partnerCreationDate, setPartnerCreationDate] = useState("27.05.2026");
  const [partnerLang, setPartnerLang] = useState("Dəyəri seçin");
  const [partnerManagers, setPartnerManagers] = useState<string[]>(["Ulvi Adilzade"]);
  const [partnerPermitted, setPartnerPermitted] = useState(true);
  const [partnerExtraInfo, setPartnerExtraInfo] = useState("");

  // Contact tab states
  const [legalCountry, setLegalCountry] = useState("Dəyəri seçin");
  const [legalCity, setLegalCity] = useState("");
  const [legalStreet, setLegalStreet] = useState("");
  const [legalZip, setLegalZip] = useState("");
  const [legalTel, setLegalTel] = useState("");
  const [legalFax, setLegalFax] = useState("");
  const [legalEmail, setLegalEmail] = useState("");
  const [legalWeb, setLegalWeb] = useState("");
  const [physicalCountry, setPhysicalCountry] = useState("Dəyəri seçin");
  const [physicalCity, setPhysicalCity] = useState("");
  const [physicalStreet, setPhysicalStreet] = useState("");
  const [physicalZip, setPhysicalZip] = useState("");

  // Finance tab states
  const [bankAccounts, setBankAccounts] = useState<Array<{
    id: string;
    currency: string;
    account: string;
    bank: string;
    transitAccount: string;
    corrBank: string;
    corrAccount: string;
  }>>([
    {
      id: "1",
      currency: "Dəyəri ...",
      account: "",
      bank: "Dəyəri seçin",
      transitAccount: "",
      corrBank: "Dəyəri seçin",
      corrAccount: ""
    }
  ]);
  const [financeDelay, setFinanceDelay] = useState("");
  const [financeDelayTerms, setFinanceDelayTerms] = useState("B/k 30 təqvim günü.");
  const [financeDocTerms, setFinanceDocTerms] = useState("Hesabın, aktın və qəbul edən tərəfindən təsdiqlənmiş CMR-in orijinallarını aldıqdan sonra 30 təq");
  const [financeCreditLimit, setFinanceCreditLimit] = useState("");
  const [financeEmailDocs, setFinanceEmailDocs] = useState("");
  const [financeSendReminders, setFinanceSendReminders] = useState(true);

  // Template Modal Fields States
  const [tplPartner, setTplPartner] = useState("Dəyəri seçin");
  const [tplName, setTplName] = useState("");
  const [tplCategory, setTplCategory] = useState("Order expenses");
  const [tplCalcType, setTplCalcType] = useState("ƏDV-siz qiymət");

  const [tplRevQty, setTplRevQty] = useState("1");
  const [tplRevPrice, setTplRevPrice] = useState("0");
  const [tplRevTarif, setTplRevTarif] = useState("0");
  const [tplRevVatRate, setTplRevVatRate] = useState("20%");
  const [tplRevCurrency, setTplRevCurrency] = useState("AZN");

  const [tplExpQty, setTplExpQty] = useState("1");
  const [tplExpPrice, setTplExpPrice] = useState("0");
  const [tplExpMesarif, setTplExpMesarif] = useState("0");
  const [tplExpVatRate, setTplExpVatRate] = useState("20%");
  const [tplExpCurrency, setTplExpCurrency] = useState("AZN");

  const [tplExclude, setTplExclude] = useState(false);
  const [tplSeparate, setTplSeparate] = useState(false);

  // Category Modal Fields States
  const [catName, setCatName] = useState("");
  const [catActive, setCatActive] = useState(true);
  const [catDefault, setCatDefault] = useState(false);

  const [txTemplate, setTxTemplate] = useState("Dəyəri seçin");
  const [txUser, setTxUser] = useState("Ulvi Adilzade");
  const [txCalcType, setTxCalcType] = useState("ƏDV-siz qiymət");
  const [txCategory, setTxCategory] = useState("Order expenses");
  const [txInvoiceReceived, setTxInvoiceReceived] = useState("Dəyəri seçin");
  const [txName, setTxName] = useState("");

  const [txRevQty, setTxRevQty] = useState("1");
  const [txRevPrice, setTxRevPrice] = useState("0");
  const [txRevTarif, setTxRevTarif] = useState("0");
  const [txRevVatRate, setTxRevVatRate] = useState("0%");
  const [txRevCurrency, setTxRevCurrency] = useState("AZN");

  const [txExpQty, setTxExpQty] = useState("1");
  const [txExpPrice, setTxExpPrice] = useState("0");
  const [txExpMesarif, setTxExpMesarif] = useState("0");
  const [txExpVatRate, setTxExpVatRate] = useState("0%");
  const [txExpCurrency, setTxExpCurrency] = useState("AZN");

  const [txDescription, setTxDescription] = useState("");
  const [txExcludeFromFinance, setTxExcludeFromFinance] = useState(false);
  const [txSeparateInvoiceLine, setTxSeparateInvoiceLine] = useState(false);

  // Auto computations
  useEffect(() => {
    const qty = parseFloat(txRevQty) || 0;
    const price = parseFloat(txRevPrice) || 0;
    setTxRevTarif((qty * price).toFixed(2));
  }, [txRevQty, txRevPrice]);

  useEffect(() => {
    const qty = parseFloat(txExpQty) || 0;
    const price = parseFloat(txExpPrice) || 0;
    setTxExpMesarif((qty * price).toFixed(2));
  }, [txExpQty, txExpPrice]);

  useEffect(() => {
    const qty = parseFloat(tplRevQty) || 0;
    const price = parseFloat(tplRevPrice) || 0;
    setTplRevTarif((qty * price).toFixed(0));
  }, [tplRevQty, tplRevPrice]);

  useEffect(() => {
    const qty = parseFloat(tplExpQty) || 0;
    const price = parseFloat(tplExpPrice) || 0;
    setTplExpMesarif((qty * price).toFixed(0));
  }, [tplExpQty, tplExpPrice]);

  const handleSavePartner = () => {
    setIsPartnerModalOpen(false);
  };

  const handleAddInvoiceRow = () => {
    setInvoiceRows([
      ...invoiceRows,
      {
        id: String(Date.now() + Math.random()),
        text: "",
        unit: "Marşrut",
        qty: 1,
        price: 0,
        vatRate: "0%"
      }
    ]);
  };

  const handleRemoveInvoiceRow = (id: string) => {
    if (invoiceRows.length > 1) {
      setInvoiceRows(invoiceRows.filter(r => r.id !== id));
    } else {
      alert("Ən azı bir hesab sətri olmalıdır!");
    }
  };

  const handleSaveInvoice = () => {
    if (!invoiceNumber.trim()) {
      alert("Lütfən hesab nömrəsini daxil edin!");
      return;
    }
    const newInvoice = {
      id: String(Date.now()),
      number: invoiceNumber,
      date: invoiceDate,
      payer: invoicePayer,
      amount: `${invoiceVatIncluded} ${invoiceCurrency}`,
      status: "Gözlənilir",
      type: invoicesSubTab,
      template: invoiceTemplate,
      contract: invoiceContract,
      creator: invoiceCreator,
      lang: invoiceLang,
      delayDays: invoiceDelayDays,
      payUntil: invoicePayUntilDate,
      splitRule: invoiceSplitRule,
      vatExempt: invoiceVatExempt,
      vatIncluded: invoiceVatIncluded,
      currency: invoiceCurrency,
      executor: invoiceExecutor,
      calcType: invoiceCalcType,
      rateDate: invoiceRateDate,
      useNonStandard: invoiceUseNonStandard,
      noStampSign: invoiceNoStampSign,
      sendNotif: invoiceSendNotif,
      rows: invoiceRows
    };
    setInvoicesList([...invoicesList, newInvoice]);
    setIsNewInvoiceModalOpen(false);
    // Reset form states
    setInvoiceNumber("");
  };

  const handleEditTransaction = (tx: any) => {
    setSelectedTxForEdit(tx);
    setTxName(tx.name);
    setTxUser(tx.user);
    setTxRevQty("1");
    setTxRevPrice(tx.tarifPrice || "0");
    setTxRevCurrency(tx.tarifCurrency || "AZN");
    setTxExpQty("1");
    setTxExpPrice(tx.mesarifPrice || "0");
    setTxExpCurrency(tx.mesarifCurrency || "AZN");
    setIsAddTransactionModalOpen(true);
  };

  const handleSaveTransaction = () => {
    if (!txName.trim()) {
      alert("Lütfən adı daxil edin!");
      return;
    }

    let profitVal = 0;
    const rev = parseFloat(txRevTarif) || 0;
    const exp = parseFloat(txExpMesarif) || 0;
    const revAzn = txRevCurrency === "USD" ? rev * 1.7 : rev;
    const expAzn = txExpCurrency === "USD" ? exp * 1.7 : exp;
    profitVal = revAzn - expAzn;

    if (selectedTxForEdit) {
      const updateData = {
        name: txName,
        user: txUser,
        tarifPrice: txRevTarif,
        tarifCurrency: txRevCurrency,
        tarifAzn: revAzn.toFixed(2),
        edvliTarifPrice: txRevTarif,
        edvliTarifCurrency: txRevCurrency,
        edvliTarifAzn: revAzn.toFixed(2),
        mesarifPrice: txExpMesarif !== "0.00" ? txExpMesarif : "",
        mesarifCurrency: txExpMesarif !== "0.00" ? txExpCurrency : "",
        edvliMesarifPrice: txExpMesarif !== "0.00" ? txExpMesarif : "",
        edvliMesarifCurrency: txExpMesarif !== "0.00" ? txExpCurrency : "",
        profit: `${profitVal.toFixed(2)} AZN`,
      };
      axios.put(ENDPOINTS.FINANCE.BASE + "/" + selectedTxForEdit.id, updateData, { headers: { Authorization: "Bearer " + localStorage.getItem("token") } })
        .then(res => {
          setFinanceTransactions(financeTransactions.map(t => t.id === selectedTxForEdit.id ? res.data : t));
        })
        .catch(console.error);
    } else {
      const newTx = {
        orderId: order.id,
        name: txName,
        partner: "Müştəri",
        tarifPrice: txRevTarif,
        tarifCurrency: txRevCurrency,
        tarifAzn: revAzn.toFixed(2),
        edvliTarifPrice: txRevTarif,
        edvliTarifCurrency: txRevCurrency,
        edvliTarifAzn: revAzn.toFixed(2),
        mesarifPrice: txExpMesarif !== "0.00" ? txExpMesarif : "",
        mesarifCurrency: txExpMesarif !== "0.00" ? txExpCurrency : "",
        edvliMesarifPrice: txExpMesarif !== "0.00" ? txExpMesarif : "",
        edvliMesarifCurrency: txExpMesarif !== "0.00" ? txExpCurrency : "",
        profit: `${profitVal.toFixed(2)} AZN`,
        user: txUser,
        invoiceWritten: false,
        invoiceReceived: false,
        costDate: new Date().toLocaleDateString("az-AZ")
      };
      axios.post(ENDPOINTS.FINANCE.BASE, newTx, { headers: { Authorization: "Bearer " + localStorage.getItem("token") } })
        .then(res => {
          setFinanceTransactions([...financeTransactions, res.data]);
        })
        .catch(console.error);
    }

    setIsAddTransactionModalOpen(false);
    setSelectedTxForEdit(null);
    setTxName("");
    setTxRevQty("1");
    setTxRevPrice("0");
    setTxExpQty("1");
    setTxExpPrice("0");
    setTxDescription("");
  };


  const [voyagesList, setVoyagesList] = useState<Array<{
    id: string;
    number: string;
    tags: string;
    sender: string;
    loadPlace: string;
    receiver: string;
    unloadPlace: string;
    status: string;
    loadDate: string;
    unloadDate: string;
    price: string;
    carrier: string;
    carNumber: string;
    expeditor: string;
    invoices: string;
    loads: string;
    rawPayload?: any;
  }>>([]);

  const [selectedVoyageForView, setSelectedVoyageForView] = useState<any | null>(null);
  const [isVoyageViewOpen, setIsVoyageViewOpen] = useState(false);
  const [selectedVoyageForEdit, setSelectedVoyageForEdit] = useState<any | null>(null);
  const [isVoyageEditOpen, setIsVoyageEditOpen] = useState(false);
  const [selectedVoyageForDelete, setSelectedVoyageForDelete] = useState<any | null>(null);
  const [isVoyageDeleteOpen, setIsVoyageDeleteOpen] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get(ENDPOINTS.ORDERS.BASE, {
          headers: { Authorization: "Bearer " + localStorage.getItem("token") }
        });
        const mapped = (res.data || []).map((o: any) => ({
          ...o,
          queryNumber: o.query?.number || "—",
          queryDate: o.query?.createdAt ? new Date(o.query.createdAt).toLocaleDateString("az-AZ") : "—",
          customer: o.customerName || "—"
        }));
        setOrders(mapped);
      } catch (e) {
        console.error("Order load error:", e);
      }
    };
    fetchOrders();
  }, []);

  const order = useMemo(() => {
    return orders.find((o) => String(o.id) === String(orderId) || o.orderNumber === orderId) || null;
  }, [orders, orderId]);

  useEffect(() => {
    if (order) {
      const fetchAll = async () => {
        try {
          const headers = { Authorization: "Bearer " + localStorage.getItem("token") };
          const [finRes, loadRes, voyRes, invRes] = await Promise.all([
            axios.get(ENDPOINTS.FINANCE.BASE + "?orderId=" + order.id, { headers }).catch(() => ({ data: [] })),
            axios.get(ENDPOINTS.LOADS.BASE + "?orderId=" + order.id, { headers }).catch(() => ({ data: [] })),
            axios.get(ENDPOINTS.VOYAGES.BASE + "?orderId=" + order.id, { headers }).catch(() => ({ data: [] })),
            axios.get(ENDPOINTS.INVOICES.BASE + "?orderId=" + order.id, { headers }).catch(() => ({ data: [] }))
          ]);
          setFinanceTransactions(finRes.data || []);
          
          const mappedLoads = (loadRes.data || []).map((l: any) => ({
            ...l,
            number: l.id ? `Y-${l.id}` : "—",
            name: l.cargoName || "—",
            orderRef: l.order?.orderNumber || "—"
          }));
          setLoadsList(mappedLoads);
          
          const mappedVoyages = (voyRes.data || []).map((v: any) => ({
            ...v,
            number: v.tripRef || (v.id ? `R-${v.id}` : "—"),
            loadPlace: v.loading || "—",
            unloadPlace: v.unloading || "—",
            status: v.tripStatus || "—",
            price: v.tripPrice || "—"
          }));
          setVoyagesList(mappedVoyages);
          
          setInvoicesList(invRes.data || []);
        } catch (e) {
          console.error(e);
        }
      };
      fetchAll();
    }
  }, [order]);

  const saveFinanceTransactions = (newList: typeof financeTransactions) => {
    setFinanceTransactions(newList);
    if (order) {
      localStorage.setItem(`logistic_finance_${order.id}`, JSON.stringify(newList));
    }
  };

  const financeTotals = useMemo(() => {
    let totalRevAzn = 0;
    let totalExpAzn = 0;
    financeTransactions.forEach(t => {
       if (t.tarifAzn) totalRevAzn += parseFloat(t.tarifAzn) || 0;
       
       if (t.mesarifPrice && t.mesarifCurrency) {
          const exp = parseFloat(t.mesarifPrice) || 0;
          const azn = t.mesarifCurrency === "USD" ? exp * 1.7 : t.mesarifCurrency === "EUR" ? exp * 1.85 : exp;
          totalExpAzn += azn;
       }
    });

    voyagesList.forEach(v => {
       if (v.rawPayload && v.rawPayload.price) {
          const exp = parseFloat(v.rawPayload.price) || 0;
          const curr = v.rawPayload.currency || "AZN";
          const azn = curr === "USD" ? exp * 1.7 : curr === "EUR" ? exp * 1.85 : exp;
          totalExpAzn += azn;
       }
    });

    return {
      totalRevAzn,
      totalExpAzn,
      profitAzn: totalRevAzn - totalExpAzn
    };
  }, [financeTransactions, voyagesList]);

  // Removed previous unused useEffects

  // Removed previous unused useEffects

  // Tab State
  type SifarisTabId = "loads" | "voyages" | "finance" | "documents" | "invoices" | "comments";
  const [activeTab, setActiveTab] = useState<SifarisTabId>("loads");
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Invoice Sub-tab and list states
  const [invoicesSubTab, setInvoicesSubTab] = useState<"ireli" | "ilkin" | "alinmis">("ireli");
  const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState(false);
  const [invoicesList, setInvoicesList] = useState<Array<{
    id: string;
    number: string;
    date: string;
    payer: string;
    amount: string;
    status: string;
    type: "ireli" | "ilkin" | "alinmis";
    template: string;
    contract: string;
    creator: string;
    lang: string;
    delayDays: string;
    payUntil: string;
    splitRule: string;
    vatExempt: string;
    vatIncluded: string;
    currency: string;
    executor: string;
    calcType: string;
    rateDate: string;
    useNonStandard: boolean;
    noStampSign: boolean;
    sendNotif: boolean;
    rows: Array<{
      id: string;
      text: string;
      unit: string;
      qty: number;
      price: number;
      vatRate: string;
    }>;
  }>>([
    {
      id: "inv-mock-1",
      number: "INV-2026-004",
      date: "27.05.2026",
      payer: "Limon Dental MMC",
      amount: "1450 USD",
      status: "Ölənilib",
      type: "ireli",
      template: "Invoice Ziyafreight",
      contract: "23.05.2019 - ZF2019/05 - Zf Limon agreement",
      creator: "Ulvi Adilzade",
      lang: "Azərbaycan",
      delayDays: "0",
      payUntil: "27.05.2026",
      splitRule: "Dəyəri seçin",
      vatExempt: "1450",
      vatIncluded: "1450",
      currency: "USD",
      executor: "Ziyafreight",
      calcType: "ƏDV-siz qiymət",
      rateDate: "27.05.2026",
      useNonStandard: false,
      noStampSign: false,
      sendNotif: false,
      rows: [
        {
          id: "r1",
          text: "Freight Charges EXW Changzhou, up to FOA Baku\n\nSender: Changzhou Sifary Medical Technology\nConsinger: Limon Dental MMC\nTrace number:",
          unit: "Marşrut",
          qty: 1,
          price: 1450,
          vatRate: "0%"
        }
      ]
    }
  ]);

  // New Invoice form states
  const [invoiceTemplate, setInvoiceTemplate] = useState("Invoice Ziyafreight");
  const [invoiceContract, setInvoiceContract] = useState("23.05.2019 - ZF2019/05 - Zf Limon agreement");
  const [invoiceCreator, setInvoiceCreator] = useState("Ulvi Adilzade");
  const [invoiceLang, setInvoiceLang] = useState("Azərbaycan");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("27.05.2026");
  const [invoiceDelayDays, setInvoiceDelayDays] = useState("0");
  const [invoicePayUntilDate, setInvoicePayUntilDate] = useState("27.05.2026");
  const [invoiceSplitRule, setInvoiceSplitRule] = useState("Dəyəri seçin");
  const [invoiceVatExempt, setInvoiceVatExempt] = useState("1450");
  const [invoiceVatIncluded, setInvoiceVatIncluded] = useState("1450");
  const [invoiceCurrency, setInvoiceCurrency] = useState("USD");
  const [invoiceExecutor, setInvoiceExecutor] = useState("Ziyafreight");
  const [invoiceCalcType, setInvoiceCalcType] = useState("ƏDV-siz qiymət");
  const [invoiceRateDate, setInvoiceRateDate] = useState("27.05.2026");
  const [invoicePayer, setInvoicePayer] = useState("Limon Dental MMC");
  
  const [invoiceUseNonStandard, setInvoiceUseNonStandard] = useState(false);
  const [invoiceNoStampSign, setInvoiceNoStampSign] = useState(false);
  const [invoiceSendNotif, setInvoiceSendNotif] = useState(false);

  const [invoiceRows, setInvoiceRows] = useState<Array<{
    id: string;
    text: string;
    unit: string;
    qty: number;
    price: number;
    vatRate: string;
  }>>([
    {
      id: "1",
      text: "Freight Charges EXW Changzhou, up to FOA Baku\n\nSender: Changzhou Sifary Medical Technology\nConsinger: Limon Dental MMC\nTrace number:",
      unit: "Marşrut",
      qty: 1,
      price: 1450,
      vatRate: "0%"
    }
  ]);

  // Sync dates
  useEffect(() => {
    if (invoiceDate) {
      const days = parseInt(invoiceDelayDays) || 0;
      try {
        const parts = invoiceDate.split(".");
        if (parts.length === 3) {
          const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
          d.setDate(d.getDate() + days);
          const pad = (n: number) => n.toString().padStart(2, "0");
          setInvoicePayUntilDate(`${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`);
        }
      } catch (e) {
        // Fallback
      }
    }
  }, [invoiceDate, invoiceDelayDays]);

  // Sync calculations
  useEffect(() => {
    let sumNoVat = 0;
    let sumWithVat = 0;
    invoiceRows.forEach(row => {
      const rowSum = (row.qty || 0) * (row.price || 0);
      sumNoVat += rowSum;
      const ratePercent = parseFloat(row.vatRate) || 0;
      sumWithVat += rowSum * (1 + ratePercent / 100);
    });
    setInvoiceVatExempt(sumNoVat.toFixed(2));
    setInvoiceVatIncluded(sumWithVat.toFixed(2));
  }, [invoiceRows]);

  // Dynamic comments
  const [comments, setComments] = useState<Array<{ id: string; text: string; userName: string; createdAt: string }>>([
    { id: "1", text: "Yükləmə nöqtəsindən gömrük sənədləri qəbul edildi.", userName: "Ulvi Adilzade", createdAt: "26.05.2026 10:15" },
    { id: "2", text: "Reys uğurla təyin olunmuşdur.", userName: "Nijat Shabanly", createdAt: "26.05.2026 11:42" }
  ]);
  const [commentInput, setCommentInput] = useState("");

  // Combined Comments & Tasks States
  const [isNewCommentModalOpen, setIsNewCommentModalOpen] = useState(false);
  const [commentCategory, setCommentCategory] = useState("Sifariş");
  const [commentProvideAccessCustomer, setCommentProvideAccessCustomer] = useState(false);
  const [commentProvideAccessCarrier, setCommentProvideAccessCarrier] = useState(false);
  const [commentText, setCommentText] = useState("");

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState<any | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskChecklist, setTaskChecklist] = useState<string[]>([]);
  const [taskContractor, setTaskContractor] = useState("Dəyəri seçin");
  const [taskDepartment, setTaskDepartment] = useState("Dəyəri seçin");
  const [taskAuthor, setTaskAuthor] = useState("Ulvi Adilzade (Satış şöbəsi)");
  const [taskExecutor, setTaskExecutor] = useState("Ulvi Adilzade (Satış şöbəsi)");
  const [taskIsRecurring, setTaskIsRecurring] = useState(false);
  const [taskCreatedDate, setTaskCreatedDate] = useState("27.05.2026");
  const [taskCreatedTime, setTaskCreatedTime] = useState("17:54");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskDueTime, setTaskDueTime] = useState("");
  const [taskDueAmount, setTaskDueAmount] = useState("");
  const [taskRemind, setTaskRemind] = useState(true);
  const [taskRemindDay, setTaskRemindDay] = useState("İcra günündə");
  const [taskRemindTime, setTaskRemindTime] = useState("10:00");
  const [taskChecklistInput, setTaskChecklistInput] = useState("");

  // Yeni Müqavilə States
  const [isNewContractModalOpen, setIsNewContractModalOpen] = useState(false);
  const [contractCompany, setContractCompany] = useState("Ziyafreight");
  const [contractType, setContractType] = useState<"template" | "file">("template");
  const [contractVoyage, setContractVoyage] = useState("ZF26094-1, Makeasy");
  const [contractLoad, setContractLoad] = useState("Dəyəri seçin");
  const [contractTemplate, setContractTemplate] = useState("Dəyəri seçin");
  const [contractDocNumber, setContractDocNumber] = useState("");
  const [contractDocDate, setContractDocDate] = useState("27.05.2026");
  const [contractDocName, setContractDocName] = useState("");
  const [contractHasValidity, setContractHasValidity] = useState(false);
  const [contractProvideAccessCustomer, setContractProvideAccessCustomer] = useState(false);
  const [contractProvideAccessCarrier, setContractProvideAccessCarrier] = useState(false);
  const [contractSendNotif, setContractSendNotif] = useState(false);
  const [contractComments, setContractComments] = useState("");

  const [tasksList, setTasksList] = useState<Array<{
    id: string;
    title: string;
    description: string;
    checklist: string[];
    completed: boolean;
    contractor: string;
    department: string;
    author: string;
    executor: string;
    isRecurring: boolean;
    createdDate: string;
    createdTime: string;
    dueDate: string;
    dueTime: string;
    dueAmount: string;
    remind: boolean;
    remindDay: string;
    remindTime: string;
  }>>([
    {
      id: "t1",
      title: "Müştəri müqaviləsini yoxlamaq",
      description: "Limon Dental MMC müqaviləsi imzalanıb-imzalanmadığını yoxlayın",
      checklist: ["Müqavilə nömrəsini təsdiqlə", "Skanner nüsxəsini yüklə"],
      completed: true,
      contractor: "Dəyəri seçin",
      department: "Dəyəri seçin",
      author: "Ulvi Adilzade (Satış şöbəsi)",
      executor: "Ulvi Adilzade (Satış şöbəsi)",
      isRecurring: false,
      createdDate: "27.05.2026",
      createdTime: "17:54",
      dueDate: "28.05.2026",
      dueTime: "18:00",
      dueAmount: "",
      remind: true,
      remindDay: "İcra günündə",
      remindTime: "10:00"
    },
    {
      id: "t2",
      title: "Daşıyıcıdan CMR sürətini tələb etmək",
      description: "CMR sənədinin yüklənməsi tələb olunur",
      checklist: [],
      completed: false,
      contractor: "Dəyəri seçin",
      department: "Dəyəri seçin",
      author: "Ulvi Adilzade (Satış şöbəsi)",
      executor: "Ulvi Adilzade (Satış şöbəsi)",
      isRecurring: false,
      createdDate: "27.05.2026",
      createdTime: "17:54",
      dueDate: "",
      dueTime: "",
      dueAmount: "",
      remind: false,
      remindDay: "İcra günündə",
      remindTime: "10:00"
    }
  ]);

  const handleSaveNewComment = () => {
    if (!commentText.trim()) {
      alert("Lütfən şərhi daxil edin!");
      return;
    }
    const newComment = {
      id: String(Date.now()),
      text: commentText.trim(),
      userName: "Ulvi Adilzade",
      createdAt: new Date().toLocaleString("az-AZ", { hour12: false }).replace(/\//g, ".")
    };
    setComments([newComment, ...comments]);
    setIsNewCommentModalOpen(false);
    setCommentText("");
  };

  const handleSaveTask = () => {
    if (!taskTitle.trim()) {
      alert("Lütfən tapşırığın adını daxil edin!");
      return;
    }
    if (selectedTaskForEdit) {
      const updated = tasksList.map(t => t.id === selectedTaskForEdit.id ? {
        ...t,
        title: taskTitle,
        description: taskDescription,
        checklist: taskChecklist,
        contractor: taskContractor,
        department: taskDepartment,
        author: taskAuthor,
        executor: taskExecutor,
        isRecurring: taskIsRecurring,
        createdDate: taskCreatedDate,
        createdTime: taskCreatedTime,
        dueDate: taskDueDate,
        dueTime: taskDueTime,
        dueAmount: taskDueAmount,
        remind: taskRemind,
        remindDay: taskRemindDay,
        remindTime: taskRemindTime
      } : t);
      setTasksList(updated);
    } else {
      const newTask = {
        id: String(Date.now()),
        title: taskTitle,
        description: taskDescription,
        checklist: taskChecklist,
        completed: false,
        contractor: taskContractor,
        department: taskDepartment,
        author: taskAuthor,
        executor: taskExecutor,
        isRecurring: taskIsRecurring,
        createdDate: taskCreatedDate,
        createdTime: taskCreatedTime,
        dueDate: taskDueDate,
        dueTime: taskDueTime,
        dueAmount: taskDueAmount,
        remind: taskRemind,
        remindDay: taskRemindDay,
        remindTime: taskRemindTime
      };
      setTasksList([...tasksList, newTask]);
    }
    setIsTaskModalOpen(false);
  };

  const handleDeleteTask = (id: string) => {
    setTasksList(tasksList.filter(t => t.id !== id));
    setIsTaskModalOpen(false);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    const newComment = {
      id: String(Date.now()),
      text: commentInput.trim(),
      userName: "Sistem Meneceri",
      createdAt: new Date().toLocaleString("az-AZ", { hour12: false }).replace(/\//g, ".")
    };
    setComments([newComment, ...comments]);
    setCommentInput("");
  };

  // Dynamic Documents
  const [documents, setDocuments] = useState<Array<{ id: string; name: string; size: string; createdAt: string }>>([
    { id: "1", name: "CMR_Senedi.pdf", size: "1.4 MB", createdAt: "26.05.2026" },
    { id: "2", name: "Hesab-faktura.xlsx", size: "320 KB", createdAt: "26.05.2026" }
  ]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const newDoc = {
      id: String(Date.now()),
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      createdAt: new Date().toLocaleDateString("az-AZ").split("T")[0]
    };
    setDocuments([...documents, newDoc]);
  };

  const handleDocDelete = (id: string) => {
    setDocuments(documents.filter((doc) => doc.id !== id));
  };

  // Dynamic status change
  const [currentStatus, setCurrentStatus] = useState<string>("planned");
  const [currentStatusLabel, setCurrentStatusLabel] = useState<string>("Planlaşdırılır");

  useEffect(() => {
    if (order) {
      setCurrentStatus(order.statusKind);
      setCurrentStatusLabel(order.statusLabel);
    }
  }, [order]);

  const handleStatusChange = (nextStatus: OrderStatusKind) => {
    let label = "Planlaşdırılıb";
    if (nextStatus === "progress") label = "Davam edir";
    else if (nextStatus === "completed") label = "Tamamlandı";
    else if (nextStatus === "finance_closed") label = "Maliyyə cəhətdən bağlandı";
    else if (nextStatus === "cancelled") label = "Sifariş ləğv edildi";

    setCurrentStatus(nextStatus);
    setCurrentStatusLabel(label);

    const nextHistory = [
      ...(order?.statusHistory || []),
      {
        status: label,
        date: `${new Date().toLocaleString("az-AZ", { hour12: false }).replace(/\//g, ".")} (tərəfindən: Ulvi Adilzade)`
      }
    ];

    const updatedList = orders.map((o) => {
      if (o.id === order?.id) {
        return {
          ...o,
          statusKind: nextStatus,
          statusLabel: label,
          statusHistory: nextHistory
        };
      }
      return o;
    });

    setOrders(updatedList);
    try {
      localStorage.setItem("logistic_sifarisler", JSON.stringify(updatedList));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveEdit = (updatedOrder: SifarisOrderRow) => {
    const updatedList = orders.map((o) => (o.id === updatedOrder.id ? updatedOrder : o));
    setOrders(updatedList);
    try {
      localStorage.setItem("logistic_sifarisler", JSON.stringify(updatedList));
    } catch (e) {
      console.error(e);
    }
    setIsEditModalOpen(false);
  };

  const handleYukAdd = (payload: any) => {
    const newLoad = {
      orderId: order.id,
      cargoName: payload.name || "General cargo",
      sender: payload.sender || "—",
      receiver: payload.receiver || "—",
      weightKg: parseFloat(payload.weight) || null,
      volumeM3: parseFloat(payload.volume) || null,
      ldm: parseFloat(payload.ldm) || null,
      status: "Gözləmədə",
    };
    axios.post(ENDPOINTS.LOADS.BASE, newLoad, { headers: { Authorization: "Bearer " + localStorage.getItem("token") } })
      .then(res => {
        setLoadsList([...loadsList, res.data]);
        setIsYukModalOpen(false);
      })
      .catch(console.error);
  };

  const handleYukEdit = (payload: any) => {
    if (!selectedLoadForEdit) return;
    const updateData = {
      cargoName: payload.name || "General cargo",
      sender: payload.sender || "—",
      receiver: payload.receiver || "—",
      weightKg: parseFloat(payload.weight) || null,
      volumeM3: parseFloat(payload.volume) || null,
      ldm: parseFloat(payload.ldm) || null,
    };
    axios.put(ENDPOINTS.LOADS.BASE + "/" + selectedLoadForEdit.id, updateData, { headers: { Authorization: "Bearer " + localStorage.getItem("token") } })
      .then(res => {
        setLoadsList(loadsList.map(load => load.id === selectedLoadForEdit.id ? res.data : load));
        setIsYukEditModalOpen(false);
        setSelectedLoadForEdit(null);
      })
      .catch(console.error);
  };

  const handleVoyageAddOrEdit = (payload: any) => {
    if (selectedVoyageForEdit) {
      // Edit
      const updateData = {
        tripStatus: payload.status || "Planlaşdırılıb",
        carrier: payload.carrier,
        tripPrice: payload.price,
        sender: payload.sender,
        loading: payload.loadPlace,
        receiver: payload.receiver,
        unloading: payload.unloadPlace,
        tags: payload.tags,
      };
      axios.put(ENDPOINTS.VOYAGES.BASE + "/" + selectedVoyageForEdit.id, updateData, { headers: { Authorization: "Bearer " + localStorage.getItem("token") } })
        .then(res => {
          setVoyagesList(voyagesList.map(v => v.id === selectedVoyageForEdit.id ? res.data : v));
          setIsVoyageEditOpen(false);
          setSelectedVoyageForEdit(null);
        })
        .catch(console.error);
    } else {
      // Add new
      const newVoyage = {
        orderId: order.id,
        tripStatus: payload.status || "Planlaşdırılıb",
        customer: order.customerName || "",
        carrier: payload.carrier,
        tripPrice: payload.price,
        sender: payload.sender,
        loading: payload.loadPlace,
        receiver: payload.receiver,
        unloading: payload.unloadPlace,
        tags: payload.tags,
      };
      axios.post(ENDPOINTS.VOYAGES.BASE, newVoyage, { headers: { Authorization: "Bearer " + localStorage.getItem("token") } })
        .then(res => {
          setVoyagesList([...voyagesList, res.data]);
          setIsVoyageEditOpen(false);
        })
        .catch(console.error);
    }
  };

  if (!order) {
    return (
      <div style={{ padding: "4rem", textAlign: "center" }}>
        <h2 style={{ color: "#ef4444" }}>Sifariş tapılmadı</h2>
        <Link to="/sifarisler" className={styles.backBtn} style={{ marginTop: "1rem" }}>
          <FiArrowLeft /> Siyahıya qayıt
        </Link>
      </div>
    );
  }

  const selectStyle: React.CSSProperties = {
    width: "100%",
    border: "1px solid #cbd5e1",
    borderRadius: "0.375rem",
    padding: "0.5rem 2.2rem 0.5rem 0.75rem",
    fontSize: "0.85rem",
    background: "#ffffff",
    outline: "none",
    color: "#334155",
    fontWeight: 500,
    cursor: "pointer",
    boxSizing: "border-box",
    appearance: "none",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    border: "1px solid #cbd5e1",
    borderRadius: "0.375rem",
    padding: "0.5rem 0.75rem",
    fontSize: "0.85rem",
    background: "#ffffff",
    outline: "none",
    color: "#334155",
    fontWeight: 500,
    boxSizing: "border-box",
  };

  const plusBtnStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "14px",
    height: "14px",
    border: "1px solid #cbd5e1",
    borderRadius: "3px",
    background: "#ffffff",
    color: "#22c55e",
    fontSize: "0.75rem",
    cursor: "pointer",
    outline: "none",
    padding: 0,
    lineHeight: 1,
    fontWeight: "bold",
    marginLeft: "0.25rem"
  };

  const clearIconStyle: React.CSSProperties = {
    position: "absolute",
    right: "0.75rem",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "16px",
    height: "16px",
  };

  // Tabs navigation
  const tabItems = [
    { id: "loads" as SifarisTabId, label: `Yüklər (${order.cargoParams ? 1 : 0})`, icon: <FiBox /> },
    { id: "voyages" as SifarisTabId, label: `Reyslər (${order.voyageNumber ? 1 : 0})`, icon: <FiTruck /> },
    { id: "finance" as SifarisTabId, label: `Maliyyə (1)`, icon: <FiDollarSign /> },
    { id: "documents" as SifarisTabId, label: `Sənədlər (${documents.length})`, icon: <FiFileText /> },
    { id: "invoices" as SifarisTabId, label: "Hesablar", icon: <FiFile /> },
    { id: "comments" as SifarisTabId, label: `Şərhlər və Tapşırıqlar`, icon: <FiMessageSquare /> }
  ];

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button
          type="button"
          onClick={() => navigate("/sifarisler")}
          className={styles.backBtn}
        >
          <FiArrowLeft />
          Siyahıya qayıt
        </button>
        <h1 className={styles.title}>Sifariş detalları: {order.orderNumber}</h1>
      </div>

      {/* Main Layout */}
      <div className={styles.layout}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <span>Nr.: {order.orderNumber}</span>
          </div>
          <div className={styles.sidebarCard}>
            <button
              type="button"
              className={styles.editBtn}
              onClick={() => setIsEditModalOpen(true)}
            >
              + Redaktə et
            </button>

            {/* Status Section */}
            <div className={styles.statusWrapper} style={{ border: "none", background: "transparent", padding: 0, marginTop: "1rem" }}>
              <div style={{ position: "relative", display: "inline-flex", alignItems: "center", flex: 1 }}>
                {(() => {
                  const STATUS_OPTIONS: Array<{ value: OrderStatusKind; label: string; bg: string; text: string; dot: string; border: string }> = [
                    { value: "planned", label: "Planlaşdırılıb", bg: "#eff6ff", text: "#1d4ed8", dot: "#3b82f6", border: "#bfdbfe" },
                    { value: "progress", label: "Davam edir", bg: "#fef3c7", text: "#b45309", dot: "#f59e0b", border: "#fde68a" },
                    { value: "completed", label: "Tamamlandı", bg: "#ecfdf5", text: "#047857", dot: "#10b981", border: "#a7f3d0" },
                    { value: "finance_closed", label: "Maliyyə cəhətdən bağlandı", bg: "#e0e7ff", text: "#4338ca", dot: "#6366f1", border: "#c7d2fe" },
                    { value: "cancelled", label: "Sifariş ləğv edildi", bg: "#fee2e2", text: "#b91c1c", dot: "#ef4444", border: "#fecaca" },
                  ];
                  const currentOpt = STATUS_OPTIONS.find((o) => o.value === currentStatus) || STATUS_OPTIONS[0];
                  return (
                    <Popover.Root>
                      <Popover.Trigger asChild>
                        <button
                          type="button"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "0.5rem",
                            border: `1px solid ${currentOpt.border}`,
                            borderRadius: "0.5rem",
                            padding: "0.5rem 1rem",
                            fontSize: "0.85rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            outline: "none",
                            backgroundColor: currentOpt.bg,
                            color: currentOpt.text,
                            width: "100%",
                            transition: "all 0.2s ease",
                            boxSizing: "border-box",
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.transform = "translateY(-1px)";
                            e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.05)";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "none";
                          }}
                        >
                          <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: currentOpt.dot }} />
                            {currentOpt.label}
                          </span>
                          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </Popover.Trigger>
                      <Popover.Portal>
                        <Popover.Content
                          style={{
                            zIndex: 9999,
                            minWidth: "240px",
                            borderRadius: "0.85rem",
                            border: "1px solid #e2e8f0",
                            backgroundColor: "#ffffff",
                            padding: "0.5rem",
                            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                            outline: "none",
                          }}
                          sideOffset={6}
                          align="start"
                        >
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            {STATUS_OPTIONS.map((opt) => {
                              const isSelected = currentStatus === opt.value;
                              return (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => handleStatusChange(opt.value)}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    border: 0,
                                    background: isSelected ? "#f1f5f9" : "transparent",
                                    color: isSelected ? opt.text : "#334155",
                                    borderRadius: "0.5rem",
                                    padding: "0.625rem 0.85rem",
                                    fontSize: "0.85rem",
                                    fontWeight: isSelected ? 700 : 600,
                                    cursor: "pointer",
                                    textAlign: "left",
                                    transition: "all 0.15s ease",
                                    width: "100%",
                                  }}
                                  onMouseOver={(e) => {
                                    e.currentTarget.style.background = isSelected ? "#f1f5f9" : "#f8fafc";
                                    if (!isSelected) e.currentTarget.style.color = opt.text;
                                  }}
                                  onMouseOut={(e) => {
                                    e.currentTarget.style.background = isSelected ? "#f1f5f9" : "transparent";
                                    if (!isSelected) e.currentTarget.style.color = "#334155";
                                  }}
                                >
                                  <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: opt.dot }} />
                                    {opt.label}
                                  </span>
                                  {isSelected && <FiCheck style={{ color: opt.text, fontSize: "0.95rem" }} />}
                                </button>
                              );
                            })}
                          </div>
                        </Popover.Content>
                      </Popover.Portal>
                    </Popover.Root>
                  );
                })()}
              </div>
              <button
                type="button"
                className={styles.iconBtn}
                title="Tarixçə"
                onClick={() => setIsHistoryModalOpen(true)}
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: "0.5rem",
                  padding: "0.5rem",
                  background: "#ffffff",
                  marginLeft: "0.5rem",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FiClock />
              </button>
            </div>

            {/* Fields List */}
            <div className={styles.dlList}>
              <DlRow label="Sorğu" value={`${order.queryNumber}, ${order.queryDate || "20.05.2026"}\nTəsdiq edilmişdir: Vaxtında`} />
              <DlRow label="Müştəri üçün başlanğıc tarif" value={`${order.freight || "—"}`} />
              <DlRow label="Fraxt" value={`${financeTotals.totalRevAzn.toFixed(2)} AZN`} />
              <DlRow label="Fraxt ƏDV ilə" value={`${financeTotals.totalRevAzn.toFixed(2)} AZN`} />
              <DlRow label="Xərclər" value={<span className={styles.accentYellow}>{financeTotals.totalExpAzn.toFixed(2)} AZN</span>} />
              <DlRow label="Mənfəət" value={<span className={styles.accentGreen}>{financeTotals.profitAzn.toFixed(2)} AZN</span>} />
              <DlRow label="Şirkət" value={order.company} />
              <DlRow label="Menecer" value={order.manager || "Ulvi Adilzade"} />
              <DlRow label="Əlavə menecerlər" value={order.extraManagers || "Ulvi Adilzade"} />
              <DlRow label="Sifarişin tarixi" value={order.orderDate} />
              <DlRow label="Teqlər" value={order.tags || "—"} />
              <DlRow label="Incoterms" value={order.incoterms || "EXW"} />
              <DlRow label="Müştəri" value={order.customer} />
              <DlRow label="Ünvan" value="Azerbaijan, Baku" />
              <DlRow label="Əlaqədar şəxs" value={order.contactPerson || "Nijat Shabanly (+994 50 2053030)"} />
              <DlRow label="Daşıyıcılar" value={order.carriers} />
              <DlRow label="Ekspeditorlar" value={order.expeditor || "Ulvi Adilzade"} />
              <DlRow
                label="Müştəri ilə sənədlər"
                value={
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span onClick={() => setIsNewContractModalOpen(true)} className={styles.accentRedLink} style={{ cursor: "pointer" }}>Sifarişi əlavə et</span>
                    <span className={styles.accentRedLink}>Müqavilə</span>
                  </div>
                }
              />
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className={styles.mainPanel}>
          {/* Tabs bar */}
          <div className={styles.tabs}>
            {tabItems.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabBtnActive : ""}`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content panel */}
          <div className={styles.contentCard}>
            {activeTab === "loads" && (
              <div>
                <div className={styles.contentCardHeader}>
                  <h3 className={styles.contentCardTitle}>Yüklər</h3>
                  <button
                    type="button"
                    className={styles.addBtnGreen}
                    onClick={() => setIsYukModalOpen(true)}
                  >
                    + Əlavə et
                  </button>
                </div>
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th className={`${styles.th} ${styles.thNowrap}`}>Yükün nömrəsi</th>
                        <th className={`${styles.th} ${styles.thNowrap}`}>Yükün adı</th>
                        <th className={`${styles.th} ${styles.thNowrap}`}>Konteynerin nömrəsi</th>
                        <th className={`${styles.th} ${styles.cargoParamsCol}`}>Yükün parametrləri</th>
                        <th className={`${styles.th} ${styles.thNowrap}`}>Göndərən</th>
                        <th className={`${styles.th} ${styles.thNowrap}`}>Yükləmə</th>
                        <th className={`${styles.th} ${styles.thNowrap}`}>Yükləmə tarixi</th>
                        <th className={`${styles.th} ${styles.thNowrap}`}>Alıcı</th>
                        <th className={`${styles.th} ${styles.thNowrap}`}>Boşaltma</th>
                        <th className={`${styles.th} ${styles.thNowrap}`}>Boşaltma tarixi</th>
                        <th className={`${styles.th} ${styles.thNowrap}`}>Reyslər</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadsList.map((load) => (
                        <tr key={load.id}>
                          <td
                            className={`${styles.td} ${styles.tdNowrap}`}
                            style={{ fontWeight: 700, color: "#16a34a", cursor: "pointer" }}
                            onClick={() => {
                              setSelectedLoadForView(load);
                              setIsViewModalOpen(true);
                            }}
                          >
                            {load.number}
                          </td>
                          <td
                            className={`${styles.td} ${styles.tdNowrap}`}
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                              setSelectedLoadForView(load);
                              setIsViewModalOpen(true);
                            }}
                          >
                            {load.name}
                          </td>
                          <td className={`${styles.td} ${styles.tdNowrap}`}>{load.containerNumber}</td>
                          <td className={`${styles.td} ${styles.cargoParamsCol}`}>
                            <div className={styles.cargoDetailsBox}>
                              {`Tip: Palet\nLDM: ${load.ldm || "—"}\nHəcm: ${load.volumeM3 || "—"} m³\nÇəki: ${load.weightKg || "—"} t`}
                            </div>
                          </td>
                          <td className={`${styles.td} ${styles.tdNowrap}`}>{load.sender}</td>
                          <td className={`${styles.td} ${styles.tdNowrap}`}>{load.loadPlace}</td>
                          <td className={`${styles.td} ${styles.tdNowrap}`}>{load.loadDate}</td>
                          <td className={`${styles.td} ${styles.tdNowrap}`}>{load.receiver}</td>
                          <td className={`${styles.td} ${styles.tdNowrap}`}>{load.unloadPlace}</td>
                          <td className={`${styles.td} ${styles.tdNowrap}`}>{load.unloadDate}</td>
                          <td className={`${styles.td} ${styles.tdNowrap}`}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                              <span style={{ fontWeight: 600 }}>
                                {typeof load.voyage === "object" && load.voyage !== null 
                                  ? (load.voyage.tripRef || "—") 
                                  : (load.voyage || "—")}
                              </span>
                              <div style={{ display: "flex", gap: "0.25rem" }}>
                                <button
                                  type="button"
                                  className={styles.iconBtn}
                                  title="Yükə baxmaq"
                                  onClick={() => {
                                    setSelectedLoadForView(load);
                                    setIsViewModalOpen(true);
                                  }}
                                >
                                  <FiEye style={{ color: "#3b82f6", fontSize: "0.85rem" }} />
                                </button>
                                <button
                                  type="button"
                                  className={styles.iconBtn}
                                  title="Redaktə et"
                                  onClick={() => {
                                    setSelectedLoadForEdit(load);
                                    setIsYukEditModalOpen(true);
                                  }}
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  className={styles.iconBtn}
                                  title="Kopyalamaq"
                                  onClick={() => {
                                    const cloned = { ...load };
                                    delete cloned.id;
                                    axios.post(ENDPOINTS.LOADS.BASE, cloned, { headers: { Authorization: "Bearer " + localStorage.getItem("token") } })
                                      .then(res => setLoadsList([...loadsList, res.data]))
                                      .catch(console.error);
                                  }}
                                >
                                  <FiCopy style={{ color: "#10b981", fontSize: "0.85rem" }} />
                                </button>
                                <button
                                  type="button"
                                  className={styles.iconBtn}
                                  title="Silmək"
                                  onClick={() => {
                                    axios.delete(ENDPOINTS.LOADS.BASE + "/" + load.id, { headers: { Authorization: "Bearer " + localStorage.getItem("token") } })
                                      .then(() => setLoadsList(loadsList.filter((l) => l.id !== load.id)))
                                      .catch(console.error);
                                  }}
                                >
                                  <FiTrash2 style={{ color: "#ef4444", fontSize: "0.85rem" }} />
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "voyages" && (
              <div>
                <div className={styles.contentCardHeader}>
                  <h3 className={styles.contentCardTitle}>Reyslər</h3>
                  <button
                    type="button"
                    className={styles.addBtnGreen}
                    onClick={() => {
                      setSelectedVoyageForEdit(null);
                      setIsVoyageEditOpen(true);
                    }}
                  >
                    + Əlavə et
                  </button>
                </div>
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th className={`${styles.th} ${styles.thNowrap}`}>Reysin nömrəsi</th>
                        <th className={`${styles.th} ${styles.thNowrap}`}>Teqlər</th>
                        <th className={`${styles.th} ${styles.thNowrap}`}>Gönderen</th>
                        <th className={`${styles.th} ${styles.thNowrap}`}>Yükləmə yeri</th>
                        <th className={`${styles.th} ${styles.thNowrap}`}>Alıcı</th>
                        <th className={`${styles.th} ${styles.thNowrap}`}>Yükleme yeri</th>
                        <th className={`${styles.th} ${styles.thNowrap}`}>Status</th>
                        <th className={`${styles.th} ${styles.thNowrap}`}>Yükleme tarihi</th>
                        <th className={`${styles.th} ${styles.thNowrap}`}>Boşaltma tarixi</th>
                        <th className={`${styles.th} ${styles.thNowrap}`}>Qiymət</th>
                        <th className={`${styles.th} ${styles.thNowrap}`}>Daşıyıcı</th>
                        <th className={`${styles.th} ${styles.thNowrap}`}>Avtomobilin nömrəsi</th>
                        <th className={`${styles.th} ${styles.thNowrap}`}>Ekspeditor</th>
                        <th className={`${styles.th} ${styles.thNowrap}`}>Alınmış hesablar</th>
                        <th className={`${styles.th} ${styles.thNowrap}`}>Yüklər</th>
                      </tr>
                    </thead>
                    <tbody>
                      {voyagesList.map((v) => (
                        <tr key={v.id}>
                          <td
                            className={`${styles.td} ${styles.tdNowrap}`}
                            style={{ fontWeight: 700, color: "#16a34a", cursor: "pointer" }}
                            onClick={() => {
                              setSelectedVoyageForView(v);
                              setIsVoyageViewOpen(true);
                            }}
                          >
                            {v.number}
                          </td>
                          <td className={`${styles.td} ${styles.tdNowrap}`}>{v.tags || "—"}</td>
                          <td className={`${styles.td} ${styles.tdNowrap}`}>{v.sender || "—"}</td>
                          <td className={`${styles.td} ${styles.tdNowrap}`}>{v.loadPlace || "—"}</td>
                          <td className={`${styles.td} ${styles.tdNowrap}`}>{v.receiver || "—"}</td>
                          <td className={`${styles.td} ${styles.tdNowrap}`}>{v.unloadPlace || "—"}</td>
                          <td className={`${styles.td} ${styles.tdNowrap}`}>
                            <select
                              value={v.status}
                              onChange={(e) => {
                                const val = e.target.value;
                                const updateData = { status: val };
                                axios.put(ENDPOINTS.VOYAGES.BASE + "/" + v.id, updateData, { headers: { Authorization: "Bearer " + localStorage.getItem("token") } })
                                  .then(res => setVoyagesList(voyagesList.map(item => item.id === v.id ? res.data : item)))
                                  .catch(console.error);
                              }}
                              style={{
                                border: "1px solid #cbd5e1",
                                borderRadius: "0.375rem",
                                padding: "0.25rem 0.5rem",
                                fontSize: "0.8rem",
                                background: "#ffffff",
                                outline: "none",
                                cursor: "pointer",
                                fontWeight: 600,
                                color: "#475569"
                              }}
                            >
                              <option value="Planlaşdırılıb">Planlaşdırılıb</option>
                              <option value="Davam edir">Davam edir</option>
                              <option value="Tamamlandı">Tamamlandı</option>
                              <option value="Ləğv edilib">Ləğv edilib</option>
                            </select>
                          </td>
                          <td className={`${styles.td} ${styles.tdNowrap}`}>{v.loadDate || "—"}</td>
                          <td className={`${styles.td} ${styles.tdNowrap}`}>{v.unloadDate || "—"}</td>
                          <td className={`${styles.td} ${styles.tdNowrap}`} style={{ fontSize: "0.75rem", color: "#475569", lineHeight: 1.3 }}>
                            {v.price}
                          </td>
                          <td className={`${styles.td} ${styles.tdNowrap}`}>{v.carrier}</td>
                          <td className={`${styles.td} ${styles.tdNowrap}`}>{v.carNumber || "—"}</td>
                          <td className={`${styles.td} ${styles.tdNowrap}`}>{v.expeditor}</td>
                          <td className={`${styles.td} ${styles.tdNowrap}`}>{v.invoices || "—"}</td>
                          <td className={`${styles.td} ${styles.tdNowrap}`}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
                              <span style={{ fontSize: "0.8rem", color: "#475569" }}>
                                {Array.isArray(v.loads) ? (v.loads.length + " yük") : (v.loads || "—")}
                              </span>
                              <div style={{ display: "flex", gap: "0.35rem" }}>
                                <button
                                  type="button"
                                  className={styles.iconBtn}
                                  title="Detallarına baxmaq"
                                  onClick={() => {
                                    setSelectedVoyageForView(v);
                                    setIsVoyageViewOpen(true);
                                  }}
                                  style={{ padding: "0.25rem" }}
                                >
                                  <FiEye style={{ color: "#3b82f6", fontSize: "0.95rem" }} />
                                </button>
                                <button
                                  type="button"
                                  className={styles.iconBtn}
                                  title="Redaktə et"
                                  onClick={() => {
                                    setSelectedVoyageForEdit(v);
                                    setIsVoyageEditOpen(true);
                                  }}
                                  style={{ padding: "0.25rem" }}
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  className={styles.iconBtn}
                                  title="Silmək"
                                  onClick={() => {
                                    setSelectedVoyageForDelete(v);
                                    setIsVoyageDeleteOpen(true);
                                  }}
                                  style={{ padding: "0.25rem" }}
                                >
                                  <FiTrash2 style={{ color: "#ef4444", fontSize: "0.85rem" }} />
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "finance" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h3 className={styles.contentCardTitle} style={{ margin: 0 }}>Maliyyə</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTxForEdit(null);
                      setTxName("");
                      setTxRevQty("1");
                      setTxRevPrice("0");
                      setTxExpQty("1");
                      setTxExpPrice("0");
                      setTxDescription("");
                      setIsAddTransactionModalOpen(true);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      background: "transparent",
                      border: 0,
                      color: "#22c55e",
                      fontWeight: "bold",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      padding: "0.5rem 1rem",
                      transition: "all 0.2s"
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.color = "#16a34a")}
                    onMouseOut={(e) => (e.currentTarget.style.color = "#22c55e")}
                  >
                    <FiPlus /> Əlavə et
                  </button>
                </div>

                <div
                  style={{
                    background: "#f4fbf7",
                    border: "1px solid #bbf7d0",
                    borderRadius: "0.375rem",
                    padding: "0.75rem 1.25rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "1rem"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ color: "#22c55e", fontWeight: "bold" }}>➔</span>
                    <span style={{ fontSize: "0.85rem", color: "#334155", fontWeight: 600 }}>
                      Müştəriyə başlanğıc qiymət (price from the request)
                    </span>
                  </div>
                  <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#166534" }}>
                    1450 USD
                  </span>
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                  <h4 style={{ margin: "0 0 0.75rem 0", fontSize: "0.9rem", fontWeight: 700, color: "#475569" }}>
                    Maliyyə əməliyyatları
                  </h4>
                  <div className={styles.tableWrapper} style={{ overflowX: "auto" }}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th className={styles.th}>Adı</th>
                          <th className={styles.th}>Kontragent</th>
                          <th className={styles.th}>Tarif</th>
                          <th className={styles.th}>ƏDV ilə tarif</th>
                          <th className={styles.th}>Məsarif</th>
                          <th className={styles.th}>ƏDV ilə məsarif</th>
                          <th className={styles.th}>Mənfəət</th>
                          <th className={styles.th}>İstifadəçi</th>
                          <th className={styles.th}>Yazılmış hesab</th>
                          <th className={styles.th}>Alınmış hesab</th>
                          <th className={styles.th}>Xərclərin tarixi</th>
                          <th className={styles.th} style={{ width: "45px" }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {financeTransactions.map((tx) => (
                          <tr key={tx.id}>
                            <td className={styles.td} style={{ fontWeight: 600 }}>{tx.name}</td>
                            <td className={styles.td}>{tx.partner}</td>
                            <td className={styles.td}>
                              {tx.tarifPrice ? `${tx.tarifPrice} ${tx.tarifCurrency} (${tx.tarifAzn} AZN)` : ""}
                            </td>
                            <td className={styles.td}>
                              {tx.edvliTarifPrice ? `${tx.edvliTarifPrice} ${tx.edvliTarifCurrency} (${tx.edvliTarifAzn} AZN)` : ""}
                            </td>
                            <td className={styles.td}>
                              {tx.mesarifPrice ? `${tx.mesarifPrice} ${tx.mesarifCurrency}` : ""}
                            </td>
                            <td className={styles.td}>
                              {tx.edvliMesarifPrice ? `${tx.edvliMesarifPrice} ${tx.edvliMesarifCurrency}` : ""}
                            </td>
                            <td className={styles.td} style={{ color: "#166534", fontWeight: 700 }}>{tx.profit}</td>
                            <td className={styles.td}>{tx.user}</td>
                            <td className={styles.td} style={{ textAlign: "center" }}>
                              {tx.invoiceWritten ? (
                                <span title="Yazılmış hesab" style={{ display: "inline-flex", cursor: "pointer", color: "#3b82f6", fontSize: "1.1rem" }}>
                                  📄
                                </span>
                              ) : ""}
                            </td>
                            <td className={styles.td} style={{ textAlign: "center" }}>
                              {tx.invoiceReceived ? (
                                <span title="Alınmış hesab" style={{ display: "inline-flex", cursor: "pointer", color: "#10b981", fontSize: "1.1rem" }}>
                                  📄
                                </span>
                              ) : ""}
                            </td>
                            <td className={styles.td}>{tx.costDate || "—"}</td>
                            <td className={styles.td} style={{ textAlign: "right" }}>
                              <button
                                type="button"
                                className={styles.iconBtn}
                                onClick={() => handleEditTransaction(tx)}
                                title="Redaktə et"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h4 style={{ margin: "0 0 0.75rem 0", fontSize: "0.9rem", fontWeight: 700, color: "#475569" }}>
                    Reyslər üzrə xərclər
                  </h4>
                  <div className={styles.tableWrapper} style={{ overflowX: "auto" }}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th className={styles.th}>Reysin nömrəsi</th>
                          <th className={styles.th}>Daşıyıcı</th>
                          <th className={styles.th}>Qiymət</th>
                          <th className={styles.th}>ƏDV ilə qiymət</th>
                          <th className={styles.th}>Ekspeditor</th>
                          <th className={styles.th}>Alınmış hesab</th>
                          <th className={styles.th}>Marşrut</th>
                          <th className={styles.th} style={{ width: "100px" }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {voyagesList.map((v) => (
                          <tr key={v.id}>
                            <td className={styles.td} style={{ fontWeight: 600, color: "#16a34a" }}>{v.number}</td>
                            <td className={styles.td}>{v.carrier}</td>
                            <td className={styles.td}>
                              {v.rawPayload?.price ? `${parseFloat(v.rawPayload.price) * 1.7} AZN` : v.price}
                            </td>
                            <td className={styles.td}>
                              {v.rawPayload?.price ? `${parseFloat(v.rawPayload.price) * 1.7} AZN` : v.price}
                            </td>
                            <td className={styles.td}>{v.expeditor}</td>
                            <td className={styles.td} style={{ textAlign: "center" }}>
                              {v.invoices === "Yazılıb" ? (
                                <span title="Alınmış hesab" style={{ display: "inline-flex", color: "#3b82f6", fontSize: "1.1rem" }}>
                                  📄
                                </span>
                              ) : ""}
                            </td>
                            <td className={styles.td}>
                              <span style={{ background: "#f1f5f9", padding: "0.15rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>
                                CN - AZ
                              </span>
                            </td>
                            <td className={styles.td} style={{ textAlign: "right" }}>
                              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.25rem" }}>
                                <button
                                  type="button"
                                  className={styles.iconBtn}
                                  onClick={() => {
                                    setSelectedVoyageForView(v);
                                    setIsVoyageViewOpen(true);
                                  }}
                                  title="Detallarına baxmaq"
                                >
                                  <FiEye style={{ color: "#3b82f6", fontSize: "0.85rem" }} />
                                </button>
                                <button
                                  type="button"
                                  className={styles.iconBtn}
                                  onClick={() => {
                                    setSelectedVoyageForEdit(v);
                                    setIsVoyageEditOpen(true);
                                  }}
                                  title="Redaktə et"
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  className={styles.iconBtn}
                                  onClick={() => {
                                    setSelectedVoyageForDelete(v);
                                    setIsVoyageDeleteOpen(true);
                                  }}
                                  title="Silmək"
                                >
                                  <FiTrash2 style={{ color: "#ef4444", fontSize: "0.85rem" }} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "documents" && (
              <div>
                {/* 3 Green Underlined Sub-Tabs */}
                <div
                  style={{
                    display: "flex",
                    gap: "1.5rem",
                    borderBottom: "1px solid #cbd5e1",
                    paddingBottom: "0.75rem",
                    marginBottom: "1.25rem",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setDocsActiveSubTab("aktlar")}
                    style={{
                      background: "transparent",
                      border: 0,
                      padding: 0,
                      cursor: "pointer",
                      fontSize: "0.95rem",
                      fontWeight: 600,
                      color: docsActiveSubTab === "aktlar" ? "#15803d" : "#0891b2",
                      textDecoration: "underline",
                    }}
                  >
                    Aktlar
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocsActiveSubTab("fotos")}
                    style={{
                      background: "transparent",
                      border: 0,
                      padding: 0,
                      cursor: "pointer",
                      fontSize: "0.95rem",
                      fontWeight: 600,
                      color: docsActiveSubTab === "fotos" ? "#15803d" : "#0891b2",
                      textDecoration: "underline",
                    }}
                  >
                    Fotoşəkillər
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocsActiveSubTab("requested")}
                    style={{
                      background: "transparent",
                      border: 0,
                      padding: 0,
                      cursor: "pointer",
                      fontSize: "0.95rem",
                      fontWeight: 600,
                      color: docsActiveSubTab === "requested" ? "#15803d" : "#0891b2",
                      textDecoration: "underline",
                    }}
                  >
                    Documents from request ({requestedDocsList.length})
                  </button>
                </div>

                {/* Sub-Tab 1: Aktlar */}
                {docsActiveSubTab === "aktlar" && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                      <h4 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "#475569" }}>Aktlar</h4>
                      <button
                        type="button"
                        onClick={() => {
                          setNewActCompany("Ziyafreight");
                          setNewActType("Sənədin şablonu");
                          setNewActTemplate("Dəyəri seçin");
                          setNewActNumber("");
                          setNewActDate("27.05.2026");
                          setNewActName("");
                          setNewActHasValidity(false);
                          setNewActIsContract(true);
                          setNewActIsSendNotif(false);
                          setNewActNoSeals(false);
                          setNewActProvideAccess(false);
                          setNewActComments("");
                          setIsNewActModalOpen(true);
                        }}
                        style={{
                          background: "#22c55e",
                          color: "#ffffff",
                          border: 0,
                          borderRadius: "0.375rem",
                          padding: "0.45rem 1rem",
                          fontSize: "0.8rem",
                          fontWeight: "bold",
                          cursor: "pointer",
                        }}
                      >
                        + Əlavə et
                      </button>
                    </div>

                    <div className={styles.tableWrapper}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th className={styles.th}>Şirkət</th>
                            <th className={styles.th}>Sənədin nömrəsi</th>
                            <th className={styles.th}>Sənədin tarixi</th>
                            <th className={styles.th}>Sənədin adı</th>
                            <th className={styles.th} style={{ width: "80px" }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {aktlarList.map((act) => (
                            <tr key={act.id}>
                              <td className={styles.td} style={{ fontWeight: 600 }}>{act.company}</td>
                              <td className={styles.td}>{act.number || "—"}</td>
                              <td className={styles.td}>{act.date}</td>
                              <td className={styles.td}>{act.name || "—"}</td>
                              <td className={styles.td} style={{ textAlign: "right" }}>
                                <button
                                  type="button"
                                  className={styles.iconBtn}
                                  onClick={() => setAktlarList(aktlarList.filter(a => a.id !== act.id))}
                                  title="Silmək"
                                >
                                  <FiTrash2 style={{ color: "#ef4444" }} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Sub-Tab 2: Fotoşəkillər */}
                {docsActiveSubTab === "fotos" && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                      <h4 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "#475569" }}>Fotoşəkillər</h4>
                      <label
                        style={{
                          background: "#22c55e",
                          color: "#ffffff",
                          borderRadius: "0.375rem",
                          padding: "0.45rem 1rem",
                          fontSize: "0.8rem",
                          fontWeight: "bold",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={(e) => {
                            const files = e.target.files;
                            if (files && files.length > 0) {
                              const f = files[0];
                              setFotosList([
                                ...fotosList,
                                {
                                  id: String(Date.now()),
                                  name: f.name,
                                  url: URL.createObjectURL(f),
                                  size: `${(f.size / 1024).toFixed(0)} KB`,
                                  createdAt: "27.05.2026",
                                },
                              ]);
                            }
                          }}
                        />
                        + Şəkil yüklə
                      </label>
                    </div>

                    {fotosList.length === 0 ? (
                      <p style={{ color: "#64748b", fontSize: "0.85rem", fontStyle: "italic", textAlign: "center", padding: "1.5rem" }}>
                        Fotoşəkil yüklənməyib.
                      </p>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "1rem" }}>
                        {fotosList.map((foto) => (
                          <div
                            key={foto.id}
                            style={{
                              border: "1px solid #cbd5e1",
                              borderRadius: "0.5rem",
                              overflow: "hidden",
                              position: "relative",
                              background: "#ffffff",
                            }}
                          >
                            <img src={foto.url} alt={foto.name} style={{ width: "100%", height: "90px", objectFit: "cover" }} />
                            <div style={{ padding: "0.35rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: "0.75rem", color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80px" }} title={foto.name}>
                                {foto.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => setFotosList(fotosList.filter(f => f.id !== foto.id))}
                                style={{ background: "transparent", border: 0, padding: 0, cursor: "pointer", color: "#ef4444", fontSize: "0.85rem" }}
                              >
                                &times;
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-Tab 3: Documents from request */}
                {docsActiveSubTab === "requested" && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                      <h4 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "#475569" }}>
                        Documents from request
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          setNewDocName("");
                          setNewDocDate("27.05.2026");
                          setNewDocProvideAccessCustomer(false);
                          setNewDocProvideAccessCarrier(false);
                          setNewDocComments("");
                          setNewDocLink("");
                          setIsNewDocModalOpen(true);
                        }}
                        style={{
                          background: "#22c55e",
                          color: "#ffffff",
                          border: 0,
                          borderRadius: "0.375rem",
                          padding: "0.45rem 1rem",
                          fontSize: "0.8rem",
                          fontWeight: "bold",
                          cursor: "pointer",
                        }}
                      >
                        + Əlavə et
                      </button>
                    </div>

                    <div className={styles.tableWrapper}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th className={styles.th}>Sənədin adı</th>
                            <th className={styles.th}>Şərhlər</th>
                            <th className={styles.th}>Yaradılması tarixi</th>
                            <th className={styles.th}>Müştəri üçün əlçatandır</th>
                            <th className={styles.th} style={{ width: "180px", textAlign: "right" }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {requestedDocsList.map((doc) => (
                            <tr key={doc.id}>
                              <td className={styles.td} style={{ fontWeight: 600 }}>{doc.name}</td>
                              <td className={styles.td}>{doc.comments || "—"}</td>
                              <td className={styles.td}>{doc.createdAt}</td>
                              <td className={styles.td}>
                                {doc.isAvailableToCustomer ? (
                                  <span style={{ color: "#22c55e", fontWeight: "bold" }}>Bəli</span>
                                ) : (
                                  <span style={{ color: "#ef4444", fontWeight: "bold" }}>Xeyr</span>
                                )}
                              </td>
                              <td className={styles.td} style={{ textAlign: "right" }}>
                                <div style={{ display: "inline-flex", gap: "0.5rem", alignItems: "center" }}>
                                  {/* PDF icon */}
                                  <FiFileText style={{ color: "#ef4444", fontSize: "0.95rem", cursor: "pointer" }} title="PDF" />

                                  {/* Email icon */}
                                  <span style={{ display: "inline-flex", cursor: "pointer" }} title="Email">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                      <polyline points="22,6 12,13 2,6" />
                                    </svg>
                                  </span>

                                  {/* Email with green check icon */}
                                  <span style={{ display: "inline-flex", cursor: "pointer" }} title="Notified">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                      <polyline points="22,6 12,13 2,6" />
                                    </svg>
                                  </span>
                                  
                                  {/* Edit pencil icon */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedDocForEdit(doc);
                                      setEditDocType(doc.type);
                                      setEditDocTemplate(doc.template);
                                      setEditDocName(doc.name);
                                      setEditDocProvideAccessCustomer(doc.isAvailableToCustomer);
                                      setEditDocProvideAccessCarrier(doc.isAvailableToCarrier);
                                      setEditDocSendNotif(doc.sendNotif);
                                      setEditDocComments(doc.comments);
                                      setIsEditDocModalOpen(true);
                                    }}
                                    style={{
                                      background: "transparent",
                                      border: 0,
                                      cursor: "pointer",
                                      padding: "0.15rem",
                                      display: "flex",
                                      alignItems: "center",
                                    }}
                                    title="Redaktə et"
                                  >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                    </svg>
                                  </button>

                                  {/* Log icon */}
                                  <FiBookOpen style={{ color: "#94a3b8", fontSize: "0.95rem", cursor: "pointer" }} title="Logs" />

                                  {/* Delete circular minus icon */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDocToDelete(doc);
                                      setIsDocDeleteConfirmOpen(true);
                                    }}
                                    style={{
                                      background: "transparent",
                                      border: 0,
                                      cursor: "pointer",
                                      padding: "0.15rem",
                                      display: "flex",
                                      alignItems: "center",
                                    }}
                                    title="Sil"
                                  >
                                    <FiTrash2 style={{ color: "#ef4444", fontSize: "0.95rem" }} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "invoices" && (
              <div>
                {/* Sub navigation bar */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.5rem", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", gap: "1.5rem" }}>
                    <button
                      type="button"
                      onClick={() => setInvoicesSubTab("ireli")}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        background: "transparent",
                        border: 0,
                        borderBottom: invoicesSubTab === "ireli" ? "2px solid #16a34a" : "2px solid transparent",
                        paddingBottom: "0.5rem",
                        color: invoicesSubTab === "ireli" ? "#16a34a" : "#64748b",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontSize: "0.9rem"
                      }}
                    >
                      <FiFileText style={{ fontSize: "1rem" }} />
                      İrəli sürülmüş hesablar
                    </button>
                    <button
                      type="button"
                      onClick={() => setInvoicesSubTab("ilkin")}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        background: "transparent",
                        border: 0,
                        borderBottom: invoicesSubTab === "ilkin" ? "2px solid #16a34a" : "2px solid transparent",
                        paddingBottom: "0.5rem",
                        color: invoicesSubTab === "ilkin" ? "#16a34a" : "#64748b",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontSize: "0.9rem"
                      }}
                    >
                      <FiFile style={{ fontSize: "1rem" }} />
                      İlkin hesablar
                    </button>
                    <button
                      type="button"
                      onClick={() => setInvoicesSubTab("alinmis")}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        background: "transparent",
                        border: 0,
                        borderBottom: invoicesSubTab === "alinmis" ? "2px solid #16a34a" : "2px solid transparent",
                        paddingBottom: "0.5rem",
                        color: invoicesSubTab === "alinmis" ? "#16a34a" : "#64748b",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontSize: "0.9rem"
                      }}
                    >
                      <FiArrowLeft style={{ fontSize: "1rem" }} />
                      Alınmış hesablar
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setInvoiceNumber(`INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
                      setInvoiceDate("27.05.2026");
                      setInvoiceDelayDays("0");
                      setInvoicePayUntilDate("27.05.2026");
                      setInvoiceRows([
                        {
                          id: "1",
                          text: "Freight Charges EXW Changzhou, up to FOA Baku\n\nSender: Changzhou Sifary Medical Technology\nConsinger: Limon Dental MMC\nTrace number:",
                          unit: "Marşrut",
                          qty: 1,
                          price: 1450,
                          vatRate: "0%"
                        }
                      ]);
                      setIsNewInvoiceModalOpen(true);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.375rem",
                      background: "#16a34a",
                      color: "#ffffff",
                      border: 0,
                      borderRadius: "0.375rem",
                      padding: "0.5rem 1rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontSize: "0.875rem",
                      transition: "background-color 0.2s"
                    }}
                  >
                    <FiPlus />
                    Əlavə et
                  </button>
                </div>

                {/* Table or Empty State */}
                {invoicesList.filter(inv => inv.type === invoicesSubTab).length === 0 ? (
                  <div style={{ padding: "2rem", textAlign: "left", color: "#64748b", background: "#ffffff", borderRadius: "0.5rem", border: "1px solid #e2e8f0", fontSize: "0.9rem" }}>
                    Hesablar əlavə edilmeyib...
                  </div>
                ) : (
                  <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th className={styles.th}>Hesab №</th>
                          <th className={styles.th}>Tarix</th>
                          <th className={styles.th}>Ödəyici</th>
                          <th className={styles.th}>Məbləğ</th>
                          <th className={styles.th}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoicesList.filter(inv => inv.type === invoicesSubTab).map((inv) => (
                          <tr key={inv.id}>
                            <td className={styles.td} style={{ fontWeight: 600 }}>{inv.number}</td>
                            <td className={styles.td}>{inv.date}</td>
                            <td className={styles.td}>{inv.payer}</td>
                            <td className={styles.td}>{inv.amount}</td>
                            <td className={styles.td}>
                              <span className={styles.statusBadge} style={{ background: inv.status === "Ölənilib" ? "#dcfce7" : "#fef9c3", color: inv.status === "Ölənilib" ? "#166534" : "#854d0e" }}>
                                {inv.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === "comments" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(20rem, 1fr))", gap: "2.5rem" }}>
                  
                  {/* Left Column: Comments List */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "2px solid #f1f5f9", paddingBottom: "0.75rem" }}>
                      <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#1e293b" }}>Şərhlər ({comments.length})</h3>
                      <button
                        type="button"
                        onClick={() => {
                          setCommentText("");
                          setCommentProvideAccessCustomer(false);
                          setCommentProvideAccessCarrier(false);
                          setIsNewCommentModalOpen(true);
                        }}
                        style={{
                          background: "#16a34a",
                          color: "#ffffff",
                          border: 0,
                          borderRadius: "0.375rem",
                          padding: "0.45rem 1rem",
                          fontSize: "0.825rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.375rem"
                        }}
                      >
                        <FiPlus />
                        Şərh yaz
                      </button>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxHeight: "450px", overflowY: "auto", paddingRight: "0.25rem" }}>
                      {comments.map((c) => (
                        <div key={c.id} style={{ background: "#ffffff", padding: "1.25rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.75rem", color: "#64748b" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontWeight: 700, color: "#475569" }}>
                              <FiUser style={{ color: "#16a34a" }} /> {c.userName}
                            </span>
                            <span>{c.createdAt}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: "0.875rem", color: "#334155", lineHeight: 1.5 }}>{c.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Tasks List */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "2px solid #f1f5f9", paddingBottom: "0.75rem" }}>
                      <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#1e293b" }}>Tapşırıqlar ({tasksList.length})</h3>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTaskForEdit(null);
                          setTaskTitle("");
                          setTaskDescription("");
                          setTaskChecklist([]);
                          setTaskContractor("Dəyəri seçin");
                          setTaskDepartment("Dəyəri seçin");
                          setTaskAuthor("Ulvi Adilzade (Satış şöbəsi)");
                          setTaskExecutor("Ulvi Adilzade (Satış şöbəsi)");
                          setTaskIsRecurring(false);
                          setTaskCreatedDate("27.05.2026");
                          setTaskCreatedTime("17:54");
                          setTaskDueDate("");
                          setTaskDueTime("");
                          setTaskDueAmount("");
                          setTaskRemind(true);
                          setTaskRemindDay("İcra günündə");
                          setTaskRemindTime("10:00");
                          setIsTaskModalOpen(true);
                        }}
                        style={{
                          background: "#16a34a",
                          color: "#ffffff",
                          border: 0,
                          borderRadius: "0.375rem",
                          padding: "0.45rem 1rem",
                          fontSize: "0.825rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.375rem"
                        }}
                      >
                        <FiPlus />
                        Tapşırıq əlavə et
                      </button>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxHeight: "450px", overflowY: "auto", paddingRight: "0.25rem" }}>
                      {tasksList.map((task) => (
                        <div
                          key={task.id}
                          style={{
                            background: "#ffffff",
                            padding: "1.25rem",
                            borderRadius: "0.5rem",
                            border: "1px solid #e2e8f0",
                            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.75rem",
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                          onClick={() => {
                            setSelectedTaskForEdit(task);
                            setTaskTitle(task.title);
                            setTaskDescription(task.description);
                            setTaskChecklist(task.checklist);
                            setTaskContractor(task.contractor);
                            setTaskDepartment(task.department);
                            setTaskAuthor(task.author);
                            setTaskExecutor(task.executor);
                            setTaskIsRecurring(task.isRecurring);
                            setTaskCreatedDate(task.createdDate);
                            setTaskCreatedTime(task.createdTime);
                            setTaskDueDate(task.dueDate);
                            setTaskDueTime(task.dueTime);
                            setTaskDueAmount(task.dueAmount);
                            setTaskRemind(task.remind);
                            setTaskRemindDay(task.remindDay);
                            setTaskRemindTime(task.remindTime);
                            setIsTaskModalOpen(true);
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.borderColor = "#16a34a";
                            e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.05)";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.borderColor = "#e2e8f0";
                            e.currentTarget.style.boxShadow = "0 1px 3px 0 rgba(0, 0, 0, 0.05)";
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                            <input
                              type="checkbox"
                              checked={task.completed}
                              onChange={(e) => {
                                e.stopPropagation();
                                const updated = tasksList.map(t => t.id === task.id ? { ...t, completed: e.target.checked } : t);
                                setTasksList(updated);
                              }}
                              style={{ width: "1.15rem", height: "1.15rem", accentColor: "#16a34a", cursor: "pointer", marginTop: "0.15rem" }}
                            />
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1 }}>
                              <span style={{ fontWeight: 700, fontSize: "0.925rem", color: "#1e293b", textDecoration: task.completed ? "line-through" : "none" }}>
                                {task.title}
                              </span>
                              {task.description && (
                                <span style={{ fontSize: "0.825rem", color: "#64748b", textDecoration: task.completed ? "line-through" : "none" }}>
                                  {task.description.length > 70 ? `${task.description.slice(0, 70)}...` : task.description}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {task.checklist && task.checklist.length > 0 && (
                            <div style={{ paddingLeft: "1.9rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                              {task.checklist.map((item, idx) => (
                                <span key={idx} style={{ fontSize: "0.775rem", color: "#64748b", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                                  <span style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: "#cbd5e1" }} />
                                  {item}
                                </span>
                              ))}
                            </div>
                          )}

                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.725rem", color: "#94a3b8", borderTop: "1px dashed #f1f5f9", paddingTop: "0.5rem", marginTop: "0.25rem" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                              <FiUser /> {task.executor.split(" ")[0]}
                            </span>
                            {task.dueDate && (
                              <span style={{ background: "#fee2e2", color: "#b91c1c", padding: "0.15rem 0.45rem", borderRadius: "0.25rem", fontWeight: 600 }}>
                                Son: {task.dueDate}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status History Modal Overlay */}
      {isHistoryModalOpen && (
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
          {/* Backdrop blur */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(15, 23, 42, 0.4)",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setIsHistoryModalOpen(false)}
          />
          {/* Center Card */}
          <div
            style={{
              position: "relative",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "1.25rem",
              width: "min(100%, 28rem)",
              boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.15)",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                background: "#f8fafc",
                borderBottom: "1px solid #e2e8f0",
                padding: "1.25rem 1.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#1e293b" }}>
                Sifarişin Status Tarixçəsi
              </h3>
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                style={{
                  background: "transparent",
                  border: 0,
                  cursor: "pointer",
                  fontSize: "1.25rem",
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                  padding: "0.25rem",
                  borderRadius: "0.375rem",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            {/* Body */}
            <div style={{ padding: "1.5rem", maxHeight: "60vh", overflowY: "auto" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {(order.statusHistory && order.statusHistory.length > 0) ? (
                  order.statusHistory.map((item, idx) => (
                    <div key={idx} style={{ position: "relative", paddingLeft: "1.5rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                      {idx !== order.statusHistory!.length - 1 && (
                        <div style={{ position: "absolute", left: "5px", top: "16px", bottom: "-12px", width: "1px", backgroundColor: "#cbd5e1" }} />
                      )}
                      <div style={{ position: "absolute", left: 0, top: "6px", width: "10px", height: "10px", borderRadius: "50%", border: "2px solid #ffffff", backgroundColor: "#16a34a", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }} />
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1 }}>
                        <span
                          style={{
                            fontSize: "0.85rem",
                            fontWeight: 700,
                            color: item.status === "Davam edir" ? "#b45309" : item.status === "Tamamlandı" ? "#047857" : item.status === "Maliyyə cəhətdən bağlandı" ? "#4338ca" : item.status === "Sifariş ləğv edildi" ? "#b91c1c" : "#1d4ed8",
                          }}
                        >
                          {item.status}
                        </span>
                        <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 500 }}>
                          {item.date.includes("tərəfindən") ? item.date : `${item.date} (tərəfindən: Ulvi Adilzade)`}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ margin: 0, color: "#64748b", fontStyle: "italic", textAlign: "center", padding: "1rem 0" }}>Tarixçə tapılmadı.</p>
                )}
              </div>
            </div>
            {/* Footer */}
            <div
              style={{
                background: "#f8fafc",
                borderTop: "1px solid #e2e8f0",
                padding: "1rem 1.5rem",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                style={{
                  border: "1px solid #dbe4f0",
                  background: "#ffffff",
                  color: "#475569",
                  borderRadius: "0.5rem",
                  padding: "0.5rem 1.25rem",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  transition: "background-color 0.2s ease",
                }}
              >
                Bağla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      <SifarisEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onConfirm={handleSaveEdit}
        order={order}
      />

      {/* New Load Modal */}
      <YukNewModal
        isOpen={isYukModalOpen}
        onClose={() => setIsYukModalOpen(false)}
        onConfirm={handleYukAdd}
      />

      {/* View Load Modal */}
      <YukViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedLoadForView(null);
        }}
        onEdit={() => {
          setSelectedLoadForEdit(selectedLoadForView);
          setIsViewModalOpen(false);
          setIsYukEditModalOpen(true);
        }}
        load={selectedLoadForView}
      />

      {/* Edit Load Modal */}
      <YukNewModal
        isOpen={isYukEditModalOpen}
        onClose={() => {
          setIsYukEditModalOpen(false);
          setSelectedLoadForEdit(null);
        }}
        onConfirm={handleYukEdit}
        editLoad={selectedLoadForEdit}
      />

      {/* View Voyage Modal */}
      <ReysViewModal
        isOpen={isVoyageViewOpen}
        onClose={() => {
          setIsVoyageViewOpen(false);
          setSelectedVoyageForView(null);
        }}
        onEdit={() => {
          setSelectedVoyageForEdit(selectedVoyageForView);
          setIsVoyageViewOpen(false);
          setIsVoyageEditOpen(true);
        }}
        voyage={selectedVoyageForView}
      />

      {/* Edit Voyage Modal */}
      <ReysEditModal
        isOpen={isVoyageEditOpen}
        onClose={() => {
          setIsVoyageEditOpen(false);
          setSelectedVoyageForEdit(null);
        }}
        onConfirm={handleVoyageAddOrEdit}
        editVoyage={selectedVoyageForEdit}
      />

      {/* Delete Voyage Modal */}
      <ReysDeleteModal
        isOpen={isVoyageDeleteOpen}
        onClose={() => {
          setIsVoyageDeleteOpen(false);
          setSelectedVoyageForDelete(null);
        }}
        onConfirm={() => {
          if (selectedVoyageForDelete) {
            saveVoyagesList(voyagesList.filter((item) => item.id !== selectedVoyageForDelete.id));
          }
          setIsVoyageDeleteOpen(false);
          setSelectedVoyageForDelete(null);
        }}
        voyageNumber={selectedVoyageForDelete?.number || ""}
      />

      {/* Transaction Modal Overlay */}
      {isAddTransactionModalOpen && (
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
          {/* Backdrop blur */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(15, 23, 42, 0.4)",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setIsAddTransactionModalOpen(false)}
          />
          {/* Modal Container */}
          <div
            style={{
              position: "relative",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "1rem",
              width: "min(100%, 58rem)",
              boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.15)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              maxHeight: "90vh",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "1.25rem 1.75rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "transparent",
                borderBottom: "1px solid #e2e8f0"
              }}
            >
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#334155" }}>
                {selectedTxForEdit ? "Maliyyə əməliyyatını redaktə etmə" : "Əlavə etmə"}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddTransactionModalOpen(false)}
                style={{
                  background: "transparent",
                  border: 0,
                  cursor: "pointer",
                  fontSize: "1.5rem",
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                  padding: "0.25rem",
                  transition: "color 0.2s",
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = "#334155")}
                onMouseOut={(e) => (e.currentTarget.style.color = "#64748b")}
              >
                &times;
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div style={{ padding: "1.75rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

              {/* Row 1: Şablon, İstifadəçi, Qiymətin hesablanması tipi, Expense category */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "1.25rem" }}>
                {/* Şablon */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Şablon</span>
                    <button type="button" onClick={() => setIsTemplateModalOpen(true)} style={plusBtnStyle}>+</button>
                  </div>
                  <select
                    value={txTemplate}
                    onChange={(e) => setTxTemplate(e.target.value)}
                    style={selectStyle}
                  >
                    <option value="Dəyəri seçin">Dəyəri seçin</option>
                    <option value="Standard">Standard</option>
                  </select>
                </div>

                {/* İstifadəçi */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>İstifadəçi <span style={{ color: "#ef4444" }}>*</span></span>
                  </div>
                  <div style={{ position: "relative" }}>
                    <select
                      value={txUser}
                      onChange={(e) => setTxUser(e.target.value)}
                      style={selectStyle}
                    >
                      <option value="Ulvi Adilzade">Ulvi Adilzade</option>
                      <option value="Nijat Shabanly">Nijat Shabanly</option>
                    </select>
                    {txUser && (
                      <span onClick={() => setTxUser("")} style={clearIconStyle}>&times;</span>
                    )}
                  </div>
                </div>

                {/* Qiymətin hesablanması tipi */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Qiymətin hesablanması tipi <span style={{ color: "#ef4444" }}>*</span></span>
                  </div>
                  <div style={{ position: "relative" }}>
                    <select
                      value={txCalcType}
                      onChange={(e) => setTxCalcType(e.target.value)}
                      style={selectStyle}
                    >
                      <option value="ƏDV-siz qiymət">ƏDV-siz qiymət</option>
                      <option value="ƏDV ilə qiymət">ƏDV ilə qiymət</option>
                    </select>
                    {txCalcType && (
                      <span onClick={() => setTxCalcType("")} style={clearIconStyle}>&times;</span>
                    )}
                  </div>
                </div>

                {/* Expense category */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Expense category <span style={{ color: "#ef4444" }}>*</span></span>
                    <button
                      type="button"
                      onClick={() => {
                        setCatName("");
                        setCatActive(true);
                        setCatDefault(false);
                        setIsExpenseCategoryModalOpen(true);
                      }}
                      style={plusBtnStyle}
                    >
                      +
                    </button>
                  </div>
                  <div style={{ position: "relative" }}>
                    <select
                      value={txCategory}
                      onChange={(e) => setTxCategory(e.target.value)}
                      style={selectStyle}
                    >
                      <option value="Order expenses">Order expenses</option>
                      <option value="Administrative expenses">Administrative expenses</option>
                    </select>
                    {txCategory && (
                      <span onClick={() => setTxCategory("")} style={clearIconStyle}>&times;</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 2: Hesab alındı, Adı */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1.25rem" }}>
                {/* Hesab alındı */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>
                      Hesab alındı <span style={{ color: "#94a3b8", cursor: "help" }} title="Hesab alınıb-alınmadığını bildirir">?</span>
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setPartnerMenuCoords({ x: rect.left, y: rect.bottom + window.scrollY });
                        setIsPartnerMenuOpen(!isPartnerMenuOpen);
                      }}
                      style={plusBtnStyle}
                    >
                      +
                    </button>
                  </div>
                  <select
                    value={txInvoiceReceived}
                    onChange={(e) => setTxInvoiceReceived(e.target.value)}
                    style={selectStyle}
                  >
                    <option value="Dəyəri seçin">Dəyəri seçin</option>
                    <option value="Bəli">Bəli</option>
                    <option value="Xeyr">Xeyr</option>
                  </select>
                </div>

                {/* Adı */}
                <div>
                  <span style={{ display: "block", fontSize: "0.75rem", color: "#64748b", fontWeight: 600, marginBottom: "0.25rem" }}>
                    Adı <span style={{ color: "#ef4444" }}>*</span>
                  </span>
                  <input
                    type="text"
                    value={txName}
                    onChange={(e) => setTxName(e.target.value)}
                    placeholder="Əməliyyatın adı"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Section 1: Gəlir */}
              <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "1rem" }}>
                <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.9rem", fontWeight: 700, color: "#475569" }}>Gəlir</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 1.5fr 1.5fr 1.2fr 1fr", gap: "1.25rem" }}>
                  <div>
                    <span style={{ display: "block", fontSize: "0.75rem", color: "#64748b", fontWeight: 600, marginBottom: "0.25rem" }}>
                      Miqdarı <span style={{ color: "#ef4444" }}>*</span>
                    </span>
                    <input
                      type="number"
                      value={txRevQty}
                      onChange={(e) => setTxRevQty(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: "0.75rem", color: "#64748b", fontWeight: 600, marginBottom: "0.25rem" }}>
                      Qiymət <span style={{ color: "#ef4444" }}>*</span>
                    </span>
                    <input
                      type="number"
                      value={txRevPrice}
                      onChange={(e) => setTxRevPrice(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: "0.75rem", color: "#64748b", fontWeight: 600, marginBottom: "0.25rem" }}>Tarif</span>
                    <input
                      type="text"
                      value={txRevTarif}
                      disabled
                      style={{ ...inputStyle, background: "#f1f5f9", cursor: "not-allowed" }}
                    />
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: "0.75rem", color: "#64748b", fontWeight: 600, marginBottom: "0.25rem" }}>ƏDV ilə tarif</span>
                    <input
                      type="text"
                      value={txRevTarif}
                      disabled
                      style={{ ...inputStyle, background: "#f1f5f9", cursor: "not-allowed" }}
                    />
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: "0.75rem", color: "#64748b", fontWeight: 600, marginBottom: "0.25rem" }}>
                      ƏDV tarifi <span style={{ color: "#ef4444" }}>*</span>
                    </span>
                    <select
                      value={txRevVatRate}
                      onChange={(e) => setTxRevVatRate(e.target.value)}
                      style={selectStyle}
                    >
                      <option value="0%">0%</option>
                      <option value="18%">18%</option>
                    </select>
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: "0.75rem", color: "#64748b", fontWeight: 600, marginBottom: "0.25rem" }}>
                      Valyuta <span style={{ color: "#ef4444" }}>*</span>
                    </span>
                    <select
                      value={txRevCurrency}
                      onChange={(e) => setTxRevCurrency(e.target.value)}
                      style={selectStyle}
                    >
                      <option value="AZN">AZN</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Məsarif */}
              <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "1rem" }}>
                <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.9rem", fontWeight: 700, color: "#475569" }}>Məsarif</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 1.5fr 1.5fr 1.2fr 1fr", gap: "1.25rem" }}>
                  <div>
                    <span style={{ display: "block", fontSize: "0.75rem", color: "#64748b", fontWeight: 600, marginBottom: "0.25rem" }}>
                      Miqdarı <span style={{ color: "#ef4444" }}>*</span>
                    </span>
                    <input
                      type="number"
                      value={txExpQty}
                      onChange={(e) => setTxExpQty(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: "0.75rem", color: "#64748b", fontWeight: 600, marginBottom: "0.25rem" }}>
                      Qiymət <span style={{ color: "#ef4444" }}>*</span>
                    </span>
                    <input
                      type="number"
                      value={txExpPrice}
                      onChange={(e) => setTxExpPrice(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: "0.75rem", color: "#64748b", fontWeight: 600, marginBottom: "0.25rem" }}>Məsarif</span>
                    <input
                      type="text"
                      value={txExpMesarif}
                      disabled
                      style={{ ...inputStyle, background: "#f1f5f9", cursor: "not-allowed" }}
                    />
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: "0.75rem", color: "#64748b", fontWeight: 600, marginBottom: "0.25rem" }}>ƏDV ilə məsarif</span>
                    <input
                      type="text"
                      value={txExpMesarif}
                      disabled
                      style={{ ...inputStyle, background: "#f1f5f9", cursor: "not-allowed" }}
                    />
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: "0.75rem", color: "#64748b", fontWeight: 600, marginBottom: "0.25rem" }}>
                      ƏDV tarifi <span style={{ color: "#ef4444" }}>*</span>
                    </span>
                    <select
                      value={txExpVatRate}
                      onChange={(e) => setTxExpVatRate(e.target.value)}
                      style={selectStyle}
                    >
                      <option value="0%">0%</option>
                      <option value="18%">18%</option>
                    </select>
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: "0.75rem", color: "#64748b", fontWeight: 600, marginBottom: "0.25rem" }}>
                      Valyuta <span style={{ color: "#ef4444" }}>*</span>
                    </span>
                    <select
                      value={txExpCurrency}
                      onChange={(e) => setTxExpCurrency(e.target.value)}
                      style={selectStyle}
                    >
                      <option value="AZN">AZN</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Təsviri */}
              <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "1rem" }}>
                <span style={{ display: "block", fontSize: "0.75rem", color: "#64748b", fontWeight: 600, marginBottom: "0.25rem" }}>Təsviri</span>
                <textarea
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                  rows={2}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              {/* Checkboxes */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={txExcludeFromFinance}
                    onChange={(e) => setTxExcludeFromFinance(e.target.checked)}
                    style={{ width: "16px", height: "16px", accentColor: "#22c55e" }}
                  />
                  <span style={{ fontSize: "0.85rem", color: "#334155", fontWeight: 500 }}>
                    Məsarif maliyyələrdə nəzərə alınmasın <span style={{ color: "#94a3b8", cursor: "help" }} title="Bu xərclər ümumi maliyyə hesabatlarında mənfəətdən çıxılmayacaq">?</span>
                  </span>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={txSeparateInvoiceLine}
                    onChange={(e) => setTxSeparateInvoiceLine(e.target.checked)}
                    style={{ width: "16px", height: "16px", accentColor: "#22c55e" }}
                  />
                  <span style={{ fontSize: "0.85rem", color: "#334155", fontWeight: 500 }}>
                    Hesaba ayrıca sətir <span style={{ color: "#94a3b8", cursor: "help" }} title="Hesab-fakturada bu əməliyyat ayrıca sətir kimi göstəriləcək">?</span>
                  </span>
                </label>
              </div>

            </div>

            {/* Footer */}
            <div
              style={{
                padding: "1.25rem 1.75rem",
                display: "flex",
                justifyContent: "flex-end",
                background: "#f8fafc",
                borderTop: "1px solid #e2e8f0"
              }}
            >
              <button
                type="button"
                onClick={handleSaveTransaction}
                style={{
                  background: "#22c55e",
                  color: "#ffffff",
                  border: 0,
                  borderRadius: "0.375rem",
                  padding: "0.625rem 1.5rem",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "background 0.2s",
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

      {/* Template creation modal: "Xərclər üçün şablon" */}
      {isTemplateModalOpen && (
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
          <div 
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(15, 23, 42, 0.4)",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setIsTemplateModalOpen(false)}
          />

          <div 
            style={{
              position: "relative",
              background: "#f8fafc",
              borderRadius: "0.75rem",
              boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.15)",
              width: "90%",
              maxWidth: "1120px",
              display: "flex",
              flexDirection: "column",
              zIndex: 10002,
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div 
              style={{
                padding: "1.25rem 1.75rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#ffffff",
                borderBottom: "1px solid #e2e8f0"
              }}
            >
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#334155" }}>
                Xərclər üçün şablon
              </h3>
              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(false)}
                style={{
                  background: "transparent",
                  border: 0,
                  cursor: "pointer",
                  fontSize: "1.5rem",
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                  padding: "0.25rem",
                }}
              >
                &times;
              </button>
            </div>

            {/* Form Content */}
            <div style={{ padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem", background: "#f8fafc" }}>
              {/* Row 1 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "1.25rem" }}>
                <div>
                  <span style={{ display: "block", fontSize: "0.75rem", color: "#64748b", fontWeight: 600, marginBottom: "0.25rem" }}>Kontragent</span>
                  <select value={tplPartner} onChange={(e) => setTplPartner(e.target.value)} style={selectStyle}>
                    <option value="Dəyəri seçin">Dəyəri seçin</option>
                  </select>
                </div>
                <div>
                  <span style={{ display: "block", fontSize: "0.75rem", color: "#64748b", fontWeight: 600, marginBottom: "0.25rem" }}>Şablonun adı <span style={{ color: "#ef4444" }}>*</span></span>
                  <input type="text" value={tplName} onChange={(e) => setTplName(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <span style={{ display: "block", fontSize: "0.75rem", color: "#64748b", fontWeight: 600, marginBottom: "0.25rem" }}>Expense category <span style={{ color: "#ef4444" }}>*</span></span>
                  <div style={{ position: "relative" }}>
                    <select value={tplCategory} onChange={(e) => setTplCategory(e.target.value)} style={selectStyle}>
                      <option value="Order expenses">Order expenses</option>
                    </select>
                    <span style={{ position: "absolute", right: "2rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", cursor: "pointer" }}>&times;</span>
                  </div>
                </div>
                <div>
                  <span style={{ display: "block", fontSize: "0.75rem", color: "#64748b", fontWeight: 600, marginBottom: "0.25rem" }}>Qiymətin hesablanması tipi</span>
                  <select value={tplCalcType} onChange={(e) => setTplCalcType(e.target.value)} style={selectStyle}>
                    <option value="ƏDV-siz qiymət">ƏDV-siz qiymət</option>
                  </select>
                </div>
              </div>

              {/* Section 1: Gəlir */}
              <div>
                <h4 style={{ margin: "0.5rem 0 0.75rem", fontSize: "0.9rem", fontWeight: 700, color: "#475569" }}>Gəlir</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.5fr 1.5fr 1.5fr 1.5fr", gap: "1.25rem" }}>
                  <div>
                    <span style={{ display: "block", fontSize: "0.75rem", color: "#64748b", fontWeight: 600, marginBottom: "0.25rem" }}>Miqdarı</span>
                    <input type="number" value={tplRevQty} onChange={(e) => setTplRevQty(e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: "0.75rem", color: "#64748b", fontWeight: 600, marginBottom: "0.25rem" }}>Qiymət</span>
                    <input type="number" value={tplRevPrice} onChange={(e) => setTplRevPrice(e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: "0.75rem", color: "#64748b", fontWeight: 600, marginBottom: "0.25rem" }}>Tarif</span>
                    <input type="text" value={tplRevTarif} disabled style={{ ...inputStyle, background: "#f1f5f9", cursor: "not-allowed" }} />
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: "0.75rem", color: "#64748b", fontWeight: 600, marginBottom: "0.25rem" }}>ƏDV ilə tarif</span>
                    <input type="text" value={tplRevTarif} disabled style={{ ...inputStyle, background: "#f1f5f9", cursor: "not-allowed" }} />
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: "0.75rem", color: "#64748b", fontWeight: 600, marginBottom: "0.25rem" }}>ƏDV tarifi <span style={{ color: "#ef4444" }}>*</span></span>
                    <select value={tplRevVatRate} onChange={(e) => setTplRevVatRate(e.target.value)} style={selectStyle}>
                      <option value="20%">20%</option>
                      <option value="18%">18%</option>
                      <option value="0%">0%</option>
                    </select>
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: "0.75rem", color: "#64748b", fontWeight: 600, marginBottom: "0.25rem" }}>Valyuta <span style={{ color: "#ef4444" }}>*</span></span>
                    <select value={tplRevCurrency} onChange={(e) => setTplRevCurrency(e.target.value)} style={selectStyle}>
                      <option value="AZN">AZN</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Məsarif */}
              <div>
                <h4 style={{ margin: "0.5rem 0 0.75rem", fontSize: "0.9rem", fontWeight: 700, color: "#475569" }}>Məsarif</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.5fr 1.5fr 1.5fr 1.5fr", gap: "1.25rem" }}>
                  <div>
                    <span style={{ display: "block", fontSize: "0.75rem", color: "#64748b", fontWeight: 600, marginBottom: "0.25rem" }}>Miqdarı</span>
                    <input type="number" value={tplExpQty} onChange={(e) => setTplExpQty(e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: "0.75rem", color: "#64748b", fontWeight: 600, marginBottom: "0.25rem" }}>Qiymət</span>
                    <input type="number" value={tplExpPrice} onChange={(e) => setTplExpPrice(e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: "0.75rem", color: "#64748b", fontWeight: 600, marginBottom: "0.25rem" }}>Tarif</span>
                    <input type="text" value={tplExpMesarif} disabled style={{ ...inputStyle, background: "#f1f5f9", cursor: "not-allowed" }} />
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: "0.75rem", color: "#64748b", fontWeight: 600, marginBottom: "0.25rem" }}>ƏDV ilə tarif</span>
                    <input type="text" value={tplExpMesarif} disabled style={{ ...inputStyle, background: "#f1f5f9", cursor: "not-allowed" }} />
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: "0.75rem", color: "#64748b", fontWeight: 600, marginBottom: "0.25rem" }}>ƏDV tarifi <span style={{ color: "#ef4444" }}>*</span></span>
                    <select value={tplExpVatRate} onChange={(e) => setTplExpVatRate(e.target.value)} style={selectStyle}>
                      <option value="20%">20%</option>
                      <option value="18%">18%</option>
                      <option value="0%">0%</option>
                    </select>
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: "0.75rem", color: "#64748b", fontWeight: 600, marginBottom: "0.25rem" }}>Valyuta <span style={{ color: "#ef4444" }}>*</span></span>
                    <select value={tplExpCurrency} onChange={(e) => setTplExpCurrency(e.target.value)} style={selectStyle}>
                      <option value="AZN">AZN</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Checkboxes */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                  <input type="checkbox" checked={tplExclude} onChange={(e) => setTplExclude(e.target.checked)} style={{ width: "16px", height: "16px", accentColor: "#22c55e" }} />
                  <span style={{ fontSize: "0.85rem", color: "#334155", fontWeight: 500 }}>
                    Məsarif maliyyələrdə nəzərə alınmasın <span style={{ color: "#94a3b8", cursor: "help" }} title="Bu xərclər ümumi maliyyə hesabatlarında mənfəətdən çıxılmayacaq">?</span>
                  </span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                  <input type="checkbox" checked={tplSeparate} onChange={(e) => setTplSeparate(e.target.checked)} style={{ width: "16px", height: "16px", accentColor: "#22c55e" }} />
                  <span style={{ fontSize: "0.85rem", color: "#334155", fontWeight: 500 }}>
                    Hesaba ayrıca sətir <span style={{ color: "#94a3b8", cursor: "help" }} title="Hesab-fakturada bu əməliyyat ayrıca sətir kimi göstəriləcək">?</span>
                  </span>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div 
              style={{
                padding: "1.25rem 1.75rem",
                display: "flex",
                justifyContent: "flex-end",
                background: "#ffffff",
                borderTop: "1px solid #e2e8f0"
              }}
            >
              <button
                type="button"
                onClick={() => {
                  if (tplName.trim()) {
                    setTxTemplate(tplName);
                  }
                  setIsTemplateModalOpen(false);
                }}
                style={{
                  background: "#22c55e",
                  color: "#ffffff",
                  border: 0,
                  borderRadius: "0.375rem",
                  padding: "0.625rem 1.5rem",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
              >
                Yaddaşda saxlamaq
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category creation modal: "Əlavə etmə" */}
      {isExpenseCategoryModalOpen && (
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
          <div 
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(15, 23, 42, 0.4)",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setIsExpenseCategoryModalOpen(false)}
          />

          <div 
            style={{
              position: "relative",
              background: "#f8fafc",
              borderRadius: "0.75rem",
              boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.15)",
              width: "90%",
              maxWidth: "500px",
              display: "flex",
              flexDirection: "column",
              zIndex: 10002,
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div 
              style={{
                padding: "1.25rem 1.75rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#ffffff",
                borderBottom: "1px solid #e2e8f0"
              }}
            >
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#334155" }}>
                Əlavə etmə
              </h3>
              <button
                type="button"
                onClick={() => setIsExpenseCategoryModalOpen(false)}
                style={{
                  background: "transparent",
                  border: 0,
                  cursor: "pointer",
                  fontSize: "1.5rem",
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                  padding: "0.25rem",
                }}
              >
                &times;
              </button>
            </div>

            {/* Form Content */}
            <div style={{ padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <span style={{ display: "block", fontSize: "0.75rem", color: "#64748b", fontWeight: 600, marginBottom: "0.25rem" }}>Adı <span style={{ color: "#ef4444" }}>*</span></span>
                <input type="text" value={catName} onChange={(e) => setCatName(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <span style={{ display: "block", fontSize: "0.75rem", color: "#64748b", fontWeight: 600, marginBottom: "0.25rem" }}>Expenses: Category <span style={{ color: "#ef4444" }}>*</span></span>
                <input type="text" value="Expense per order" disabled style={{ ...inputStyle, background: "#f1f5f9", cursor: "not-allowed" }} />
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.5rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                  <input type="checkbox" checked={catActive} onChange={(e) => setCatActive(e.target.checked)} style={{ width: "18px", height: "18px", accentColor: "#22c55e" }} />
                  <span style={{ fontSize: "0.85rem", color: "#334155", fontWeight: 600 }}>Aktiv</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                  <input type="checkbox" checked={catDefault} onChange={(e) => setCatDefault(e.target.checked)} style={{ width: "18px", height: "18px", accentColor: "#22c55e" }} />
                  <span style={{ fontSize: "0.85rem", color: "#334155", fontWeight: 600 }}>Susmaya görə</span>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div 
              style={{
                padding: "1.25rem 1.75rem",
                display: "flex",
                justifyContent: "flex-end",
                background: "#ffffff",
                borderTop: "1px solid #e2e8f0"
              }}
            >
              <button
                type="button"
                onClick={() => {
                  if (catName.trim()) {
                    setTxCategory(catName);
                  }
                  setIsExpenseCategoryModalOpen(false);
                }}
                style={{
                  background: "#22c55e",
                  color: "#ffffff",
                  border: 0,
                  borderRadius: "0.375rem",
                  padding: "0.625rem 1.5rem",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
              >
                Yaddaşda saxlamaq
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Dropdown Context Box */}
      {isPartnerMenuOpen && partnerMenuCoords && (
        <div 
          style={{
            position: "absolute",
            left: `${partnerMenuCoords.x}px`,
            top: `${partnerMenuCoords.y}px`,
            zIndex: 10005,
          }}
        >
          <div 
            style={{
              position: "fixed",
              inset: 0,
              background: "transparent",
              zIndex: 10004,
            }}
            onClick={() => setIsPartnerMenuOpen(false)}
          />

          <div
            style={{
              position: "relative",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "0.5rem",
              width: "220px",
              boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              padding: "0.5rem 0",
              zIndex: 10005,
            }}
          >
            <button
              type="button"
              onClick={() => {
                setPartnerModalType("client");
                setPartnerActiveTab("general");
                setIsPartnerModalOpen(true);
                setIsPartnerMenuOpen(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                background: "transparent",
                border: 0,
                padding: "0.6rem 1rem",
                width: "100%",
                textAlign: "left",
                cursor: "pointer",
                color: "#475569",
                fontSize: "0.85rem",
                fontWeight: 600,
              }}
            >
              <FiUser style={{ color: "#3b82f6" }} />
              Create a client
            </button>

            <button
              type="button"
              onClick={() => {
                setPartnerModalType("carrier");
                setPartnerActiveTab("general");
                setIsPartnerModalOpen(true);
                setIsPartnerMenuOpen(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                background: "transparent",
                border: 0,
                padding: "0.6rem 1rem",
                width: "100%",
                textAlign: "left",
                cursor: "pointer",
                color: "#475569",
                fontSize: "0.85rem",
                fontWeight: 600,
              }}
            >
              <FiTruck style={{ color: "#10b981" }} />
              Create a carrier
            </button>
          </div>
        </div>
      )}

      {/* Dynamic 3-Tab Master Modal for Client & Carrier Creation */}
      {isPartnerModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10006,
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
            onClick={() => setIsPartnerModalOpen(false)}
          />

          <div
            style={{
              position: "relative",
              background: "#f8fafc",
              border: "1px solid #cbd5e1",
              borderRadius: "0.75rem",
              width: "90%",
              maxWidth: "1120px",
              height: "88vh",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              zIndex: 10007,
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
                  fontSize: "1.5rem",
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                  padding: "0.25rem",
                }}
              >
                &times;
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
                background: "#ffffff",
              }}
            >
              {/* TAB 1: Əsas Məlumatlar */}
              {partnerActiveTab === "general" && (
                <div style={{ display: "grid", gridTemplateColumns: "1.1fr auto 1fr", gap: "1.5rem", alignItems: "stretch" }}>
                  {/* Left Column: Şirkətin rekvizitləri */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <h4 style={{ margin: "0 0 0.25rem 0", fontSize: "0.9rem", fontWeight: 700, color: "#475569" }}>
                      Şirkətin rekvizitləri
                    </h4>

                    {/* Name (full) */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Name (full)</label>
                      <input
                        type="text"
                        placeholder="Limited liability company"
                        value={partnerFullName}
                        onChange={(e) => setPartnerFullName(e.target.value)}
                        style={inputStyle}
                      />
                    </div>

                    {/* Name (abbreviated) and Fəaliyyət növü side-by-side */}
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
                          style={inputStyle}
                        />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Fəaliyyət növü</label>
                        <select
                          value={partnerActivityType}
                          onChange={(e) => setPartnerActivityType(e.target.value)}
                          style={selectStyle}
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
                          style={selectStyle}
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
                          style={inputStyle}
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
                          style={inputStyle}
                        />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>MTÜT</label>
                        <input
                          type="text"
                          value={partnerMtut}
                          onChange={(e) => setPartnerMtut(e.target.value)}
                          style={inputStyle}
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
                          style={inputStyle}
                        />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>UAK</label>
                        <input
                          type="text"
                          value={partnerUak}
                          onChange={(e) => setPartnerUak(e.target.value)}
                          style={inputStyle}
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
                          style={inputStyle}
                        />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Ödəyicinin ƏDV kodu</label>
                        <input
                          type="text"
                          value={partnerVatCode}
                          onChange={(e) => setPartnerVatCode(e.target.value)}
                          style={inputStyle}
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
                            style={inputStyle}
                          />
                          <FiCalendar style={{ position: "absolute", right: "0.6rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Language of notifications</label>
                        <select
                          value={partnerLang}
                          onChange={(e) => setPartnerLang(e.target.value)}
                          style={selectStyle}
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

              {/* TAB 2: Əlaqə məlumatları */}
              {partnerActiveTab === "contact" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#475569" }}>Hüquqi ünvan</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <LabelWithPlus label="Ölkə" onPlusClick={() => setIsCountryModalOpen(true)} />
                        <select value={legalCountry} onChange={(e) => setLegalCountry(e.target.value)} style={selectStyle}>
                          <option value="Dəyəri seçin">Dəyəri seçin</option>
                          {countries.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Şəhər</label>
                        <input type="text" value={legalCity} onChange={(e) => setLegalCity(e.target.value)} style={inputStyle} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Ünvan</label>
                        <input type="text" value={legalStreet} onChange={(e) => setLegalStreet(e.target.value)} style={inputStyle} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Poçt kodu</label>
                        <input type="text" value={legalZip} onChange={(e) => setLegalZip(e.target.value)} style={inputStyle} />
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginTop: "0.5rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Telefon</label>
                        <input type="text" value={legalTel} onChange={(e) => setLegalTel(e.target.value)} style={inputStyle} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Faks</label>
                        <input type="text" value={legalFax} onChange={(e) => setLegalFax(e.target.value)} style={inputStyle} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>E-poçt</label>
                        <input type="email" value={legalEmail} onChange={(e) => setLegalEmail(e.target.value)} style={inputStyle} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Veb-sayt</label>
                        <input type="text" value={legalWeb} onChange={(e) => setLegalWeb(e.target.value)} style={inputStyle} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Maliyyələr */}
              {partnerActiveTab === "finance" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {/* Bank accounts section header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      cursor: "pointer",
                      color: "#2563eb",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                    }}
                    onClick={() => {
                      setBankAccounts([
                        ...bankAccounts,
                        {
                          id: String(Date.now()),
                          currency: "Dəyəri ...",
                          account: "",
                          bank: "Dəyəri seçin",
                          transitAccount: "",
                          corrBank: "Dəyəri seçin",
                          corrAccount: "",
                        },
                      ]);
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "20px",
                        height: "20px",
                        borderRadius: "4px",
                        background: "#3b82f6",
                        color: "#ffffff",
                        fontSize: "0.95rem",
                        fontWeight: "bold",
                      }}
                    >
                      +
                    </span>
                    <span style={{ color: "#1e293b", fontWeight: 700, fontSize: "0.9rem" }}>Bank accounts</span>
                  </div>

                  {/* Bank accounts list */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {bankAccounts.map((account, index) => (
                      <div
                        key={account.id}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "30px 100px 1.5fr 1.5fr 1.5fr 1.5fr 1.5fr",
                          gap: "0.75rem",
                          alignItems: "end",
                        }}
                      >
                        {/* Remove button */}
                        <div style={{ paddingBottom: "0.5rem" }}>
                          <button
                            type="button"
                            onClick={() => {
                              if (bankAccounts.length > 1) {
                                setBankAccounts(bankAccounts.filter((a) => a.id !== account.id));
                              }
                            }}
                            style={{
                              background: "transparent",
                              border: 0,
                              padding: 0,
                              cursor: bankAccounts.length > 1 ? "pointer" : "not-allowed",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              opacity: bankAccounts.length > 1 ? 1 : 0.5,
                            }}
                          >
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "20px",
                                height: "20px",
                                borderRadius: "50%",
                                background: "#ef4444",
                                color: "#ffffff",
                                fontSize: "0.85rem",
                                fontWeight: "bold",
                              }}
                            >
                              -
                            </span>
                          </button>
                        </div>

                        {/* Valyuta */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                          {index === 0 && (
                            <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>
                              Valyuta <span style={{ color: "#ef4444" }}>*</span>
                            </label>
                          )}
                          <select
                            value={account.currency}
                            onChange={(e) => {
                              setBankAccounts(
                                bankAccounts.map((a) =>
                                  a.id === account.id ? { ...a, currency: e.target.value } : a
                                )
                              );
                            }}
                            style={selectStyle}
                          >
                            <option value="Dəyəri ...">Dəyəri ...</option>
                            <option value="AZN">AZN</option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                          </select>
                        </div>

                        {/* Hesablaşma hesabı */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                          {index === 0 && (
                            <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>
                              Hesablaşma hesabı
                            </label>
                          )}
                          <input
                            type="text"
                            value={account.account}
                            onChange={(e) => {
                              setBankAccounts(
                                bankAccounts.map((a) =>
                                  a.id === account.id ? { ...a, account: e.target.value } : a
                                )
                              );
                            }}
                            style={inputStyle}
                          />
                        </div>

                        {/* Bank */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                          {index === 0 && (
                            <LabelWithPlus label="Bank" onPlusClick={() => setIsBankModalOpen(true)} />
                          )}
                          <select
                            value={account.bank}
                            onChange={(e) => {
                              setBankAccounts(
                                bankAccounts.map((a) =>
                                  a.id === account.id ? { ...a, bank: e.target.value } : a
                                )
                              );
                            }}
                            style={selectStyle}
                          >
                            <option value="Dəyəri seçin">Dəyəri seçin</option>
                            {banks.map((b) => (
                              <option key={b} value={b}>
                                {b}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Tranzit hesab */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                          {index === 0 && (
                            <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>
                              Tranzit hesab
                            </label>
                          )}
                          <input
                            type="text"
                            value={account.transitAccount}
                            onChange={(e) => {
                              setBankAccounts(
                                bankAccounts.map((a) =>
                                  a.id === account.id ? { ...a, transitAccount: e.target.value } : a
                                )
                              );
                            }}
                            style={inputStyle}
                          />
                        </div>

                        {/* Müxbir bank */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                          {index === 0 && (
                            <LabelWithPlus label="Müxbir bank" onPlusClick={() => setIsBankModalOpen(true)} />
                          )}
                          <select
                            value={account.corrBank}
                            onChange={(e) => {
                              setBankAccounts(
                                bankAccounts.map((a) =>
                                  a.id === account.id ? { ...a, corrBank: e.target.value } : a
                                )
                              );
                            }}
                            style={selectStyle}
                          >
                            <option value="Dəyəri seçin">Dəyəri seçin</option>
                            {banks.map((b) => (
                              <option key={b} value={b}>
                                {b}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Müxbir hesab */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                          {index === 0 && (
                            <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>
                              Müxbir hesab
                            </label>
                          )}
                          <input
                            type="text"
                            value={account.corrAccount}
                            onChange={(e) => {
                              setBankAccounts(
                                bankAccounts.map((a) =>
                                  a.id === account.id ? { ...a, corrAccount: e.target.value } : a
                                )
                              );
                            }}
                            style={inputStyle}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Financial terms & conditions */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#475569" }}>Financial terms</span>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>
                          Ödənişin təxirə salınması
                        </label>
                        <input
                          type="text"
                          value={financeDelay}
                          onChange={(e) => setFinanceDelay(e.target.value)}
                          style={inputStyle}
                        />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>
                          Ödənişlərin təxirə salınması şərtləri
                        </label>
                        <select
                          value={financeDelayTerms}
                          onChange={(e) => setFinanceDelayTerms(e.target.value)}
                          style={selectStyle}
                        >
                          <option value="B/k 30 təqvim günü.">B/k 30 təqvim günü.</option>
                          <option value="B/k 15 təqvim günü.">B/k 15 təqvim günü.</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Document terms text */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>
                      Document terms text
                    </label>
                    <textarea
                      value={financeDocTerms}
                      onChange={(e) => setFinanceDocTerms(e.target.value)}
                      style={{ ...inputStyle, height: "64px", resize: "none" }}
                    />
                  </div>

                  {/* Credit limit, Email, Checkbox */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1.3fr", gap: "1.5rem", alignItems: "end" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Kredit limiti</label>
                      <input
                        type="text"
                        value={financeCreditLimit}
                        onChange={(e) => setFinanceCreditLimit(e.target.value)}
                        style={inputStyle}
                      />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>
                        Sənədlərin göndərilməsi üçün el.poçt ?
                      </label>
                      <input
                        type="text"
                        value={financeEmailDocs}
                        onChange={(e) => setFinanceEmailDocs(e.target.value)}
                        style={inputStyle}
                      />
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        cursor: "pointer",
                        paddingBottom: "0.5rem",
                      }}
                      onClick={() => setFinanceSendReminders(!financeSendReminders)}
                    >
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
                borderTop: "1px solid #cbd5e1",
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

      {/* Country Creation Modal: "Yarat" */}
      {isCountryModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10010,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: "rgba(15, 23, 42, 0.4)",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setIsCountryModalOpen(false)}
          />

          <div
            style={{
              position: "relative",
              background: "#f8fafc",
              border: "1px solid #cbd5e1",
              borderRadius: "0.5rem",
              width: "90%",
              maxWidth: "500px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              zIndex: 10011,
              padding: "1.25rem",
              gap: "1.25rem",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#475569" }}>
                Yarat
              </span>
              <button
                type="button"
                onClick={() => setIsCountryModalOpen(false)}
                style={{
                  background: "transparent",
                  border: 0,
                  cursor: "pointer",
                  fontSize: "1.25rem",
                  color: "#0f172a",
                  display: "flex",
                  alignItems: "center",
                  padding: "0.25rem",
                  fontWeight: "bold",
                }}
              >
                <FiX />
              </button>
            </div>

            {/* Row 1: Adı * and ISO kodu * */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>
                  Adı <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  value={newCountryName}
                  onChange={(e) => setNewCountryName(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>
                  ISO kodu <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  value={newCountryIso}
                  onChange={(e) => setNewCountryIso(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Row 2: Checkboxes (Avropa ölkələri, Susmaya görə ölkə, Aktiv) */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
              {/* Avropa ölkələri */}
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}
                onClick={() => setIsEuropeCountry(!isEuropeCountry)}
              >
                <div
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "4px",
                    border: isEuropeCountry ? "1.5px solid #22c55e" : "1.5px solid #cbd5e1",
                    background: isEuropeCountry ? "#22c55e" : "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    fontSize: "0.7rem",
                    fontWeight: "bold",
                  }}
                >
                  {isEuropeCountry && "✓"}
                </div>
                <span style={{ fontSize: "0.8rem", color: "#1e293b", fontWeight: 600 }}>
                  Avropa ölkələri
                </span>
              </div>

              {/* Susmaya görə ölkə */}
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}
                onClick={() => setIsDefaultCountry(!isDefaultCountry)}
              >
                <div
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "4px",
                    border: isDefaultCountry ? "1.5px solid #22c55e" : "1.5px solid #cbd5e1",
                    background: isDefaultCountry ? "#22c55e" : "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    fontSize: "0.7rem",
                    fontWeight: "bold",
                  }}
                >
                  {isDefaultCountry && "✓"}
                </div>
                <span style={{ fontSize: "0.8rem", color: "#1e293b", fontWeight: 600 }}>
                  Susmaya görə ölkə
                </span>
              </div>

              {/* Aktiv */}
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}
                onClick={() => setIsActiveCountry(!isActiveCountry)}
              >
                <div
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "4px",
                    border: isActiveCountry ? "1.5px solid #22c55e" : "1.5px solid #cbd5e1",
                    background: isActiveCountry ? "#22c55e" : "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    fontSize: "0.7rem",
                    fontWeight: "bold",
                  }}
                >
                  {isActiveCountry && "✓"}
                </div>
                <span style={{ fontSize: "0.8rem", color: "#1e293b", fontWeight: 600 }}>
                  Aktiv
                </span>
              </div>
            </div>

            {/* Row 3: Ölkələr */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>
                Ölkələr
              </label>
              <select
                value={parentCountry}
                onChange={(e) => setParentCountry(e.target.value)}
                style={selectStyle}
              >
                <option value="Dəyəri seçin">Dəyəri seçin</option>
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: Yeni akt (Image 2) */}
      {isNewActModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10015,
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
            onClick={() => setIsNewActModalOpen(false)}
          />

          <div
            style={{
              position: "relative",
              background: "#f8fafc",
              border: "1px solid #cbd5e1",
              borderRadius: "0.5rem",
              width: "90%",
              maxWidth: "600px",
              maxHeight: "92vh",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
              zIndex: 10016,
              padding: "1.5rem",
              gap: "1rem",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#475569" }}>Yeni akt</span>
              <button
                type="button"
                onClick={() => setIsNewActModalOpen(false)}
                style={{ background: "transparent", border: 0, cursor: "pointer", fontSize: "1.25rem", color: "#0f172a" }}
              >
                <FiX />
              </button>
            </div>

            {/* Şirkət */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Şirkət</label>
              <div style={{ position: "relative" }}>
                <select value={newActCompany} onChange={(e) => setNewActCompany(e.target.value)} style={selectStyle}>
                  <option value="Ziyafreight">Ziyafreight</option>
                </select>
                <span style={{ position: "absolute", right: "2.2rem", top: "50%", transform: "translateY(-50%)", color: "#64748b", cursor: "pointer", fontWeight: "bold" }} onClick={() => setNewActCompany("")}>&times;</span>
              </div>
            </div>

            {/* Tip * */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>
                Tip <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <div style={{ display: "flex", gap: "1.5rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="actType"
                    checked={newActType === "Sənədin şablonu"}
                    onChange={() => setNewActType("Sənədin şablonu")}
                    style={{ accentColor: "#22c55e", width: "18px", height: "18px" }}
                  />
                  <span style={{ fontSize: "0.85rem", color: "#1e293b", fontWeight: 600 }}>Sənədin şablonu</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="actType"
                    checked={newActType === "Əlavə edilmiş fayl"}
                    onChange={() => setNewActType("Əlavə edilmiş fayl")}
                    style={{ accentColor: "#22c55e", width: "18px", height: "18px" }}
                  />
                  <span style={{ fontSize: "0.85rem", color: "#1e293b", fontWeight: 600 }}>Əlavə edilmiş fayl</span>
                </label>
              </div>
            </div>

            {/* Şablon * */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>
                Şablon <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <select value={newActTemplate} onChange={(e) => setNewActTemplate(e.target.value)} style={selectStyle}>
                <option value="Dəyəri seçin">Dəyəri seçin</option>
                <option value="Template 1">Template 1</option>
                <option value="Template 2">Template 2</option>
              </select>
            </div>

            {/* Row 3: Sənədin nömrəsi, Sənədin tarixi, Sənədin adı */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.2fr", gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Sənədin nömrəsi</label>
                <input type="text" value={newActNumber} onChange={(e) => setNewActNumber(e.target.value)} style={inputStyle} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Sənədin tarixi</label>
                <div style={{ position: "relative" }}>
                  <input type="text" value={newActDate} onChange={(e) => setNewActDate(e.target.value)} style={inputStyle} />
                  <FiCalendar style={{ position: "absolute", right: "0.6rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Sənədin adı</label>
                <input type="text" value={newActName} onChange={(e) => setNewActName(e.target.value)} style={inputStyle} />
              </div>
            </div>

            {/* Checkboxes Group 1 */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {/* Sənədin etibarlılıq müddəti */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }} onClick={() => setNewActHasValidity(!newActHasValidity)}>
                <div style={{ width: "18px", height: "18px", borderRadius: "4px", border: newActHasValidity ? "1.5px solid #22c55e" : "1.5px solid #cbd5e1", background: newActHasValidity ? "#22c55e" : "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontSize: "0.7rem", fontWeight: "bold" }}>
                  {newActHasValidity && "✓"}
                </div>
                <span style={{ fontSize: "0.8rem", color: "#1e293b", fontWeight: 600 }}>Sənədin etibarlılıq müddəti</span>
              </div>

              {/* Reys üçün müqavilə */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }} onClick={() => setNewActIsContract(!newActIsContract)}>
                <div style={{ width: "18px", height: "18px", borderRadius: "4px", border: newActIsContract ? "1.5px solid #22c55e" : "1.5px solid #cbd5e1", background: newActIsContract ? "#22c55e" : "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontSize: "0.7rem", fontWeight: "bold" }}>
                  {newActIsContract && "✓"}
                </div>
                <span style={{ fontSize: "0.8rem", color: "#1e293b", fontWeight: 600 }}>Reys üçün müqavilə</span>
              </div>

              {/* Göndərmə barədə məlumat verin */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }} onClick={() => setNewActIsSendNotif(!newActIsSendNotif)}>
                <div style={{ width: "18px", height: "18px", borderRadius: "4px", border: newActIsSendNotif ? "1.5px solid #22c55e" : "1.5px solid #cbd5e1", background: newActIsSendNotif ? "#22c55e" : "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontSize: "0.7rem", fontWeight: "bold" }}>
                  {newActIsSendNotif && "✓"}
                </div>
                <span style={{ fontSize: "0.8rem", color: "#1e293b", fontWeight: 600 }}>Göndərmə barədə məlumat verin</span>
              </div>
            </div>

            {/* Reyslər label and value */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
              <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700 }}>Reyslər</span>
              <span style={{ fontSize: "0.85rem", color: "#1e293b", fontWeight: 600 }}>ZF26094-1</span>
            </div>

            {/* Checkboxes Group 2 */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {/* Möhürlər və imzalar olmadan */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }} onClick={() => setNewActNoSeals(!newActNoSeals)}>
                <div style={{ width: "18px", height: "18px", borderRadius: "4px", border: newActNoSeals ? "1.5px solid #22c55e" : "1.5px solid #cbd5e1", background: newActNoSeals ? "#22c55e" : "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontSize: "0.7rem", fontWeight: "bold" }}>
                  {newActNoSeals && "✓"}
                </div>
                <span style={{ fontSize: "0.8rem", color: "#1e293b", fontWeight: 600 }}>Möhürlər və imzalar olmadan</span>
              </div>

              {/* Müştəriyə çıxışı təqdim et */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }} onClick={() => setNewActProvideAccess(!newActProvideAccess)}>
                <div style={{ width: "18px", height: "18px", borderRadius: "4px", border: newActProvideAccess ? "1.5px solid #22c55e" : "1.5px solid #cbd5e1", background: newActProvideAccess ? "#22c55e" : "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontSize: "0.7rem", fontWeight: "bold" }}>
                  {newActProvideAccess && "✓"}
                </div>
                <span style={{ fontSize: "0.8rem", color: "#1e293b", fontWeight: 600 }}>Müştəriyə çıxışı təqdim et</span>
              </div>
            </div>

            {/* Hesablar */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
              <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700 }}>Hesablar</span>
              <span style={{ fontSize: "1.1rem", color: "#0f172a", fontWeight: 800 }}>Hesab mövcud deyil</span>
            </div>

            {/* Şərhlər */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Şərhlər</label>
              <textarea
                value={newActComments}
                onChange={(e) => setNewActComments(e.target.value)}
                style={{ ...inputStyle, height: "64px", resize: "none" }}
              />
            </div>

            {/* Footer Buttons */}
            <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
              <button
                type="button"
                onClick={() => {
                  setAktlarList([
                    ...aktlarList,
                    {
                      id: String(Date.now()),
                      company: newActCompany,
                      type: newActType,
                      template: newActTemplate,
                      number: newActNumber,
                      date: newActDate,
                      name: newActName || "Akt",
                      hasValidity: newActHasValidity,
                      isContract: newActIsContract,
                      isSendNotif: newActIsSendNotif,
                      noSeals: newActNoSeals,
                      provideAccess: newActProvideAccess,
                      comments: newActComments,
                    },
                  ]);
                  setIsNewActModalOpen(false);
                }}
                style={{
                  background: "#4ade80",
                  color: "#ffffff",
                  border: 0,
                  borderRadius: "0.375rem",
                  padding: "0.55rem 1.5rem",
                  fontSize: "0.85rem",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                Yaddaşda saxlamaq
              </button>

              <button
                type="button"
                onClick={() => {
                  setAktlarList([
                    ...aktlarList,
                    {
                      id: String(Date.now()),
                      company: newActCompany,
                      type: newActType,
                      template: newActTemplate,
                      number: newActNumber,
                      date: newActDate,
                      name: newActName || "Akt (Tamamlanmış)",
                      hasValidity: newActHasValidity,
                      isContract: newActIsContract,
                      isSendNotif: newActIsSendNotif,
                      noSeals: newActNoSeals,
                      provideAccess: newActProvideAccess,
                      comments: newActComments,
                    },
                  ]);
                  setIsNewActModalOpen(false);
                }}
                style={{
                  background: "#22c55e",
                  color: "#ffffff",
                  border: 0,
                  borderRadius: "0.375rem",
                  padding: "0.55rem 1.5rem",
                  fontSize: "0.85rem",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                Müqaviləni yaddaşda saxla və tamamla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Yeni sənəd (Image 3) */}
      {isNewDocModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10015,
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
            onClick={() => setIsNewDocModalOpen(false)}
          />

          <div
            style={{
              position: "relative",
              background: "#f8fafc",
              border: "1px solid #cbd5e1",
              borderRadius: "0.5rem",
              width: "90%",
              maxWidth: "500px",
              maxHeight: "92vh",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
              zIndex: 10016,
              padding: "1.5rem",
              gap: "1rem",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#475569" }}>Yeni sənəd</span>
              <button
                type="button"
                onClick={() => setIsNewDocModalOpen(false)}
                style={{ background: "transparent", border: 0, cursor: "pointer", fontSize: "1.25rem", color: "#0f172a" }}
              >
                <FiX />
              </button>
            </div>

            {/* Reyslər label and value */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
              <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700 }}>Reyslər</span>
              <span style={{ fontSize: "0.85rem", color: "#1e293b", fontWeight: 600 }}>ZF26094-1</span>
            </div>

            {/* Checkboxes (Müştəriyə çıxışı təqdim et, Daşıyıcıya girişi təqdim et) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }} onClick={() => setNewDocProvideAccessCustomer(!newDocProvideAccessCustomer)}>
                <div style={{ width: "18px", height: "18px", borderRadius: "4px", border: newDocProvideAccessCustomer ? "1.5px solid #22c55e" : "1.5px solid #cbd5e1", background: newDocProvideAccessCustomer ? "#22c55e" : "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontSize: "0.7rem", fontWeight: "bold" }}>
                  {newDocProvideAccessCustomer && "✓"}
                </div>
                <span style={{ fontSize: "0.8rem", color: "#1e293b", fontWeight: 600 }}>Müştəriyə çıxışı təqdim et</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }} onClick={() => setNewDocProvideAccessCarrier(!newDocProvideAccessCarrier)}>
                <div style={{ width: "18px", height: "18px", borderRadius: "4px", border: newDocProvideAccessCarrier ? "1.5px solid #22c55e" : "1.5px solid #cbd5e1", background: newDocProvideAccessCarrier ? "#22c55e" : "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontSize: "0.7rem", fontWeight: "bold" }}>
                  {newDocProvideAccessCarrier && "✓"}
                </div>
                <span style={{ fontSize: "0.8rem", color: "#1e293b", fontWeight: 600 }}>Daşıyıcıya girişi təqdim et</span>
              </div>
            </div>

            {/* Row: Sənədin adı * and Sənədin tarixi */}
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>
                  Sənədin adı <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input type="text" value={newDocName} onChange={(e) => setNewDocName(e.target.value)} style={inputStyle} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Sənədin tarixi</label>
                <div style={{ position: "relative" }}>
                  <input type="text" value={newDocDate} onChange={(e) => setNewDocDate(e.target.value)} style={inputStyle} />
                  <FiCalendar style={{ position: "absolute", right: "0.6rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                </div>
              </div>
            </div>

            {/* Şərhlər */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Şərhlər</label>
              <textarea
                value={newDocComments}
                onChange={(e) => setNewDocComments(e.target.value)}
                style={{ ...inputStyle, height: "64px", resize: "none" }}
              />
            </div>

            {/* Link */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Link</label>
              <input type="text" value={newDocLink} onChange={(e) => setNewDocLink(e.target.value)} style={inputStyle} />
            </div>

            {/* Fayl drag and drop */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Fayl</label>
              <div
                style={{
                  border: "2px dashed #cbd5e1",
                  borderRadius: "0.5rem",
                  padding: "1.5rem",
                  textAlign: "center",
                  background: "#ffffff",
                  cursor: "pointer",
                }}
              >
                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                  Faylınızı Sürüşdürün & Buraxın ya da <span style={{ color: "#22c55e", textDecoration: "underline", fontWeight: "bold" }}>Seçin</span>
                </span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
              <button
                type="button"
                onClick={() => {
                  if (!newDocName.trim()) {
                    alert("Lütfən sənədin adını yazın!");
                    return;
                  }
                  setRequestedDocsList([
                    ...requestedDocsList,
                    {
                      id: String(Date.now()),
                      name: newDocName,
                      comments: newDocComments,
                      createdAt: newDocDate,
                      isAvailableToCustomer: newDocProvideAccessCustomer,
                      isAvailableToCarrier: newDocProvideAccessCarrier,
                      sendNotif: false,
                      type: "Sənədin şablonu",
                      template: "Dəyəri seçin",
                    },
                  ]);
                  setIsNewDocModalOpen(false);
                }}
                style={{
                  background: "#22c55e",
                  color: "#ffffff",
                  border: 0,
                  borderRadius: "0.375rem",
                  padding: "0.55rem 1.5rem",
                  fontSize: "0.85rem",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                Yaddaşda saxlamaq
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Sənədi redaktə et (Image 5) */}
      {isEditDocModalOpen && selectedDocForEdit && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10015,
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
            onClick={() => {
              setIsEditDocModalOpen(false);
              setSelectedDocForEdit(null);
            }}
          />

          <div
            style={{
              position: "relative",
              background: "#f8fafc",
              border: "1px solid #cbd5e1",
              borderRadius: "0.5rem",
              width: "90%",
              maxWidth: "500px",
              maxHeight: "92vh",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
              zIndex: 10016,
              padding: "1.5rem",
              gap: "1rem",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#475569" }}>Sənədi redaktə et</span>
              <button
                type="button"
                onClick={() => {
                  setIsEditDocModalOpen(false);
                  setSelectedDocForEdit(null);
                }}
                style={{ background: "transparent", border: 0, cursor: "pointer", fontSize: "1.25rem", color: "#0f172a" }}
              >
                <FiX />
              </button>
            </div>

            {/* Tip * */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>
                Tip <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <div style={{ display: "flex", gap: "1.5rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="editDocType"
                    checked={editDocType === "Sənədin şablonu"}
                    onChange={() => setEditDocType("Sənədin şablonu")}
                    style={{ accentColor: "#22c55e", width: "18px", height: "18px" }}
                  />
                  <span style={{ fontSize: "0.85rem", color: "#1e293b", fontWeight: 600 }}>Sənədin şablonu</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="editDocType"
                    checked={editDocType === "Əlavə edilmiş fayl"}
                    onChange={() => setEditDocType("Əlavə edilmiş fayl")}
                    style={{ accentColor: "#22c55e", width: "18px", height: "18px" }}
                  />
                  <span style={{ fontSize: "0.85rem", color: "#1e293b", fontWeight: 600 }}>Əlavə edilmiş fayl</span>
                </label>
              </div>
            </div>

            {/* Sənədin şablonu * */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>
                Sənədin şablonu <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <select value={editDocTemplate} onChange={(e) => setEditDocTemplate(e.target.value)} style={selectStyle}>
                <option value="Dəyəri seçin">Dəyəri seçin</option>
                <option value="Template 1">Template 1</option>
              </select>
            </div>

            {/* Sənədin adı * */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>
                Sənədin adı <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input type="text" value={editDocName} onChange={(e) => setEditDocName(e.target.value)} style={inputStyle} />
            </div>

            {/* Checkboxes */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {/* Müştəriyə çıxışı təqdim et */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }} onClick={() => setEditDocProvideAccessCustomer(!editDocProvideAccessCustomer)}>
                <div style={{ width: "18px", height: "18px", borderRadius: "4px", border: editDocProvideAccessCustomer ? "1.5px solid #22c55e" : "1.5px solid #cbd5e1", background: editDocProvideAccessCustomer ? "#22c55e" : "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontSize: "0.7rem", fontWeight: "bold" }}>
                  {editDocProvideAccessCustomer && "✓"}
                </div>
                <span style={{ fontSize: "0.8rem", color: "#1e293b", fontWeight: 600 }}>Müştəriyə çıxışı təqdim et</span>
              </div>

              {/* Daşıyıcıya girişi təqdim et */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }} onClick={() => setEditDocProvideAccessCarrier(!editDocProvideAccessCarrier)}>
                <div style={{ width: "18px", height: "18px", borderRadius: "4px", border: editDocProvideAccessCarrier ? "1.5px solid #22c55e" : "1.5px solid #cbd5e1", background: editDocProvideAccessCarrier ? "#22c55e" : "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontSize: "0.7rem", fontWeight: "bold" }}>
                  {editDocProvideAccessCarrier && "✓"}
                </div>
                <span style={{ fontSize: "0.8rem", color: "#1e293b", fontWeight: 600 }}>Daşıyıcıya girişi təqdim et</span>
              </div>

              {/* Göndərmə barədə məlumat verin */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }} onClick={() => setEditDocSendNotif(!editDocSendNotif)}>
                <div style={{ width: "18px", height: "18px", borderRadius: "4px", border: editDocSendNotif ? "1.5px solid #22c55e" : "1.5px solid #cbd5e1", background: editDocSendNotif ? "#22c55e" : "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontSize: "0.7rem", fontWeight: "bold" }}>
                  {editDocSendNotif && "✓"}
                </div>
                <span style={{ fontSize: "0.8rem", color: "#1e293b", fontWeight: 600 }}>Göndərmə barədə məlumat verin</span>
              </div>
            </div>

            {/* Şərhlər */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Şərhlər</label>
              <textarea
                value={editDocComments}
                onChange={(e) => setEditDocComments(e.target.value)}
                style={{ ...inputStyle, height: "64px", resize: "none" }}
              />
            </div>

            {/* Footer Buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
              <button
                type="button"
                onClick={() => {
                  if (!editDocName.trim()) {
                    alert("Lütfən sənədin adını daxil edin!");
                    return;
                  }
                  setRequestedDocsList(
                    requestedDocsList.map((d) =>
                      d.id === selectedDocForEdit.id
                        ? {
                            ...d,
                            name: editDocName,
                            type: editDocType,
                            template: editDocTemplate,
                            isAvailableToCustomer: editDocProvideAccessCustomer,
                            isAvailableToCarrier: editDocProvideAccessCarrier,
                            sendNotif: editDocSendNotif,
                            comments: editDocComments,
                          }
                        : d
                    )
                  );
                  setIsEditDocModalOpen(false);
                  setSelectedDocForEdit(null);
                }}
                style={{
                  background: "#22c55e",
                  color: "#ffffff",
                  border: 0,
                  borderRadius: "0.375rem",
                  padding: "0.55rem 1.5rem",
                  fontSize: "0.85rem",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                Yaddaşda saxlamaq
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Sənədin silinməsini təsdiqlə (Delete Confirmation Modal) */}
      {isDocDeleteConfirmOpen && docToDelete && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10020,
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
            onClick={() => {
              setIsDocDeleteConfirmOpen(false);
              setDocToDelete(null);
            }}
          />

          <div
            style={{
              position: "relative",
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: "0.5rem",
              width: "90%",
              maxWidth: "400px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              display: "flex",
              flexDirection: "column",
              zIndex: 10021,
              padding: "1.5rem",
              gap: "1.25rem",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#475569" }}>Sənədi sil</span>
              <button
                type="button"
                onClick={() => {
                  setIsDocDeleteConfirmOpen(false);
                  setDocToDelete(null);
                }}
                style={{ background: "transparent", border: 0, cursor: "pointer", fontSize: "1.25rem", color: "#0f172a" }}
              >
                <FiX />
              </button>
            </div>

            {/* Warning Message */}
            <div style={{ fontSize: "0.9rem", color: "#334155", lineHeight: 1.5 }}>
              <strong>"{docToDelete.name}"</strong> sənədini silmək istədiyinizdən əminsiniz? Bu əməliyyat geri qaytarıla bilməz.
            </div>

            {/* Footer Buttons */}
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => {
                  setIsDocDeleteConfirmOpen(false);
                  setDocToDelete(null);
                }}
                style={{
                  background: "transparent",
                  border: "1px solid #cbd5e1",
                  borderRadius: "0.375rem",
                  padding: "0.5rem 1rem",
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
                onClick={() => {
                  setRequestedDocsList(requestedDocsList.filter((d) => d.id !== docToDelete.id));
                  setIsDocDeleteConfirmOpen(false);
                  setDocToDelete(null);
                }}
                style={{
                  background: "#ef4444",
                  color: "#ffffff",
                  border: 0,
                  borderRadius: "0.375rem",
                  padding: "0.5rem 1.25rem",
                  fontSize: "0.85rem",
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = "#dc2626")}
                onMouseOut={(e) => (e.currentTarget.style.background = "#ef4444")}
              >
                Bəli, sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Yeni hesabı əlavə et Modal Overlay */}
      {isNewInvoiceModalOpen && (
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
          {/* Backdrop blur */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(15, 23, 42, 0.4)",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setIsNewInvoiceModalOpen(false)}
          />
          {/* Modal Container */}
          <div
            style={{
              position: "relative",
              background: "#f4f6f8",
              border: "1px solid #e2e8f0",
              borderRadius: "0.75rem",
              width: "min(100%, 75rem)",
              boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.15)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              maxHeight: "95vh",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "1.25rem 2rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "transparent",
                borderBottom: "1px solid #e2e8f0"
              }}
            >
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#334155" }}>
                Yeni hesabı əlavə et
              </h3>
              <button
                type="button"
                onClick={() => setIsNewInvoiceModalOpen(false)}
                style={{
                  background: "transparent",
                  border: 0,
                  cursor: "pointer",
                  fontSize: "1.5rem",
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                  padding: "0.25rem",
                  transition: "color 0.2s",
                }}
              >
                <FiX />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: "2rem", overflowY: "auto", flex: 1 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                
                {/* Inputs Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))", gap: "1.5rem" }}>
                  
                  {/* Şablon */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>Şablon <span style={{ color: "#ef4444" }}>*</span></label>
                    <select
                      value={invoiceTemplate}
                      onChange={(e) => setInvoiceTemplate(e.target.value)}
                      style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem 0.75rem", outline: "none", fontSize: "0.875rem", backgroundColor: "#ffffff" }}
                    >
                      <option value="Invoice Ziyafreight">Invoice Ziyafreight</option>
                      <option value="Invoice Standard">Invoice Standard</option>
                    </select>
                  </div>

                  {/* Müştəri ilə müqavilənin nömrəsi */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>Müştəri ilə müqavilənin nömrəsi</label>
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      <input
                        type="text"
                        value={invoiceContract}
                        onChange={(e) => setInvoiceContract(e.target.value)}
                        style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem 2rem 0.5rem 0.75rem", outline: "none", fontSize: "0.875rem", backgroundColor: "#ffffff" }}
                      />
                      <button
                        type="button"
                        onClick={() => setInvoiceContract("")}
                        style={{ position: "absolute", right: "0.5rem", background: "transparent", border: 0, cursor: "pointer", color: "#64748b" }}
                      >
                        <FiX style={{ fontSize: "0.875rem" }} />
                      </button>
                    </div>
                  </div>

                  {/* Tərtib etdi */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>Tərtib etdi <span style={{ color: "#ef4444" }}>*</span></label>
                    <select
                      value={invoiceCreator}
                      onChange={(e) => setInvoiceCreator(e.target.value)}
                      style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem 0.75rem", outline: "none", fontSize: "0.875rem", backgroundColor: "#ffffff" }}
                    >
                      <option value="Ulvi Adilzade">Ulvi Adilzade</option>
                      <option value="Nijat Shabanly">Nijat Shabanly</option>
                    </select>
                  </div>

                  {/* Dil */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>Dil <span style={{ color: "#ef4444" }}>*</span></label>
                    <select
                      value={invoiceLang}
                      onChange={(e) => setInvoiceLang(e.target.value)}
                      style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem 0.75rem", outline: "none", fontSize: "0.875rem", backgroundColor: "#ffffff" }}
                    >
                      <option value="Azərbaycan">Azərbaycan</option>
                      <option value="English">English</option>
                      <option value="Türkçe">Türkçe</option>
                    </select>
                  </div>

                  {/* Hesabın nömrəsi */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>Hesabın nömrəsi</label>
                    <input
                      type="text"
                      placeholder="Hesab nömrəsini daxil edin"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem 0.75rem", outline: "none", fontSize: "0.875rem", backgroundColor: "#ffffff" }}
                    />
                  </div>

                  {/* Hesab yazılıb */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>Hesab yazılıb</label>
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      <input
                        type="text"
                        value={invoiceDate}
                        onChange={(e) => setInvoiceDate(e.target.value)}
                        style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem 2.25rem 0.5rem 0.75rem", outline: "none", fontSize: "0.875rem", backgroundColor: "#ffffff" }}
                      />
                      <FiCalendar style={{ position: "absolute", right: "0.75rem", color: "#64748b" }} />
                    </div>
                  </div>

                  {/* Təxirə salma günləri */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>Təxirə salma günləri</label>
                    <input
                      type="number"
                      value={invoiceDelayDays}
                      onChange={(e) => setInvoiceDelayDays(e.target.value)}
                      style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem 0.75rem", outline: "none", fontSize: "0.875rem", backgroundColor: "#ffffff" }}
                    />
                  </div>

                  {/* Tarixinə kimi ödə */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>Tarixinə kimi ödə <span style={{ color: "#ef4444" }}>*</span></label>
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      <input
                        type="text"
                        value={invoicePayUntilDate}
                        onChange={(e) => setInvoicePayUntilDate(e.target.value)}
                        style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem 2.25rem 0.5rem 0.75rem", outline: "none", fontSize: "0.875rem", backgroundColor: "#ffffff" }}
                      />
                      <FiCalendar style={{ position: "absolute", right: "0.75rem", color: "#64748b" }} />
                    </div>
                  </div>

                  {/* Bölünmə qaydası */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>Bölünmə qaydası</label>
                    <select
                      value={invoiceSplitRule}
                      onChange={(e) => setInvoiceSplitRule(e.target.value)}
                      style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem 0.75rem", outline: "none", fontSize: "0.875rem", backgroundColor: "#ffffff" }}
                    >
                      <option value="Dəyəri seçin">Dəyəri seçin</option>
                      <option value="Bərabər">Bərabər</option>
                    </select>
                  </div>

                  {/* ƏDV-siz */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>ƏDV-siz <span style={{ color: "#ef4444" }}>*</span></label>
                    <input
                      type="text"
                      disabled
                      value={invoiceVatExempt}
                      style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem 0.75rem", outline: "none", fontSize: "0.875rem", backgroundColor: "#f1f5f9", color: "#64748b" }}
                    />
                  </div>

                  {/* ƏDV ilə */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>ƏDV ilə <span style={{ color: "#ef4444" }}>*</span></label>
                    <input
                      type="text"
                      disabled
                      value={invoiceVatIncluded}
                      style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem 0.75rem", outline: "none", fontSize: "0.875rem", backgroundColor: "#f1f5f9", color: "#64748b" }}
                    />
                  </div>

                  {/* Valyuta */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>Valyuta <span style={{ color: "#ef4444" }}>*</span></label>
                    <select
                      value={invoiceCurrency}
                      onChange={(e) => setInvoiceCurrency(e.target.value)}
                      style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem 0.75rem", outline: "none", fontSize: "0.875rem", backgroundColor: "#ffffff" }}
                    >
                      <option value="USD">USD</option>
                      <option value="AZN">AZN</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>

                  {/* İcraçı */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>İcraçı <span style={{ color: "#ef4444" }}>*</span></label>
                    <select
                      value={invoiceExecutor}
                      onChange={(e) => setInvoiceExecutor(e.target.value)}
                      style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem 0.75rem", outline: "none", fontSize: "0.875rem", backgroundColor: "#ffffff" }}
                    >
                      <option value="Ziyafreight">Ziyafreight</option>
                      <option value="Standard Cargo">Standard Cargo</option>
                    </select>
                  </div>

                  {/* Qiymətin hesablanması tipi */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>Qiymətin hesablanması tipi <span style={{ color: "#ef4444" }}>*</span></label>
                    <select
                      value={invoiceCalcType}
                      onChange={(e) => setInvoiceCalcType(e.target.value)}
                      style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem 0.75rem", outline: "none", fontSize: "0.875rem", backgroundColor: "#ffffff" }}
                    >
                      <option value="ƏDV-siz qiymət">ƏDV-siz qiymət</option>
                      <option value="ƏDV ilə qiymət">ƏDV ilə qiymət</option>
                    </select>
                  </div>

                  {/* Məzənnənin t... */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>Məzənnənin t...</label>
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      <input
                        type="text"
                        value={invoiceRateDate}
                        onChange={(e) => setInvoiceRateDate(e.target.value)}
                        style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem 2.25rem 0.5rem 0.75rem", outline: "none", fontSize: "0.875rem", backgroundColor: "#ffffff" }}
                      />
                      <FiCalendar style={{ position: "absolute", right: "0.75rem", color: "#64748b" }} />
                    </div>
                  </div>

                  {/* Ödəyici */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", gridColumn: "span 2" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>Ödəyici <span style={{ color: "#ef4444" }}>*</span></label>
                    <select
                      value={invoicePayer}
                      onChange={(e) => setInvoicePayer(e.target.value)}
                      style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem 0.75rem", outline: "none", fontSize: "0.875rem", backgroundColor: "#ffffff" }}
                    >
                      <option value="Limon Dental MMC">Limon Dental MMC</option>
                      <option value="Ziyafreight LLC">Ziyafreight LLC</option>
                    </select>
                  </div>
                </div>

                {/* Hesabın Sətri Dynamic Rows Section */}
                <div style={{ borderTop: "1px solid #cbd5e1", paddingTop: "1.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                    <h4 style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: "#475569" }}>Hesabın sətri</h4>
                    <button
                      type="button"
                      onClick={handleAddInvoiceRow}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#e2e8f0",
                        border: "1px solid #cbd5e1",
                        borderRadius: "0.25rem",
                        width: "1.5rem",
                        height: "1.5rem",
                        color: "#475569",
                        fontWeight: "bold",
                        cursor: "pointer"
                      }}
                    >
                      +
                    </button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {invoiceRows.map((row) => (
                      <div key={row.id} style={{ display: "flex", gap: "1rem", alignItems: "flex-start", background: "#ffffff", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0" }}>
                        
                        {/* Textarea */}
                        <div style={{ flex: 1 }}>
                          <textarea
                            value={row.text}
                            onChange={(e) => {
                              const textVal = e.target.value;
                              setInvoiceRows(invoiceRows.map(r => r.id === row.id ? { ...r, text: textVal } : r));
                            }}
                            rows={4}
                            style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem", outline: "none", fontSize: "0.825rem", resize: "vertical" }}
                          />
                        </div>

                        {/* Vahid */}
                        <div style={{ width: "6.5rem" }}>
                          <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "0.25rem" }}>Vahid</label>
                          <input
                            type="text"
                            value={row.unit}
                            onChange={(e) => {
                              const val = e.target.value;
                              setInvoiceRows(invoiceRows.map(r => r.id === row.id ? { ...r, unit: val } : r));
                            }}
                            style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem", outline: "none", fontSize: "0.825rem" }}
                          />
                        </div>

                        {/* Miqdar */}
                        <div style={{ width: "5rem" }}>
                          <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "0.25rem" }}>Miqdar <span style={{ color: "#ef4444" }}>*</span></label>
                          <input
                            type="number"
                            value={row.qty}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setInvoiceRows(invoiceRows.map(r => r.id === row.id ? { ...r, qty: val } : r));
                            }}
                            style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem", outline: "none", fontSize: "0.825rem" }}
                          />
                        </div>

                        {/* Qiymət */}
                        <div style={{ width: "6.5rem" }}>
                          <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "0.25rem" }}>Qiymət <span style={{ color: "#ef4444" }}>*</span></label>
                          <input
                            type="number"
                            value={row.price}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setInvoiceRows(invoiceRows.map(r => r.id === row.id ? { ...r, price: val } : r));
                            }}
                            style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem", outline: "none", fontSize: "0.825rem" }}
                          />
                        </div>

                        {/* ƏDV-siz */}
                        <div style={{ width: "6.5rem" }}>
                          <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "0.25rem" }}>ƏDV-siz</label>
                          <input
                            type="text"
                            disabled
                            value={((row.qty || 0) * (row.price || 0)).toFixed(2)}
                            style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem", outline: "none", fontSize: "0.825rem", backgroundColor: "#f1f5f9", color: "#64748b" }}
                          />
                        </div>

                        {/* ƏDV ilə */}
                        <div style={{ width: "6.5rem" }}>
                          <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "0.25rem" }}>ƏDV ilə</label>
                          <input
                            type="text"
                            disabled
                            value={(((row.qty || 0) * (row.price || 0)) * (1 + (parseFloat(row.vatRate) || 0) / 100)).toFixed(2)}
                            style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem", outline: "none", fontSize: "0.825rem", backgroundColor: "#f1f5f9", color: "#64748b" }}
                          />
                        </div>

                        {/* ƏDV-nin tarifi */}
                        <div style={{ width: "6.5rem" }}>
                          <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "0.25rem" }}>ƏDV-nin tarifi <span style={{ color: "#ef4444" }}>*</span></label>
                          <select
                            value={row.vatRate}
                            onChange={(e) => {
                              const val = e.target.value;
                              setInvoiceRows(invoiceRows.map(r => r.id === row.id ? { ...r, vatRate: val } : r));
                            }}
                            style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem", outline: "none", fontSize: "0.825rem", backgroundColor: "#ffffff" }}
                          >
                            <option value="0%">0%</option>
                            <option value="18%">18%</option>
                            <option value="20%">20%</option>
                          </select>
                        </div>

                        {/* Remove button */}
                        {invoiceRows.length > 1 && (
                          <div style={{ alignSelf: "flex-end" }}>
                            <button
                              type="button"
                              onClick={() => handleRemoveInvoiceRow(row.id)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "#fee2e2",
                                border: "1px solid #fca5a5",
                                borderRadius: "0.375rem",
                                width: "2.25rem",
                                height: "2.25rem",
                                color: "#ef4444",
                                cursor: "pointer",
                                transition: "background-color 0.2s"
                              }}
                            >
                              <FiTrash2 style={{ fontSize: "1rem" }} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Second Add Button underneath rows */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "1rem", padding: "0.75rem", border: "2px dashed #10b981", borderRadius: "0.5rem", background: "#f0fdf4" }}>
                    <button
                      type="button"
                      onClick={handleAddInvoiceRow}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#10b981",
                        border: 0,
                        borderRadius: "0.25rem",
                        width: "1.5rem",
                        height: "1.5rem",
                        color: "#ffffff",
                        fontWeight: "bold",
                        cursor: "pointer"
                      }}
                    >
                      +
                    </button>
                    <select
                      style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.375rem 0.75rem", outline: "none", fontSize: "0.875rem", backgroundColor: "#ffffff", color: "#64748b" }}
                      defaultValue="Şablon"
                    >
                      <option disabled value="Şablon">Şablon</option>
                      <option value="Standard">Standard</option>
                    </select>
                  </div>
                </div>

                {/* Checkboxes Row */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem", borderTop: "1px solid #cbd5e1", paddingTop: "1.5rem" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "#475569", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={invoiceUseNonStandard}
                      onChange={(e) => setInvoiceUseNonStandard(e.target.checked)}
                      style={{ width: "1.1rem", height: "1.1rem", accentColor: "#16a34a" }}
                    />
                    Hesabın qeyri-standart şablonundan istifadə et
                  </label>
                  
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "#475569", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={invoiceNoStampSign}
                      onChange={(e) => setInvoiceNoStampSign(e.target.checked)}
                      style={{ width: "1.1rem", height: "1.1rem", accentColor: "#16a34a" }}
                    />
                    Möhürlər və imzalar olmadan
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "#475569", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={invoiceSendNotif}
                      onChange={(e) => setInvoiceSendNotif(e.target.checked)}
                      style={{ width: "1.1rem", height: "1.1rem", accentColor: "#16a34a" }}
                    />
                    Göndərmə barədə məlumat verin
                  </label>
                </div>

              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "1.25rem 2rem",
                display: "flex",
                justifyContent: "flex-end",
                background: "transparent",
                borderTop: "1px solid #e2e8f0"
              }}
            >
              <button
                type="button"
                onClick={handleSaveInvoice}
                style={{
                  background: "#22c55e",
                  color: "#ffffff",
                  border: 0,
                  borderRadius: "0.375rem",
                  padding: "0.625rem 2rem",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  transition: "background-color 0.2s"
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

      {/* Şərh etmək Modal Overlay (Screenshot 1) */}
      {isNewCommentModalOpen && (
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
          {/* Backdrop blur */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(15, 23, 42, 0.4)",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setIsNewCommentModalOpen(false)}
          />
          {/* Modal Container */}
          <div
            style={{
              position: "relative",
              background: "#f8fafc",
              border: "1px solid #cbd5e1",
              borderRadius: "0.75rem",
              width: "min(100%, 55rem)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              maxHeight: "90vh",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "1.25rem 2rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid #cbd5e1"
              }}
            >
              <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#475569" }}>Şərh etmək</span>
              <button
                type="button"
                onClick={() => setIsNewCommentModalOpen(false)}
                style={{ background: "transparent", border: 0, cursor: "pointer", fontSize: "1.5rem", color: "#0f172a" }}
              >
                <FiX />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "2rem", flexWrap: "wrap" }}>
                
                {/* Şərh et */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", minWidth: "18rem" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>Şərh et</label>
                  <select
                    value={commentCategory}
                    onChange={(e) => setCommentCategory(e.target.value)}
                    style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.5rem", outline: "none", fontSize: "0.85rem", backgroundColor: "#ffffff" }}
                  >
                    <option value="Sifariş">Sifariş</option>
                    <option value="Reys">Reys</option>
                  </select>
                </div>

                {/* Checkbox 1 */}
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "#475569", cursor: "pointer", marginTop: "1rem" }}>
                  <input
                    type="checkbox"
                    checked={commentProvideAccessCustomer}
                    onChange={(e) => setCommentProvideAccessCustomer(e.target.checked)}
                    style={{ width: "1.1rem", height: "1.1rem", accentColor: "#16a34a" }}
                  />
                  Müştəriyə çıxışı təqdim et
                </label>

                {/* Checkbox 2 */}
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "#475569", cursor: "pointer", marginTop: "1rem" }}>
                  <input
                    type="checkbox"
                    checked={commentProvideAccessCarrier}
                    onChange={(e) => setCommentProvideAccessCarrier(e.target.checked)}
                    style={{ width: "1.1rem", height: "1.1rem", accentColor: "#16a34a" }}
                  />
                  Daşıyıcıya girişi təqdim et
                </label>
              </div>

              {/* Şərhlər */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>Şərhlər <span style={{ color: "#ef4444" }}>*</span></label>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={5}
                  style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.75rem", outline: "none", fontSize: "0.875rem", boxSizing: "border-box" }}
                  placeholder="Bura şərhinizi yazın..."
                />
              </div>

              {/* File Upload Box */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>Fayl</span>
                <div
                  style={{
                    border: "2px dashed #cbd5e1",
                    borderRadius: "0.5rem",
                    padding: "2rem",
                    textAlign: "center",
                    background: "#ffffff",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    color: "#64748b"
                  }}
                >
                  Faylınızı Sürüşdürün & Buraxın ya da <span style={{ textDecoration: "underline", color: "#16a34a", fontWeight: 600 }}>Seçin</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: "1.25rem 2rem", display: "flex", justifyContent: "flex-end", borderTop: "1px solid #cbd5e1" }}>
              <button
                type="button"
                onClick={handleSaveNewComment}
                style={{
                  background: "#22c55e",
                  color: "#ffffff",
                  border: 0,
                  borderRadius: "0.375rem",
                  padding: "0.625rem 2rem",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  transition: "background-color 0.2s"
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

      {/* Tapşırığa baxış / Əlavə et Modal Overlay (Screenshot 2) */}
      {isTaskModalOpen && (
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
          {/* Backdrop blur */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(15, 23, 42, 0.4)",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setIsTaskModalOpen(false)}
          />
          {/* Modal Container */}
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
              <div style={{ flex: 1, textAlign: "center" }}>
                <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1e293b" }}>Tapşırığa baxış</span>
              </div>
              <button
                type="button"
                onClick={() => setIsTaskModalOpen(false)}
                style={{ background: "transparent", border: 0, cursor: "pointer", fontSize: "1.5rem", color: "#ef4444" }}
              >
                <FiX />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: "2rem", overflowY: "auto", flex: 1 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "2rem", alignItems: "start" }}>
                
                {/* Left Column */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  
                  {/* Adı */}
                  <input
                    type="text"
                    placeholder="Adı"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.75rem", outline: "none", fontSize: "1rem", backgroundColor: "#ffffff" }}
                  />

                  {/* Təsviri */}
                  <textarea
                    placeholder="Təsviri"
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    rows={8}
                    style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.75rem", outline: "none", fontSize: "0.875rem", resize: "vertical", backgroundColor: "#ffffff" }}
                  />

                  {/* Çeklist */}
                  <div style={{ background: "#ffffff", padding: "1.25rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "0.75rem" }}>Çeklist</span>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "0.75rem" }}>
                      {taskChecklist.map((item, idx) => (
                        <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <input type="checkbox" style={{ cursor: "pointer" }} />
                          <span style={{ fontSize: "0.85rem", color: "#334155" }}>{item}</span>
                          <button
                            type="button"
                            onClick={() => setTaskChecklist(taskChecklist.filter((_, i) => i !== idx))}
                            style={{ background: "transparent", border: 0, cursor: "pointer", color: "#ef4444", fontSize: "0.8rem", marginLeft: "auto" }}
                          >
                            Sil
                          </button>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <input
                        type="text"
                        placeholder="Yeni element əlavə et"
                        value={taskChecklistInput}
                        onChange={(e) => setTaskChecklistInput(e.target.value)}
                        style={{ flex: 1, border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.375rem 0.5rem", fontSize: "0.8rem" }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (taskChecklistInput.trim()) {
                            setTaskChecklist([...taskChecklist, taskChecklistInput.trim()]);
                            setTaskChecklistInput("");
                          }
                        }}
                        style={{
                          background: "#ffffff",
                          border: "1px solid #cbd5e1",
                          borderRadius: "0.375rem",
                          padding: "0.375rem 0.75rem",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.25rem"
                        }}
                      >
                        <FiPlus />
                        Əlavə et
                      </button>
                    </div>
                  </div>

                  {/* Əlavə edilmiş fayllar */}
                  <div style={{ background: "#ffffff", padding: "1.25rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "0.75rem" }}>Əlavə edilmiş fayllar</span>
                    <div
                      style={{
                        border: "2px dashed #cbd5e1",
                        borderRadius: "0.5rem",
                        padding: "2rem",
                        textAlign: "center",
                        fontSize: "0.85rem",
                        color: "#64748b",
                        cursor: "pointer"
                      }}
                    >
                      Faylınızı Sürüşdürün & Buraxın ya da Seçin
                    </div>
                  </div>
                </div>

                {/* Right Column / Control Panel */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  
                  {/* Kontragent */}
                  <div style={{ background: "#ffffff", padding: "0.75rem 1rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "0.25rem" }}>Kontragent</label>
                    <select
                      value={taskContractor}
                      onChange={(e) => setTaskContractor(e.target.value)}
                      style={{ width: "100%", border: 0, padding: 0, outline: "none", fontSize: "0.85rem", backgroundColor: "transparent" }}
                    >
                      <option value="Dəyəri seçin">Dəyəri seçin</option>
                      <option value="Limon Dental MMC">Limon Dental MMC</option>
                    </select>
                  </div>

                  {/* Şöbə */}
                  <div style={{ background: "#ffffff", padding: "0.75rem 1rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "0.25rem" }}>Şöbə</label>
                    <select
                      value={taskDepartment}
                      onChange={(e) => setTaskDepartment(e.target.value)}
                      style={{ width: "100%", border: 0, padding: 0, outline: "none", fontSize: "0.85rem", backgroundColor: "transparent" }}
                    >
                      <option value="Dəyəri seçin">Dəyəri seçin</option>
                      <option value="Satış şöbəsi">Satış şöbəsi</option>
                      <option value="Maliyyə şöbəsi">Maliyyə şöbəsi</option>
                    </select>
                  </div>

                  {/* Müəllif */}
                  <div style={{ background: "#ffffff", padding: "0.75rem 1rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "0.25rem" }}>Müəllif</label>
                      <input
                        type="text"
                        value={taskAuthor}
                        onChange={(e) => setTaskAuthor(e.target.value)}
                        style={{ width: "100%", border: 0, padding: 0, outline: "none", fontSize: "0.85rem", backgroundColor: "transparent" }}
                      />
                    </div>
                    <button type="button" onClick={() => setTaskAuthor("")} style={{ background: "transparent", border: 0, cursor: "pointer", color: "#cbd5e1" }}>×</button>
                  </div>

                  {/* İcraçı */}
                  <div style={{ background: "#ffffff", padding: "0.75rem 1rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "0.25rem" }}>İcraçı</label>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", alignItems: "center" }}>
                        <span style={{ background: "#f1f5f9", padding: "0.15rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.775rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          {taskExecutor}
                          <button type="button" onClick={() => setTaskExecutor("")} style={{ border: 0, background: "transparent", cursor: "pointer", fontSize: "0.75rem" }}>×</button>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Təkrarlanan tapşırıq */}
                  <div style={{ background: "#ffffff", padding: "0.75rem 1rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "#475569", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={taskIsRecurring}
                        onChange={(e) => setTaskIsRecurring(e.target.checked)}
                        style={{ width: "1.1rem", height: "1.1rem", accentColor: "#16a34a" }}
                      />
                      Təkrarlanan tapşırıq
                    </label>
                    <span style={{ color: "#3b82f6", cursor: "pointer", fontWeight: "bold" }}>!</span>
                  </div>

                  {/* Yaradılması tarix */}
                  <div style={{ background: "#ffffff", padding: "0.75rem 1rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={{ fontSize: "0.725rem", color: "#64748b", display: "block", marginBottom: "0.25rem" }}>Yradılması tarix</label>
                      <input
                        type="text"
                        value={taskCreatedDate}
                        onChange={(e) => setTaskCreatedDate(e.target.value)}
                        style={{ width: "100%", border: 0, padding: 0, outline: "none", fontSize: "0.85rem", fontWeight: 600 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.725rem", color: "#64748b", display: "block", marginBottom: "0.25rem" }}>Vaxt</label>
                      <input
                        type="text"
                        value={taskCreatedTime}
                        onChange={(e) => setTaskCreatedTime(e.target.value)}
                        style={{ width: "100%", border: 0, padding: 0, outline: "none", fontSize: "0.85rem", fontWeight: 600 }}
                      />
                    </div>
                  </div>

                  {/* Son müddət */}
                  <div style={{ background: "#ffffff", padding: "0.75rem 1rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "0.75rem" }}>
                    <div>
                      <label style={{ fontSize: "0.725rem", color: "#64748b", display: "block", marginBottom: "0.25rem" }}>Son müddət</label>
                      <input
                        type="text"
                        placeholder="28.05.2026"
                        value={taskDueDate}
                        onChange={(e) => setTaskDueDate(e.target.value)}
                        style={{ width: "100%", border: 0, padding: 0, outline: "none", fontSize: "0.85rem" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.725rem", color: "#64748b", display: "block", marginBottom: "0.25rem" }}>Vaxt</label>
                      <input
                        type="text"
                        placeholder="18:00"
                        value={taskDueTime}
                        onChange={(e) => setTaskDueTime(e.target.value)}
                        style={{ width: "100%", border: 0, padding: 0, outline: "none", fontSize: "0.85rem" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.725rem", color: "#64748b", display: "block", marginBottom: "0.25rem" }}>Qədər</label>
                      <input
                        type="text"
                        value={taskDueAmount}
                        onChange={(e) => setTaskDueAmount(e.target.value)}
                        style={{ width: "100%", border: 0, padding: 0, outline: "none", fontSize: "0.85rem" }}
                      />
                    </div>
                  </div>

                  {/* Xatırlat Checkbox */}
                  <div style={{ background: "#ffffff", padding: "0.75rem 1rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "#475569", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={taskRemind}
                        onChange={(e) => setTaskRemind(e.target.checked)}
                        style={{ width: "1.1rem", height: "1.1rem", accentColor: "#16a34a" }}
                      />
                      Xatırlat
                    </label>
                    <span style={{ color: "#3b82f6", cursor: "pointer", fontWeight: "bold" }}>!</span>
                  </div>

                  {/* Xatırlat Options */}
                  {taskRemind && (
                    <div style={{ background: "#ffffff", padding: "0.75rem 1rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "1rem" }}>
                      <div>
                        <label style={{ fontSize: "0.725rem", color: "#64748b", display: "block", marginBottom: "0.25rem" }}>Xatırlat</label>
                        <select
                          value={taskRemindDay}
                          onChange={(e) => setTaskRemindDay(e.target.value)}
                          style={{ width: "100%", border: 0, padding: 0, outline: "none", fontSize: "0.85rem", backgroundColor: "transparent" }}
                        >
                          <option value="İcra günündə">İcra günündə</option>
                          <option value="1 gün əvvəl">1 gün əvvəl</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: "0.725rem", color: "#64748b", display: "block", marginBottom: "0.25rem" }}>Vaxt</label>
                        <input
                          type="text"
                          value={taskRemindTime}
                          onChange={(e) => setTaskRemindTime(e.target.value)}
                          style={{ width: "100%", border: 0, padding: 0, outline: "none", fontSize: "0.85rem", fontWeight: 600 }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: "1.25rem 2rem", display: "flex", justifyContent: "space-between", borderTop: "1px solid #cbd5e1", background: "#ffffff" }}>
              {selectedTaskForEdit ? (
                <button
                  type="button"
                  onClick={() => handleDeleteTask(selectedTaskForEdit.id)}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: "0.375rem",
                    padding: "0.625rem 1.5rem",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "#ef4444",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.375rem"
                  }}
                >
                  <FiTrash2 />
                  Sil
                </button>
              ) : (
                <div />
              )}
              <button
                type="button"
                onClick={handleSaveTask}
                style={{
                  background: "#1e293b",
                  color: "#ffffff",
                  border: 0,
                  borderRadius: "0.375rem",
                  padding: "0.625rem 2rem",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}
              >
                <span>Yaddaşda saxla və çıx</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Yeni müqavilə Modal Overlay (Screenshot) */}
      {isNewContractModalOpen && (
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
          {/* Backdrop blur */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(15, 23, 42, 0.4)",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setIsNewContractModalOpen(false)}
          />
          {/* Modal Container */}
          <div
            style={{
              position: "relative",
              background: "#f4f6f8",
              border: "1px solid #cbd5e1",
              borderRadius: "0.75rem",
              width: "min(100%, 46rem)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              maxHeight: "95vh",
              fontFamily: "Inter, sans-serif"
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "1.25rem 2rem 0.5rem 2rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "transparent"
              }}
            >
              <span style={{ fontSize: "1.25rem", fontWeight: 500, color: "#5a738e" }}>Yeni müqavilə</span>
              <button
                type="button"
                onClick={() => setIsNewContractModalOpen(false)}
                style={{ background: "transparent", border: 0, cursor: "pointer", fontSize: "1.5rem", color: "#000000", fontWeight: "bold" }}
              >
                <FiX />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: "1.5rem 2rem 2rem 2rem", overflowY: "auto", flex: 1 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                
                {/* Şirkət */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  <label style={{ fontSize: "0.85rem", color: "#8a99ad" }}>Şirkət</label>
                  <div style={{ position: "relative", width: "100%" }}>
                    <select
                      value={contractCompany}
                      onChange={(e) => setContractCompany(e.target.value)}
                      style={{
                        width: "100%",
                        border: "1px solid #cbd5e1",
                        borderRadius: "0.375rem",
                        padding: "0.55rem 2.5rem 0.55rem 0.75rem",
                        fontSize: "0.9rem",
                        outline: "none",
                        backgroundColor: "#ffffff",
                        color: "#334155",
                        appearance: "none",
                        cursor: "pointer"
                      }}
                    >
                      <option value="Ziyafreight">Ziyafreight</option>
                      <option value="Logistra LLC">Logistra LLC</option>
                    </select>
                    <div style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", gap: "0.5rem", pointerEvents: "none" }}>
                      <span style={{ color: "#000000", fontSize: "0.9rem", fontWeight: "bold" }}>×</span>
                      <span style={{ color: "#94a3b8", fontSize: "0.55rem" }}>▼</span>
                    </div>
                  </div>
                </div>

                {/* Tip */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <label style={{ fontSize: "0.85rem", color: "#8a99ad" }}>Tip <span style={{ color: "#ef4444" }}>*</span></label>
                  <div style={{ display: "flex", gap: "2rem" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", color: "#000000", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="contractType"
                        checked={contractType === "template"}
                        onChange={() => setContractType("template")}
                        style={{ display: "none" }}
                      />
                      <span style={{
                        width: "1.25rem",
                        height: "1.25rem",
                        borderRadius: "50%",
                        border: contractType === "template" ? "2px solid #5cb85c" : "2px solid #cbd5e1",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: contractType === "template" ? "#5cb85c" : "#ffffff",
                        transition: "all 0.2s"
                      }}>
                        {contractType === "template" && (
                          <span style={{ width: "0.5rem", height: "0.5rem", borderRadius: "50%", background: "#ffffff" }} />
                        )}
                      </span>
                      Sənədin şablonu
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", color: "#000000", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="contractType"
                        checked={contractType === "file"}
                        onChange={() => setContractType("file")}
                        style={{ display: "none" }}
                      />
                      <span style={{
                        width: "1.25rem",
                        height: "1.25rem",
                        borderRadius: "50%",
                        border: contractType === "file" ? "2px solid #5cb85c" : "2px solid #cbd5e1",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: contractType === "file" ? "#5cb85c" : "#ffffff",
                        transition: "all 0.2s"
                      }}>
                        {contractType === "file" && (
                          <span style={{ width: "0.5rem", height: "0.5rem", borderRadius: "50%", background: "#ffffff" }} />
                        )}
                      </span>
                      Əlavə edilmiş fayl
                    </label>
                  </div>
                </div>

                {/* Reys və Yük üçün müqavilə (Flex grid) */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    <label style={{ fontSize: "0.85rem", color: "#8a99ad" }}>Reys üçün müqavilə</label>
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        width: "100%",
                        border: "1px solid #cbd5e1",
                        borderRadius: "0.375rem",
                        padding: "0.375rem 0.5rem",
                        background: "#ffffff",
                        minHeight: "2.35rem",
                        boxSizing: "border-box"
                      }}>
                        {contractVoyage ? (
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            background: "#e2e8f0",
                            color: "#000000",
                            padding: "0.15rem 0.5rem",
                            borderRadius: "0.25rem",
                            fontSize: "0.85rem",
                          }}>
                            <span 
                              style={{ cursor: "pointer", fontWeight: "bold", color: "#94a3b8" }}
                              onClick={() => setContractVoyage("")}
                            >
                              ×
                            </span>
                            {contractVoyage}
                          </span>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Dəyəri seçin</span>
                        )}
                        <span 
                          style={{ marginLeft: "auto", cursor: "pointer", fontWeight: "bold", color: "#000000", fontSize: "1rem" }}
                          onClick={() => setContractVoyage("")}
                        >
                          ×
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    <label style={{ fontSize: "0.85rem", color: "#8a99ad" }}>Yük üçün müqavilə</label>
                    <div style={{ position: "relative", width: "100%" }}>
                      <select
                        value={contractLoad}
                        onChange={(e) => setContractLoad(e.target.value)}
                        style={{
                          width: "100%",
                          border: "1px solid #cbd5e1",
                          borderRadius: "0.375rem",
                          padding: "0.55rem 2.5rem 0.55rem 0.75rem",
                          fontSize: "0.9rem",
                          outline: "none",
                          backgroundColor: "#ffffff",
                          color: contractLoad === "Dəyəri seçin" ? "#94a3b8" : "#334155",
                          appearance: "none",
                          cursor: "pointer"
                        }}
                      >
                        <option value="Dəyəri seçin">Dəyəri seçin</option>
                        <option value="General cargo">General cargo</option>
                      </select>
                      <div style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", gap: "0.5rem", pointerEvents: "none" }}>
                        <span style={{ color: "#cbd5e1", fontSize: "0.55rem" }}>▼</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Şablon */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  <label style={{ fontSize: "0.85rem", color: "#8a99ad" }}>Şablon <span style={{ color: "#ef4444" }}>*</span></label>
                  <div style={{ position: "relative", width: "100%" }}>
                    <select
                      value={contractTemplate}
                      onChange={(e) => setContractTemplate(e.target.value)}
                      style={{
                        width: "100%",
                        border: "1px solid #cbd5e1",
                        borderRadius: "0.375rem",
                        padding: "0.55rem 2.5rem 0.55rem 0.75rem",
                        fontSize: "0.9rem",
                        outline: "none",
                        backgroundColor: "#ffffff",
                        color: contractTemplate === "Dəyəri seçin" ? "#94a3b8" : "#334155",
                        appearance: "none",
                        cursor: "pointer"
                      }}
                    >
                      <option value="Dəyəri seçin">Dəyəri seçin</option>
                      <option value="Standard Agreement">Standard Agreement</option>
                    </select>
                    <div style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", gap: "0.5rem", pointerEvents: "none" }}>
                      <span style={{ color: "#94a3b8", fontSize: "0.55rem" }}>▼</span>
                    </div>
                  </div>
                </div>

                {/* Sənədin nömrəsi, tarixi, adı (Grid) */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.2fr", gap: "1.5rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    <label style={{ fontSize: "0.85rem", color: "#8a99ad" }}>Sənədin nömrəsi</label>
                    <input
                      type="text"
                      value={contractDocNumber}
                      onChange={(e) => setContractDocNumber(e.target.value)}
                      style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.55rem 0.75rem", fontSize: "0.9rem", outline: "none", backgroundColor: "#ffffff" }}
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    <label style={{ fontSize: "0.85rem", color: "#8a99ad" }}>Sənədin tarixi</label>
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      <input
                        type="text"
                        value={contractDocDate}
                        onChange={(e) => setContractDocDate(e.target.value)}
                        style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.55rem 2.25rem 0.55rem 0.75rem", fontSize: "0.9rem", outline: "none", backgroundColor: "#ffffff" }}
                      />
                      <FiCalendar style={{ position: "absolute", right: "0.75rem", color: "#cbd5e1" }} />
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    <label style={{ fontSize: "0.85rem", color: "#8a99ad" }}>Sənədin adı</label>
                    <input
                      type="text"
                      value={contractDocName}
                      onChange={(e) => setContractDocName(e.target.value)}
                      style={{ border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.55rem 0.75rem", fontSize: "0.9rem", outline: "none", backgroundColor: "#ffffff" }}
                    />
                  </div>
                </div>

                {/* Checkboxes vertically aligned */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.5rem" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", color: "#000000", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={contractHasValidity}
                      onChange={(e) => setContractHasValidity(e.target.checked)}
                      style={{ width: "1.1rem", height: "1.1rem", accentColor: "#5cb85c" }}
                    />
                    Sənədin etibarlılıq müddəti
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", color: "#000000", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={contractProvideAccessCustomer}
                      onChange={(e) => setContractProvideAccessCustomer(e.target.checked)}
                      style={{ width: "1.1rem", height: "1.1rem", accentColor: "#5cb85c" }}
                    />
                    Müştəriyə çıxışı təqdim et
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", color: "#000000", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={contractProvideAccessCarrier}
                      onChange={(e) => setContractProvideAccessCarrier(e.target.checked)}
                      style={{ width: "1.1rem", height: "1.1rem", accentColor: "#5cb85c" }}
                    />
                    Daşıyıcıya girişi təqdim et
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", color: "#000000", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={contractSendNotif}
                      onChange={(e) => setContractSendNotif(e.target.checked)}
                      style={{ width: "1.1rem", height: "1.1rem", accentColor: "#5cb85c" }}
                    />
                    Göndərmə barədə məlumat verin
                  </label>
                </div>

                {/* Şərhlər */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  <label style={{ fontSize: "0.85rem", color: "#8a99ad" }}>Şərhlər</label>
                  <textarea
                    value={contractComments}
                    onChange={(e) => setContractComments(e.target.value)}
                    rows={4}
                    style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.75rem", outline: "none", fontSize: "0.9rem", boxSizing: "border-box", resize: "both" }}
                  />
                </div>

              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: "1.25rem 2rem", display: "flex", justifyContent: "center", gap: "1rem", background: "transparent" }}>
              <button
                type="button"
                onClick={() => setIsNewContractModalOpen(false)}
                style={{
                  background: "#5cb85c",
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

              <button
                type="button"
                onClick={() => setIsNewContractModalOpen(false)}
                style={{
                  background: "#5cb85c",
                  color: "#ffffff",
                  border: 0,
                  borderRadius: "0.375rem",
                  padding: "0.625rem 2rem",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  cursor: "pointer"
                }}
              >
                Müqaviləni yaddaşda saxla və tamamla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className={styles.footer}>
        Logistra Copyright © 2013-2026
      </footer>
    </div>
  );
}
