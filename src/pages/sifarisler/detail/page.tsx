"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
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
  FiX,
  FiUpload,
  FiEdit2,
} from "react-icons/fi";
import axios from "axios";
import { ENDPOINTS } from "../../../services/EndpointResources.g";
import type { SifarisOrderRow, OrderStatusKind } from "../types/sifaris.types";
import {
  buildLoadApiPayload,
  formatVoyageLabel,
  mapLoadRow,
} from "../lib/mapLoadRow";
import { formatDateOnly } from "../lib/formatDate";
import { formatStatusHistoryMeta } from "../lib/statusHistory.utils";
import SifarisEditModal from "../components/SifarisEditModal";
import YukNewModal from "../components/YukNewModal";
import YukViewModal from "../components/YukViewModal";
import ReysViewModal from "../components/ReysViewModal";
import ReysEditModal from "../components/ReysEditModal";
import ReysDeleteModal from "../components/ReysDeleteModal";
import { ConfirmModal } from "../../../common/components/ConfirmModal";
import EntityTasksPanel from "../../../common/components/tasks/EntityTasksPanel";
import DocumentGeneratePanel from "../../../common/components/documents/DocumentGeneratePanel";
import { resolveUploadUrl, fetchOrderDocumentsAction } from "../../../common/actions/document.actions";
import { useAppDispatch } from "../../../common/store/hooks";
import { showNotification } from "../../../common/store/modalSlice";
import { useAuth } from "../../../common/contexts/AuthContext";
import styles from "./page.module.css";
import {
  convertCurrencyToAzn,
  resolveFinanceExpenseAzn,
  resolveFinanceRevenueAzn,
  resolveVoyageExpenseAzn,
} from "../../../common/utils/currency.utils";
import {
  resolveOfferExpenseFallbackAzn,
  resolveOfferSalesTotalSummary,
} from "../lib/offerExpense.utils";
import {
  formatVolumeLabel,
  sumOrderCargoTotals,
} from "../lib/orderCargoDisplay";
import { parseCompositePlace } from "../lib/yukPrefill.utils";
import { fetchUsersAction } from "../../../common/actions/user.actions";
import {
  fetchCustomerDetailAction,
  fetchCustomersAction,
} from "../../../common/actions/customer.actions";
import { updateQueryAction } from "../../../common/actions/query.actions";
import { parseCarrierDocuments } from "../../../common/utils/carrierDisplay.utils";
import type { UserRow } from "../../ayarlar/types/user.types";

type InvoiceDocumentItem = {
  id: string;
  name: string;
  size: string;
  url: string;
  createdAt: string;
  /** Yalnız yüklənməmiş (blob) sənədlər üçün — refresh-dən sonra itməsin deyə serverə yazılır */
  file?: File;
};

function formatInvoiceDocSize(bytes: number): string {
  if (!bytes || bytes < 0) return "0 B";
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function mapInvoiceFromApi(inv: any) {
  if (!inv) return inv;
  let documents: InvoiceDocumentItem[] = [];
  if (Array.isArray(inv.documents)) {
    documents = inv.documents;
  } else if (typeof inv.documentsJson === "string" && inv.documentsJson.trim()) {
    try {
      const parsed = JSON.parse(inv.documentsJson);
      documents = Array.isArray(parsed) ? parsed : [];
    } catch {
      documents = [];
    }
  }
  let rows = inv.rows;
  if (!Array.isArray(rows) && typeof inv.rowsJson === "string" && inv.rowsJson.trim()) {
    try {
      const parsed = JSON.parse(inv.rowsJson);
      rows = Array.isArray(parsed) ? parsed : [];
    } catch {
      rows = [];
    }
  }
  return {
    ...inv,
    documents,
    rows: Array.isArray(rows) ? rows : [],
    carrier: inv.carrier || inv.payer || "",
    payer: inv.payer || inv.carrier || "",
  };
}

function resolveUserDisplayName(
  value: unknown,
  users?: Array<{ id?: number | string; name?: string }>,
): string {
  const raw =
    typeof value === "string" || typeof value === "number"
      ? String(value).trim()
      : "";
  if (!raw) return "";
  if (Array.isArray(users)) {
    const found = users.find((u) => String(u.id) === raw);
    if (found?.name) return found.name;
  }
  return raw;
}

function resolveCustomerDisplayName(
  value: unknown,
  customers?: Array<{
    id?: number | string;
    name?: string;
    companyName?: string;
    company?: string;
    fullName?: string;
  }>,
): string {
  const raw =
    typeof value === "string" || typeof value === "number"
      ? String(value).trim()
      : "";
  if (!raw || raw === "—") return "";

  const list = Array.isArray(customers) ? customers : [];
  const found = list.find((c) => String(c?.id) === raw);
  if (found) {
    const name =
      (typeof found.name === "string" && found.name.trim()) ||
      (typeof found.companyName === "string" && found.companyName.trim()) ||
      (typeof found.company === "string" && found.company.trim()) ||
      (typeof found.fullName === "string" && found.fullName.trim()) ||
      "";
    if (name) return name;
  }
  return raw;
}

function looksLikeNumericId(value: unknown): boolean {
  const raw = String(value ?? "").trim();
  return /^\d+$/.test(raw);
}

// Helper components for key-value layout
function DlRow({ label, value }: { label: string; value?: React.ReactNode }) {
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

const LabelWithPlus = ({
  label,
  onPlusClick,
}: {
  label: string;
  onPlusClick?: () => void;
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }}
  >
    <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>
      {label}
    </span>
    {onPlusClick && (
      <button
        type="button"
        onClick={onPlusClick}
        style={{
          background: "transparent",
          border: 0,
          padding: 0,
          color: "#3b82f6",
          cursor: "pointer",
          fontSize: "0.85rem",
          fontWeight: "bold",
        }}
      >
        +
      </button>
    )}
  </div>
);

export default function SifarisDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerNameOverride, setCustomerNameOverride] = useState("");
  const navigate = useNavigate();

  const [orders, setOrders] = useState<SifarisOrderRow[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isOrderSaving, setIsOrderSaving] = useState(false);
  const [isYukModalOpen, setIsYukModalOpen] = useState(false);

  const [loadsList, setLoadsList] = useState<
    Array<{
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
      voyage: any;
      voyageId?: string | number | null;
      rawPayload?: any;
      ldm?: number;
      volumeM3?: number;
      weightKg?: number;
      packagingType?: string;
      status?: string;
    }>
  >([]);

  const [selectedLoadForView, setSelectedLoadForView] = useState<any | null>(
    null,
  );
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedLoadForEdit, setSelectedLoadForEdit] = useState<any | null>(
    null,
  );
  const [isYukEditModalOpen, setIsYukEditModalOpen] = useState(false);

  // Finance States
  const [financeTransactions, setFinanceTransactions] = useState<
    Array<{
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
      mesarifAzn?: string;
      edvliMesarifPrice: string;
      edvliMesarifCurrency: string;
      edvliMesarifAzn?: string;
      profit: string;
      user: string;
      invoiceWritten: boolean;
      invoiceReceived: boolean;
      costDate: string;
    }>
  >([]);

  const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] =
    useState(false);
  const [selectedTxForEdit, setSelectedTxForEdit] = useState<any | null>(null);

  // Nested Finance Modals States
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isExpenseCategoryModalOpen, setIsExpenseCategoryModalOpen] =
    useState(false);
  const [isPartnerMenuOpen, setIsPartnerMenuOpen] = useState(false);
  const [partnerMenuCoords, setPartnerMenuCoords] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [newCountryName, setNewCountryName] = useState("");
  const [newCountryIso, setNewCountryIso] = useState("");
  const [isEuropeCountry, setIsEuropeCountry] = useState(false);
  const [isDefaultCountry, setIsDefaultCountry] = useState(false);
  const [isActiveCountry, setIsActiveCountry] = useState(true);
  const [parentCountry, setParentCountry] = useState("Dəyəri seçin");
  const [partnerModalType, setPartnerModalType] = useState<
    "client" | "carrier"
  >("client");
  const [partnerActiveTab, setPartnerActiveTab] = useState<
    "general" | "contact" | "finance"
  >("general");

  // Full-fidelity partner modal states
  const [partnerFullName, setPartnerFullName] = useState("");
  const [partnerAbbrevName, setPartnerAbbrevName] = useState("");
  const [partnerType, setPartnerType] = useState("Yeni müştəri");
  const [partnerActivityType, setPartnerActivityType] =
    useState("Dəyəri seçin");
  const [partnerVoun, setPartnerVoun] = useState("");
  const [partnerVoen, setPartnerVoen] = useState("");
  const [partnerMtut, setPartnerMtut] = useState("");
  const [partnerEdqn, setPartnerEdqn] = useState("");
  const [partnerUak, setPartnerUak] = useState("");
  const [partnerBin, setPartnerBin] = useState("");
  const [partnerVatCode, setPartnerVatCode] = useState("");
  const [partnerCreationDate, setPartnerCreationDate] = useState("");
  const [partnerLang, setPartnerLang] = useState("Dəyəri seçin");
  const [partnerManagers, setPartnerManagers] = useState<string[]>([]);
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
  const [bankAccounts, setBankAccounts] = useState<
    Array<{
      id: string;
      currency: string;
      account: string;
      bank: string;
      transitAccount: string;
      corrBank: string;
      corrAccount: string;
    }>
  >([
    {
      id: "1",
      currency: "Dəyəri ...",
      account: "",
      bank: "Dəyəri seçin",
      transitAccount: "",
      corrBank: "Dəyəri seçin",
      corrAccount: "",
    },
  ]);
  const [financeDelay, setFinanceDelay] = useState("");
  const [financeDelayTerms, setFinanceDelayTerms] = useState(
    "B/k 30 təqvim günü.",
  );
  const [financeDocTerms, setFinanceDocTerms] = useState(
    "Hesabın, aktın və qəbul edən tərəfindən təsdiqlənmiş CMR-in orijinallarını aldıqdan sonra 30 təq",
  );
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
  const [txUser, setTxUser] = useState("");
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
        vatRate: "0%",
      },
    ]);
  };

  const handleRemoveInvoiceRow = (id: string) => {
    if (invoiceRows.length <= 1) {
      dispatch(
        showNotification({
          message: "Ən azı bir hesab sətri olmalıdır!",
          type: "error",
          autoCloseDuration: 3500,
        }),
      );
      return;
    }
    openDeleteConfirm(
      "Sətri sil",
      "Bu hesab sətrini silmək istədiyinizə əminsiniz?",
      () => setInvoiceRows(invoiceRows.filter((r) => r.id !== id)),
    );
  };

  const handleSaveInvoice = async () => {
    if (invoicesSubTab !== "alinmis" && !invoiceNumber.trim()) {
      dispatch(
        showNotification({
          message: "Lütfən hesab nömrəsini daxil edin!",
          type: "error",
          autoCloseDuration: 3500,
        }),
      );
      return;
    }
    if (invoicesSubTab === "alinmis" && invoicePendingDocs.length === 0) {
      dispatch(
        showNotification({
          message: "Alınmış hesab üçün ən azı bir sənəd əlavə edin!",
          type: "error",
          autoCloseDuration: 3500,
        }),
      );
      return;
    }
    if (!order?.id) {
      dispatch(
        showNotification({
          message: "Sifariş tapılmadı. Hesab saxlanılmadı.",
          type: "error",
          autoCloseDuration: 3500,
        }),
      );
      return;
    }

    const rowsTotal = invoiceRows.reduce((sum, row) => {
      const qty = Number(row.qty) || 0;
      const price = Number(row.price) || 0;
      return sum + qty * price;
    }, 0);
    const invoiceTotal =
      Number.parseFloat(String(invoiceFreightPrice).replace(",", ".")) ||
      rowsTotal;

    const resolvedNumber =
      invoiceNumber.trim() ||
      (invoicesSubTab === "alinmis"
        ? `AL-${order?.orderNumber || order?.id}-${Date.now()}`
        : "");

    const existingInvoice = editingInvoiceId
      ? invoicesList.find((i) => String(i.id) === String(editingInvoiceId))
      : null;

    try {
      const headers = {
        Authorization: "Bearer " + localStorage.getItem("token"),
      };

      const uploadInvoiceFileToServer = async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        const up = await axios.post(ENDPOINTS.INVOICES.UPLOAD, formData, {
          headers: { Authorization: headers.Authorization },
        });
        return {
          id: String(Date.now() + Math.random()),
          name: up.data?.fileName || file.name,
          size: formatInvoiceDocSize(up.data?.fileSize || file.size),
          url: up.data?.fileUrl || "",
          createdAt: new Date().toLocaleDateString("az-AZ"),
        } as InvoiceDocumentItem;
      };

      const resolvePersistedDocs = async (docs: InvoiceDocumentItem[]) => {
        const out: InvoiceDocumentItem[] = [];
        for (const doc of docs) {
          if (doc.file instanceof File) {
            out.push(await uploadInvoiceFileToServer(doc.file));
          } else if (doc.url && !String(doc.url).startsWith("blob:")) {
            out.push({
              id: doc.id,
              name: doc.name,
              size: doc.size,
              url: doc.url,
              createdAt: doc.createdAt,
            });
          }
        }
        return out;
      };

      const invoiceDocs =
        invoicesSubTab === "alinmis"
          ? await resolvePersistedDocs(invoicePendingDocs)
          : Array.isArray(existingInvoice?.documents)
            ? existingInvoice!.documents.filter(
                (d) => d.url && !String(d.url).startsWith("blob:"),
              )
            : [];

      if (invoicesSubTab === "alinmis" && invoiceDocs.length === 0) {
        dispatch(
          showNotification({
            message: "Sənəd serverə yüklənmədi. Yenidən cəhd edin.",
            type: "error",
            autoCloseDuration: 3500,
          }),
        );
        return;
      }

      const payload = {
        orderId: order?.id ? Number(order.id) : undefined,
        number: resolvedNumber,
        date: invoiceDate,
        amount: `${invoiceTotal} ${invoiceCurrency}`,
        status: existingInvoice?.status || "Gözlənilir",
        type: invoicesSubTab,
        payer: invoiceCarrier,
        contract: invoiceContract,
        creator: invoiceCreator,
        lang: invoiceLang,
        delayDays: invoiceDelayDays,
        payUntil: invoicePayUntilDate,
        currency: invoiceCurrency,
        rateDate: invoiceRateDate,
        useNonStandard: false,
        noStampSign: false,
        sendNotif: false,
        rows: invoiceRows,
        documents: invoiceDocs,
      };

      const isEdit = Boolean(editingInvoiceId);
      const res = isEdit
        ? await axios.put(
            ENDPOINTS.INVOICES.BY_ID(Number(editingInvoiceId)),
            payload,
            { headers },
          )
        : await axios.post(ENDPOINTS.INVOICES.BASE, payload, { headers });
      const saved = mapInvoiceFromApi(res.data || {});

      const mappedInvoice = {
        id: saved.id ?? editingInvoiceId ?? String(Date.now()),
        number: saved.number ?? resolvedNumber,
        date: saved.date ?? invoiceDate,
        amount:
          saved.amount ??
          `${invoiceTotal} ${invoiceCurrency}`,
        status: saved.status ?? existingInvoice?.status ?? "Gözlənilir",
        type: saved.type ?? invoicesSubTab,
        orderNumber: order?.orderNumber || "",
        carrier: invoiceCarrier,
        payer: saved.payer ?? invoiceCarrier,
        voyageNumber: invoiceVoyageNumber,
        contract: saved.contract ?? invoiceContract,
        creator: saved.creator ?? invoiceCreator,
        lang: saved.lang ?? invoiceLang,
        delayDays: saved.delayDays ?? invoiceDelayDays,
        payUntil: saved.payUntil ?? invoicePayUntilDate,
        freightPrice: invoiceFreightPrice,
        invoicePrice: String(invoiceTotal),
        currency: saved.currency ?? invoiceCurrency,
        rateDate: saved.rateDate ?? invoiceRateDate,
        useNonStandard: false,
        noStampSign: false,
        sendNotif: false,
        rows: invoiceRows,
        documents: Array.isArray(saved.documents)
          ? saved.documents
          : invoiceDocs,
      };

      if (isEdit) {
        setInvoicesList((prev) =>
          prev.map((inv) =>
            String(inv.id) === String(editingInvoiceId)
              ? { ...inv, ...mappedInvoice }
              : inv,
          ),
        );
      } else {
        setInvoicesList([...invoicesList, mappedInvoice]);
      }

      // İrəli hesab — avtomatik invoice PDF hazırlandı; sənəd sayını yenilə
      if (
        !isEdit &&
        invoicesSubTab === "ireli" &&
        order?.id
      ) {
        try {
          const docs = await fetchOrderDocumentsAction(Number(order.id));
          setOrders((prev) =>
            prev.map((o) =>
              String(o.id) === String(order.id)
                ? ({ ...o, orderDocuments: docs } as any)
                : o,
            ),
          );
        } catch {
          /* ignore */
        }
      }

      // Hesab borcu maliyyəyə yazıldı — siyahını yenilə
      try {
        if (order?.id) {
          const finRefresh = await axios.get(
            ENDPOINTS.FINANCE.BASE + "?orderId=" + order.id,
            { headers },
          );
          setFinanceTransactions(
            Array.isArray(finRefresh.data) ? finRefresh.data : [],
          );
        }
      } catch {
        /* ignore */
      }

      setIsNewInvoiceModalOpen(false);
      setEditingInvoiceId(null);
      setInvoiceNumber("");
      setInvoiceFreightPrice("");
      setInvoiceExpectedPrice(null);
      setInvoicePendingDocs([]);
      setInvoiceCarrier("");
      setInvoiceVoyageNumber("");
      setInvoiceContract("");
      dispatch(
        showNotification({
          message: isEdit
            ? "Hesab-faktura yeniləndi."
            : invoicesSubTab === "ireli"
              ? "İrəli hesab saxlanıldı və invoice sənədi hazırlandı."
              : "Hesab-faktura yadda saxlanıldı.",
          type: "success",
          autoCloseDuration: 2500,
        }),
      );
    } catch (err: any) {
      console.error(err);
      const apiMsg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "";
      const isUnique =
        /unique|Invoice_number|P2002/i.test(String(apiMsg)) ||
        /unique|Invoice_number|P2002/i.test(String(err?.message || ""));
      dispatch(
        showNotification({
          message: isUnique
            ? "Bu hesab nömrəsi artıq mövcuddur. Nömrəni dəyişib yenidən saxlayın."
            : apiMsg ||
              err?.message ||
              "Hesab-faktura saxlanılarkən xəta baş verdi.",
          type: "error",
          autoCloseDuration: 4500,
        }),
      );
    }
  };

  const openEditInvoice = (inv: any) => {
    if (!inv) return;
    setEditingInvoiceId(String(inv.id));
    if (inv.type === "ireli" || inv.type === "ilkin" || inv.type === "alinmis") {
      setInvoicesSubTab(inv.type);
    }
    setInvoiceNumber(String(inv.number || ""));
    setInvoiceDate(String(inv.date || ""));
    setInvoiceDelayDays(String(inv.delayDays ?? "0"));
    setInvoicePayUntilDate(String(inv.payUntil || inv.date || ""));
    setInvoiceRateDate(String(inv.rateDate || inv.date || ""));
    setInvoiceCreator(String(inv.creator || user?.name || ""));
    setInvoiceCarrier(String(inv.payer || inv.carrier || ""));
    setInvoiceVoyageNumber(String(inv.voyageNumber || ""));
    setInvoiceContract(String(inv.contract || ""));
    setInvoiceCurrency(String(inv.currency || "EUR").toUpperCase() || "EUR");

    const freightRaw = String(
      inv.freightPrice ?? inv.invoicePrice ?? "",
    ).replace(",", ".");
    const freightNum = Number.parseFloat(freightRaw);
    const fromAmount = String(inv.amount || "").match(
      /([\d.,]+)/,
    );
    const amountNum = fromAmount
      ? Number.parseFloat(fromAmount[1].replace(",", "."))
      : NaN;
    const expected =
      Number.isFinite(freightNum) && freightNum > 0
        ? freightNum
        : Number.isFinite(amountNum)
          ? amountNum
          : null;
    setInvoiceFreightPrice(
      expected != null ? String(expected) : freightRaw || "",
    );
    setInvoiceExpectedPrice(expected);

    if (Array.isArray(inv.rows) && inv.rows.length > 0) {
      setInvoiceRows(
        inv.rows.map((r: any, idx: number) => ({
          id: String(r.id ?? idx + 1),
          text: String(r.text ?? ""),
          unit: String(r.unit || "Marşrut"),
          qty: Number(r.qty) || 1,
          price: Number(r.price) || 0,
          vatRate: String(r.vatRate || "0%"),
        })),
      );
    } else {
      setInvoiceRows([
        {
          id: "1",
          text: "",
          unit: "Marşrut",
          qty: 1,
          price: expected || 0,
          vatRate: "0%",
        },
      ]);
    }

    setInvoicePendingDocs(
      Array.isArray(inv.documents) ? [...inv.documents] : [],
    );

    if (inv.type !== "alinmis") {
      fetchCustomersAction()
        .then((data) => {
          const list = Array.isArray(data)
            ? data
            : Array.isArray((data as any)?.customers)
              ? (data as any).customers
              : [];
          setInvoiceCarriersList(
            list
              .map((c: any) => ({
                id: String(c.id ?? ""),
                name: String(
                  c.name || c.company || c.companyName || "",
                ).trim(),
                documents: parseCarrierDocuments(
                  c.documents ?? c.documentsJson,
                ),
              }))
              .filter((c: { name: string }) => c.name),
          );
        })
        .catch(() => setInvoiceCarriersList([]));
    } else {
      setInvoiceCarriersList([]);
    }

    setIsNewInvoiceModalOpen(true);
  };

  const handleDeleteInvoice = (inv: any) => {
    if (!inv?.id) return;
    openDeleteConfirm(
      "Hesabı sil",
      `"${inv.number || "Hesab"}" silinsin? Bu əməliyyat geri qaytarıla bilməz.`,
      async () => {
        const idNum = Number(inv.id);
        const headers = {
          Authorization: "Bearer " + localStorage.getItem("token"),
        };
        try {
          if (Number.isFinite(idNum) && idNum > 0) {
            await axios.delete(ENDPOINTS.INVOICES.BY_ID(idNum), { headers });
          }
          setInvoicesList((prev) =>
            prev.filter((i) => String(i.id) !== String(inv.id)),
          );
          if (order?.id) {
            try {
              const finRefresh = await axios.get(
                ENDPOINTS.FINANCE.BASE + "?orderId=" + order.id,
                { headers },
              );
              setFinanceTransactions(
                Array.isArray(finRefresh.data) ? finRefresh.data : [],
              );
            } catch {
              /* ignore */
            }
          }
          dispatch(
            showNotification({
              message: "Hesab silindi.",
              type: "success",
              autoCloseDuration: 2500,
            }),
          );
        } catch (err: any) {
          console.error(err);
          const status = err?.response?.status;
          if (status === 404) {
            setInvoicesList((prev) =>
              prev.filter((i) => String(i.id) !== String(inv.id)),
            );
            dispatch(
              showNotification({
                message: "Hesab silindi.",
                type: "success",
                autoCloseDuration: 2500,
              }),
            );
            return;
          }
          dispatch(
            showNotification({
              message:
                err?.response?.data?.error ||
                err?.message ||
                "Hesab silinərkən xəta baş verdi.",
              type: "error",
              autoCloseDuration: 3500,
            }),
          );
        }
      },
    );
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

  const handleSaveTransaction = async () => {
    if (!txName.trim()) {
      dispatch(
        showNotification({
          message: "Lütfən adı daxil edin!",
          type: "error",
          autoCloseDuration: 3500,
        }),
      );
      return;
    }

    const rev = parseFloat(txRevTarif) || 0;
    const exp = parseFloat(txExpMesarif) || 0;
    const rateDate = selectedTxForEdit?.costDate || undefined;
    const [revConv, expConv] = await Promise.all([
      convertCurrencyToAzn(rev, txRevCurrency, rateDate),
      convertCurrencyToAzn(exp, txExpCurrency, rateDate),
    ]);
    const revAzn = revConv.azn;
    const expAzn = expConv.azn;
    const profitVal = revAzn - expAzn;

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
        mesarifAzn: txExpMesarif !== "0.00" ? expAzn.toFixed(2) : "",
        edvliMesarifPrice: txExpMesarif !== "0.00" ? txExpMesarif : "",
        edvliMesarifCurrency: txExpMesarif !== "0.00" ? txExpCurrency : "",
        edvliMesarifAzn: txExpMesarif !== "0.00" ? expAzn.toFixed(2) : "",
        profit: `${profitVal.toFixed(2)} AZN`,
        costDate: selectedTxForEdit.costDate,
      };
      axios
        .put(ENDPOINTS.FINANCE.BASE + "/" + selectedTxForEdit.id, updateData, {
          headers: { Authorization: "Bearer " + localStorage.getItem("token") },
        })
        .then((res) => {
          setFinanceTransactions(
            financeTransactions.map((t) =>
              t.id === selectedTxForEdit.id ? res.data : t,
            ),
          );
        })
        .catch(console.error);
    } else {
      const newTx = {
        orderId: order?.id,
        name: txName,
        partner:
          resolveCustomerDisplayName(
            (order as any)?.customerName || (order as any)?.customerId,
            customers,
          ) ||
          String((order as any)?.customerName || "").trim() ||
          "Müştəri",
        customerId: (() => {
          const raw = (order as any)?.customerId;
          if (raw != null && /^\d+$/.test(String(raw))) return Number(raw);
          const found = customers.find(
            (c) =>
              String(c.name || "").trim() ===
                String((order as any)?.customerName || "").trim() ||
              String(c.company || "").trim() ===
                String((order as any)?.customerName || "").trim(),
          );
          return found?.id != null ? Number(found.id) : null;
        })(),
        paymentMethod: "Sifariş",
        category: "ORDER_BOOK",
        tarifPrice: txRevTarif,
        tarifCurrency: txRevCurrency,
        tarifAzn: revAzn.toFixed(2),
        edvliTarifPrice: txRevTarif,
        edvliTarifCurrency: txRevCurrency,
        edvliTarifAzn: revAzn.toFixed(2),
        mesarifPrice: txExpMesarif !== "0.00" ? txExpMesarif : "",
        mesarifCurrency: txExpMesarif !== "0.00" ? txExpCurrency : "",
        mesarifAzn: txExpMesarif !== "0.00" ? expAzn.toFixed(2) : "",
        edvliMesarifPrice: txExpMesarif !== "0.00" ? txExpMesarif : "",
        edvliMesarifCurrency: txExpMesarif !== "0.00" ? txExpCurrency : "",
        edvliMesarifAzn: txExpMesarif !== "0.00" ? expAzn.toFixed(2) : "",
        profit: `${profitVal.toFixed(2)} AZN`,
        user: txUser,
        invoiceWritten: false,
        invoiceReceived: false,
        costDate: new Date().toLocaleDateString("az-AZ"),
      };
      axios
        .post(ENDPOINTS.FINANCE.BASE, newTx, {
          headers: { Authorization: "Bearer " + localStorage.getItem("token") },
        })
        .then((res) => {
          setFinanceTransactions([res.data, ...financeTransactions]);
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

  const [voyagesList, setVoyagesList] = useState<
    Array<{
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
    }>
  >([]);

  const [selectedVoyageForView, setSelectedVoyageForView] = useState<
    any | null
  >(null);
  const [isVoyageViewOpen, setIsVoyageViewOpen] = useState(false);
  const [selectedVoyageForEdit, setSelectedVoyageForEdit] = useState<
    any | null
  >(null);
  const [isVoyageEditOpen, setIsVoyageEditOpen] = useState(false);
  const [selectedVoyageForDelete, setSelectedVoyageForDelete] = useState<
    any | null
  >(null);
  const [isVoyageDeleteOpen, setIsVoyageDeleteOpen] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const openDeleteConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
  ) => {
    setDeleteConfirm({ title, message, onConfirm });
  };

  useEffect(() => {
    fetchUsersAction()
      .then(setUsers)
      .catch(() => setUsers([]));
    fetchCustomersAction()
      .then((data) => {
        const list = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.data)
            ? (data as any).data
            : Array.isArray((data as any)?.customers)
              ? (data as any).customers
              : [];
        setCustomers(list);
      })
      .catch(() => setCustomers([]));
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get(ENDPOINTS.ORDERS.BASE, {
          headers: { Authorization: "Bearer " + localStorage.getItem("token") },
        });
        const mapped = (res.data || []).map((o: any) => {
          const voyages = Array.isArray(o.voyages) ? o.voyages : [];
          const voyageCarriers = voyages
            .map((v: any) => String(v?.carrier || "").trim())
            .filter(
              (name: string) => name && name !== "—" && name !== "Daşıyıcı",
            );
          const carriersFromVoyages = Array.from(new Set(voyageCarriers)).join(
            ", ",
          );
          return {
            ...o,
            queryNumber: o.query?.number || "—",
            queryDate: o.query?.createdAt
              ? new Date(o.query.createdAt).toLocaleDateString("az-AZ")
              : "—",
            customer: o.customerName || o.query?.customer || "—",
            customerId: o.customerName || o.query?.customer || "",
            carriers: o.carriers || carriersFromVoyages || "",
          };
        });
        setOrders(mapped);
      } catch (e) {
        console.error("Order load error:", e);
      }
    };
    fetchOrders();
  }, []);

  const order = useMemo(() => {
    return (
      orders.find(
        (o) => String(o.id) === String(orderId) || o.orderNumber === orderId,
      ) || null
    );
  }, [orders, orderId]);

  const displayCustomerName = useMemo(() => {
    if (!order) return "—";
    if (customerNameOverride) return customerNameOverride;

    const candidates = [
      order.customer,
      (order as any).customerName,
      (order as any).customerId,
      (order as any).query?.customer,
    ];

    for (const candidate of candidates) {
      const resolved = resolveCustomerDisplayName(candidate, customers);
      if (resolved && !looksLikeNumericId(resolved)) return resolved;
    }

    for (const candidate of candidates) {
      const resolved = resolveCustomerDisplayName(candidate, customers);
      if (resolved) return resolved;
    }

    return "—";
  }, [order, customers, customerNameOverride]);

  const displayCarriers = useMemo(() => {
    const clean = (value: unknown) => {
      const text = String(value ?? "").trim();
      if (!text || text === "—" || text === "Daşıyıcı") return "";
      return text;
    };

    const fromField = clean(order?.carriers);
    if (fromField) return fromField;

    const voyageCarriers = [
      ...voyagesList.map((v) => clean(v.carrier)),
      ...(((order as any)?.voyages as any[]) || []).map((v) =>
        clean(v?.carrier),
      ),
    ].filter(Boolean);

    if (voyageCarriers.length > 0) {
      return Array.from(new Set(voyageCarriers)).join(", ");
    }

    const tagMatch = String(order?.tags || "").match(/Daşıyıcı:\s*(.+)/i);
    if (tagMatch?.[1]) return clean(tagMatch[1]) || "—";

    const offerItems = (() => {
      const query = (order as any)?.query;
      if (Array.isArray(query?.priceOfferItems)) return query.priceOfferItems;
      if (
        typeof query?.priceOffersJson === "string" &&
        query.priceOffersJson.trim()
      ) {
        try {
          const parsed = JSON.parse(query.priceOffersJson);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }
      return [];
    })();

    const offerCarriers = offerItems
      .map((o: any) => clean(o?.carrierName))
      .filter(Boolean);
    if (offerCarriers.length > 0) {
      return Array.from(new Set(offerCarriers)).join(", ");
    }

    return "—";
  }, [order, voyagesList]);

  const cargoTotals = useMemo(() => {
    const fromLoads = {
      weightKg: loadsList.reduce((s, l) => s + (Number(l.weightKg) || 0), 0),
      volumeM3: loadsList.reduce((s, l) => s + (Number(l.volumeM3) || 0), 0),
      ldm: loadsList.reduce((s, l) => s + (Number(l.ldm) || 0), 0),
    };

    if (fromLoads.volumeM3 > 0 || fromLoads.weightKg > 0 || fromLoads.ldm > 0) {
      return fromLoads;
    }

    return sumOrderCargoTotals({
      ...order,
      loads: (order as any)?.loads || loadsList,
    });
  }, [order, loadsList]);

  useEffect(() => {
    setCustomerNameOverride("");
    if (!order) return;

    const raw = String(
      order.customer ||
        (order as any).customerName ||
        (order as any).query?.customer ||
        "",
    ).trim();

    if (!looksLikeNumericId(raw)) return;
    if (resolveCustomerDisplayName(raw, customers) !== raw) return;

    let cancelled = false;
    fetchCustomerDetailAction(raw)
      .then((customer) => {
        if (cancelled || !customer) return;
        const name =
          customer.name ||
          customer.companyName ||
          customer.company ||
          customer.fullName ||
          "";
        if (name) setCustomerNameOverride(name);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [order, customers]);

  useEffect(() => {
    if (order) {
      const fetchAll = async () => {
        try {
          const headers = {
            Authorization: "Bearer " + localStorage.getItem("token"),
          };
          const [finRes, loadRes, voyRes, invRes] = await Promise.all([
            axios
              .get(ENDPOINTS.FINANCE.BASE + "?orderId=" + order.id, { headers })
              .catch(() => ({ data: [] })),
            axios
              .get(ENDPOINTS.LOADS.BASE + "?orderId=" + order.id, { headers })
              .catch(() => ({ data: [] })),
            axios
              .get(ENDPOINTS.VOYAGES.BASE + "?orderId=" + order.id, { headers })
              .catch(() => ({ data: [] })),
            axios
              .get(ENDPOINTS.INVOICES.BASE + "?orderId=" + order.id, {
                headers,
              })
              .catch(() => ({ data: [] })),
          ]);
          setFinanceTransactions(finRes.data || []);

          const mappedLoads = (loadRes.data || [])
            .filter((l: any) => String(l.orderId) === String(order.id))
            .map((l: any) => mapLoadRow(l, order));
          setLoadsList(mappedLoads);

          const mappedVoyages = (voyRes.data || [])
            .filter((v: any) => String(v.orderId) === String(order.id))
            .map((v: any) => {
              let rawPayload = v.rawPayload;
              if (
                !rawPayload &&
                typeof v.rawPayloadJson === "string" &&
                v.rawPayloadJson.trim()
              ) {
                try {
                  rawPayload = JSON.parse(v.rawPayloadJson);
                } catch {
                  rawPayload = undefined;
                }
              }
              return {
                ...v,
                number: v.id ? `R-${v.id}` : "—",
                loadPlace: v.loading || "—",
                unloadPlace: v.unloading || "—",
                status: v.tripStatus || "—",
                price: v.tripPrice || "—",
                valueAzn:
                  typeof v.valueAzn === "number" ? v.valueAzn : undefined,
                rawPayload,
                loads: v.cargoInfo || v.loads || "—",
                cargoInfo: v.cargoInfo || "",
              };
            });
          // Yüklər sütununu DB-dəki voyageId bağlantısından düzəlt
          const voyagesWithLoads = mappedVoyages.map((v: any) => {
            const linked = mappedLoads.filter(
              (l: any) =>
                l.voyageId != null && String(l.voyageId) === String(v.id),
            );
            if (linked.length === 0) return v;
            const label = linked
              .map((l: any) => l.number || l.name || `Y-${l.id}`)
              .join(", ");
            return { ...v, loads: label, cargoInfo: label };
          });
          setVoyagesList(voyagesWithLoads);

          setInvoicesList(
            (invRes.data || []).map((inv: any) => mapInvoiceFromApi(inv)),
          );

          // Borclanma yalnız hesab (irəli/alınmış) yaradılanda edilir — sifarişdə avtomatik xərc/borc yoxdur.
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
      localStorage.setItem(
        `logistic_finance_${order.id}`,
        JSON.stringify(newList),
      );
    }
  };

  const offerSalesTotal = useMemo(
    () =>
      resolveOfferSalesTotalSummary({
        order,
        voyages: voyagesList,
        financeTransactions,
      }),
    [order, voyagesList, financeTransactions],
  );

  /** Seçilib yaradılan Başlanğıc tarif / irəli hesab sətri — sidebar/banner üçün mənbə */
  const baslangicTarifDisplay = useMemo(() => {
    const tx =
      financeTransactions.find(
        (t) => String(t.name || "").trim() === "Başlanğıc tarif",
      ) ||
      financeTransactions.find((t) =>
        /^İrəli hesab #/i.test(String(t.name || "").trim()),
      );
    if (tx) {
      const price =
        Number.parseFloat(
          String(tx.tarifPrice || tx.edvliTarifPrice || "").replace(",", "."),
        ) || 0;
      const currency =
        String(tx.tarifCurrency || tx.edvliTarifCurrency || "AZN")
          .trim()
          .toUpperCase() || "AZN";
      const azn =
        Number.parseFloat(
          String(tx.tarifAzn || tx.edvliTarifAzn || "").replace(",", "."),
        ) ||
        resolveFinanceRevenueAzn(tx) ||
        0;

      if (price > 0) {
        if (currency === "AZN") {
          return `${price} AZN`;
        }
        const aznPart = azn > 0 ? ` (${azn.toFixed(2)} AZN)` : "";
        return `${price} ${currency}${aznPart}`;
      }
      if (azn > 0) return `${azn.toFixed(2)} AZN`;
    }

    if (offerSalesTotal?.labelSales && offerSalesTotal.labelSales !== "—") {
      return offerSalesTotal.labelSales;
    }
    return order?.freight || "—";
  }, [financeTransactions, offerSalesTotal, order]);

  const financeTotals = useMemo(() => {
    const isVoyageFinanceName = (name: unknown) =>
      /^Reys R-\d+$/i.test(String(name || "").trim());

    const rates: Record<string, number> = { AZN: 1 };
    const learnRate = (amount: number, currency: string, azn: number) => {
      const curr = (currency || "AZN").toUpperCase();
      if (curr === "AZN" || !(amount > 0) || !(azn > 0)) return;
      rates[curr] = azn / amount;
    };

    financeTransactions.forEach((t) => {
      const mPrice =
        Number.parseFloat(
          String(t.mesarifPrice || t.edvliMesarifPrice || "").replace(",", "."),
        ) || 0;
      const mAzn =
        Number.parseFloat(
          String(t.mesarifAzn || t.edvliMesarifAzn || "").replace(",", "."),
        ) || 0;
      learnRate(
        mPrice,
        String(t.mesarifCurrency || t.edvliMesarifCurrency || "AZN"),
        mAzn,
      );
      const tPrice =
        Number.parseFloat(
          String(t.tarifPrice || t.edvliTarifPrice || "").replace(",", "."),
        ) || 0;
      const tAzn =
        Number.parseFloat(
          String(t.tarifAzn || t.edvliTarifAzn || "").replace(",", "."),
        ) || 0;
      learnRate(
        tPrice,
        String(t.tarifCurrency || t.edvliTarifCurrency || "AZN"),
        tAzn,
      );
    });

    voyagesList.forEach((v) => {
      const text = String(v.price || v.tripPrice || "");
      const m = text.match(
        /^([0-9]+(?:[.,][0-9]+)?)\s*([A-Za-z]{3}).*?\(([0-9]+(?:[.,][0-9]+)?)\s*AZN/i,
      );
      if (m) {
        learnRate(
          Number.parseFloat(m[1].replace(",", ".")) || 0,
          m[2],
          Number.parseFloat(m[3].replace(",", ".")) || 0,
        );
      }
    });
    if (!rates.USD) rates.USD = 1.7;
    if (!rates.EUR) rates.EUR = 1.93;

    const toAznAmount = (amount: number, currency: string) => {
      const curr = (currency || "AZN").toUpperCase();
      if (!(amount > 0)) return 0;
      if (curr === "AZN") return amount;
      return amount * (rates[curr] || 1);
    };

    const resolveVoyageParts = (v: any) => {
      const text = String(v.price || v.tripPrice || "");
      const match = text.match(/^([0-9]+(?:[.,][0-9]+)?)\s*([A-Za-z]{3})/);
      const amount = match
        ? Number.parseFloat(match[1].replace(",", ".")) || 0
        : 0;
      const currency = match ? match[2].toUpperCase() : "AZN";
      let azn = resolveVoyageExpenseAzn(v);
      if (!(azn > 0) && amount > 0) {
        azn = toAznAmount(amount, currency);
      }
      return { amount, currency, azn };
    };

    let financeRevAzn = 0;
    let otherFinanceExpAzn = 0;

    financeTransactions.forEach((t) => {
      financeRevAzn += resolveFinanceRevenueAzn(t);

      const name = String(t.name || "").trim();
      if (isVoyageFinanceName(name)) return;
      if (name === "Başlanğıc tarif") return;

      otherFinanceExpAzn += resolveFinanceExpenseAzn(t);
    });

    let voyageExpAzn = 0;
    voyagesList.forEach((v) => {
      voyageExpAzn += resolveVoyageParts(v).azn;
    });

    let totalRevAzn = financeRevAzn;
    let totalExpAzn = voyageExpAzn + otherFinanceExpAzn;

    if (totalExpAzn <= 0) {
      totalExpAzn += resolveOfferExpenseFallbackAzn({
        order,
        voyages: voyagesList,
        financeTransactions,
      });
      if (totalExpAzn <= 0 && offerSalesTotal && offerSalesTotal.totalAzn > 0) {
        totalExpAzn = offerSalesTotal.totalAzn;
      }
    }

    if (financeRevAzn <= 0 && offerSalesTotal && offerSalesTotal.salesAzn > 0) {
      totalRevAzn = offerSalesTotal.salesAzn;
    }

    return {
      totalRevAzn,
      totalExpAzn,
      profitAzn: totalRevAzn - totalExpAzn,
      voyageExpAzn,
      otherFinanceExpAzn,
      resolveVoyageParts,
      toAznAmount,
      hasFinanceRevenue: financeRevAzn > 0,
      hasFinanceExpense: totalExpAzn > 0,
    };
  }, [financeTransactions, voyagesList, order, offerSalesTotal]);

  const financeExpenseLabel = useMemo(() => {
    const byCurrency: Record<string, { amount: number; azn: number }> = {};

    const addPart = (amount: number, currency: string, azn: number) => {
      if (!(azn > 0) && !(amount > 0)) return;
      const curr = (currency || "AZN").toUpperCase();
      if (!byCurrency[curr]) byCurrency[curr] = { amount: 0, azn: 0 };
      byCurrency[curr].amount += amount > 0 ? amount : azn;
      byCurrency[curr].azn += azn > 0 ? azn : amount;
    };

    voyagesList.forEach((v) => {
      const parts = financeTotals.resolveVoyageParts(v);
      if (parts.azn > 0 || parts.amount > 0) {
        addPart(parts.amount, parts.currency, parts.azn);
      }
    });

    financeTransactions.forEach((t) => {
      const name = String(t.name || "").trim();
      if (/^Reys R-\d+$/i.test(name)) return;
      if (name === "Başlanğıc tarif") return;
      const azn = resolveFinanceExpenseAzn(t);
      if (!(azn > 0)) return;
      const amount =
        Number.parseFloat(
          String(t.mesarifPrice || t.edvliMesarifPrice || "").replace(",", "."),
        ) || azn;
      const curr = String(
        t.mesarifCurrency || t.edvliMesarifCurrency || "AZN",
      ).toUpperCase();
      addPart(amount, curr, azn);
    });

    const parts = Object.entries(byCurrency).map(([curr, g]) => {
      if (curr === "AZN") return `${g.amount.toFixed(2)} AZN`;
      return `${g.amount.toFixed(2)} ${curr} (${g.azn.toFixed(2)} AZN)`;
    });

    if (parts.length > 0) return parts.join(" + ");

    if (offerSalesTotal?.labelTotal && offerSalesTotal.labelTotal !== "—") {
      return offerSalesTotal.labelTotal;
    }
    return `${financeTotals.totalExpAzn.toFixed(2)} AZN`;
  }, [financeTotals, financeTransactions, voyagesList, offerSalesTotal]);

  // Removed previous unused useEffects

  // Removed previous unused useEffects

  // Tab State
  type SifarisTabId =
    | "loads"
    | "voyages"
    | "finance"
    | "documents"
    | "invoices"
    | "comments";
  const [activeTab, setActiveTab] = useState<SifarisTabId>("loads");
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Invoice Sub-tab and list states
  const [invoicesSubTab, setInvoicesSubTab] = useState<
    "ireli" | "ilkin" | "alinmis"
  >("ireli");
  const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState(false);
  const [invoicesList, setInvoicesList] = useState<
    Array<{
      id: string;
      number: string;
      date: string;
      payer?: string;
      amount: string;
      status: string;
      type: "ireli" | "ilkin" | "alinmis";
      documents?: InvoiceDocumentItem[];
      [key: string]: any;
    }>
  >([]);

  const [invoiceDocsViewId, setInvoiceDocsViewId] = useState<string | null>(
    null,
  );
  const [invoiceUploadTargetId, setInvoiceUploadTargetId] = useState<
    string | null
  >(null);
  const invoiceFileInputRef = useRef<HTMLInputElement>(null);

  const handleInvoiceDocUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    const targetId = invoiceUploadTargetId;
    if (!files || files.length === 0 || !targetId) {
      e.target.value = "";
      return;
    }
    const headers = {
      Authorization: "Bearer " + localStorage.getItem("token"),
    };
    try {
      const uploaded: InvoiceDocumentItem[] = [];
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        const up = await axios.post(ENDPOINTS.INVOICES.UPLOAD, formData, {
          headers: { Authorization: headers.Authorization },
        });
        uploaded.push({
          id: String(Date.now() + Math.random()),
          name: up.data?.fileName || file.name,
          size: formatInvoiceDocSize(up.data?.fileSize || file.size),
          url: up.data?.fileUrl || "",
          createdAt: new Date().toLocaleDateString("az-AZ"),
        });
      }

      const current = invoicesList.find((i) => String(i.id) === String(targetId));
      const nextDocs = [...(current?.documents || []), ...uploaded];
      const idNum = Number(targetId);
      if (Number.isFinite(idNum) && idNum > 0) {
        await axios.put(
          ENDPOINTS.INVOICES.BY_ID(idNum),
          { documents: nextDocs },
          { headers },
        );
      }

      setInvoicesList((prev) =>
        prev.map((inv) =>
          String(inv.id) === String(targetId)
            ? { ...inv, documents: nextDocs }
            : inv,
        ),
      );
      dispatch(
        showNotification({
          message: "Sənəd yükləndi.",
          type: "success",
          autoCloseDuration: 2200,
        }),
      );
    } catch (err: any) {
      console.error(err);
      dispatch(
        showNotification({
          message:
            err?.response?.data?.error ||
            err?.message ||
            "Sənəd yüklənərkən xəta baş verdi.",
          type: "error",
          autoCloseDuration: 3500,
        }),
      );
    } finally {
      setInvoiceUploadTargetId(null);
      e.target.value = "";
    }
  };

  const openInvoiceDocUpload = (invoiceId: string) => {
    setInvoiceUploadTargetId(invoiceId);
    requestAnimationFrame(() => invoiceFileInputRef.current?.click());
  };

  // New Invoice form states
  const [invoiceCarrier, setInvoiceCarrier] = useState("");
  const [invoiceVoyageNumber, setInvoiceVoyageNumber] = useState("");
  const [invoiceContract, setInvoiceContract] = useState("");
  const [invoiceCreator, setInvoiceCreator] = useState("");
  const [invoiceLang] = useState("Azərbaycan");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [invoiceDelayDays, setInvoiceDelayDays] = useState("0");
  const [invoicePayUntilDate, setInvoicePayUntilDate] = useState("");
  const [invoiceFreightPrice, setInvoiceFreightPrice] = useState("");
  /** Modal açılarkən / təklifdən gələn ilkin qiymət — yalnız uyarı üçün */
  const [invoiceExpectedPrice, setInvoiceExpectedPrice] = useState<number | null>(
    null,
  );
  const [invoiceCurrency, setInvoiceCurrency] = useState("EUR");
  const [invoiceRateDate, setInvoiceRateDate] = useState("");
  /** Alınmış hesab modalı — saxlamazdan əvvəl əlavə olunan sənədlər */
  const [invoicePendingDocs, setInvoicePendingDocs] = useState<
    InvoiceDocumentItem[]
  >([]);
  const invoicePendingFileRef = useRef<HTMLInputElement>(null);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [invoiceCarriersList, setInvoiceCarriersList] = useState<
    Array<{
      id: string;
      name: string;
      documents: ReturnType<typeof parseCarrierDocuments>;
    }>
  >([]);

  const [invoiceRows, setInvoiceRows] = useState<
    Array<{
      id: string;
      text: string;
      unit: string;
      qty: number;
      price: number;
      vatRate: string;
    }>
  >([
    {
      id: "1",
      text: "",
      unit: "Marşrut",
      qty: 1,
      price: 0,
      vatRate: "0%",
    },
  ]);

  // Daşıma qiyməti = sətirlərin (miqdar × qiymət) cəmi
  useEffect(() => {
    const total = invoiceRows.reduce((sum, row) => {
      const qty = Number(row.qty) || 0;
      const price = Number(row.price) || 0;
      return sum + qty * price;
    }, 0);
    const next =
      Math.abs(total) < 0.0000001
        ? "0"
        : String(Number(total.toFixed(4)));
    setInvoiceFreightPrice((prev) => {
      const prevNum =
        Number.parseFloat(String(prev || "").replace(",", ".")) || 0;
      if (Math.abs(prevNum - total) < 0.0001 && String(prev ?? "") !== "") {
        return prev;
      }
      return next;
    });
  }, [invoiceRows]);

  const orderPriceOffers = useMemo(() => {
    const query = (order as any)?.query;
    if (!query) return [] as any[];
    if (
      Array.isArray(query.priceOfferItems) &&
      query.priceOfferItems.length > 0
    ) {
      return query.priceOfferItems;
    }
    if (
      typeof query.priceOffersJson === "string" &&
      query.priceOffersJson.trim()
    ) {
      try {
        const parsed = JSON.parse(query.priceOffersJson);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }, [order]);

  const orderCarrierNames = useMemo(() => {
    const names = new Set<string>();
    for (const v of voyagesList) {
      const c = String(v?.carrier || "").trim();
      if (c && c !== "—" && c.toLowerCase() !== "daşıyıcı") names.add(c);
    }
    const tagMatch = String(order?.tags || "").match(/Daşıyıcı:\s*(.+)/i);
    if (tagMatch?.[1]?.trim()) names.add(tagMatch[1].trim());
    const carriersField = String(order?.carriers || "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s && s !== "—");
    for (const c of carriersField) names.add(c);
    return Array.from(names);
  }, [voyagesList, order]);

  const invoiceVoyagesForCarrier = useMemo(() => {
    const carrier = String(invoiceCarrier || "")
      .trim()
      .toLowerCase();
    if (!carrier) return voyagesList;
    return voyagesList.filter(
      (v) =>
        String(v?.carrier || "")
          .trim()
          .toLowerCase() === carrier,
    );
  }, [voyagesList, invoiceCarrier]);

  const resolveInvoiceVoyageNumber = (carrierName?: string) => {
    const clean = (v: unknown) => {
      const t = String(v ?? "").trim();
      return !t || t === "—" ? "" : t;
    };
    const byCarrier = carrierName
      ? voyagesList.find(
          (v) =>
            clean(v.carrier).toLowerCase() === carrierName.trim().toLowerCase(),
        )
      : null;
    const voyage = byCarrier || voyagesList[0];
    if (!voyage) return "";
    return (
      clean(voyage.number) ||
      clean(formatVoyageLabel(voyage)) ||
      (voyage.id ? `R-${voyage.id}` : "")
    );
  };

  const applyCarrierOfferPricing = (carrierName: string) => {
    if (!carrierName) {
      setInvoiceFreightPrice("");
      setInvoiceExpectedPrice(null);
      return;
    }
    const offer = orderPriceOffers.find(
      (o: any) =>
        String(o?.carrierName || "")
          .trim()
          .toLowerCase() === carrierName.trim().toLowerCase(),
    );
    // Təklifdəki xərcsiz alış qiyməti (price) + valyuta
    const raw = String(offer?.price ?? "")
      .replace(",", ".")
      .trim();
    const num = Number.parseFloat(raw);
    const price = Number.isFinite(num) ? num : 0;
    const currency =
      String(offer?.currency || resolveOrderCurrency()).trim() || "EUR";
    setInvoiceFreightPrice(price > 0 ? String(price) : raw || "");
    setInvoiceExpectedPrice(price > 0 ? price : null);
    setInvoiceCurrency(currency);
    setInvoiceRows((rows) =>
      rows.map((r, idx) => (idx === 0 ? { ...r, price } : r)),
    );
  };

  const resolveOrderCurrency = () => {
    const pick = (value: unknown) => {
      const text = String(value ?? "")
        .trim()
        .toUpperCase();
      if (["AZN", "USD", "EUR", "TRY"].includes(text)) return text;
      return "";
    };

    for (const offer of orderPriceOffers) {
      const sales = Number.parseFloat(
        String(offer?.salesPrice ?? "").replace(",", "."),
      );
      if (Number.isFinite(sales) && sales > 0) {
        const curr = pick(offer?.currency) || pick(offer?.totalCurrency);
        if (curr) return curr;
      }
    }
    for (const offer of orderPriceOffers) {
      const curr = pick(offer?.currency) || pick(offer?.totalCurrency);
      if (curr) return curr;
    }

    for (const tx of financeTransactions) {
      if (resolveFinanceRevenueAzn(tx) > 0) {
        const curr = pick(tx.tarifCurrency) || pick(tx.edvliTarifCurrency);
        if (curr) return curr;
      }
    }
    for (const tx of financeTransactions) {
      const curr = pick(tx.tarifCurrency) || pick(tx.edvliTarifCurrency);
      if (curr) return curr;
    }

    const fromFreight = String(
      (order as any)?.freight || offerSalesTotal?.labelSales || "",
    ).match(/\b(AZN|USD|EUR|TRY)\b/i);
    if (fromFreight?.[1]) return fromFreight[1].toUpperCase();

    const fromVoyage = String(voyagesList[0]?.price || "").match(
      /\b(AZN|USD|EUR|TRY)\b/i,
    );
    if (fromVoyage?.[1]) return fromVoyage[1].toUpperCase();

    return "EUR";
  };

  const buildInvoiceFreightText = () => {
    const query = (order as any)?.query || {};
    const firstLoad = loadsList[0];
    const raw = firstLoad?.rawPayload || {};
    const firstLp =
      (Array.isArray(raw.loadingPlaces) && raw.loadingPlaces[0]) ||
      raw.loadingPlace ||
      null;
    const firstUp =
      (Array.isArray(raw.unloadingPlaces) && raw.unloadingPlaces[0]) ||
      raw.unloadingPlace ||
      null;

    const incoterm =
      String((order as any)?.incoterms || query.incoterms || "EXW").trim() ||
      "EXW";

    const loadCity =
      String(query.loadCity || "").trim() ||
      String((order as any)?.loadCity || "").trim() ||
      String(firstLp?.city || "").trim() ||
      parseCompositePlace(firstLoad?.loadPlace).city ||
      parseCompositePlace(query.loadPlace || query.loadAddress).city ||
      "";

    const unloadCity =
      String(query.unloadCity || "").trim() ||
      String((order as any)?.unloadCity || "").trim() ||
      String(firstUp?.city || "").trim() ||
      parseCompositePlace(firstLoad?.unloadPlace).city ||
      parseCompositePlace(query.unloadPlace || query.unloadAddress).city ||
      "";

    const placeCompany = (value: unknown) => {
      const text = String(value ?? "").trim();
      if (!text || text === "—" || text === "Dəyəri seçin") return "";
      return text;
    };

    const sender =
      placeCompany(firstLp?.company) ||
      placeCompany(query.loadPlaceCompany) ||
      parseCompositePlace(firstLoad?.loadPlace).company ||
      parseCompositePlace(query.loadPlace || query.loadAddress).company ||
      "";

    const consignee =
      placeCompany(firstUp?.company) ||
      placeCompany(query.unloadPlaceCompany) ||
      parseCompositePlace(firstLoad?.unloadPlace).company ||
      parseCompositePlace(query.unloadPlace || query.unloadAddress).company ||
      "";

    const truckNumber =
      placeCompany(firstLoad?.containerNumber) ||
      placeCompany(raw.containerNumber) ||
      "";

    return `Freight Charges ${incoterm} ${loadCity}, up to FOA ${unloadCity}\n\nSender: ${sender}\nConsinger: ${consignee}\nTrace number: ${truckNumber}`;
  };

  // Sync «Tarixinə kimi ödə» = Hesab yazılıb + təxirə salma günləri
  useEffect(() => {
    if (!invoiceDate) return;
    const days = Number.parseInt(String(invoiceDelayDays), 10);
    const addDays = Number.isFinite(days) ? days : 0;

    const parseInvoiceDate = (raw: string): Date | null => {
      const text = String(raw || "").trim();
      if (!text) return null;

      // dd.mm.yyyy or dd/mm/yyyy
      const dmy = text.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
      if (dmy) {
        const d = new Date(
          Number(dmy[3]),
          Number(dmy[2]) - 1,
          Number(dmy[1]),
        );
        return Number.isNaN(d.getTime()) ? null : d;
      }

      // yyyy-mm-dd (HTML date / ISO date part)
      const ymd = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (ymd) {
        const d = new Date(
          Number(ymd[1]),
          Number(ymd[2]) - 1,
          Number(ymd[3]),
        );
        return Number.isNaN(d.getTime()) ? null : d;
      }

      const d = new Date(text);
      return Number.isNaN(d.getTime()) ? null : d;
    };

    const base = parseInvoiceDate(invoiceDate);
    if (!base) return;

    const result = new Date(base);
    result.setDate(result.getDate() + addDays);

    const pad = (n: number) => n.toString().padStart(2, "0");
    // Keep same style as source when ISO, otherwise AZ dd.mm.yyyy
    const useIso = /^\d{4}-\d{2}-\d{2}/.test(String(invoiceDate).trim());
    const next = useIso
      ? `${result.getFullYear()}-${pad(result.getMonth() + 1)}-${pad(result.getDate())}`
      : `${pad(result.getDate())}.${pad(result.getMonth() + 1)}.${result.getFullYear()}`;

    setInvoicePayUntilDate((prev) => (prev === next ? prev : next));
  }, [invoiceDate, invoiceDelayDays]);

  // Dynamic comments
  const [comments, setComments] = useState<
    Array<{ id: string; text: string; userName: string; createdAt: string }>
  >([]);
  const [commentInput, setCommentInput] = useState("");

  // Combined Comments & Tasks States
  const [isNewCommentModalOpen, setIsNewCommentModalOpen] = useState(false);
  const [commentCategory, setCommentCategory] = useState("Sifariş");
  const [commentProvideAccessCustomer, setCommentProvideAccessCustomer] =
    useState(false);
  const [commentProvideAccessCarrier, setCommentProvideAccessCarrier] =
    useState(false);
  const [commentText, setCommentText] = useState("");

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState<any | null>(
    null,
  );
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskChecklist, setTaskChecklist] = useState<string[]>([]);
  const [taskAuthor, setTaskAuthor] = useState("");
  const [taskExecutor, setTaskExecutor] = useState("");
  const [taskIsRecurring, setTaskIsRecurring] = useState(false);
  const [taskCreatedDate, setTaskCreatedDate] = useState("");
  const [taskCreatedTime, setTaskCreatedTime] = useState("");
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
  const [contractType, setContractType] = useState<"template" | "file">(
    "template",
  );
  const [contractVoyage, setContractVoyage] = useState("");
  const [contractLoad, setContractLoad] = useState("Dəyəri seçin");
  const [contractTemplate, setContractTemplate] = useState("Dəyəri seçin");
  const [contractDocNumber, setContractDocNumber] = useState("");
  const [contractDocDate, setContractDocDate] = useState("");
  const [contractDocName, setContractDocName] = useState("");
  const [contractHasValidity, setContractHasValidity] = useState(false);
  const [contractProvideAccessCustomer, setContractProvideAccessCustomer] =
    useState(false);
  const [contractProvideAccessCarrier, setContractProvideAccessCarrier] =
    useState(false);
  const [contractSendNotif, setContractSendNotif] = useState(false);
  const [contractComments, setContractComments] = useState("");

  const [tasksList, setTasksList] = useState<
    Array<{
      id: string;
      title: string;
      description: string;
      checklist: string[];
      completed: boolean;
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
    }>
  >([]);

  const handleSaveNewComment = () => {
    if (!commentText.trim()) {
      dispatch(
        showNotification({
          message: "Lütfən şərhi daxil edin!",
          type: "error",
          autoCloseDuration: 3500,
        }),
      );
      return;
    }
    const newComment = {
      id: String(Date.now()),
      text: commentText.trim(),
      userName: String(user?.name || "").trim() || "İstifadəçi",
      createdAt: new Date()
        .toLocaleString("az-AZ", { hour12: false })
        .replace(/\//g, "."),
    };
    setComments([newComment, ...comments]);
    setIsNewCommentModalOpen(false);
    setCommentText("");
  };

  const handleSaveTask = () => {
    if (!taskTitle.trim()) {
      dispatch(
        showNotification({
          message: "Lütfən tapşırığın adını daxil edin!",
          type: "error",
          autoCloseDuration: 3500,
        }),
      );
      return;
    }
    if (selectedTaskForEdit) {
      const updated = tasksList.map((t) =>
        t.id === selectedTaskForEdit.id
          ? {
              ...t,
              title: taskTitle,
              description: taskDescription,
              checklist: taskChecklist,
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
              remindTime: taskRemindTime,
            }
          : t,
      );
      setTasksList(updated);
    } else {
      const newTask = {
        id: String(Date.now()),
        title: taskTitle,
        description: taskDescription,
        checklist: taskChecklist,
        completed: false,
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
        remindTime: taskRemindTime,
      };
      setTasksList([...tasksList, newTask]);
    }
    setIsTaskModalOpen(false);
  };

  const handleDeleteTask = (id: string) => {
    openDeleteConfirm(
      "Tapşırığı sil",
      "Bu tapşırığı silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz.",
      () => {
        setTasksList(tasksList.filter((t) => t.id !== id));
        setIsTaskModalOpen(false);
        setSelectedTaskForEdit(null);
      },
    );
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    const newComment = {
      id: String(Date.now()),
      text: commentInput.trim(),
      userName: String(user?.name || "").trim() || "İstifadəçi",
      createdAt: new Date()
        .toLocaleString("az-AZ", { hour12: false })
        .replace(/\//g, "."),
    };
    setComments([newComment, ...comments]);
    setCommentInput("");
  };

  const orderDocumentsCount = useMemo(() => {
    const fromOrder = (order as any)?.orderDocuments;
    if (Array.isArray(fromOrder)) return fromOrder.length;
    return 0;
  }, [order]);

  // Dynamic status change
  const [currentStatus, setCurrentStatus] = useState<string>("planned");
  const [currentStatusLabel, setCurrentStatusLabel] =
    useState<string>("Planlaşdırılır");

  useEffect(() => {
    if (order) {
      setCurrentStatus(order.statusKind);
      setCurrentStatusLabel(order.statusLabel);
    }
  }, [order]);

  const handleStatusChange = async (nextStatus: OrderStatusKind) => {
    if (!order?.id) return;

    let label = "Planlaşdırılıb";
    if (nextStatus === "progress") label = "Davam edir";
    else if (nextStatus === "completed") label = "Tamamlandı";
    else if (nextStatus === "finance_closed")
      label = "Maliyyə cəhətdən bağlandı";
    else if (nextStatus === "cancelled") label = "Sifariş ləğv edildi";

    try {
      const res = await axios.put(
        ENDPOINTS.ORDERS.BY_ID(order.id),
        { statusKind: nextStatus, statusLabel: label },
        {
          headers: {
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
        },
      );
      const saved = res.data || {};
      setCurrentStatus(saved.statusKind || nextStatus);
      setCurrentStatusLabel(saved.statusLabel || label);
      setOrders((prev) =>
        prev.map((o) => {
          if (String(o.id) !== String(order.id)) return o;
          return {
            ...o,
            statusKind: saved.statusKind || nextStatus,
            statusLabel: saved.statusLabel || label,
            statusHistory: saved.statusHistory || o.statusHistory || [],
          };
        }),
      );
      dispatch(
        showNotification({
          message: "Sifarişin statusu yeniləndi.",
          type: "success",
          autoCloseDuration: 2500,
        }),
      );
    } catch (err) {
      console.error(err);
      // Offline / API fail fallback — still record local history with real user
      const by = String(user?.name || "").trim() || "Naməlum";
      const nextHistory = [
        ...(order?.statusHistory || []),
        {
          status: label,
          date: new Date().toISOString(),
          changedBy: by,
        },
      ];
      setCurrentStatus(nextStatus);
      setCurrentStatusLabel(label);
      setOrders((prev) =>
        prev.map((o) =>
          String(o.id) === String(order.id)
            ? {
                ...o,
                statusKind: nextStatus,
                statusLabel: label,
                statusHistory: nextHistory,
              }
            : o,
        ),
      );
      dispatch(
        showNotification({
          message: "Status yenilənərkən xəta baş verdi.",
          type: "error",
          autoCloseDuration: 3500,
        }),
      );
    }
  };

  const handleSaveEdit = async (updatedOrder: SifarisOrderRow) => {
    if (!updatedOrder?.id) return;

    const parseMaybeDate = (value: unknown) => {
      if (value == null || value === "") return null;
      if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value.toISOString();
      }
      const text = String(value).trim();
      if (!text) return null;
      // dd.mm.yyyy or dd/mm/yyyy
      const m = text.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
      if (m) {
        const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
        return Number.isNaN(d.getTime()) ? null : d.toISOString();
      }
      const d = new Date(text);
      return Number.isNaN(d.getTime()) ? null : d.toISOString();
    };

    const payload: Record<string, unknown> = {
      orderNumber: updatedOrder.orderNumber,
      orderDate: parseMaybeDate(updatedOrder.orderDate),
      customerOrderRef: updatedOrder.customerOrderRef || null,
      tags: updatedOrder.tags || null,
      customerName:
        (updatedOrder as any).customerName ||
        updatedOrder.customer ||
        null,
      contractNumber: updatedOrder.contractNumber || null,
      contactPerson: updatedOrder.contactPerson || null,
      manager: updatedOrder.manager || null,
      expeditor: updatedOrder.expeditor || null,
      extraManagers: updatedOrder.extraManagers || null,
      company: updatedOrder.company || null,
      extraInfo: updatedOrder.extraInfo || null,
      serviceName: updatedOrder.serviceName || null,
      freight: updatedOrder.freight || null,
      freightWithVat: updatedOrder.freightWithVat || null,
      vatRate: updatedOrder.vatRate || null,
      currency: updatedOrder.currency || null,
      exchangeRateDate: parseMaybeDate(updatedOrder.exchangeRateDate),
      paymentTerms: updatedOrder.paymentTerms || null,
      paymentDelayDays: updatedOrder.paymentDelayDays || null,
      incoterms: updatedOrder.incoterms || null,
    };

    setIsOrderSaving(true);
    try {
      const res = await axios.put(
        ENDPOINTS.ORDERS.BY_ID(updatedOrder.id),
        payload,
        {
          headers: {
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
        },
      );
      const saved = res.data || {};
      const merged: SifarisOrderRow = {
        ...updatedOrder,
        ...saved,
        customer:
          saved.customerName ||
          updatedOrder.customer ||
          (updatedOrder as any).customerName ||
          "",
        queryNumber:
          updatedOrder.queryNumber ||
          (saved as any).query?.number ||
          "—",
        queryDate: updatedOrder.queryDate || "—",
      };
      setOrders((prev) =>
        prev.map((o) => (String(o.id) === String(merged.id) ? merged : o)),
      );
      setIsEditModalOpen(false);
      dispatch(
        showNotification({
          message: "Sifariş yeniləndi",
          type: "success",
          autoCloseDuration: 3000,
        }),
      );
    } catch (err) {
      console.error(err);
      dispatch(
        showNotification({
          message: "Sifariş yenilənərkən xəta baş verdi",
          type: "error",
          autoCloseDuration: 4000,
        }),
      );
    } finally {
      setIsOrderSaving(false);
    }
  };

  const handleYukAdd = (payload: any) => {
    if (!order?.id) return;
    const newLoad = buildLoadApiPayload(payload, order.id);
    axios
      .post(ENDPOINTS.LOADS.BASE, newLoad, {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      })
      .then((res) => {
        setLoadsList([...loadsList, mapLoadRow(res.data, order)]);
        setIsYukModalOpen(false);
      })
      .catch(console.error);
  };

  const handleYukEdit = (payload: any) => {
    if (!selectedLoadForEdit) return;
    const updateData = buildLoadApiPayload(
      payload,
      order?.id || selectedLoadForEdit.orderId,
    );
    axios
      .put(ENDPOINTS.LOADS.BASE + "/" + selectedLoadForEdit.id, updateData, {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      })
      .then((res) => {
        setLoadsList(
          loadsList.map((load) =>
            load.id === selectedLoadForEdit.id
              ? mapLoadRow(res.data, order)
              : load,
          ),
        );
        setIsYukEditModalOpen(false);
        setSelectedLoadForEdit(null);
      })
      .catch(console.error);
  };

  const handleVoyageAddOrEdit = async (payload: any) => {
    const authHeaders = {
      Authorization: "Bearer " + localStorage.getItem("token"),
    };
    const selectedIds: string[] = Array.isArray(payload.selectedLoadIds)
      ? payload.selectedLoadIds.map((id: any) => String(id))
      : [];

    const syncLoadVoyageLinks = async (voyageId: string | number) => {
      const voyageIdNum = Number(voyageId);
      if (!Number.isFinite(voyageIdNum) || voyageIdNum <= 0) return;

      const updates = loadsList.map(async (load) => {
        const loadId = String(load.id);
        const shouldLink = selectedIds.includes(loadId);
        const currentVoyageId =
          load.voyageId != null && String(load.voyageId).trim() !== ""
            ? String(load.voyageId)
            : "";
        const linkedToThis = currentVoyageId === String(voyageId);

        if (shouldLink && !linkedToThis) {
          const res = await axios.put(
            ENDPOINTS.LOADS.BASE + "/" + load.id,
            { voyageId: voyageIdNum },
            { headers: authHeaders },
          );
          return mapLoadRow(res.data, order);
        }
        if (!shouldLink && linkedToThis) {
          const res = await axios.put(
            ENDPOINTS.LOADS.BASE + "/" + load.id,
            { voyageId: null },
            { headers: authHeaders },
          );
          return mapLoadRow(res.data, order);
        }
        return load;
      });

      try {
        const nextLoads = await Promise.all(updates);
        setLoadsList(nextLoads);
        // Reys cədvəlindəki Yüklər sütununu bağlı yüklərdən yenilə
        setVoyagesList((prev) =>
          prev.map((v) => {
            if (String(v.id) !== String(voyageId)) return v;
            const linked = nextLoads.filter(
              (l) =>
                l.voyageId != null && String(l.voyageId) === String(voyageId),
            );
            const label =
              linked.length > 0
                ? linked
                    .map((l) => l.number || l.name || `Y-${l.id}`)
                    .join(", ")
                : "—";
            return { ...v, loads: label, cargoInfo: label };
          }),
        );
      } catch (err) {
        console.error(err);
        dispatch(
          showNotification({
            message: "Yüklər reysə bağlanarkən xəta baş verdi",
            type: "error",
            autoCloseDuration: 3500,
          }),
        );
        throw err;
      }
    };

    /** Reys qiyməti artıq daşıyıcı borcu yaratmır — borc yalnız alınmış hesabda yaranır */
    const syncVoyageFinanceExpense = async (_opts: {
      voyageId: string | number;
      carrier: string;
      priceNum: number;
      currency: string;
      priceAzn: number;
    }) => {
      return;
    };

    const priceNum =
      Number.parseFloat(
        String(payload.rawPayload?.price ?? "").replace(",", "."),
      ) ||
      Number.parseFloat(
        String(payload.price || "")
          .match(/^([0-9]+(?:[.,][0-9]+)?)/)?.[1]
          ?.replace(",", ".") || "0",
      ) ||
      0;
    const priceCurrency =
      String(payload.rawPayload?.currency || "AZN")
        .trim()
        .toUpperCase() || "AZN";
    const priceAzn =
      Number.parseFloat(String(payload.priceAzn || "").replace(",", ".")) || 0;

    const mapVoyageRow = (raw: any, extras: Record<string, any> = {}) => ({
      ...raw,
      number: raw?.id ? `R-${raw.id}` : extras.number || "—",
      loadPlace: raw?.loading || extras.loadPlace || "—",
      unloadPlace: raw?.unloading || extras.unloadPlace || "—",
      status: raw?.tripStatus || extras.status || "—",
      price: extras.price || raw?.tripPrice || "—",
      tripPrice: extras.price || raw?.tripPrice || "",
      valueAzn:
        extras.valueAzn ??
        (typeof raw?.valueAzn === "number" ? raw.valueAzn : undefined),
      expeditor: extras.expeditor ?? raw?.expeditor,
      rawPayload: extras.rawPayload ?? raw?.rawPayload,
      loads:
        extras.loads ||
        raw?.cargoInfo ||
        raw?.loads ||
        "—",
      cargoInfo: extras.loads || raw?.cargoInfo || raw?.loads || "",
    });

    if (selectedVoyageForEdit) {
      const voyageId = selectedVoyageForEdit.id;
      const updateData = {
        tripStatus: payload.status || "Planlaşdırılıb",
        carrier: payload.carrier || "",
        tripPrice: payload.price,
        valueAzn: priceAzn > 0 ? priceAzn : undefined,
        sender: payload.sender,
        loading: payload.loadPlace,
        receiver: payload.receiver,
        unloading: payload.unloadPlace,
        tags: payload.tags,
        cargoInfo: payload.loads || "",
        tripRef: voyageId ? `R-${voyageId}` : undefined,
      };
      try {
        const res = await axios.put(
          ENDPOINTS.VOYAGES.BASE + "/" + voyageId,
          updateData,
          { headers: authHeaders },
        );
        const saved = mapVoyageRow(res.data, {
          price: payload.price,
          valueAzn: priceAzn > 0 ? priceAzn : undefined,
          rawPayload: payload.rawPayload || selectedVoyageForEdit.rawPayload,
          expeditor: payload.expeditor,
          loads: payload.loads || "",
        });
        setVoyagesList((prev) =>
          prev.map((v) =>
            String(v.id) === String(voyageId) ? { ...v, ...saved } : v,
          ),
        );
        await syncLoadVoyageLinks(voyageId);
        await syncVoyageFinanceExpense({
          voyageId,
          carrier: payload.carrier || "",
          priceNum,
          currency: priceCurrency,
          priceAzn,
        });
        setIsVoyageEditOpen(false);
        setSelectedVoyageForEdit(null);
      } catch (e) {
        console.error(e);
        dispatch(
          showNotification({
            message: "Reys yenilənərkən xəta baş verdi",
            type: "error",
            autoCloseDuration: 3500,
          }),
        );
      }
    } else {
      const newVoyage = {
        orderId: Number(order?.id),
        tripStatus: payload.status || "Planlaşdırılıb",
        customer: order?.customer || "",
        carrier: payload.carrier || "",
        tripPrice: payload.price,
        valueAzn: priceAzn > 0 ? priceAzn : undefined,
        sender: payload.sender,
        loading: payload.loadPlace,
        receiver: payload.receiver,
        unloading: payload.unloadPlace,
        tags: payload.tags,
        cargoInfo: payload.loads || "",
      };
      try {
        const res = await axios.post(ENDPOINTS.VOYAGES.BASE, newVoyage, {
          headers: authHeaders,
        });
        const newId = res.data?.id;
        const tripRef = newId ? `R-${newId}` : "";
        let savedVoyage = res.data;
        if (tripRef && newId) {
          try {
            const updated = await axios.put(
              ENDPOINTS.VOYAGES.BASE + "/" + newId,
              { tripRef },
              { headers: authHeaders },
            );
            savedVoyage = updated.data || { ...res.data, tripRef };
          } catch {
            savedVoyage = { ...res.data, tripRef };
          }
        }
        const saved = mapVoyageRow(savedVoyage, {
          number: tripRef || "—",
          price: payload.price,
          valueAzn: priceAzn > 0 ? priceAzn : undefined,
          rawPayload: payload.rawPayload,
          expeditor: payload.expeditor,
          loads: payload.loads || "",
        });
        setVoyagesList((prev) => [...prev, saved]);
        if (newId) {
          await syncLoadVoyageLinks(newId);
          await syncVoyageFinanceExpense({
            voyageId: newId,
            carrier: payload.carrier || "",
            priceNum,
            currency: priceCurrency,
            priceAzn,
          });
        }
        setIsVoyageEditOpen(false);
      } catch (e) {
        console.error(e);
        dispatch(
          showNotification({
            message: "Reys yaradılarkən xəta baş verdi",
            type: "error",
            autoCloseDuration: 3500,
          }),
        );
      }
    }
  };

  if (!order) {
    return (
      <div style={{ padding: "4rem", textAlign: "center" }}>
        <h2 style={{ color: "#ef4444" }}>Sifariş tapılmadı</h2>
        <Link
          to="/sifarisler"
          className={styles.backBtn}
          style={{ marginTop: "1rem" }}
        >
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
    marginLeft: "0.25rem",
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
    {
      id: "loads" as SifarisTabId,
      label: `Yüklər (${loadsList.length})`,
      icon: <FiBox />,
    },
    {
      id: "voyages" as SifarisTabId,
      label: `Reyslər (${voyagesList.length})`,
      icon: <FiTruck />,
    },
    {
      id: "finance" as SifarisTabId,
      label: `Maliyyə (${financeTransactions.length})`,
      icon: <FiDollarSign />,
    },
    {
      id: "documents" as SifarisTabId,
      label: `Sənədlər (${orderDocumentsCount})`,
      icon: <FiFileText />,
    },
    { id: "invoices" as SifarisTabId, label: "Hesablar", icon: <FiFile /> },
    {
      id: "comments" as SifarisTabId,
      label: `Şərhlər və Tapşırıqlar`,
      icon: <FiMessageSquare />,
    },
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
              disabled={isOrderSaving}
              title="Sifarişi redaktə et"
            >
              <FiEdit2 size={15} />
              {isOrderSaving ? "Saxlanılır..." : "Redaktə et"}
            </button>

            {/* Status Section */}
            <div
              className={styles.statusWrapper}
              style={{
                border: "none",
                background: "transparent",
                padding: 0,
                marginTop: "1rem",
              }}
            >
              <div
                style={{
                  position: "relative",
                  display: "inline-flex",
                  alignItems: "center",
                  flex: 1,
                }}
              >
                {(() => {
                  const STATUS_OPTIONS: Array<{
                    value: OrderStatusKind;
                    label: string;
                    bg: string;
                    text: string;
                    dot: string;
                    border: string;
                  }> = [
                    {
                      value: "planned",
                      label: "Planlaşdırılıb",
                      bg: "#eff6ff",
                      text: "#1d4ed8",
                      dot: "#3b82f6",
                      border: "#bfdbfe",
                    },
                    {
                      value: "progress",
                      label: "Davam edir",
                      bg: "#fef3c7",
                      text: "#b45309",
                      dot: "#f59e0b",
                      border: "#fde68a",
                    },
                    {
                      value: "completed",
                      label: "Tamamlandı",
                      bg: "#ecfdf5",
                      text: "#047857",
                      dot: "#10b981",
                      border: "#a7f3d0",
                    },
                    {
                      value: "finance_closed",
                      label: "Maliyyə cəhətdən bağlandı",
                      bg: "#e0e7ff",
                      text: "#4338ca",
                      dot: "#6366f1",
                      border: "#c7d2fe",
                    },
                    {
                      value: "cancelled",
                      label: "Sifariş ləğv edildi",
                      bg: "#fee2e2",
                      text: "#b91c1c",
                      dot: "#ef4444",
                      border: "#fecaca",
                    },
                  ];
                  const currentOpt =
                    STATUS_OPTIONS.find((o) => o.value === currentStatus) ||
                    STATUS_OPTIONS[0];
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
                            e.currentTarget.style.transform =
                              "translateY(-1px)";
                            e.currentTarget.style.boxShadow =
                              "0 4px 6px -1px rgba(0, 0, 0, 0.05)";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "none";
                          }}
                        >
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                            }}
                          >
                            <span
                              style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "50%",
                                backgroundColor: currentOpt.dot,
                              }}
                            />
                            {currentOpt.label}
                          </span>
                          <svg
                            width="10"
                            height="6"
                            viewBox="0 0 10 6"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M1 1L5 5L9 1"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
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
                            boxShadow:
                              "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                            outline: "none",
                          }}
                          sideOffset={6}
                          align="start"
                        >
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "2px",
                            }}
                          >
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
                                    background: isSelected
                                      ? "#f1f5f9"
                                      : "transparent",
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
                                    e.currentTarget.style.background =
                                      isSelected ? "#f1f5f9" : "#f8fafc";
                                    if (!isSelected)
                                      e.currentTarget.style.color = opt.text;
                                  }}
                                  onMouseOut={(e) => {
                                    e.currentTarget.style.background =
                                      isSelected ? "#f1f5f9" : "transparent";
                                    if (!isSelected)
                                      e.currentTarget.style.color = "#334155";
                                  }}
                                >
                                  <span
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "0.5rem",
                                    }}
                                  >
                                    <span
                                      style={{
                                        width: "6px",
                                        height: "6px",
                                        borderRadius: "50%",
                                        backgroundColor: opt.dot,
                                      }}
                                    />
                                    {opt.label}
                                  </span>
                                  {isSelected && (
                                    <FiCheck
                                      style={{
                                        color: opt.text,
                                        fontSize: "0.95rem",
                                      }}
                                    />
                                  )}
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
              <DlRow
                label="Sorğu"
                value={`${order.queryNumber}, ${order.queryDate || "20.05.2026"}\nTəsdiq edilmişdir: Vaxtında`}
              />
              <DlRow
                label="Müştəri üçün başlanğıc tarif"
                value={baslangicTarifDisplay}
              />
              <DlRow
                label="Fraxt"
                value={`${financeTotals.totalRevAzn.toFixed(2)} AZN`}
              />
              <DlRow
                label="Fraxt ƏDV ilə"
                value={`${financeTotals.totalRevAzn.toFixed(2)} AZN`}
              />
              <DlRow
                label="Xərclər (Total qiymət)"
                value={
                  <span className={styles.accentYellow}>
                    {financeExpenseLabel}
                  </span>
                }
              />
              <DlRow
                label="Mənfəət"
                value={
                  <span className={styles.accentGreen}>
                    {financeTotals.profitAzn.toFixed(2)} AZN
                  </span>
                }
              />
              <DlRow label="Şirkət" value={order.company} />
              <DlRow
                label="Menecer"
                value={resolveUserDisplayName(order.manager, users) || "—"}
              />
              <DlRow
                label="Əlavə menecerlər"
                value={
                  resolveUserDisplayName(order.extraManagers, users) ||
                  order.extraManagers ||
                  "—"
                }
              />
              <DlRow
                label="Sifarişin tarixi"
                value={formatDateOnly(order.orderDate)}
              />
              <DlRow label="Teqlər" value={order.tags || "—"} />
              <DlRow label="Incoterms" value={order.incoterms || "—"} />
              <DlRow label="Müştəri" value={displayCustomerName} />
              <DlRow
                label="Ünvan"
                value={
                  String((order as any)?.query?.loadAddress || "").trim() ||
                  String((order as any)?.query?.loadCity || "").trim() ||
                  "—"
                }
              />
              <DlRow
                label="Əlaqədar şəxs"
                value={order.contactPerson || "—"}
              />
              <DlRow label="Daşıyıcılar" value={displayCarriers} />
              <DlRow
                label="Yükün həcmi"
                value={formatVolumeLabel(cargoTotals.volumeM3)}
              />
              <DlRow
                label="Yükün çəkisi"
                value={
                  cargoTotals.weightKg > 0 ? `${cargoTotals.weightKg} kq` : "—"
                }
              />
              <DlRow
                label="Ümumi LDM"
                value={cargoTotals.ldm > 0 ? String(cargoTotals.ldm) : "—"}
              />
              <DlRow
                label="Ekspeditorlar"
                value={
                  resolveUserDisplayName(order.expeditor, users) ||
                  order.expeditor ||
                  "—"
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
                        <th className={`${styles.th} ${styles.thNowrap}`}>
                          Yükün nömrəsi
                        </th>
                        <th className={`${styles.th} ${styles.thNowrap}`}>
                          Yükün adı
                        </th>
                        <th className={`${styles.th} ${styles.thNowrap}`}>
                          Konteynerin nömrəsi
                        </th>
                        <th className={`${styles.th} ${styles.cargoParamsCol}`}>
                          Yükün parametrləri
                        </th>
                        <th className={`${styles.th} ${styles.thNowrap}`}>
                          Göndərən
                        </th>
                        <th className={`${styles.th} ${styles.thNowrap}`}>
                          Yükləmə
                        </th>
                        <th className={`${styles.th} ${styles.thNowrap}`}>
                          Alıcı
                        </th>
                        <th className={`${styles.th} ${styles.thNowrap}`}>
                          Boşaltma
                        </th>
                        <th className={`${styles.th} ${styles.thNowrap}`}>
                          Reyslər
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadsList.map((load) => (
                        <tr key={load.id}>
                          <td
                            className={`${styles.td} ${styles.tdNowrap}`}
                            style={{
                              fontWeight: 700,
                              color: "#16a34a",
                              cursor: "pointer",
                            }}
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
                          <td className={`${styles.td} ${styles.tdNowrap}`}>
                            {load.containerNumber}
                          </td>
                          <td
                            className={`${styles.td} ${styles.cargoParamsCol}`}
                          >
                            <div className={styles.cargoDetailsBox}>
                              {`Tip: ${load.packagingType || "—"}\nLDM: ${load.ldm ?? "—"}\nHəcm: ${load.volumeM3 ?? "—"} m³\nÇəki: ${load.weightKg ?? "—"} kq`}
                            </div>
                          </td>
                          <td className={`${styles.td} ${styles.tdNowrap}`}>
                            {load.sender}
                          </td>
                          <td className={`${styles.td} ${styles.tdNowrap}`}>
                            {load.loadPlace}
                          </td>
                          <td className={`${styles.td} ${styles.tdNowrap}`}>
                            {load.receiver}
                          </td>
                          <td className={`${styles.td} ${styles.tdNowrap}`}>
                            {load.unloadPlace}
                          </td>
                          <td className={`${styles.td} ${styles.tdNowrap}`}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.375rem",
                              }}
                            >
                              <span style={{ fontWeight: 600 }}>
                                {load.voyageLabel ||
                                  formatVoyageLabel(load.voyage, load.voyageId)}
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
                                  <FiEye
                                    style={{
                                      color: "#3b82f6",
                                      fontSize: "0.85rem",
                                    }}
                                  />
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
                                  <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#6366f1"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  className={styles.iconBtn}
                                  title="Kopyalamaq"
                                  onClick={() => {
                                    if (!order?.id) return;
                                    const clonePayload = buildLoadApiPayload(
                                      {
                                        name: load.name,
                                        containerNumber: load.containerNumber,
                                        sender: load.sender,
                                        receiver: load.receiver,
                                        loadPlace: load.loadPlace,
                                        unloadPlace: load.unloadPlace,
                                        loadDate: load.loadDate,
                                        unloadDate: load.unloadDate,
                                        weight: load.weightKg,
                                        volume: load.volumeM3,
                                        ldm: load.ldm,
                                        packagingType: load.packagingType,
                                        rawPayload: load.rawPayload,
                                      },
                                      order.id,
                                    );
                                    axios
                                      .post(
                                        ENDPOINTS.LOADS.BASE,
                                        clonePayload,
                                        {
                                          headers: {
                                            Authorization:
                                              "Bearer " +
                                              localStorage.getItem("token"),
                                          },
                                        },
                                      )
                                      .then((res) =>
                                        setLoadsList([
                                          ...loadsList,
                                          mapLoadRow(res.data, order),
                                        ]),
                                      )
                                      .catch(console.error);
                                  }}
                                >
                                  <FiCopy
                                    style={{
                                      color: "#10b981",
                                      fontSize: "0.85rem",
                                    }}
                                  />
                                </button>
                                <button
                                  type="button"
                                  className={styles.iconBtn}
                                  title="Silmək"
                                  onClick={() => {
                                    openDeleteConfirm(
                                      "Yükü sil",
                                      `"${load.name || load.containerNumber || "Yük"}" silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz.`,
                                      () => {
                                        axios
                                          .delete(
                                            ENDPOINTS.LOADS.BASE +
                                              "/" +
                                              load.id,
                                            {
                                              headers: {
                                                Authorization:
                                                  "Bearer " +
                                                  localStorage.getItem("token"),
                                              },
                                            },
                                          )
                                          .then(() =>
                                            setLoadsList(
                                              loadsList.filter(
                                                (l) => l.id !== load.id,
                                              ),
                                            ),
                                          )
                                          .catch(console.error);
                                      },
                                    );
                                  }}
                                >
                                  <FiTrash2
                                    style={{
                                      color: "#ef4444",
                                      fontSize: "0.85rem",
                                    }}
                                  />
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
                        <th className={`${styles.th} ${styles.thNowrap}`}>
                          Reysin nömrəsi
                        </th>
                        <th className={`${styles.th} ${styles.thNowrap}`}>
                          Teqlər
                        </th>
                        <th className={`${styles.th} ${styles.thNowrap}`}>
                          Gönderen
                        </th>
                        <th className={`${styles.th} ${styles.thNowrap}`}>
                          Yükləmə yeri
                        </th>
                        <th className={`${styles.th} ${styles.thNowrap}`}>
                          Alıcı
                        </th>
                        <th className={`${styles.th} ${styles.thNowrap}`}>
                          Boşaltma yeri
                        </th>
                        <th className={`${styles.th} ${styles.thNowrap}`}>
                          Status
                        </th>
                        <th className={`${styles.th} ${styles.thNowrap}`}>
                          Qiymət
                        </th>
                        <th className={`${styles.th} ${styles.thNowrap}`}>
                          Daşıyıcı
                        </th>
                        <th className={`${styles.th} ${styles.thNowrap}`}>
                          Ekspeditor
                        </th>
                        <th className={`${styles.th} ${styles.thNowrap}`}>
                          Alınmış hesablar
                        </th>
                        <th className={`${styles.th} ${styles.thNowrap}`}>
                          Yüklər
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {voyagesList.map((v) => (
                        <tr key={v.id}>
                          <td
                            className={`${styles.td} ${styles.tdNowrap}`}
                            style={{
                              fontWeight: 700,
                              color: "#16a34a",
                              cursor: "pointer",
                            }}
                            onClick={() => {
                              setSelectedVoyageForView(v);
                              setIsVoyageViewOpen(true);
                            }}
                          >
                            {v.number}
                          </td>
                          <td className={`${styles.td} ${styles.tdNowrap}`}>
                            {v.tags || "—"}
                          </td>
                          <td className={`${styles.td} ${styles.tdNowrap}`}>
                            {v.sender || "—"}
                          </td>
                          <td className={`${styles.td} ${styles.tdNowrap}`}>
                            {v.loadPlace || "—"}
                          </td>
                          <td className={`${styles.td} ${styles.tdNowrap}`}>
                            {v.receiver || "—"}
                          </td>
                          <td className={`${styles.td} ${styles.tdNowrap}`}>
                            {v.unloadPlace || "—"}
                          </td>
                          <td className={`${styles.td} ${styles.tdNowrap}`}>
                            <select
                              value={v.status}
                              onChange={(e) => {
                                const val = e.target.value;
                                const updateData = { status: val };
                                axios
                                  .put(
                                    ENDPOINTS.VOYAGES.BASE + "/" + v.id,
                                    updateData,
                                    {
                                      headers: {
                                        Authorization:
                                          "Bearer " +
                                          localStorage.getItem("token"),
                                      },
                                    },
                                  )
                                  .then((res) =>
                                    setVoyagesList(
                                      voyagesList.map((item) =>
                                        item.id === v.id ? res.data : item,
                                      ),
                                    ),
                                  )
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
                                color: "#475569",
                              }}
                            >
                              <option value="Planlaşdırılıb">
                                Planlaşdırılıb
                              </option>
                              <option value="Davam edir">Davam edir</option>
                              <option value="Tamamlandı">Tamamlandı</option>
                              <option value="Ləğv edilib">Ləğv edilib</option>
                            </select>
                          </td>
                          <td
                            className={`${styles.td} ${styles.tdNowrap}`}
                            style={{
                              fontSize: "0.75rem",
                              color: "#475569",
                              lineHeight: 1.3,
                            }}
                          >
                            {v.price && v.price !== "—"
                              ? v.price
                              : v.tripPrice || "—"}
                          </td>
                          <td className={`${styles.td} ${styles.tdNowrap}`}>
                            {v.carrier}
                          </td>
                          <td className={`${styles.td} ${styles.tdNowrap}`}>
                            {v.expeditor}
                          </td>
                          <td className={`${styles.td} ${styles.tdNowrap}`}>
                            {v.invoices || "—"}
                          </td>
                          <td className={`${styles.td} ${styles.tdNowrap}`}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "1rem",
                              }}
                            >
                              <span
                                style={{ fontSize: "0.8rem", color: "#475569" }}
                              >
                                {(() => {
                                  const linked = loadsList.filter(
                                    (l) =>
                                      l.voyageId != null &&
                                      String(l.voyageId) === String(v.id),
                                  );
                                  if (linked.length > 0) {
                                    return linked
                                      .map(
                                        (l) =>
                                          l.number || l.name || `Y-${l.id}`,
                                      )
                                      .join(", ");
                                  }
                                  if (Array.isArray(v.loads)) {
                                    return v.loads.length + " yük";
                                  }
                                  return v.loads || v.cargoInfo || "—";
                                })()}
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
                                  <FiEye
                                    style={{
                                      color: "#3b82f6",
                                      fontSize: "0.95rem",
                                    }}
                                  />
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
                                  <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#6366f1"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
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
                                  <FiTrash2
                                    style={{
                                      color: "#ef4444",
                                      fontSize: "0.85rem",
                                    }}
                                  />
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
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1rem",
                  }}
                >
                  <h3 className={styles.contentCardTitle} style={{ margin: 0 }}>
                    Maliyyə
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTxForEdit(null);
                      setTxName("");
                      setTxUser(String(user?.name || "").trim());
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
                      transition: "all 0.2s",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.color = "#16a34a")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.color = "#22c55e")
                    }
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
                    marginBottom: "1rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <span style={{ color: "#22c55e", fontWeight: "bold" }}>
                      ➔
                    </span>
                    <span
                      style={{
                        fontSize: "0.85rem",
                        color: "#334155",
                        fontWeight: 600,
                      }}
                    >
                      Müştəriyə başlanğıc qiymət (price from the request)
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      color: "#166534",
                    }}
                  >
                    {baslangicTarifDisplay}
                  </span>
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                  <h4
                    style={{
                      margin: "0 0 0.75rem 0",
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      color: "#475569",
                    }}
                  >
                    Maliyyə əməliyyatları
                  </h4>
                  <div
                    className={styles.tableWrapper}
                    style={{ overflowX: "auto" }}
                  >
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
                          <th className={styles.th}>Yaradan</th>
                          <th className={styles.th}>Redaktə edən</th>
                          <th className={styles.th}>Yazılmış hesab</th>
                          <th className={styles.th}>Alınmış hesab</th>
                          <th className={styles.th}>Xərclərin tarixi</th>
                          <th
                            className={styles.th}
                            style={{ width: "45px" }}
                          ></th>
                        </tr>
                      </thead>
                      <tbody>
                        {financeTransactions.map((tx) => (
                          <tr key={tx.id}>
                            <td
                              className={styles.td}
                              style={{ fontWeight: 600 }}
                            >
                              {tx.name}
                            </td>
                            <td className={styles.td}>
                              {(() => {
                                const txAny = tx as any;
                                const fromCustomerObj =
                                  (typeof txAny.customer?.name === "string" &&
                                    txAny.customer.name.trim()) ||
                                  (typeof txAny.customer?.companyName ===
                                    "string" &&
                                    txAny.customer.companyName.trim()) ||
                                  (typeof txAny.customer?.company ===
                                    "string" &&
                                    txAny.customer.company.trim()) ||
                                  "";
                                if (fromCustomerObj) return fromCustomerObj;

                                const fromPartner = resolveCustomerDisplayName(
                                  txAny.partner,
                                  customers,
                                );
                                if (
                                  fromPartner &&
                                  fromPartner !==
                                    String(txAny.partner ?? "").trim()
                                ) {
                                  return fromPartner;
                                }
                                const fromCustomerId =
                                  resolveCustomerDisplayName(
                                    txAny.customerId,
                                    customers,
                                  );
                                if (
                                  fromCustomerId &&
                                  fromCustomerId !==
                                    String(txAny.customerId ?? "").trim()
                                ) {
                                  return fromCustomerId;
                                }
                                if (
                                  displayCustomerName &&
                                  displayCustomerName !== "—"
                                ) {
                                  const rawPartner = String(
                                    txAny.partner ?? "",
                                  ).trim();
                                  if (
                                    !rawPartner ||
                                    rawPartner === "Müştəri" ||
                                    /^\d+$/.test(rawPartner)
                                  ) {
                                    return displayCustomerName;
                                  }
                                }
                                return (
                                  fromPartner ||
                                  displayCustomerName ||
                                  txAny.partner ||
                                  "—"
                                );
                              })()}
                            </td>
                            <td className={styles.td}>
                              {tx.tarifPrice
                                ? `${tx.tarifPrice} ${tx.tarifCurrency} (${tx.tarifAzn} AZN)`
                                : ""}
                            </td>
                            <td className={styles.td}>
                              {tx.edvliTarifPrice
                                ? `${tx.edvliTarifPrice} ${tx.edvliTarifCurrency} (${tx.edvliTarifAzn} AZN)`
                                : ""}
                            </td>
                            <td className={styles.td}>
                              {tx.mesarifPrice
                                ? `${tx.mesarifPrice} ${tx.mesarifCurrency}${tx.mesarifAzn ? ` (${tx.mesarifAzn} AZN)` : ""}`
                                : ""}
                            </td>
                            <td className={styles.td}>
                              {tx.edvliMesarifPrice
                                ? `${tx.edvliMesarifPrice} ${tx.edvliMesarifCurrency}${tx.edvliMesarifAzn ? ` (${tx.edvliMesarifAzn} AZN)` : ""}`
                                : ""}
                            </td>
                            <td
                              className={styles.td}
                              style={{ color: "#166534", fontWeight: 700 }}
                            >
                              {tx.profit}
                            </td>
                            <td className={styles.td}>
                              <div style={{ fontWeight: 600 }}>
                                {(tx as any).createdByName || tx.user || "—"}
                              </div>
                              <div
                                style={{
                                  fontSize: "0.72rem",
                                  color: "#64748b",
                                }}
                              >
                                {(tx as any).createdAt
                                  ? new Date(
                                      (tx as any).createdAt,
                                    ).toLocaleString("az-AZ", {
                                      hour12: false,
                                    })
                                  : "—"}
                              </div>
                            </td>
                            <td className={styles.td}>
                              {(tx as any).updatedAt &&
                              (tx as any).createdAt &&
                              new Date((tx as any).updatedAt).getTime() -
                                new Date((tx as any).createdAt).getTime() >
                                2000 ? (
                                <>
                                  <div style={{ fontWeight: 600 }}>
                                    {(tx as any).updatedByName || "—"}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "0.72rem",
                                      color: "#64748b",
                                    }}
                                  >
                                    {new Date(
                                      (tx as any).updatedAt,
                                    ).toLocaleString("az-AZ", {
                                      hour12: false,
                                    })}
                                  </div>
                                </>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td
                              className={styles.td}
                              style={{ textAlign: "center" }}
                            >
                              {tx.invoiceWritten ? (
                                <span
                                  title="Yazılmış hesab"
                                  style={{
                                    display: "inline-flex",
                                    cursor: "pointer",
                                    color: "#3b82f6",
                                    fontSize: "1.1rem",
                                  }}
                                >
                                  📄
                                </span>
                              ) : (
                                ""
                              )}
                            </td>
                            <td
                              className={styles.td}
                              style={{ textAlign: "center" }}
                            >
                              {tx.invoiceReceived ? (
                                <span
                                  title="Alınmış hesab"
                                  style={{
                                    display: "inline-flex",
                                    cursor: "pointer",
                                    color: "#10b981",
                                    fontSize: "1.1rem",
                                  }}
                                >
                                  📄
                                </span>
                              ) : (
                                ""
                              )}
                            </td>
                            <td className={styles.td}>{tx.costDate || "—"}</td>
                            <td
                              className={styles.td}
                              style={{ textAlign: "right" }}
                            >
                              <button
                                type="button"
                                className={styles.iconBtn}
                                onClick={() => handleEditTransaction(tx)}
                                title="Redaktə et"
                              >
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="#6366f1"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
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
                  <h4
                    style={{
                      margin: "0 0 0.75rem 0",
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      color: "#475569",
                    }}
                  >
                    Reyslər üzrə xərclər
                  </h4>
                  <div
                    className={styles.tableWrapper}
                    style={{ overflowX: "auto" }}
                  >
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
                          <th
                            className={styles.th}
                            style={{ width: "100px" }}
                          ></th>
                        </tr>
                      </thead>
                      <tbody>
                        {voyagesList.map((v) => (
                          <tr key={v.id}>
                            <td
                              className={styles.td}
                              style={{ fontWeight: 600, color: "#16a34a" }}
                            >
                              {v.number}
                            </td>
                            <td className={styles.td}>{v.carrier}</td>
                            <td className={styles.td}>
                              {v.price && v.price !== "—"
                                ? v.price
                                : v.tripPrice || "—"}
                            </td>
                            <td className={styles.td}>
                              {v.price && v.price !== "—"
                                ? v.price
                                : v.tripPrice || "—"}
                            </td>
                            <td className={styles.td}>{v.expeditor}</td>
                            <td
                              className={styles.td}
                              style={{ textAlign: "center" }}
                            >
                              {v.invoices === "Yazılıb" ? (
                                <span
                                  title="Alınmış hesab"
                                  style={{
                                    display: "inline-flex",
                                    color: "#3b82f6",
                                    fontSize: "1.1rem",
                                  }}
                                >
                                  📄
                                </span>
                              ) : (
                                ""
                              )}
                            </td>
                            <td className={styles.td}>
                              <span
                                style={{
                                  background: "#f1f5f9",
                                  padding: "0.15rem 0.5rem",
                                  borderRadius: "0.25rem",
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  color: "#475569",
                                }}
                              >
                                CN - AZ
                              </span>
                            </td>
                            <td
                              className={styles.td}
                              style={{ textAlign: "right" }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "flex-end",
                                  gap: "0.25rem",
                                }}
                              >
                                <button
                                  type="button"
                                  className={styles.iconBtn}
                                  onClick={() => {
                                    setSelectedVoyageForView(v);
                                    setIsVoyageViewOpen(true);
                                  }}
                                  title="Detallarına baxmaq"
                                >
                                  <FiEye
                                    style={{
                                      color: "#3b82f6",
                                      fontSize: "0.85rem",
                                    }}
                                  />
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
                                  <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#6366f1"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
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
                                  <FiTrash2
                                    style={{
                                      color: "#ef4444",
                                      fontSize: "0.85rem",
                                    }}
                                  />
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
                <DocumentGeneratePanel
                  scope="order"
                  orderId={order?.id ? Number(order.id) : null}
                  queryId={
                    (order as any)?.queryId
                      ? Number((order as any).queryId)
                      : null
                  }
                />
              </div>
            )}

            {activeTab === "invoices" && (
              <div>
                {/* Sub navigation bar */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: "1px solid #e2e8f0",
                    paddingBottom: "0.5rem",
                    marginBottom: "1rem",
                  }}
                >
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
                        borderBottom:
                          invoicesSubTab === "ireli"
                            ? "2px solid #16a34a"
                            : "2px solid transparent",
                        paddingBottom: "0.5rem",
                        color:
                          invoicesSubTab === "ireli" ? "#16a34a" : "#64748b",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontSize: "0.9rem",
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
                        borderBottom:
                          invoicesSubTab === "ilkin"
                            ? "2px solid #16a34a"
                            : "2px solid transparent",
                        paddingBottom: "0.5rem",
                        color:
                          invoicesSubTab === "ilkin" ? "#16a34a" : "#64748b",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontSize: "0.9rem",
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
                        borderBottom:
                          invoicesSubTab === "alinmis"
                            ? "2px solid #16a34a"
                            : "2px solid transparent",
                        paddingBottom: "0.5rem",
                        color:
                          invoicesSubTab === "alinmis" ? "#16a34a" : "#64748b",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontSize: "0.9rem",
                      }}
                    >
                      <FiArrowLeft style={{ fontSize: "1rem" }} />
                      Alınmış hesablar
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingInvoiceId(null);
                      const today = (() => {
                        const d = new Date();
                        const pad = (n: number) =>
                          n.toString().padStart(2, "0");
                        return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
                      })();
                      const isReceived = invoicesSubTab === "alinmis";
                      const baseNum = String(order?.orderNumber || "").trim();
                      const usedNumbers = new Set(
                        invoicesList
                          .map((inv) => String(inv.number || "").trim())
                          .filter(Boolean),
                      );
                      let nextNumber = baseNum;
                      if (!isReceived && baseNum) {
                        if (usedNumbers.has(nextNumber)) {
                          let n = 2;
                          while (usedNumbers.has(`${baseNum}-${n}`)) n += 1;
                          nextNumber = `${baseNum}-${n}`;
                        }
                      } else {
                        nextNumber = "";
                      }
                      setInvoiceNumber(nextNumber);
                      setInvoicePendingDocs([]);
                      setInvoiceCreator(
                        String(user?.name || "").trim() || "",
                      );
                      setInvoiceDate(today);
                      setInvoiceDelayDays("0");
                      setInvoicePayUntilDate(today);
                      setInvoiceRateDate(today);

                      if (isReceived) {
                        const firstCarrier = orderCarrierNames[0] || "";
                        setInvoiceCarrier(firstCarrier);
                        setInvoiceContract("");
                        setInvoiceVoyageNumber(
                          resolveInvoiceVoyageNumber(firstCarrier),
                        );
                        if (firstCarrier) {
                          applyCarrierOfferPricing(firstCarrier);
                          const offer = orderPriceOffers.find(
                            (o: any) =>
                              String(o?.carrierName || "")
                                .trim()
                                .toLowerCase() ===
                              firstCarrier.trim().toLowerCase(),
                          );
                          const raw = String(offer?.price ?? "")
                            .replace(",", ".")
                            .trim();
                          const num = Number.parseFloat(raw);
                          const price = Number.isFinite(num) ? num : 0;
                          setInvoiceRows([
                            {
                              id: "1",
                              text: "",
                              unit: "Marşrut",
                              qty: 1,
                              price,
                              vatRate: "0%",
                            },
                          ]);
                        } else {
                          setInvoiceFreightPrice("");
                          setInvoiceExpectedPrice(null);
                          setInvoiceRows([
                            {
                              id: "1",
                              text: "",
                              unit: "Marşrut",
                              qty: 1,
                              price: 0,
                              vatRate: "0%",
                            },
                          ]);
                        }
                        setInvoiceCarriersList([]);
                        setIsNewInvoiceModalOpen(true);
                        return;
                      }

                      const customerName =
                        displayCustomerName && displayCustomerName !== "—"
                          ? displayCustomerName
                          : "";
                      setInvoiceCarrier(customerName);
                      setInvoiceVoyageNumber("");
                      const matchedCustomer = customers.find((c: any) => {
                        const names = [
                          c.name,
                          c.company,
                          c.companyName,
                          c.fullName,
                        ]
                          .map((n) =>
                            String(n || "")
                              .trim()
                              .toLowerCase(),
                          )
                          .filter(Boolean);
                        return (
                          customerName &&
                          names.includes(customerName.trim().toLowerCase())
                        );
                      });
                      const docs = parseCarrierDocuments(
                        matchedCustomer?.documents ??
                          matchedCustomer?.documentsJson,
                      );
                      const numbers = docs
                        .map((d) => String(d.number || "").trim())
                        .filter(Boolean);
                      setInvoiceContract(
                        numbers.length > 0 ? numbers.join(", ") : "",
                      );
                      // Müştəri hesabı: satış qiyməti
                      const offer =
                        orderPriceOffers.find(
                          (o: any) =>
                            Number.parseFloat(
                              String(o?.salesPrice ?? "").replace(",", "."),
                            ) > 0,
                        ) || orderPriceOffers[0];
                      const salesRaw = String(offer?.salesPrice ?? "")
                        .replace(",", ".")
                        .trim();
                      const salesNum = Number.parseFloat(salesRaw);
                      const salesPrice = Number.isFinite(salesNum)
                        ? salesNum
                        : 0;
                      const currency =
                        String(offer?.currency || resolveOrderCurrency())
                          .trim()
                          .toUpperCase() || resolveOrderCurrency();
                      setInvoiceFreightPrice(
                        salesPrice > 0 ? String(salesPrice) : salesRaw || "",
                      );
                      setInvoiceExpectedPrice(salesPrice > 0 ? salesPrice : null);
                      setInvoiceCurrency(currency);
                      setInvoiceRows([
                        {
                          id: "1",
                          text: buildInvoiceFreightText(),
                          unit: "Marşrut",
                          qty: 1,
                          price: salesPrice,
                          vatRate: "0%",
                        },
                      ]);
                      fetchCustomersAction()
                        .then((data) => {
                          const list = Array.isArray(data)
                            ? data
                            : Array.isArray((data as any)?.customers)
                              ? (data as any).customers
                              : [];
                          setInvoiceCarriersList(
                            list
                              .map((c: any) => ({
                                id: String(c.id ?? ""),
                                name: String(
                                  c.name || c.company || c.companyName || "",
                                ).trim(),
                                documents: parseCarrierDocuments(
                                  c.documents ?? c.documentsJson,
                                ),
                              }))
                              .filter((c: { name: string }) => c.name),
                          );
                          setCustomers(list);
                        })
                        .catch(() => setInvoiceCarriersList([]));
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
                      transition: "background-color 0.2s",
                    }}
                  >
                    <FiPlus />
                    {invoicesSubTab === "alinmis"
                      ? "Alınmış hesab əlavə et"
                      : invoicesSubTab === "ilkin"
                        ? "İlkin hesab əlavə et"
                        : "İrəli hesab əlavə et"}
                  </button>
                </div>

                {/* Table or Empty State */}
                {invoicesList.filter((inv) => inv.type === invoicesSubTab)
                  .length === 0 ? (
                  <div
                    style={{
                      padding: "2rem",
                      textAlign: "left",
                      color: "#64748b",
                      background: "#ffffff",
                      borderRadius: "0.5rem",
                      border: "1px solid #e2e8f0",
                      fontSize: "0.9rem",
                    }}
                  >
                    Hesablar əlavə edilmeyib...
                  </div>
                ) : (
                  <div className={styles.tableWrapper}>
                    <input
                      ref={invoiceFileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp"
                      style={{ display: "none" }}
                      onChange={handleInvoiceDocUpload}
                    />
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
                        {invoicesList
                          .filter((inv) => inv.type === invoicesSubTab)
                          .map((inv) => (
                            <tr key={inv.id}>
                              <td
                                className={styles.td}
                                style={{ fontWeight: 600 }}
                              >
                                {inv.number}
                              </td>
                              <td className={styles.td}>{inv.date}</td>
                              <td className={styles.td}>{inv.payer || "—"}</td>
                              <td className={styles.td}>{inv.amount}</td>
                              <td className={styles.td}>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                  }}
                                >
                                  <span
                                    className={styles.statusBadge}
                                    style={{
                                      background:
                                        inv.status === "Ölənilib"
                                          ? "#dcfce7"
                                          : "#fef9c3",
                                      color:
                                        inv.status === "Ölənilib"
                                          ? "#166534"
                                          : "#854d0e",
                                    }}
                                  >
                                    {inv.status}
                                  </span>
                                  <button
                                    type="button"
                                    title="Yüklənmiş sənədlərə bax"
                                    onClick={() => setInvoiceDocsViewId(inv.id)}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      width: "1.75rem",
                                      height: "1.75rem",
                                      borderRadius: "0.375rem",
                                      border: "1px solid #cbd5e1",
                                      background: "#ffffff",
                                      color: "#3b82f6",
                                      cursor: "pointer",
                                      position: "relative",
                                    }}
                                  >
                                    <FiEye style={{ fontSize: "0.95rem" }} />
                                    {(inv.documents?.length || 0) > 0 && (
                                      <span
                                        style={{
                                          position: "absolute",
                                          top: "-0.35rem",
                                          right: "-0.35rem",
                                          minWidth: "1rem",
                                          height: "1rem",
                                          borderRadius: "999px",
                                          background: "#16a34a",
                                          color: "#fff",
                                          fontSize: "0.65rem",
                                          fontWeight: 700,
                                          display: "inline-flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          padding: "0 0.2rem",
                                        }}
                                      >
                                        {inv.documents!.length}
                                      </span>
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    title="Sənəd yüklə"
                                    onClick={() => openInvoiceDocUpload(inv.id)}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      width: "1.75rem",
                                      height: "1.75rem",
                                      borderRadius: "0.375rem",
                                      border: "1px solid #cbd5e1",
                                      background: "#ffffff",
                                      color: "#16a34a",
                                      cursor: "pointer",
                                    }}
                                  >
                                    <FiUpload style={{ fontSize: "0.95rem" }} />
                                  </button>
                                  <button
                                    type="button"
                                    title="Redaktə et"
                                    onClick={() => openEditInvoice(inv)}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      width: "1.75rem",
                                      height: "1.75rem",
                                      borderRadius: "0.375rem",
                                      border: "1px solid #cbd5e1",
                                      background: "#ffffff",
                                      color: "#0f172a",
                                      cursor: "pointer",
                                    }}
                                  >
                                    <FiEdit2 style={{ fontSize: "0.9rem" }} />
                                  </button>
                                  <button
                                    type="button"
                                    title="Sil"
                                    onClick={() => handleDeleteInvoice(inv)}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      width: "1.75rem",
                                      height: "1.75rem",
                                      borderRadius: "0.375rem",
                                      border: "1px solid #fecaca",
                                      background: "#ffffff",
                                      color: "#dc2626",
                                      cursor: "pointer",
                                    }}
                                  >
                                    <FiTrash2 style={{ fontSize: "0.9rem" }} />
                                  </button>
                                </div>
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
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(20rem, 1fr))",
                    gap: "2.5rem",
                  }}
                >
                  {/* Left Column: Comments List */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "1.25rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderBottom: "2px solid #f1f5f9",
                        paddingBottom: "0.75rem",
                      }}
                    >
                      <h3
                        style={{
                          margin: 0,
                          fontSize: "1.1rem",
                          fontWeight: 700,
                          color: "#1e293b",
                        }}
                      >
                        Şərhlər ({comments.length})
                      </h3>
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
                          gap: "0.375rem",
                        }}
                      >
                        <FiPlus />
                        Şərh yaz
                      </button>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "1rem",
                        maxHeight: "450px",
                        overflowY: "auto",
                        paddingRight: "0.25rem",
                      }}
                    >
                      {comments.length === 0 ? (
                        <p
                          style={{
                            margin: 0,
                            color: "#64748b",
                            fontSize: "0.875rem",
                            fontStyle: "italic",
                            textAlign: "center",
                            padding: "1.5rem 0",
                          }}
                        >
                          Hələ şərh yoxdur
                        </p>
                      ) : (
                        comments.map((c) => (
                        <div
                          key={c.id}
                          style={{
                            background: "#ffffff",
                            padding: "1.25rem",
                            borderRadius: "0.5rem",
                            border: "1px solid #e2e8f0",
                            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginBottom: "0.5rem",
                              fontSize: "0.75rem",
                              color: "#64748b",
                            }}
                          >
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.375rem",
                                fontWeight: 700,
                                color: "#475569",
                              }}
                            >
                              <FiUser style={{ color: "#16a34a" }} />{" "}
                              {c.userName}
                            </span>
                            <span>{c.createdAt}</span>
                          </div>
                          <p
                            style={{
                              margin: 0,
                              fontSize: "0.875rem",
                              color: "#334155",
                              lineHeight: 1.5,
                            }}
                          >
                            {c.text}
                          </p>
                        </div>
                      ))
                      )}
                    </div>
                  </div>

                  {/* Right Column: Tasks List */}
                  <EntityTasksPanel
                    orderId={order?.id ? Number(order.id) : null}
                  />
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
              <h3
                style={{
                  margin: 0,
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  color: "#1e293b",
                }}
              >
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
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1 1L13 13M1 13L13 1"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            {/* Body */}
            <div
              style={{
                padding: "1.5rem",
                maxHeight: "60vh",
                overflowY: "auto",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {order.statusHistory && order.statusHistory.length > 0 ? (
                  order.statusHistory.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: "relative",
                        paddingLeft: "1.5rem",
                        display: "flex",
                        gap: "0.75rem",
                        alignItems: "flex-start",
                      }}
                    >
                      {idx !== order.statusHistory!.length - 1 && (
                        <div
                          style={{
                            position: "absolute",
                            left: "5px",
                            top: "16px",
                            bottom: "-12px",
                            width: "1px",
                            backgroundColor: "#cbd5e1",
                          }}
                        />
                      )}
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          top: "6px",
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          border: "2px solid #ffffff",
                          backgroundColor: "#16a34a",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                        }}
                      />
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.25rem",
                          flex: 1,
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.85rem",
                            fontWeight: 700,
                            color:
                              item.status === "Davam edir"
                                ? "#b45309"
                                : item.status === "Tamamlandı"
                                  ? "#047857"
                                  : item.status === "Maliyyə cəhətdən bağlandı"
                                    ? "#4338ca"
                                    : item.status === "Sifariş ləğv edildi"
                                      ? "#b91c1c"
                                      : "#1d4ed8",
                          }}
                        >
                          {item.status}
                        </span>
                          <span
                          style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            fontWeight: 500,
                          }}
                        >
                          {formatStatusHistoryMeta(item)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p
                    style={{
                      margin: 0,
                      color: "#64748b",
                      fontStyle: "italic",
                      textAlign: "center",
                      padding: "1rem 0",
                    }}
                  >
                    Tarixçə tapılmadı.
                  </p>
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
        financeTransactions={financeTransactions}
      />

      {/* New Load Modal */}
      <YukNewModal
        isOpen={isYukModalOpen}
        onClose={() => setIsYukModalOpen(false)}
        onConfirm={handleYukAdd}
        orderContext={order ? { ...order, voyage: voyagesList[0] } : undefined}
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
        orderContext={order ? { ...order, voyage: voyagesList[0] } : undefined}
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
        availableLoads={loadsList}
        orderNumber={order?.orderNumber || ""}
        order={order}
        priceOffers={orderPriceOffers}
        defaultExpeditor={
          resolveUserDisplayName(order?.manager, users) ||
          resolveUserDisplayName(order?.expeditor, users) ||
          order?.manager ||
          order?.expeditor ||
          ""
        }
        expeditorOptions={users.map((u) => u.name).filter(Boolean)}
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
            setVoyagesList(
              voyagesList.filter(
                (item) => item.id !== selectedVoyageForDelete.id,
              ),
            );
          }
          setIsVoyageDeleteOpen(false);
          setSelectedVoyageForDelete(null);
        }}
        voyageNumber={selectedVoyageForDelete?.number || ""}
      />

      <ConfirmModal
        isOpen={deleteConfirm !== null}
        title={deleteConfirm?.title ?? ""}
        message={deleteConfirm?.message ?? ""}
        onConfirm={() => {
          deleteConfirm?.onConfirm();
          setDeleteConfirm(null);
        }}
        onCancel={() => setDeleteConfirm(null)}
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
                borderBottom: "1px solid #e2e8f0",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  color: "#334155",
                }}
              >
                {selectedTxForEdit
                  ? "Maliyyə əməliyyatını redaktə etmə"
                  : "Əlavə etmə"}
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
            <div
              style={{
                padding: "1.75rem",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
              }}
            >
              {/* Row 1: Şablon, İstifadəçi, Qiymətin hesablanması tipi, Expense category */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr 1fr",
                  gap: "1.25rem",
                }}
              >
                {/* Şablon */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "0.25rem",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "#64748b",
                        fontWeight: 600,
                      }}
                    >
                      Şablon
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsTemplateModalOpen(true)}
                      style={plusBtnStyle}
                    >
                      +
                    </button>
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
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "0.25rem",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "#64748b",
                        fontWeight: 600,
                      }}
                    >
                      İstifadəçi <span style={{ color: "#ef4444" }}>*</span>
                    </span>
                  </div>
                  <div style={{ position: "relative" }}>
                    <select
                      value={txUser}
                      onChange={(e) => setTxUser(e.target.value)}
                      style={selectStyle}
                    >
                      <option value="">İstifadəçi seçin</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.name}>
                          {u.name}
                        </option>
                      ))}
                      {txUser &&
                        !users.some((u) => u.name === txUser) && (
                          <option value={txUser}>{txUser}</option>
                        )}
                    </select>
                    {txUser && (
                      <span
                        onClick={() => setTxUser("")}
                        style={clearIconStyle}
                      >
                        &times;
                      </span>
                    )}
                  </div>
                </div>

                {/* Qiymətin hesablanması tipi */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "0.25rem",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "#64748b",
                        fontWeight: 600,
                      }}
                    >
                      Qiymətin hesablanması tipi{" "}
                      <span style={{ color: "#ef4444" }}>*</span>
                    </span>
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
                      <span
                        onClick={() => setTxCalcType("")}
                        style={clearIconStyle}
                      >
                        &times;
                      </span>
                    )}
                  </div>
                </div>

                {/* Expense category */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "0.25rem",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "#64748b",
                        fontWeight: 600,
                      }}
                    >
                      Expense category{" "}
                      <span style={{ color: "#ef4444" }}>*</span>
                    </span>
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
                      <option value="Administrative expenses">
                        Administrative expenses
                      </option>
                    </select>
                    {txCategory && (
                      <span
                        onClick={() => setTxCategory("")}
                        style={clearIconStyle}
                      >
                        &times;
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 2: Hesab alındı, Adı */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 2fr",
                  gap: "1.25rem",
                }}
              >
                {/* Hesab alındı */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "0.25rem",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "#64748b",
                        fontWeight: 600,
                      }}
                    >
                      Hesab alındı{" "}
                      <span
                        style={{ color: "#94a3b8", cursor: "help" }}
                        title="Hesab alınıb-alınmadığını bildirir"
                      >
                        ?
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setPartnerMenuCoords({
                          x: rect.left,
                          y: rect.bottom + window.scrollY,
                        });
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
                  <span
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      color: "#64748b",
                      fontWeight: 600,
                      marginBottom: "0.25rem",
                    }}
                  >
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
              <div
                style={{ borderTop: "1px solid #e2e8f0", paddingTop: "1rem" }}
              >
                <h4
                  style={{
                    margin: "0 0 0.75rem",
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    color: "#475569",
                  }}
                >
                  Gəlir
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1.5fr 1.5fr 1.5fr 1.2fr 1fr",
                    gap: "1.25rem",
                  }}
                >
                  <div>
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.75rem",
                        color: "#64748b",
                        fontWeight: 600,
                        marginBottom: "0.25rem",
                      }}
                    >
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
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.75rem",
                        color: "#64748b",
                        fontWeight: 600,
                        marginBottom: "0.25rem",
                      }}
                    >
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
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.75rem",
                        color: "#64748b",
                        fontWeight: 600,
                        marginBottom: "0.25rem",
                      }}
                    >
                      Tarif
                    </span>
                    <input
                      type="text"
                      value={txRevTarif}
                      disabled
                      style={{
                        ...inputStyle,
                        background: "#f1f5f9",
                        cursor: "not-allowed",
                      }}
                    />
                  </div>
                  <div>
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.75rem",
                        color: "#64748b",
                        fontWeight: 600,
                        marginBottom: "0.25rem",
                      }}
                    >
                      ƏDV ilə tarif
                    </span>
                    <input
                      type="text"
                      value={txRevTarif}
                      disabled
                      style={{
                        ...inputStyle,
                        background: "#f1f5f9",
                        cursor: "not-allowed",
                      }}
                    />
                  </div>
                  <div>
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.75rem",
                        color: "#64748b",
                        fontWeight: 600,
                        marginBottom: "0.25rem",
                      }}
                    >
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
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.75rem",
                        color: "#64748b",
                        fontWeight: 600,
                        marginBottom: "0.25rem",
                      }}
                    >
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
              <div
                style={{ borderTop: "1px solid #e2e8f0", paddingTop: "1rem" }}
              >
                <h4
                  style={{
                    margin: "0 0 0.75rem",
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    color: "#475569",
                  }}
                >
                  Məsarif
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1.5fr 1.5fr 1.5fr 1.2fr 1fr",
                    gap: "1.25rem",
                  }}
                >
                  <div>
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.75rem",
                        color: "#64748b",
                        fontWeight: 600,
                        marginBottom: "0.25rem",
                      }}
                    >
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
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.75rem",
                        color: "#64748b",
                        fontWeight: 600,
                        marginBottom: "0.25rem",
                      }}
                    >
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
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.75rem",
                        color: "#64748b",
                        fontWeight: 600,
                        marginBottom: "0.25rem",
                      }}
                    >
                      Məsarif
                    </span>
                    <input
                      type="text"
                      value={txExpMesarif}
                      disabled
                      style={{
                        ...inputStyle,
                        background: "#f1f5f9",
                        cursor: "not-allowed",
                      }}
                    />
                  </div>
                  <div>
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.75rem",
                        color: "#64748b",
                        fontWeight: 600,
                        marginBottom: "0.25rem",
                      }}
                    >
                      ƏDV ilə məsarif
                    </span>
                    <input
                      type="text"
                      value={txExpMesarif}
                      disabled
                      style={{
                        ...inputStyle,
                        background: "#f1f5f9",
                        cursor: "not-allowed",
                      }}
                    />
                  </div>
                  <div>
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.75rem",
                        color: "#64748b",
                        fontWeight: 600,
                        marginBottom: "0.25rem",
                      }}
                    >
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
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.75rem",
                        color: "#64748b",
                        fontWeight: 600,
                        marginBottom: "0.25rem",
                      }}
                    >
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
              <div
                style={{ borderTop: "1px solid #e2e8f0", paddingTop: "1rem" }}
              >
                <span
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    color: "#64748b",
                    fontWeight: 600,
                    marginBottom: "0.25rem",
                  }}
                >
                  Təsviri
                </span>
                <textarea
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                  rows={2}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              {/* Checkboxes */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={txExcludeFromFinance}
                    onChange={(e) => setTxExcludeFromFinance(e.target.checked)}
                    style={{
                      width: "16px",
                      height: "16px",
                      accentColor: "#22c55e",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "0.85rem",
                      color: "#334155",
                      fontWeight: 500,
                    }}
                  >
                    Məsarif maliyyələrdə nəzərə alınmasın{" "}
                    <span
                      style={{ color: "#94a3b8", cursor: "help" }}
                      title="Bu xərclər ümumi maliyyə hesabatlarında mənfəətdən çıxılmayacaq"
                    >
                      ?
                    </span>
                  </span>
                </label>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={txSeparateInvoiceLine}
                    onChange={(e) => setTxSeparateInvoiceLine(e.target.checked)}
                    style={{
                      width: "16px",
                      height: "16px",
                      accentColor: "#22c55e",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "0.85rem",
                      color: "#334155",
                      fontWeight: 500,
                    }}
                  >
                    Hesaba ayrıca sətir{" "}
                    <span
                      style={{ color: "#94a3b8", cursor: "help" }}
                      title="Hesab-fakturada bu əməliyyat ayrıca sətir kimi göstəriləcək"
                    >
                      ?
                    </span>
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
                borderTop: "1px solid #e2e8f0",
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
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = "#16a34a")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = "#22c55e")
                }
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
                borderBottom: "1px solid #e2e8f0",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  color: "#334155",
                }}
              >
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
            <div
              style={{
                padding: "1.75rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
                background: "#f8fafc",
              }}
            >
              {/* Row 1 */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr 1fr",
                  gap: "1.25rem",
                }}
              >
                <div>
                  <span
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      color: "#64748b",
                      fontWeight: 600,
                      marginBottom: "0.25rem",
                    }}
                  >
                    Kontragent
                  </span>
                  <select
                    value={tplPartner}
                    onChange={(e) => setTplPartner(e.target.value)}
                    style={selectStyle}
                  >
                    <option value="Dəyəri seçin">Dəyəri seçin</option>
                  </select>
                </div>
                <div>
                  <span
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      color: "#64748b",
                      fontWeight: 600,
                      marginBottom: "0.25rem",
                    }}
                  >
                    Şablonun adı <span style={{ color: "#ef4444" }}>*</span>
                  </span>
                  <input
                    type="text"
                    value={tplName}
                    onChange={(e) => setTplName(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <span
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      color: "#64748b",
                      fontWeight: 600,
                      marginBottom: "0.25rem",
                    }}
                  >
                    Expense category <span style={{ color: "#ef4444" }}>*</span>
                  </span>
                  <div style={{ position: "relative" }}>
                    <select
                      value={tplCategory}
                      onChange={(e) => setTplCategory(e.target.value)}
                      style={selectStyle}
                    >
                      <option value="Order expenses">Order expenses</option>
                    </select>
                    <span
                      style={{
                        position: "absolute",
                        right: "2rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#94a3b8",
                        cursor: "pointer",
                      }}
                    >
                      &times;
                    </span>
                  </div>
                </div>
                <div>
                  <span
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      color: "#64748b",
                      fontWeight: 600,
                      marginBottom: "0.25rem",
                    }}
                  >
                    Qiymətin hesablanması tipi
                  </span>
                  <select
                    value={tplCalcType}
                    onChange={(e) => setTplCalcType(e.target.value)}
                    style={selectStyle}
                  >
                    <option value="ƏDV-siz qiymət">ƏDV-siz qiymət</option>
                  </select>
                </div>
              </div>

              {/* Section 1: Gəlir */}
              <div>
                <h4
                  style={{
                    margin: "0.5rem 0 0.75rem",
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    color: "#475569",
                  }}
                >
                  Gəlir
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1.5fr 1.5fr 1.5fr 1.5fr",
                    gap: "1.25rem",
                  }}
                >
                  <div>
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.75rem",
                        color: "#64748b",
                        fontWeight: 600,
                        marginBottom: "0.25rem",
                      }}
                    >
                      Miqdarı
                    </span>
                    <input
                      type="number"
                      value={tplRevQty}
                      onChange={(e) => setTplRevQty(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.75rem",
                        color: "#64748b",
                        fontWeight: 600,
                        marginBottom: "0.25rem",
                      }}
                    >
                      Qiymət
                    </span>
                    <input
                      type="number"
                      value={tplRevPrice}
                      onChange={(e) => setTplRevPrice(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.75rem",
                        color: "#64748b",
                        fontWeight: 600,
                        marginBottom: "0.25rem",
                      }}
                    >
                      Tarif
                    </span>
                    <input
                      type="text"
                      value={tplRevTarif}
                      disabled
                      style={{
                        ...inputStyle,
                        background: "#f1f5f9",
                        cursor: "not-allowed",
                      }}
                    />
                  </div>
                  <div>
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.75rem",
                        color: "#64748b",
                        fontWeight: 600,
                        marginBottom: "0.25rem",
                      }}
                    >
                      ƏDV ilə tarif
                    </span>
                    <input
                      type="text"
                      value={tplRevTarif}
                      disabled
                      style={{
                        ...inputStyle,
                        background: "#f1f5f9",
                        cursor: "not-allowed",
                      }}
                    />
                  </div>
                  <div>
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.75rem",
                        color: "#64748b",
                        fontWeight: 600,
                        marginBottom: "0.25rem",
                      }}
                    >
                      ƏDV tarifi <span style={{ color: "#ef4444" }}>*</span>
                    </span>
                    <select
                      value={tplRevVatRate}
                      onChange={(e) => setTplRevVatRate(e.target.value)}
                      style={selectStyle}
                    >
                      <option value="20%">20%</option>
                      <option value="18%">18%</option>
                      <option value="0%">0%</option>
                    </select>
                  </div>
                  <div>
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.75rem",
                        color: "#64748b",
                        fontWeight: 600,
                        marginBottom: "0.25rem",
                      }}
                    >
                      Valyuta <span style={{ color: "#ef4444" }}>*</span>
                    </span>
                    <select
                      value={tplRevCurrency}
                      onChange={(e) => setTplRevCurrency(e.target.value)}
                      style={selectStyle}
                    >
                      <option value="AZN">AZN</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Məsarif */}
              <div>
                <h4
                  style={{
                    margin: "0.5rem 0 0.75rem",
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    color: "#475569",
                  }}
                >
                  Məsarif
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1.5fr 1.5fr 1.5fr 1.5fr",
                    gap: "1.25rem",
                  }}
                >
                  <div>
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.75rem",
                        color: "#64748b",
                        fontWeight: 600,
                        marginBottom: "0.25rem",
                      }}
                    >
                      Miqdarı
                    </span>
                    <input
                      type="number"
                      value={tplExpQty}
                      onChange={(e) => setTplExpQty(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.75rem",
                        color: "#64748b",
                        fontWeight: 600,
                        marginBottom: "0.25rem",
                      }}
                    >
                      Qiymət
                    </span>
                    <input
                      type="number"
                      value={tplExpPrice}
                      onChange={(e) => setTplExpPrice(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.75rem",
                        color: "#64748b",
                        fontWeight: 600,
                        marginBottom: "0.25rem",
                      }}
                    >
                      Tarif
                    </span>
                    <input
                      type="text"
                      value={tplExpMesarif}
                      disabled
                      style={{
                        ...inputStyle,
                        background: "#f1f5f9",
                        cursor: "not-allowed",
                      }}
                    />
                  </div>
                  <div>
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.75rem",
                        color: "#64748b",
                        fontWeight: 600,
                        marginBottom: "0.25rem",
                      }}
                    >
                      ƏDV ilə tarif
                    </span>
                    <input
                      type="text"
                      value={tplExpMesarif}
                      disabled
                      style={{
                        ...inputStyle,
                        background: "#f1f5f9",
                        cursor: "not-allowed",
                      }}
                    />
                  </div>
                  <div>
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.75rem",
                        color: "#64748b",
                        fontWeight: 600,
                        marginBottom: "0.25rem",
                      }}
                    >
                      ƏDV tarifi <span style={{ color: "#ef4444" }}>*</span>
                    </span>
                    <select
                      value={tplExpVatRate}
                      onChange={(e) => setTplExpVatRate(e.target.value)}
                      style={selectStyle}
                    >
                      <option value="20%">20%</option>
                      <option value="18%">18%</option>
                      <option value="0%">0%</option>
                    </select>
                  </div>
                  <div>
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.75rem",
                        color: "#64748b",
                        fontWeight: 600,
                        marginBottom: "0.25rem",
                      }}
                    >
                      Valyuta <span style={{ color: "#ef4444" }}>*</span>
                    </span>
                    <select
                      value={tplExpCurrency}
                      onChange={(e) => setTplExpCurrency(e.target.value)}
                      style={selectStyle}
                    >
                      <option value="AZN">AZN</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Checkboxes */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={tplExclude}
                    onChange={(e) => setTplExclude(e.target.checked)}
                    style={{
                      width: "16px",
                      height: "16px",
                      accentColor: "#22c55e",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "0.85rem",
                      color: "#334155",
                      fontWeight: 500,
                    }}
                  >
                    Məsarif maliyyələrdə nəzərə alınmasın{" "}
                    <span
                      style={{ color: "#94a3b8", cursor: "help" }}
                      title="Bu xərclər ümumi maliyyə hesabatlarında mənfəətdən çıxılmayacaq"
                    >
                      ?
                    </span>
                  </span>
                </label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={tplSeparate}
                    onChange={(e) => setTplSeparate(e.target.checked)}
                    style={{
                      width: "16px",
                      height: "16px",
                      accentColor: "#22c55e",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "0.85rem",
                      color: "#334155",
                      fontWeight: 500,
                    }}
                  >
                    Hesaba ayrıca sətir{" "}
                    <span
                      style={{ color: "#94a3b8", cursor: "help" }}
                      title="Hesab-fakturada bu əməliyyat ayrıca sətir kimi göstəriləcək"
                    >
                      ?
                    </span>
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
                borderTop: "1px solid #e2e8f0",
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
                borderBottom: "1px solid #e2e8f0",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  color: "#334155",
                }}
              >
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
            <div
              style={{
                padding: "1.75rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
              }}
            >
              <div>
                <span
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    color: "#64748b",
                    fontWeight: 600,
                    marginBottom: "0.25rem",
                  }}
                >
                  Adı <span style={{ color: "#ef4444" }}>*</span>
                </span>
                <input
                  type="text"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <span
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    color: "#64748b",
                    fontWeight: 600,
                    marginBottom: "0.25rem",
                  }}
                >
                  Expenses: Category <span style={{ color: "#ef4444" }}>*</span>
                </span>
                <input
                  type="text"
                  value="Expense per order"
                  disabled
                  style={{
                    ...inputStyle,
                    background: "#f1f5f9",
                    cursor: "not-allowed",
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                  marginTop: "0.5rem",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={catActive}
                    onChange={(e) => setCatActive(e.target.checked)}
                    style={{
                      width: "18px",
                      height: "18px",
                      accentColor: "#22c55e",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "0.85rem",
                      color: "#334155",
                      fontWeight: 600,
                    }}
                  >
                    Aktiv
                  </span>
                </label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={catDefault}
                    onChange={(e) => setCatDefault(e.target.checked)}
                    style={{
                      width: "18px",
                      height: "18px",
                      accentColor: "#22c55e",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "0.85rem",
                      color: "#334155",
                      fontWeight: 600,
                    }}
                  >
                    Susmaya görə
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
                borderTop: "1px solid #e2e8f0",
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
              boxShadow:
                "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
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
              <span
                style={{
                  fontSize: "1.15rem",
                  fontWeight: 700,
                  color: "#1e293b",
                }}
              >
                {partnerModalType === "client"
                  ? "Yeni müştəri"
                  : "Yeni daşıyıcı"}
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
                      borderBottom: isActive
                        ? "3px solid #3b82f6"
                        : "3px solid transparent",
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
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.1fr auto 1fr",
                    gap: "1.5rem",
                    alignItems: "stretch",
                  }}
                >
                  {/* Left Column: Şirkətin rekvizitləri */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                    }}
                  >
                    <h4
                      style={{
                        margin: "0 0 0.25rem 0",
                        fontSize: "0.9rem",
                        fontWeight: 700,
                        color: "#475569",
                      }}
                    >
                      Şirkətin rekvizitləri
                    </h4>

                    {/* Name (full) */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.25rem",
                      }}
                    >
                      <label
                        style={{
                          fontSize: "0.75rem",
                          color: "#64748b",
                          fontWeight: 600,
                        }}
                      >
                        Name (full)
                      </label>
                      <input
                        type="text"
                        placeholder="Limited liability company"
                        value={partnerFullName}
                        onChange={(e) => setPartnerFullName(e.target.value)}
                        style={inputStyle}
                      />
                    </div>

                    {/* Name (abbreviated) and Fəaliyyət növü side-by-side */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "1rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.25rem",
                        }}
                      >
                        <label
                          style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            fontWeight: 600,
                          }}
                        >
                          Name (abbreviated){" "}
                          <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="LLC Company Name"
                          value={partnerAbbrevName}
                          onChange={(e) => setPartnerAbbrevName(e.target.value)}
                          style={inputStyle}
                        />
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.25rem",
                        }}
                      >
                        <label
                          style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            fontWeight: 600,
                          }}
                        >
                          Fəaliyyət növü
                        </label>
                        <select
                          value={partnerActivityType}
                          onChange={(e) =>
                            setPartnerActivityType(e.target.value)
                          }
                          style={selectStyle}
                        >
                          <option value="Dəyəri seçin">Dəyəri seçin</option>
                          <option value="Logistika">Logistika</option>
                          <option value="İstehsalat">İstehsalat</option>
                        </select>
                      </div>
                    </div>

                    {/* Müştəri tipi and VÖUN/UMTVDR/VATNº side-by-side */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "1rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.25rem",
                        }}
                      >
                        <label
                          style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            fontWeight: 600,
                          }}
                        >
                          Müştəri tipi
                        </label>
                        <select
                          value={partnerType}
                          onChange={(e) => setPartnerType(e.target.value)}
                          style={selectStyle}
                        >
                          <option value="Yeni müştəri">Yeni müştəri</option>
                          <option value="Daimi müştəri">Daimi müştəri</option>
                        </select>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.25rem",
                        }}
                      >
                        <label
                          style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            fontWeight: 600,
                          }}
                        >
                          VÖUN/UMTVDR/VATNº
                        </label>
                        <input
                          type="text"
                          value={partnerVoun}
                          onChange={(e) => setPartnerVoun(e.target.value)}
                          style={inputStyle}
                        />
                      </div>
                    </div>

                    {/* VÖEN and MTÜT side-by-side */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "1rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.25rem",
                        }}
                      >
                        <label
                          style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            fontWeight: 600,
                          }}
                        >
                          VÖEN
                        </label>
                        <input
                          type="text"
                          value={partnerVoen}
                          onChange={(e) => setPartnerVoen(e.target.value)}
                          style={inputStyle}
                        />
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.25rem",
                        }}
                      >
                        <label
                          style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            fontWeight: 600,
                          }}
                        >
                          MTÜT
                        </label>
                        <input
                          type="text"
                          value={partnerMtut}
                          onChange={(e) => setPartnerMtut(e.target.value)}
                          style={inputStyle}
                        />
                      </div>
                    </div>

                    {/* ƏDQN and UAK side-by-side */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "1rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.25rem",
                        }}
                      >
                        <label
                          style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            fontWeight: 600,
                          }}
                        >
                          ƏDQN
                        </label>
                        <input
                          type="text"
                          value={partnerEdqn}
                          onChange={(e) => setPartnerEdqn(e.target.value)}
                          style={inputStyle}
                        />
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.25rem",
                        }}
                      >
                        <label
                          style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            fontWeight: 600,
                          }}
                        >
                          UAK
                        </label>
                        <input
                          type="text"
                          value={partnerUak}
                          onChange={(e) => setPartnerUak(e.target.value)}
                          style={inputStyle}
                        />
                      </div>
                    </div>

                    {/* BİN and Ödəyicinin ƏDV kodu side-by-side */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "1rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.25rem",
                        }}
                      >
                        <label
                          style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            fontWeight: 600,
                          }}
                        >
                          BİN
                        </label>
                        <input
                          type="text"
                          value={partnerBin}
                          onChange={(e) => setPartnerBin(e.target.value)}
                          style={inputStyle}
                        />
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.25rem",
                        }}
                      >
                        <label
                          style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            fontWeight: 600,
                          }}
                        >
                          Ödəyicinin ƏDV kodu
                        </label>
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
                  <div
                    style={{
                      borderLeft: "1px dashed #cbd5e1",
                      margin: "0 0.5rem",
                    }}
                  />

                  {/* Right Column: Client settings */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                    }}
                  >
                    <h4
                      style={{
                        margin: "0 0 0.25rem 0",
                        fontSize: "0.9rem",
                        fontWeight: 700,
                        color: "#475569",
                      }}
                    >
                      {partnerModalType === "client"
                        ? "Client settings"
                        : "Carrier settings"}
                    </h4>

                    {/* Yaradılması tarixi and Language side-by-side */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "1rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.25rem",
                        }}
                      >
                        <label
                          style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            fontWeight: 600,
                          }}
                        >
                          Yaradılması tarixi
                        </label>
                        <div style={{ position: "relative" }}>
                          <input
                            type="text"
                            value={partnerCreationDate}
                            onChange={(e) =>
                              setPartnerCreationDate(e.target.value)
                            }
                            style={inputStyle}
                          />
                          <FiCalendar
                            style={{
                              position: "absolute",
                              right: "0.6rem",
                              top: "50%",
                              transform: "translateY(-50%)",
                              color: "#94a3b8",
                            }}
                          />
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.25rem",
                        }}
                      >
                        <label
                          style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            fontWeight: 600,
                          }}
                        >
                          Language of notifications
                        </label>
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
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.25rem",
                      }}
                    >
                      <label
                        style={{
                          fontSize: "0.75rem",
                          color: "#64748b",
                          fontWeight: 600,
                        }}
                      >
                        Menecerlər
                      </label>
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
                              <span
                                style={{
                                  cursor: "pointer",
                                  fontWeight: "bold",
                                }}
                                onClick={() => setPartnerManagers([])}
                              >
                                ×
                              </span>
                              {m}
                            </span>
                          ))}
                        </div>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "#94a3b8",
                            cursor: "pointer",
                            padding: "0 0.25rem",
                          }}
                          onClick={() => setPartnerManagers([])}
                        >
                          ×
                        </span>
                      </div>
                    </div>

                    {/* İşə icazə verilmişdir Checkbox */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        marginTop: "0.5rem",
                        cursor: "pointer",
                      }}
                      onClick={() => setPartnerPermitted(!partnerPermitted)}
                    >
                      <div
                        style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "4px",
                          border: partnerPermitted
                            ? "1.5px solid #22c55e"
                            : "1.5px solid #cbd5e1",
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
                      <span
                        style={{
                          fontSize: "0.8rem",
                          color: "#1e293b",
                          fontWeight: 600,
                        }}
                      >
                        İşə icazə verilmişdir
                      </span>
                    </div>

                    {/* Əlavə məlumat */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.25rem",
                        marginTop: "0.25rem",
                      }}
                    >
                      <label
                        style={{
                          fontSize: "0.75rem",
                          color: "#64748b",
                          fontWeight: 600,
                        }}
                      >
                        Əlavə məlumat
                      </label>
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
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.5rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.375rem",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          color: "#475569",
                        }}
                      >
                        Hüquqi ünvan
                      </span>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4, 1fr)",
                        gap: "0.75rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.15rem",
                        }}
                      >
                        <LabelWithPlus
                          label="Ölkə"
                          onPlusClick={() => setIsCountryModalOpen(true)}
                        />
                        <select
                          value={legalCountry}
                          onChange={(e) => setLegalCountry(e.target.value)}
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
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.15rem",
                        }}
                      >
                        <label
                          style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            fontWeight: 600,
                          }}
                        >
                          Şəhər
                        </label>
                        <input
                          type="text"
                          value={legalCity}
                          onChange={(e) => setLegalCity(e.target.value)}
                          style={inputStyle}
                        />
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.15rem",
                        }}
                      >
                        <label
                          style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            fontWeight: 600,
                          }}
                        >
                          Ünvan
                        </label>
                        <input
                          type="text"
                          value={legalStreet}
                          onChange={(e) => setLegalStreet(e.target.value)}
                          style={inputStyle}
                        />
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.15rem",
                        }}
                      >
                        <label
                          style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            fontWeight: 600,
                          }}
                        >
                          Poçt kodu
                        </label>
                        <input
                          type="text"
                          value={legalZip}
                          onChange={(e) => setLegalZip(e.target.value)}
                          style={inputStyle}
                        />
                      </div>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4, 1fr)",
                        gap: "0.75rem",
                        marginTop: "0.5rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.15rem",
                        }}
                      >
                        <label
                          style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            fontWeight: 600,
                          }}
                        >
                          Telefon
                        </label>
                        <input
                          type="text"
                          value={legalTel}
                          onChange={(e) => setLegalTel(e.target.value)}
                          style={inputStyle}
                        />
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.15rem",
                        }}
                      >
                        <label
                          style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            fontWeight: 600,
                          }}
                        >
                          Faks
                        </label>
                        <input
                          type="text"
                          value={legalFax}
                          onChange={(e) => setLegalFax(e.target.value)}
                          style={inputStyle}
                        />
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.15rem",
                        }}
                      >
                        <label
                          style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            fontWeight: 600,
                          }}
                        >
                          E-poçt
                        </label>
                        <input
                          type="email"
                          value={legalEmail}
                          onChange={(e) => setLegalEmail(e.target.value)}
                          style={inputStyle}
                        />
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.15rem",
                        }}
                      >
                        <label
                          style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            fontWeight: 600,
                          }}
                        >
                          Veb-sayt
                        </label>
                        <input
                          type="text"
                          value={legalWeb}
                          onChange={(e) => setLegalWeb(e.target.value)}
                          style={inputStyle}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Maliyyələr */}
              {partnerActiveTab === "finance" && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.25rem",
                  }}
                >
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
                    <span
                      style={{
                        color: "#1e293b",
                        fontWeight: 700,
                        fontSize: "0.9rem",
                      }}
                    >
                      Bank accounts
                    </span>
                  </div>

                  {/* Bank accounts list */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                    }}
                  >
                    {bankAccounts.map((account, index) => (
                      <div
                        key={account.id}
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "30px 100px 1.5fr 1.5fr 1.5fr 1.5fr 1.5fr",
                          gap: "0.75rem",
                          alignItems: "end",
                        }}
                      >
                        {/* Remove button */}
                        <div style={{ paddingBottom: "0.5rem" }}>
                          <button
                            type="button"
                            onClick={() => {
                              if (bankAccounts.length <= 1) return;
                              openDeleteConfirm(
                                "Bank hesabını sil",
                                "Bu bank hesabını silmək istədiyinizə əminsiniz?",
                                () =>
                                  setBankAccounts(
                                    bankAccounts.filter(
                                      (a) => a.id !== account.id,
                                    ),
                                  ),
                              );
                            }}
                            style={{
                              background: "transparent",
                              border: 0,
                              padding: 0,
                              cursor:
                                bankAccounts.length > 1
                                  ? "pointer"
                                  : "not-allowed",
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
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.25rem",
                          }}
                        >
                          {index === 0 && (
                            <label
                              style={{
                                fontSize: "0.75rem",
                                color: "#64748b",
                                fontWeight: 600,
                              }}
                            >
                              Valyuta{" "}
                              <span style={{ color: "#ef4444" }}>*</span>
                            </label>
                          )}
                          <select
                            value={account.currency}
                            onChange={(e) => {
                              setBankAccounts(
                                bankAccounts.map((a) =>
                                  a.id === account.id
                                    ? { ...a, currency: e.target.value }
                                    : a,
                                ),
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
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.25rem",
                          }}
                        >
                          {index === 0 && (
                            <label
                              style={{
                                fontSize: "0.75rem",
                                color: "#64748b",
                                fontWeight: 600,
                              }}
                            >
                              Hesablaşma hesabı
                            </label>
                          )}
                          <input
                            type="text"
                            value={account.account}
                            onChange={(e) => {
                              setBankAccounts(
                                bankAccounts.map((a) =>
                                  a.id === account.id
                                    ? { ...a, account: e.target.value }
                                    : a,
                                ),
                              );
                            }}
                            style={inputStyle}
                          />
                        </div>

                        {/* Bank */}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.25rem",
                          }}
                        >
                          {index === 0 && (
                            <LabelWithPlus
                              label="Bank"
                              onPlusClick={() => setIsBankModalOpen(true)}
                            />
                          )}
                          <select
                            value={account.bank}
                            onChange={(e) => {
                              setBankAccounts(
                                bankAccounts.map((a) =>
                                  a.id === account.id
                                    ? { ...a, bank: e.target.value }
                                    : a,
                                ),
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
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.25rem",
                          }}
                        >
                          {index === 0 && (
                            <label
                              style={{
                                fontSize: "0.75rem",
                                color: "#64748b",
                                fontWeight: 600,
                              }}
                            >
                              Tranzit hesab
                            </label>
                          )}
                          <input
                            type="text"
                            value={account.transitAccount}
                            onChange={(e) => {
                              setBankAccounts(
                                bankAccounts.map((a) =>
                                  a.id === account.id
                                    ? { ...a, transitAccount: e.target.value }
                                    : a,
                                ),
                              );
                            }}
                            style={inputStyle}
                          />
                        </div>

                        {/* Müxbir bank */}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.25rem",
                          }}
                        >
                          {index === 0 && (
                            <LabelWithPlus
                              label="Müxbir bank"
                              onPlusClick={() => setIsBankModalOpen(true)}
                            />
                          )}
                          <select
                            value={account.corrBank}
                            onChange={(e) => {
                              setBankAccounts(
                                bankAccounts.map((a) =>
                                  a.id === account.id
                                    ? { ...a, corrBank: e.target.value }
                                    : a,
                                ),
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
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.25rem",
                          }}
                        >
                          {index === 0 && (
                            <label
                              style={{
                                fontSize: "0.75rem",
                                color: "#64748b",
                                fontWeight: 600,
                              }}
                            >
                              Müxbir hesab
                            </label>
                          )}
                          <input
                            type="text"
                            value={account.corrAccount}
                            onChange={(e) => {
                              setBankAccounts(
                                bankAccounts.map((a) =>
                                  a.id === account.id
                                    ? { ...a, corrAccount: e.target.value }
                                    : a,
                                ),
                              );
                            }}
                            style={inputStyle}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Financial terms & conditions */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                      marginTop: "0.5rem",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        color: "#475569",
                      }}
                    >
                      Financial terms
                    </span>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "1rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.25rem",
                        }}
                      >
                        <label
                          style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            fontWeight: 600,
                          }}
                        >
                          Ödənişin təxirə salınması
                        </label>
                        <input
                          type="text"
                          value={financeDelay}
                          onChange={(e) => setFinanceDelay(e.target.value)}
                          style={inputStyle}
                        />
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.25rem",
                        }}
                      >
                        <label
                          style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            fontWeight: 600,
                          }}
                        >
                          Ödənişlərin təxirə salınması şərtləri
                        </label>
                        <select
                          value={financeDelayTerms}
                          onChange={(e) => setFinanceDelayTerms(e.target.value)}
                          style={selectStyle}
                        >
                          <option value="B/k 30 təqvim günü.">
                            B/k 30 təqvim günü.
                          </option>
                          <option value="B/k 15 təqvim günü.">
                            B/k 15 təqvim günü.
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Document terms text */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.25rem",
                    }}
                  >
                    <label
                      style={{
                        fontSize: "0.75rem",
                        color: "#64748b",
                        fontWeight: 600,
                      }}
                    >
                      Document terms text
                    </label>
                    <textarea
                      value={financeDocTerms}
                      onChange={(e) => setFinanceDocTerms(e.target.value)}
                      style={{ ...inputStyle, height: "64px", resize: "none" }}
                    />
                  </div>

                  {/* Credit limit, Email, Checkbox */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1.2fr 1.3fr",
                      gap: "1.5rem",
                      alignItems: "end",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.25rem",
                      }}
                    >
                      <label
                        style={{
                          fontSize: "0.75rem",
                          color: "#64748b",
                          fontWeight: 600,
                        }}
                      >
                        Kredit limiti
                      </label>
                      <input
                        type="text"
                        value={financeCreditLimit}
                        onChange={(e) => setFinanceCreditLimit(e.target.value)}
                        style={inputStyle}
                      />
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.25rem",
                      }}
                    >
                      <label
                        style={{
                          fontSize: "0.75rem",
                          color: "#64748b",
                          fontWeight: 600,
                        }}
                      >
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
                      onClick={() =>
                        setFinanceSendReminders(!financeSendReminders)
                      }
                    >
                      <div
                        style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "4px",
                          border: financeSendReminders
                            ? "1.5px solid #22c55e"
                            : "1.5px solid #cbd5e1",
                          background: financeSendReminders
                            ? "#22c55e"
                            : "#ffffff",
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
                      <span
                        style={{
                          fontSize: "0.8rem",
                          color: "#1e293b",
                          fontWeight: 600,
                        }}
                      >
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
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = "#16a34a")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.backgroundColor = "#22c55e")
                }
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
              <span
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  color: "#475569",
                }}
              >
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
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.25rem",
                }}
              >
                <label
                  style={{
                    fontSize: "0.75rem",
                    color: "#64748b",
                    fontWeight: 600,
                  }}
                >
                  Adı <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  value={newCountryName}
                  onChange={(e) => setNewCountryName(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.25rem",
                }}
              >
                <label
                  style={{
                    fontSize: "0.75rem",
                    color: "#64748b",
                    fontWeight: 600,
                  }}
                >
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
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  cursor: "pointer",
                }}
                onClick={() => setIsEuropeCountry(!isEuropeCountry)}
              >
                <div
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "4px",
                    border: isEuropeCountry
                      ? "1.5px solid #22c55e"
                      : "1.5px solid #cbd5e1",
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
                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "#1e293b",
                    fontWeight: 600,
                  }}
                >
                  Avropa ölkələri
                </span>
              </div>

              {/* Susmaya görə ölkə */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  cursor: "pointer",
                }}
                onClick={() => setIsDefaultCountry(!isDefaultCountry)}
              >
                <div
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "4px",
                    border: isDefaultCountry
                      ? "1.5px solid #22c55e"
                      : "1.5px solid #cbd5e1",
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
                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "#1e293b",
                    fontWeight: 600,
                  }}
                >
                  Susmaya görə ölkə
                </span>
              </div>

              {/* Aktiv */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  cursor: "pointer",
                }}
                onClick={() => setIsActiveCountry(!isActiveCountry)}
              >
                <div
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "4px",
                    border: isActiveCountry
                      ? "1.5px solid #22c55e"
                      : "1.5px solid #cbd5e1",
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
                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "#1e293b",
                    fontWeight: 600,
                  }}
                >
                  Aktiv
                </span>
              </div>
            </div>

            {/* Row 3: Ölkələr */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.25rem",
              }}
            >
              <label
                style={{
                  fontSize: "0.75rem",
                  color: "#64748b",
                  fontWeight: 600,
                }}
              >
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


            {/* Yeni hesabı əlavə et Modal Overlay */}
      {invoiceDocsViewId &&
        (() => {
          const inv = invoicesList.find((i) => i.id === invoiceDocsViewId);
          const docs = inv?.documents || [];
          return (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(15, 23, 42, 0.45)",
                zIndex: 10050,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem",
              }}
              onClick={() => setInvoiceDocsViewId(null)}
            >
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "0.75rem",
                  width: "min(32rem, 100%)",
                  maxHeight: "80vh",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.18)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "1rem 1.25rem",
                    borderBottom: "1px solid #e2e8f0",
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "1rem",
                      fontWeight: 700,
                      color: "#1e293b",
                    }}
                  >
                    Hesab sənədləri: {inv?.number || "—"}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setInvoiceDocsViewId(null)}
                    style={{
                      background: "transparent",
                      border: 0,
                      cursor: "pointer",
                      color: "#64748b",
                      fontSize: "1.25rem",
                    }}
                  >
                    <FiX />
                  </button>
                </div>
                <div
                  style={{
                    padding: "1rem 1.25rem",
                    overflowY: "auto",
                    flex: 1,
                  }}
                >
                  {docs.length === 0 ? (
                    <div
                      style={{
                        color: "#64748b",
                        fontSize: "0.9rem",
                        padding: "1rem 0",
                      }}
                    >
                      Bu hesab üçün sənəd yüklənməyib.
                    </div>
                  ) : (
                    <ul
                      style={{
                        listStyle: "none",
                        margin: 0,
                        padding: 0,
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                      }}
                    >
                      {docs.map((doc) => (
                        <li
                          key={doc.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "0.75rem",
                            padding: "0.65rem 0.75rem",
                            border: "1px solid #e2e8f0",
                            borderRadius: "0.5rem",
                            background: "#f8fafc",
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontWeight: 600,
                                color: "#1e293b",
                                fontSize: "0.875rem",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {doc.name}
                            </div>
                            <div
                              style={{ fontSize: "0.75rem", color: "#64748b" }}
                            >
                              {doc.size} · {doc.createdAt}
                            </div>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              gap: "0.35rem",
                              flexShrink: 0,
                            }}
                          >
                            <a
                              href={resolveUploadUrl(doc.url)}
                              target="_blank"
                              rel="noreferrer"
                              title="Aç"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "2rem",
                                height: "2rem",
                                borderRadius: "0.375rem",
                                border: "1px solid #cbd5e1",
                                background: "#ffffff",
                                color: "#3b82f6",
                                textDecoration: "none",
                              }}
                            >
                              <FiEye />
                            </a>
                            <button
                              type="button"
                              title="Sil"
                              onClick={async () => {
                                const inv = invoicesList.find(
                                  (i) =>
                                    String(i.id) === String(invoiceDocsViewId),
                                );
                                const nextDocs = (inv?.documents || []).filter(
                                  (d) => d.id !== doc.id,
                                );
                                const idNum = Number(invoiceDocsViewId);
                                try {
                                  if (Number.isFinite(idNum) && idNum > 0) {
                                    await axios.put(
                                      ENDPOINTS.INVOICES.BY_ID(idNum),
                                      { documents: nextDocs },
                                      {
                                        headers: {
                                          Authorization:
                                            "Bearer " +
                                            localStorage.getItem("token"),
                                        },
                                      },
                                    );
                                  }
                                  setInvoicesList((prev) =>
                                    prev.map((i) =>
                                      String(i.id) === String(invoiceDocsViewId)
                                        ? { ...i, documents: nextDocs }
                                        : i,
                                    ),
                                  );
                                } catch (err) {
                                  console.error(err);
                                  dispatch(
                                    showNotification({
                                      message: "Sənəd silinərkən xəta baş verdi.",
                                      type: "error",
                                      autoCloseDuration: 3000,
                                    }),
                                  );
                                }
                              }}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "2rem",
                                height: "2rem",
                                borderRadius: "0.375rem",
                                border: "1px solid #fecaca",
                                background: "#ffffff",
                                color: "#dc2626",
                                cursor: "pointer",
                              }}
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div
                  style={{
                    padding: "0.85rem 1.25rem",
                    borderTop: "1px solid #e2e8f0",
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "0.5rem",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (inv?.id) openInvoiceDocUpload(inv.id);
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      background: "#16a34a",
                      color: "#fff",
                      border: 0,
                      borderRadius: "0.375rem",
                      padding: "0.5rem 0.9rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontSize: "0.85rem",
                    }}
                  >
                    <FiUpload /> Sənəd yüklə
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

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
                borderBottom: "1px solid #e2e8f0",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  color: "#334155",
                }}
              >
                {editingInvoiceId
                  ? invoicesSubTab === "alinmis"
                    ? "Alınmış hesabı redaktə et"
                    : invoicesSubTab === "ilkin"
                      ? "İlkin hesabı redaktə et"
                      : "İrəli sürülmüş hesabı redaktə et"
                  : invoicesSubTab === "alinmis"
                    ? "Yeni alınmış hesab əlavə et"
                    : invoicesSubTab === "ilkin"
                      ? "Yeni ilkin hesab əlavə et"
                      : "Yeni irəli sürülmüş hesab əlavə et"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsNewInvoiceModalOpen(false);
                  setEditingInvoiceId(null);
                  setInvoicePendingDocs([]);
                }}
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
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.5rem",
                }}
              >
                {/* Inputs Grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))",
                    gap: "1.5rem",
                  }}
                >
                  {/* Sifarişin nömrəsi */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.375rem",
                    }}
                  >
                    <label
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "#64748b",
                      }}
                    >
                      Sifarişin nömrəsi{" "}
                      <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={order?.orderNumber || ""}
                      readOnly
                      style={{
                        border: "1px solid #cbd5e1",
                        borderRadius: "0.375rem",
                        padding: "0.5rem 0.75rem",
                        outline: "none",
                        fontSize: "0.875rem",
                        backgroundColor: "#f8fafc",
                        color: "#334155",
                      }}
                    />
                  </div>

                  {/* Alınmış: Daşıyıcı → Reys | İrəli/İlkin: Müştəri (+ müqavilə), reys yoxdur */}
                  {invoicesSubTab === "alinmis" ? (
                    <>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.375rem",
                        }}
                      >
                        <label
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            color: "#64748b",
                          }}
                        >
                          Daşıyıcı
                        </label>
                        <select
                          value={invoiceCarrier}
                          onChange={(e) => {
                            const name = e.target.value;
                            setInvoiceCarrier(name);
                            setInvoiceVoyageNumber(
                              resolveInvoiceVoyageNumber(name),
                            );
                            applyCarrierOfferPricing(name);
                            const offer = orderPriceOffers.find(
                              (o: any) =>
                                String(o?.carrierName || "")
                                  .trim()
                                  .toLowerCase() ===
                                name.trim().toLowerCase(),
                            );
                            const raw = String(offer?.price ?? "")
                              .replace(",", ".")
                              .trim();
                            const num = Number.parseFloat(raw);
                            const price = Number.isFinite(num) ? num : 0;
                            setInvoiceRows((rows) =>
                              rows.map((r, idx) =>
                                idx === 0 ? { ...r, price } : r,
                              ),
                            );
                          }}
                          style={{
                            border: "1px solid #cbd5e1",
                            borderRadius: "0.375rem",
                            padding: "0.5rem 0.75rem",
                            outline: "none",
                            fontSize: "0.875rem",
                            backgroundColor: "#ffffff",
                          }}
                        >
                          <option value="">Daşıyıcı seçin</option>
                          {orderCarrierNames.map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.375rem",
                        }}
                      >
                        <label
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            color: "#64748b",
                          }}
                        >
                          Reys nömrəsi
                        </label>
                        <select
                          value={invoiceVoyageNumber}
                          onChange={(e) =>
                            setInvoiceVoyageNumber(e.target.value)
                          }
                          style={{
                            border: "1px solid #cbd5e1",
                            borderRadius: "0.375rem",
                            padding: "0.5rem 0.75rem",
                            outline: "none",
                            fontSize: "0.875rem",
                            backgroundColor: "#ffffff",
                          }}
                        >
                          <option value="">Reys seçin</option>
                          {invoiceVoyagesForCarrier.map((v) => {
                            const label =
                              (v.id ? `R-${v.id}` : "") ||
                              String(v.number || "").trim() ||
                              formatVoyageLabel(v);
                            if (!label) return null;
                            return (
                              <option key={v.id ?? label} value={label}>
                                {label}
                                {v.carrier && v.carrier !== "—"
                                  ? ` — ${v.carrier}`
                                  : ""}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </>
                  ) : (
                    <>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.375rem",
                        }}
                      >
                        <label
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            color: "#64748b",
                          }}
                        >
                          Müştəri
                        </label>
                        <select
                          value={invoiceCarrier}
                          onChange={(e) => {
                            const name = e.target.value;
                            setInvoiceCarrier(name);
                            if (!name) {
                              setInvoiceContract("");
                              setInvoiceFreightPrice("");
                              setInvoiceExpectedPrice(null);
                              return;
                            }
                            const found = invoiceCarriersList.find(
                              (c) =>
                                c.name.toLowerCase() === name.toLowerCase(),
                            );
                            const numbers = (found?.documents || [])
                              .map((d) => String(d.number || "").trim())
                              .filter(Boolean);
                            setInvoiceContract(
                              numbers.length > 0 ? numbers.join(", ") : "",
                            );
                            const offer =
                              orderPriceOffers.find(
                                (o: any) =>
                                  Number.parseFloat(
                                    String(o?.salesPrice ?? "").replace(
                                      ",",
                                      ".",
                                    ),
                                  ) > 0,
                              ) || orderPriceOffers[0];
                            const salesRaw = String(offer?.salesPrice ?? "")
                              .replace(",", ".")
                              .trim();
                            const salesNum = Number.parseFloat(salesRaw);
                            const salesPrice = Number.isFinite(salesNum)
                              ? salesNum
                              : 0;
                            const currency =
                              String(
                                offer?.currency ||
                                  invoiceCurrency ||
                                  resolveOrderCurrency(),
                              )
                                .trim()
                                .toUpperCase() || resolveOrderCurrency();
                            setInvoiceFreightPrice(
                              salesPrice > 0
                                ? String(salesPrice)
                                : salesRaw || "",
                            );
                            setInvoiceExpectedPrice(
                              salesPrice > 0 ? salesPrice : null,
                            );
                            setInvoiceCurrency(currency);
                            setInvoiceRows((rows) =>
                              rows.map((r, idx) =>
                                idx === 0 ? { ...r, price: salesPrice } : r,
                              ),
                            );
                          }}
                          style={{
                            border: "1px solid #cbd5e1",
                            borderRadius: "0.375rem",
                            padding: "0.5rem 0.75rem",
                            outline: "none",
                            fontSize: "0.875rem",
                            backgroundColor: "#ffffff",
                          }}
                        >
                          <option value="">Müştəri seçin</option>
                          {Array.from(
                            new Set([
                              ...invoiceCarriersList.map((c) => c.name),
                              ...(displayCustomerName &&
                              displayCustomerName !== "—"
                                ? [displayCustomerName]
                                : []),
                            ]),
                          ).map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.375rem",
                        }}
                      >
                        <label
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            color: "#64748b",
                          }}
                        >
                          Müştəri ilə müqavilənin nömrəsi
                        </label>
                        <div
                          style={{
                            position: "relative",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <input
                            type="text"
                            value={invoiceContract}
                            onChange={(e) =>
                              setInvoiceContract(e.target.value)
                            }
                            style={{
                              width: "100%",
                              border: "1px solid #cbd5e1",
                              borderRadius: "0.375rem",
                              padding: "0.5rem 2rem 0.5rem 0.75rem",
                              outline: "none",
                              fontSize: "0.875rem",
                              backgroundColor: "#ffffff",
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setInvoiceContract("")}
                            style={{
                              position: "absolute",
                              right: "0.5rem",
                              background: "transparent",
                              border: 0,
                              cursor: "pointer",
                              color: "#64748b",
                            }}
                          >
                            <FiX style={{ fontSize: "0.875rem" }} />
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Tərtib etdi */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.375rem",
                    }}
                  >
                    <label
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "#64748b",
                      }}
                    >
                      Tərtib etdi <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <select
                      value={invoiceCreator}
                      onChange={(e) => setInvoiceCreator(e.target.value)}
                      style={{
                        border: "1px solid #cbd5e1",
                        borderRadius: "0.375rem",
                        padding: "0.5rem 0.75rem",
                        outline: "none",
                        fontSize: "0.875rem",
                        backgroundColor: "#ffffff",
                      }}
                    >
                      <option value="">Seçin</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.name}>
                          {u.name}
                        </option>
                      ))}
                      {invoiceCreator &&
                        !users.some((u) => u.name === invoiceCreator) && (
                          <option value={invoiceCreator}>
                            {invoiceCreator}
                          </option>
                        )}
                    </select>
                  </div>

                  {/* Hesabın nömrəsi — yalnız irəli/ilkin */}
                  {invoicesSubTab !== "alinmis" && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.375rem",
                    }}
                  >
                    <label
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "#64748b",
                      }}
                    >
                      Hesabın nömrəsi
                    </label>
                    <input
                      type="text"
                      placeholder="Hesab nömrəsini daxil edin"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      style={{
                        border: "1px solid #cbd5e1",
                        borderRadius: "0.375rem",
                        padding: "0.5rem 0.75rem",
                        outline: "none",
                        fontSize: "0.875rem",
                        backgroundColor: "#ffffff",
                      }}
                    />
                  </div>
                  )}

                  {/* Hesab yazılıb */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.375rem",
                    }}
                  >
                    <label
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "#64748b",
                      }}
                    >
                      Hesab yazılıb
                    </label>
                    <div
                      style={{
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <input
                        type="text"
                        value={invoiceDate}
                        onChange={(e) => setInvoiceDate(e.target.value)}
                        style={{
                          width: "100%",
                          border: "1px solid #cbd5e1",
                          borderRadius: "0.375rem",
                          padding: "0.5rem 2.25rem 0.5rem 0.75rem",
                          outline: "none",
                          fontSize: "0.875rem",
                          backgroundColor: "#ffffff",
                        }}
                      />
                      <FiCalendar
                        style={{
                          position: "absolute",
                          right: "0.75rem",
                          color: "#64748b",
                        }}
                      />
                    </div>
                  </div>

                  {/* Təxirə salma günləri */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.375rem",
                    }}
                  >
                    <label
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "#64748b",
                      }}
                    >
                      Təxirə salma günləri
                    </label>
                    <input
                      type="number"
                      value={invoiceDelayDays}
                      onChange={(e) => setInvoiceDelayDays(e.target.value)}
                      style={{
                        border: "1px solid #cbd5e1",
                        borderRadius: "0.375rem",
                        padding: "0.5rem 0.75rem",
                        outline: "none",
                        fontSize: "0.875rem",
                        backgroundColor: "#ffffff",
                      }}
                    />
                  </div>

                  {/* Tarixinə kimi ödə */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.375rem",
                    }}
                  >
                    <label
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "#64748b",
                      }}
                    >
                      Tarixinə kimi ödə{" "}
                      <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <div
                      style={{
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <input
                        type="text"
                        value={invoicePayUntilDate}
                        onChange={(e) => setInvoicePayUntilDate(e.target.value)}
                        style={{
                          width: "100%",
                          border: "1px solid #cbd5e1",
                          borderRadius: "0.375rem",
                          padding: "0.5rem 2.25rem 0.5rem 0.75rem",
                          outline: "none",
                          fontSize: "0.875rem",
                          backgroundColor: "#ffffff",
                        }}
                      />
                      <FiCalendar
                        style={{
                          position: "absolute",
                          right: "0.75rem",
                          color: "#64748b",
                        }}
                      />
                    </div>
                  </div>

                  {/* Daşıma qiyməti */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.375rem",
                    }}
                  >
                    <label
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "#64748b",
                      }}
                    >
                      Daşıma qiyməti <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={invoiceFreightPrice}
                      readOnly
                      title="Hesab sətirlərinin cəmi (miqdar × qiymət)"
                      placeholder="0.00"
                      style={{
                        border: "1px solid #cbd5e1",
                        borderRadius: "0.375rem",
                        padding: "0.5rem 0.75rem",
                        outline: "none",
                        fontSize: "0.875rem",
                        backgroundColor: "#f1f5f9",
                        color: "#64748b",
                      }}
                    />
                  </div>

                  {/* Valyuta */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.375rem",
                    }}
                  >
                    <label
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "#64748b",
                      }}
                    >
                      Valyuta <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <select
                      value={invoiceCurrency}
                      onChange={(e) => setInvoiceCurrency(e.target.value)}
                      style={{
                        border: "1px solid #cbd5e1",
                        borderRadius: "0.375rem",
                        padding: "0.5rem 0.75rem",
                        outline: "none",
                        fontSize: "0.875rem",
                        backgroundColor: "#ffffff",
                      }}
                    >
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                      <option value="AZN">AZN</option>
                      <option value="TRY">TRY</option>
                    </select>
                  </div>

                  {/* Məzənnənin t... */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.375rem",
                    }}
                  >
                    <label
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "#64748b",
                      }}
                    >
                      Məzənnənin t...
                    </label>
                    <div
                      style={{
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <input
                        type="text"
                        value={invoiceRateDate}
                        onChange={(e) => setInvoiceRateDate(e.target.value)}
                        style={{
                          width: "100%",
                          border: "1px solid #cbd5e1",
                          borderRadius: "0.375rem",
                          padding: "0.5rem 2.25rem 0.5rem 0.75rem",
                          outline: "none",
                          fontSize: "0.875rem",
                          backgroundColor: "#ffffff",
                        }}
                      />
                      <FiCalendar
                        style={{
                          position: "absolute",
                          right: "0.75rem",
                          color: "#64748b",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Hesabın Sətri Dynamic Rows Section */}
                <div
                  style={{
                    borderTop: "1px solid #cbd5e1",
                    paddingTop: "1.5rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      marginBottom: "1rem",
                    }}
                  >
                    <h4
                      style={{
                        margin: 0,
                        fontSize: "0.875rem",
                        fontWeight: 700,
                        color: "#475569",
                      }}
                    >
                      Hesabın sətri
                    </h4>
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
                        cursor: "pointer",
                      }}
                    >
                      +
                    </button>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "1rem",
                    }}
                  >
                    {(() => {
                      const current =
                        Number.parseFloat(
                          String(invoiceFreightPrice).replace(",", "."),
                        ) || 0;
                      const expected = invoiceExpectedPrice;
                      if (
                        expected == null ||
                        expected <= 0 ||
                        Math.abs(current - expected) < 0.0001
                      ) {
                        return null;
                      }
                      const currLabel = Number(current.toFixed(4)).toString();
                      const expLabel = Number(expected.toFixed(4)).toString();
                      const curr = invoiceCurrency || "";
                      const direction =
                        current > expected ? "yüksəltdiniz" : "azaltdınız";
                      return (
                        <div
                          style={{
                            background: "#fef3c7",
                            border: "1px solid #f59e0b",
                            color: "#92400e",
                            borderRadius: "0.375rem",
                            padding: "0.65rem 0.85rem",
                            fontSize: "0.825rem",
                            fontWeight: 600,
                          }}
                        >
                          Diqqət: daşıma qiyməti {expLabel} {curr} olmalıdır,
                          lakin siz qiyməti {currLabel} {curr}-a {direction}.
                          Bu yalnız xəbərdarlıqdır — hesabı saxlamağa davam
                          edə bilərsiniz.
                        </div>
                      );
                    })()}
                    {invoiceRows.map((row) => (
                      <div
                        key={row.id}
                        style={{
                          display: "flex",
                          gap: "1rem",
                          alignItems: "flex-start",
                          background: "#ffffff",
                          padding: "1rem",
                          borderRadius: "0.5rem",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        {/* Textarea */}
                        <div style={{ flex: 1 }}>
                          <textarea
                            value={row.text}
                            onChange={(e) => {
                              const textVal = e.target.value;
                              setInvoiceRows(
                                invoiceRows.map((r) =>
                                  r.id === row.id ? { ...r, text: textVal } : r,
                                ),
                              );
                            }}
                            rows={4}
                            style={{
                              width: "100%",
                              border: "1px solid #cbd5e1",
                              borderRadius: "0.375rem",
                              padding: "0.5rem",
                              outline: "none",
                              fontSize: "0.825rem",
                              resize: "vertical",
                            }}
                          />
                        </div>

                        {/* Vahid */}
                        <div style={{ width: "6.5rem" }}>
                          <label
                            style={{
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              color: "#64748b",
                              display: "block",
                              marginBottom: "0.25rem",
                            }}
                          >
                            Vahid
                          </label>
                          <input
                            type="text"
                            value={row.unit}
                            onChange={(e) => {
                              const val = e.target.value;
                              setInvoiceRows(
                                invoiceRows.map((r) =>
                                  r.id === row.id ? { ...r, unit: val } : r,
                                ),
                              );
                            }}
                            style={{
                              width: "100%",
                              border: "1px solid #cbd5e1",
                              borderRadius: "0.375rem",
                              padding: "0.5rem",
                              outline: "none",
                              fontSize: "0.825rem",
                            }}
                          />
                        </div>

                        {/* Miqdar */}
                        <div style={{ width: "5rem" }}>
                          <label
                            style={{
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              color: "#64748b",
                              display: "block",
                              marginBottom: "0.25rem",
                            }}
                          >
                            Miqdar <span style={{ color: "#ef4444" }}>*</span>
                          </label>
                          <input
                            type="number"
                            value={row.qty}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setInvoiceRows(
                                invoiceRows.map((r) =>
                                  r.id === row.id ? { ...r, qty: val } : r,
                                ),
                              );
                            }}
                            style={{
                              width: "100%",
                              border: "1px solid #cbd5e1",
                              borderRadius: "0.375rem",
                              padding: "0.5rem",
                              outline: "none",
                              fontSize: "0.825rem",
                            }}
                          />
                        </div>

                        {/* Qiymət */}
                        <div style={{ width: "6.5rem" }}>
                          <label
                            style={{
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              color: "#64748b",
                              display: "block",
                              marginBottom: "0.25rem",
                            }}
                          >
                            Qiymət <span style={{ color: "#ef4444" }}>*</span>
                          </label>
                          <input
                            type="number"
                            value={row.price}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setInvoiceRows(
                                invoiceRows.map((r) =>
                                  r.id === row.id ? { ...r, price: val } : r,
                                ),
                              );
                            }}
                            style={{
                              width: "100%",
                              border: "1px solid #cbd5e1",
                              borderRadius: "0.375rem",
                              padding: "0.5rem",
                              outline: "none",
                              fontSize: "0.825rem",
                              backgroundColor: "#ffffff",
                            }}
                          />
                        </div>

                        {/* ƏDV-siz */}
                        <div style={{ width: "6.5rem" }}>
                          <label
                            style={{
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              color: "#64748b",
                              display: "block",
                              marginBottom: "0.25rem",
                            }}
                          >
                            ƏDV-siz
                          </label>
                          <input
                            type="text"
                            disabled
                            value={((row.qty || 0) * (row.price || 0)).toFixed(
                              2,
                            )}
                            style={{
                              width: "100%",
                              border: "1px solid #cbd5e1",
                              borderRadius: "0.375rem",
                              padding: "0.5rem",
                              outline: "none",
                              fontSize: "0.825rem",
                              backgroundColor: "#f1f5f9",
                              color: "#64748b",
                            }}
                          />
                        </div>

                        {/* ƏDV ilə */}
                        <div style={{ width: "6.5rem" }}>
                          <label
                            style={{
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              color: "#64748b",
                              display: "block",
                              marginBottom: "0.25rem",
                            }}
                          >
                            ƏDV ilə
                          </label>
                          <input
                            type="text"
                            disabled
                            value={(
                              (row.qty || 0) *
                              (row.price || 0) *
                              (1 + (parseFloat(row.vatRate) || 0) / 100)
                            ).toFixed(2)}
                            style={{
                              width: "100%",
                              border: "1px solid #cbd5e1",
                              borderRadius: "0.375rem",
                              padding: "0.5rem",
                              outline: "none",
                              fontSize: "0.825rem",
                              backgroundColor: "#f1f5f9",
                              color: "#64748b",
                            }}
                          />
                        </div>

                        {/* ƏDV-nin tarifi */}
                        <div style={{ width: "6.5rem" }}>
                          <label
                            style={{
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              color: "#64748b",
                              display: "block",
                              marginBottom: "0.25rem",
                            }}
                          >
                            ƏDV-nin tarifi{" "}
                            <span style={{ color: "#ef4444" }}>*</span>
                          </label>
                          <select
                            value={row.vatRate}
                            onChange={(e) => {
                              const val = e.target.value;
                              setInvoiceRows(
                                invoiceRows.map((r) =>
                                  r.id === row.id ? { ...r, vatRate: val } : r,
                                ),
                              );
                            }}
                            style={{
                              width: "100%",
                              border: "1px solid #cbd5e1",
                              borderRadius: "0.375rem",
                              padding: "0.5rem",
                              outline: "none",
                              fontSize: "0.825rem",
                              backgroundColor: "#ffffff",
                            }}
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
                                transition: "background-color 0.2s",
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
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      marginTop: "1rem",
                      padding: "0.75rem",
                      border: "2px dashed #10b981",
                      borderRadius: "0.5rem",
                      background: "#f0fdf4",
                    }}
                  >
                    <button
                      type="button"
                      onClick={handleAddInvoiceRow}
                      title="Sətir əlavə et"
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
                        cursor: "pointer",
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Alınmış hesab — sənəd əlavə et (məcburi) */}
                {invoicesSubTab === "alinmis" && (
                  <div
                    style={{
                      borderTop: "1px solid #cbd5e1",
                      paddingTop: "1.5rem",
                      marginTop: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "0.75rem",
                        marginBottom: "0.75rem",
                        flexWrap: "wrap",
                      }}
                    >
                      <div>
                        <h4
                          style={{
                            margin: 0,
                            fontSize: "0.875rem",
                            fontWeight: 700,
                            color: "#475569",
                          }}
                        >
                          Sənəd{" "}
                          <span style={{ color: "#ef4444" }}>*</span>
                        </h4>
                        <p
                          style={{
                            margin: "0.25rem 0 0",
                            fontSize: "0.75rem",
                            color: "#94a3b8",
                          }}
                        >
                          Alınmış hesabı saxlamaq üçün ən azı bir sənəd əlavə
                          edin.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          invoicePendingFileRef.current?.click()
                        }
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          background: "#0f172a",
                          color: "#fff",
                          border: 0,
                          borderRadius: "0.375rem",
                          padding: "0.5rem 0.85rem",
                          fontSize: "0.825rem",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        <FiUpload /> Sənəd əlavə et
                      </button>
                      <input
                        ref={invoicePendingFileRef}
                        type="file"
                        multiple
                        accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.zip"
                        style={{ display: "none" }}
                        onChange={(e) => {
                          const files = e.target.files;
                          if (!files || files.length === 0) return;
                          const uploaded: InvoiceDocumentItem[] = Array.from(
                            files,
                          ).map((file) => ({
                            id: String(Date.now() + Math.random()),
                            name: file.name,
                            size: formatInvoiceDocSize(file.size),
                            url: URL.createObjectURL(file),
                            createdAt: new Date().toLocaleDateString("az-AZ"),
                            file,
                          }));
                          setInvoicePendingDocs((prev) => [
                            ...prev,
                            ...uploaded,
                          ]);
                          e.target.value = "";
                        }}
                      />
                    </div>
                    {invoicePendingDocs.length === 0 ? (
                      <div
                        style={{
                          border: "2px dashed #f59e0b",
                          background: "#fffbeb",
                          borderRadius: "0.5rem",
                          padding: "1rem",
                          color: "#92400e",
                          fontSize: "0.825rem",
                          fontWeight: 600,
                        }}
                      >
                        Sənəd əlavə olunmayıb — saxlama mümkün deyil.
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.5rem",
                        }}
                      >
                        {invoicePendingDocs.map((doc) => (
                          <div
                            key={doc.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.75rem",
                              padding: "0.65rem 0.85rem",
                              border: "1px solid #e2e8f0",
                              borderRadius: "0.5rem",
                              background: "#fff",
                            }}
                          >
                            <FiPaperclip
                              style={{ color: "#64748b", flexShrink: 0 }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: "0.825rem",
                                  fontWeight: 600,
                                  color: "#0f172a",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {doc.name}
                              </div>
                              <div
                                style={{
                                  fontSize: "0.7rem",
                                  color: "#94a3b8",
                                }}
                              >
                                {doc.size} · {doc.createdAt}
                              </div>
                            </div>
                            <a
                              href={
                                doc.url?.startsWith("blob:")
                                  ? doc.url
                                  : resolveUploadUrl(doc.url)
                              }
                              target="_blank"
                              rel="noreferrer"
                              title="Bax"
                              style={{
                                color: "#3b82f6",
                                padding: 4,
                                display: "flex",
                              }}
                            >
                              <FiEye />
                            </a>
                            <button
                              type="button"
                              title="Sil"
                              onClick={() =>
                                setInvoicePendingDocs((prev) =>
                                  prev.filter((d) => d.id !== doc.id),
                                )
                              }
                              style={{
                                border: 0,
                                background: "transparent",
                                color: "#dc2626",
                                cursor: "pointer",
                                padding: 4,
                                display: "flex",
                              }}
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "1.25rem 2rem",
                display: "flex",
                justifyContent: "flex-end",
                background: "transparent",
                borderTop: "1px solid #e2e8f0",
              }}
            >
              <button
                type="button"
                onClick={handleSaveInvoice}
                style={{
                  background:
                    invoicesSubTab === "alinmis" &&
                    invoicePendingDocs.length === 0
                      ? "#86efac"
                      : "#22c55e",
                  color: "#ffffff",
                  border: 0,
                  borderRadius: "0.375rem",
                  padding: "0.625rem 2rem",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  cursor:
                    invoicesSubTab === "alinmis" &&
                    invoicePendingDocs.length === 0
                      ? "not-allowed"
                      : "pointer",
                  transition: "background-color 0.2s",
                  opacity:
                    invoicesSubTab === "alinmis" &&
                    invoicePendingDocs.length === 0
                      ? 0.7
                      : 1,
                }}
                onMouseOver={(e) => {
                  if (
                    invoicesSubTab === "alinmis" &&
                    invoicePendingDocs.length === 0
                  )
                    return;
                  e.currentTarget.style.backgroundColor = "#16a34a";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor =
                    invoicesSubTab === "alinmis" &&
                    invoicePendingDocs.length === 0
                      ? "#86efac"
                      : "#22c55e";
                }}
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
                borderBottom: "1px solid #cbd5e1",
              }}
            >
              <span
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  color: "#475569",
                }}
              >
                Şərh etmək
              </span>
              <button
                type="button"
                onClick={() => setIsNewCommentModalOpen(false)}
                style={{
                  background: "transparent",
                  border: 0,
                  cursor: "pointer",
                  fontSize: "1.5rem",
                  color: "#0f172a",
                }}
              >
                <FiX />
              </button>
            </div>

            {/* Body */}
            <div
              style={{
                padding: "2rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "2rem",
                  flexWrap: "wrap",
                }}
              >
                {/* Şərh et */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.375rem",
                    minWidth: "18rem",
                  }}
                >
                  <label
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "#64748b",
                    }}
                  >
                    Şərh et
                  </label>
                  <select
                    value={commentCategory}
                    onChange={(e) => setCommentCategory(e.target.value)}
                    style={{
                      border: "1px solid #cbd5e1",
                      borderRadius: "0.375rem",
                      padding: "0.5rem",
                      outline: "none",
                      fontSize: "0.85rem",
                      backgroundColor: "#ffffff",
                    }}
                  >
                    <option value="Sifariş">Sifariş</option>
                    <option value="Reys">Reys</option>
                  </select>
                </div>

                {/* Checkbox 1 */}
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "0.85rem",
                    color: "#475569",
                    cursor: "pointer",
                    marginTop: "1rem",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={commentProvideAccessCustomer}
                    onChange={(e) =>
                      setCommentProvideAccessCustomer(e.target.checked)
                    }
                    style={{
                      width: "1.1rem",
                      height: "1.1rem",
                      accentColor: "#16a34a",
                    }}
                  />
                  Müştəriyə çıxışı təqdim et
                </label>

                {/* Checkbox 2 */}
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "0.85rem",
                    color: "#475569",
                    cursor: "pointer",
                    marginTop: "1rem",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={commentProvideAccessCarrier}
                    onChange={(e) =>
                      setCommentProvideAccessCarrier(e.target.checked)
                    }
                    style={{
                      width: "1.1rem",
                      height: "1.1rem",
                      accentColor: "#16a34a",
                    }}
                  />
                  Daşıyıcıya girişi təqdim et
                </label>
              </div>

              {/* Şərhlər */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.375rem",
                }}
              >
                <label
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#64748b",
                  }}
                >
                  Şərhlər <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={5}
                  style={{
                    width: "100%",
                    border: "1px solid #cbd5e1",
                    borderRadius: "0.375rem",
                    padding: "0.75rem",
                    outline: "none",
                    fontSize: "0.875rem",
                    boxSizing: "border-box",
                  }}
                  placeholder="Bura şərhinizi yazın..."
                />
              </div>

              {/* File Upload Box */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.375rem",
                }}
              >
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#64748b",
                  }}
                >
                  Fayl
                </span>
                <div
                  style={{
                    border: "2px dashed #cbd5e1",
                    borderRadius: "0.5rem",
                    padding: "2rem",
                    textAlign: "center",
                    background: "#ffffff",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    color: "#64748b",
                  }}
                >
                  Faylınızı Sürüşdürün & Buraxın ya da{" "}
                  <span
                    style={{
                      textDecoration: "underline",
                      color: "#16a34a",
                      fontWeight: 600,
                    }}
                  >
                    Seçin
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "1.25rem 2rem",
                display: "flex",
                justifyContent: "flex-end",
                borderTop: "1px solid #cbd5e1",
              }}
            >
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
                  transition: "background-color 0.2s",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = "#16a34a")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.backgroundColor = "#22c55e")
                }
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
                background: "#ffffff",
              }}
            >
              <div style={{ flex: 1, textAlign: "center" }}>
                <span
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color: "#1e293b",
                  }}
                >
                  Tapşırığa baxış
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsTaskModalOpen(false)}
                style={{
                  background: "transparent",
                  border: 0,
                  cursor: "pointer",
                  fontSize: "1.5rem",
                  color: "#ef4444",
                }}
              >
                <FiX />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: "2rem", overflowY: "auto", flex: 1 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.6fr 1fr",
                  gap: "2rem",
                  alignItems: "start",
                }}
              >
                {/* Left Column */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.5rem",
                  }}
                >
                  {/* Adı */}
                  <input
                    type="text"
                    placeholder="Adı"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    style={{
                      width: "100%",
                      border: "1px solid #cbd5e1",
                      borderRadius: "0.375rem",
                      padding: "0.75rem",
                      outline: "none",
                      fontSize: "1rem",
                      backgroundColor: "#ffffff",
                    }}
                  />

                  {/* Təsviri */}
                  <textarea
                    placeholder="Təsviri"
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    rows={8}
                    style={{
                      width: "100%",
                      border: "1px solid #cbd5e1",
                      borderRadius: "0.375rem",
                      padding: "0.75rem",
                      outline: "none",
                      fontSize: "0.875rem",
                      resize: "vertical",
                      backgroundColor: "#ffffff",
                    }}
                  />

                  {/* Çeklist */}
                  <div
                    style={{
                      background: "#ffffff",
                      padding: "1.25rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        color: "#475569",
                        display: "block",
                        marginBottom: "0.75rem",
                      }}
                    >
                      Çeklist
                    </span>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                        marginBottom: "0.75rem",
                      }}
                    >
                      {taskChecklist.map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                        >
                          <input
                            type="checkbox"
                            style={{ cursor: "pointer" }}
                          />
                          <span
                            style={{ fontSize: "0.85rem", color: "#334155" }}
                          >
                            {item}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              openDeleteConfirm(
                                "Elementi sil",
                                "Bu çeklist elementini silmək istədiyinizə əminsiniz?",
                                () =>
                                  setTaskChecklist(
                                    taskChecklist.filter((_, i) => i !== idx),
                                  ),
                              );
                            }}
                            style={{
                              background: "transparent",
                              border: 0,
                              cursor: "pointer",
                              color: "#ef4444",
                              fontSize: "0.8rem",
                              marginLeft: "auto",
                            }}
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
                        style={{
                          flex: 1,
                          border: "1px solid #cbd5e1",
                          borderRadius: "0.375rem",
                          padding: "0.375rem 0.5rem",
                          fontSize: "0.8rem",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (taskChecklistInput.trim()) {
                            setTaskChecklist([
                              ...taskChecklist,
                              taskChecklistInput.trim(),
                            ]);
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
                          gap: "0.25rem",
                        }}
                      >
                        <FiPlus />
                        Əlavə et
                      </button>
                    </div>
                  </div>

                  {/* Əlavə edilmiş fayllar */}
                  <div
                    style={{
                      background: "#ffffff",
                      padding: "1.25rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        color: "#475569",
                        display: "block",
                        marginBottom: "0.75rem",
                      }}
                    >
                      Əlavə edilmiş fayllar
                    </span>
                    <div
                      style={{
                        border: "2px dashed #cbd5e1",
                        borderRadius: "0.5rem",
                        padding: "2rem",
                        textAlign: "center",
                        fontSize: "0.85rem",
                        color: "#64748b",
                        cursor: "pointer",
                      }}
                    >
                      Faylınızı Sürüşdürün & Buraxın ya da Seçin
                    </div>
                  </div>
                </div>

                {/* Right Column / Control Panel */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                  }}
                >
                  {/* Müəllif */}
                  <div
                    style={{
                      background: "#ffffff",
                      padding: "0.75rem 1rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #e2e8f0",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <label
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: "#64748b",
                          display: "block",
                          marginBottom: "0.25rem",
                        }}
                      >
                        Müəllif
                      </label>
                      <input
                        type="text"
                        value={taskAuthor}
                        onChange={(e) => setTaskAuthor(e.target.value)}
                        style={{
                          width: "100%",
                          border: 0,
                          padding: 0,
                          outline: "none",
                          fontSize: "0.85rem",
                          backgroundColor: "transparent",
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setTaskAuthor("")}
                      style={{
                        background: "transparent",
                        border: 0,
                        cursor: "pointer",
                        color: "#cbd5e1",
                      }}
                    >
                      ×
                    </button>
                  </div>

                  {/* İcraçı */}
                  <div
                    style={{
                      background: "#ffffff",
                      padding: "0.75rem 1rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #e2e8f0",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <label
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: "#64748b",
                          display: "block",
                          marginBottom: "0.25rem",
                        }}
                      >
                        İcraçı
                      </label>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "0.25rem",
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            background: "#f1f5f9",
                            padding: "0.15rem 0.5rem",
                            borderRadius: "0.25rem",
                            fontSize: "0.775rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.25rem",
                          }}
                        >
                          {taskExecutor}
                          <button
                            type="button"
                            onClick={() => setTaskExecutor("")}
                            style={{
                              border: 0,
                              background: "transparent",
                              cursor: "pointer",
                              fontSize: "0.75rem",
                            }}
                          >
                            ×
                          </button>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Təkrarlanan tapşırıq */}
                  <div
                    style={{
                      background: "#ffffff",
                      padding: "0.75rem 1rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontSize: "0.85rem",
                        color: "#475569",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={taskIsRecurring}
                        onChange={(e) => setTaskIsRecurring(e.target.checked)}
                        style={{
                          width: "1.1rem",
                          height: "1.1rem",
                          accentColor: "#16a34a",
                        }}
                      />
                      Təkrarlanan tapşırıq
                    </label>
                    <span
                      style={{
                        color: "#3b82f6",
                        cursor: "pointer",
                        fontWeight: "bold",
                      }}
                    >
                      !
                    </span>
                  </div>

                  {/* Yaradılması tarix */}
                  <div
                    style={{
                      background: "#ffffff",
                      padding: "0.75rem 1rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #e2e8f0",
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "1rem",
                    }}
                  >
                    <div>
                      <label
                        style={{
                          fontSize: "0.725rem",
                          color: "#64748b",
                          display: "block",
                          marginBottom: "0.25rem",
                        }}
                      >
                        Yradılması tarix
                      </label>
                      <input
                        type="text"
                        value={taskCreatedDate}
                        onChange={(e) => setTaskCreatedDate(e.target.value)}
                        style={{
                          width: "100%",
                          border: 0,
                          padding: 0,
                          outline: "none",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                        }}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          fontSize: "0.725rem",
                          color: "#64748b",
                          display: "block",
                          marginBottom: "0.25rem",
                        }}
                      >
                        Vaxt
                      </label>
                      <input
                        type="text"
                        value={taskCreatedTime}
                        onChange={(e) => setTaskCreatedTime(e.target.value)}
                        style={{
                          width: "100%",
                          border: 0,
                          padding: 0,
                          outline: "none",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                        }}
                      />
                    </div>
                  </div>

                  {/* Son müddət */}
                  <div
                    style={{
                      background: "#ffffff",
                      padding: "0.75rem 1rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #e2e8f0",
                      display: "grid",
                      gridTemplateColumns: "1.2fr 1fr 1fr",
                      gap: "0.75rem",
                    }}
                  >
                    <div>
                      <label
                        style={{
                          fontSize: "0.725rem",
                          color: "#64748b",
                          display: "block",
                          marginBottom: "0.25rem",
                        }}
                      >
                        Son müddət
                      </label>
                      <input
                        type="text"
                        placeholder="28.05.2026"
                        value={taskDueDate}
                        onChange={(e) => setTaskDueDate(e.target.value)}
                        style={{
                          width: "100%",
                          border: 0,
                          padding: 0,
                          outline: "none",
                          fontSize: "0.85rem",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          fontSize: "0.725rem",
                          color: "#64748b",
                          display: "block",
                          marginBottom: "0.25rem",
                        }}
                      >
                        Vaxt
                      </label>
                      <input
                        type="text"
                        placeholder="18:00"
                        value={taskDueTime}
                        onChange={(e) => setTaskDueTime(e.target.value)}
                        style={{
                          width: "100%",
                          border: 0,
                          padding: 0,
                          outline: "none",
                          fontSize: "0.85rem",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          fontSize: "0.725rem",
                          color: "#64748b",
                          display: "block",
                          marginBottom: "0.25rem",
                        }}
                      >
                        Qədər
                      </label>
                      <input
                        type="text"
                        value={taskDueAmount}
                        onChange={(e) => setTaskDueAmount(e.target.value)}
                        style={{
                          width: "100%",
                          border: 0,
                          padding: 0,
                          outline: "none",
                          fontSize: "0.85rem",
                        }}
                      />
                    </div>
                  </div>

                  {/* Xatırlat Checkbox */}
                  <div
                    style={{
                      background: "#ffffff",
                      padding: "0.75rem 1rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontSize: "0.85rem",
                        color: "#475569",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={taskRemind}
                        onChange={(e) => setTaskRemind(e.target.checked)}
                        style={{
                          width: "1.1rem",
                          height: "1.1rem",
                          accentColor: "#16a34a",
                        }}
                      />
                      Xatırlat
                    </label>
                    <span
                      style={{
                        color: "#3b82f6",
                        cursor: "pointer",
                        fontWeight: "bold",
                      }}
                    >
                      !
                    </span>
                  </div>

                  {/* Xatırlat Options */}
                  {taskRemind && (
                    <div
                      style={{
                        background: "#ffffff",
                        padding: "0.75rem 1rem",
                        borderRadius: "0.5rem",
                        border: "1px solid #e2e8f0",
                        display: "grid",
                        gridTemplateColumns: "1.5fr 1fr",
                        gap: "1rem",
                      }}
                    >
                      <div>
                        <label
                          style={{
                            fontSize: "0.725rem",
                            color: "#64748b",
                            display: "block",
                            marginBottom: "0.25rem",
                          }}
                        >
                          Xatırlat
                        </label>
                        <select
                          value={taskRemindDay}
                          onChange={(e) => setTaskRemindDay(e.target.value)}
                          style={{
                            width: "100%",
                            border: 0,
                            padding: 0,
                            outline: "none",
                            fontSize: "0.85rem",
                            backgroundColor: "transparent",
                          }}
                        >
                          <option value="İcra günündə">İcra günündə</option>
                          <option value="1 gün əvvəl">1 gün əvvəl</option>
                        </select>
                      </div>
                      <div>
                        <label
                          style={{
                            fontSize: "0.725rem",
                            color: "#64748b",
                            display: "block",
                            marginBottom: "0.25rem",
                          }}
                        >
                          Vaxt
                        </label>
                        <input
                          type="text"
                          value={taskRemindTime}
                          onChange={(e) => setTaskRemindTime(e.target.value)}
                          style={{
                            width: "100%",
                            border: 0,
                            padding: 0,
                            outline: "none",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "1.25rem 2rem",
                display: "flex",
                justifyContent: "space-between",
                borderTop: "1px solid #cbd5e1",
                background: "#ffffff",
              }}
            >
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
                    gap: "0.375rem",
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
                  gap: "0.5rem",
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
              fontFamily: "Inter, sans-serif",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "1.25rem 2rem 0.5rem 2rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "transparent",
              }}
            >
              <span
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 500,
                  color: "#5a738e",
                }}
              >
                Yeni müqavilə
              </span>
              <button
                type="button"
                onClick={() => setIsNewContractModalOpen(false)}
                style={{
                  background: "transparent",
                  border: 0,
                  cursor: "pointer",
                  fontSize: "1.5rem",
                  color: "#000000",
                  fontWeight: "bold",
                }}
              >
                <FiX />
              </button>
            </div>

            {/* Body */}
            <div
              style={{
                padding: "1.5rem 2rem 2rem 2rem",
                overflowY: "auto",
                flex: 1,
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {/* Şirkət */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.375rem",
                  }}
                >
                  <label style={{ fontSize: "0.85rem", color: "#8a99ad" }}>
                    Şirkət
                  </label>
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
                        cursor: "pointer",
                      }}
                    >
                      <option value="Ziyafreight">Ziyafreight</option>
                      <option value="Ziyalog LLC">Ziyalog LLC</option>
                    </select>
                    <div
                      style={{
                        position: "absolute",
                        right: "0.75rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        pointerEvents: "none",
                      }}
                    >
                      <span
                        style={{
                          color: "#000000",
                          fontSize: "0.9rem",
                          fontWeight: "bold",
                        }}
                      >
                        ×
                      </span>
                      <span style={{ color: "#94a3b8", fontSize: "0.55rem" }}>
                        ▼
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tip */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  <label style={{ fontSize: "0.85rem", color: "#8a99ad" }}>
                    Tip <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <div style={{ display: "flex", gap: "2rem" }}>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontSize: "0.9rem",
                        color: "#000000",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        name="contractType"
                        checked={contractType === "template"}
                        onChange={() => setContractType("template")}
                        style={{ display: "none" }}
                      />
                      <span
                        style={{
                          width: "1.25rem",
                          height: "1.25rem",
                          borderRadius: "50%",
                          border:
                            contractType === "template"
                              ? "2px solid #5cb85c"
                              : "2px solid #cbd5e1",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background:
                            contractType === "template" ? "#5cb85c" : "#ffffff",
                          transition: "all 0.2s",
                        }}
                      >
                        {contractType === "template" && (
                          <span
                            style={{
                              width: "0.5rem",
                              height: "0.5rem",
                              borderRadius: "50%",
                              background: "#ffffff",
                            }}
                          />
                        )}
                      </span>
                      Sənədin şablonu
                    </label>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontSize: "0.9rem",
                        color: "#000000",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        name="contractType"
                        checked={contractType === "file"}
                        onChange={() => setContractType("file")}
                        style={{ display: "none" }}
                      />
                      <span
                        style={{
                          width: "1.25rem",
                          height: "1.25rem",
                          borderRadius: "50%",
                          border:
                            contractType === "file"
                              ? "2px solid #5cb85c"
                              : "2px solid #cbd5e1",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background:
                            contractType === "file" ? "#5cb85c" : "#ffffff",
                          transition: "all 0.2s",
                        }}
                      >
                        {contractType === "file" && (
                          <span
                            style={{
                              width: "0.5rem",
                              height: "0.5rem",
                              borderRadius: "50%",
                              background: "#ffffff",
                            }}
                          />
                        )}
                      </span>
                      Əlavə edilmiş fayl
                    </label>
                  </div>
                </div>

                {/* Reys və Yük üçün müqavilə (Flex grid) */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1.5rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.375rem",
                    }}
                  >
                    <label style={{ fontSize: "0.85rem", color: "#8a99ad" }}>
                      Reys üçün müqavilə
                    </label>
                    <div
                      style={{
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          width: "100%",
                          border: "1px solid #cbd5e1",
                          borderRadius: "0.375rem",
                          padding: "0.375rem 0.5rem",
                          background: "#ffffff",
                          minHeight: "2.35rem",
                          boxSizing: "border-box",
                        }}
                      >
                        {contractVoyage ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.25rem",
                              background: "#e2e8f0",
                              color: "#000000",
                              padding: "0.15rem 0.5rem",
                              borderRadius: "0.25rem",
                              fontSize: "0.85rem",
                            }}
                          >
                            <span
                              style={{
                                cursor: "pointer",
                                fontWeight: "bold",
                                color: "#94a3b8",
                              }}
                              onClick={() => setContractVoyage("")}
                            >
                              ×
                            </span>
                            {contractVoyage}
                          </span>
                        ) : (
                          <span
                            style={{ color: "#94a3b8", fontSize: "0.85rem" }}
                          >
                            Dəyəri seçin
                          </span>
                        )}
                        <span
                          style={{
                            marginLeft: "auto",
                            cursor: "pointer",
                            fontWeight: "bold",
                            color: "#000000",
                            fontSize: "1rem",
                          }}
                          onClick={() => setContractVoyage("")}
                        >
                          ×
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.375rem",
                    }}
                  >
                    <label style={{ fontSize: "0.85rem", color: "#8a99ad" }}>
                      Yük üçün müqavilə
                    </label>
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
                          color:
                            contractLoad === "Dəyəri seçin"
                              ? "#94a3b8"
                              : "#334155",
                          appearance: "none",
                          cursor: "pointer",
                        }}
                      >
                        <option value="Dəyəri seçin">Dəyəri seçin</option>
                        <option value="General cargo">General cargo</option>
                      </select>
                      <div
                        style={{
                          position: "absolute",
                          right: "0.75rem",
                          top: "50%",
                          transform: "translateY(-50%)",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          pointerEvents: "none",
                        }}
                      >
                        <span style={{ color: "#cbd5e1", fontSize: "0.55rem" }}>
                          ▼
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Şablon */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.375rem",
                  }}
                >
                  <label style={{ fontSize: "0.85rem", color: "#8a99ad" }}>
                    Şablon <span style={{ color: "#ef4444" }}>*</span>
                  </label>
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
                        color:
                          contractTemplate === "Dəyəri seçin"
                            ? "#94a3b8"
                            : "#334155",
                        appearance: "none",
                        cursor: "pointer",
                      }}
                    >
                      <option value="Dəyəri seçin">Dəyəri seçin</option>
                      <option value="Standard Agreement">
                        Standard Agreement
                      </option>
                    </select>
                    <div
                      style={{
                        position: "absolute",
                        right: "0.75rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        pointerEvents: "none",
                      }}
                    >
                      <span style={{ color: "#94a3b8", fontSize: "0.55rem" }}>
                        ▼
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sənədin nömrəsi, tarixi, adı (Grid) */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1.2fr",
                    gap: "1.5rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.375rem",
                    }}
                  >
                    <label style={{ fontSize: "0.85rem", color: "#8a99ad" }}>
                      Sənədin nömrəsi
                    </label>
                    <input
                      type="text"
                      value={contractDocNumber}
                      onChange={(e) => setContractDocNumber(e.target.value)}
                      style={{
                        border: "1px solid #cbd5e1",
                        borderRadius: "0.375rem",
                        padding: "0.55rem 0.75rem",
                        fontSize: "0.9rem",
                        outline: "none",
                        backgroundColor: "#ffffff",
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.375rem",
                    }}
                  >
                    <label style={{ fontSize: "0.85rem", color: "#8a99ad" }}>
                      Sənədin tarixi
                    </label>
                    <div
                      style={{
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <input
                        type="text"
                        value={contractDocDate}
                        onChange={(e) => setContractDocDate(e.target.value)}
                        style={{
                          width: "100%",
                          border: "1px solid #cbd5e1",
                          borderRadius: "0.375rem",
                          padding: "0.55rem 2.25rem 0.55rem 0.75rem",
                          fontSize: "0.9rem",
                          outline: "none",
                          backgroundColor: "#ffffff",
                        }}
                      />
                      <FiCalendar
                        style={{
                          position: "absolute",
                          right: "0.75rem",
                          color: "#cbd5e1",
                        }}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.375rem",
                    }}
                  >
                    <label style={{ fontSize: "0.85rem", color: "#8a99ad" }}>
                      Sənədin adı
                    </label>
                    <input
                      type="text"
                      value={contractDocName}
                      onChange={(e) => setContractDocName(e.target.value)}
                      style={{
                        border: "1px solid #cbd5e1",
                        borderRadius: "0.375rem",
                        padding: "0.55rem 0.75rem",
                        fontSize: "0.9rem",
                        outline: "none",
                        backgroundColor: "#ffffff",
                      }}
                    />
                  </div>
                </div>

                {/* Checkboxes vertically aligned */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                    marginTop: "0.5rem",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontSize: "0.9rem",
                      color: "#000000",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={contractHasValidity}
                      onChange={(e) => setContractHasValidity(e.target.checked)}
                      style={{
                        width: "1.1rem",
                        height: "1.1rem",
                        accentColor: "#5cb85c",
                      }}
                    />
                    Sənədin etibarlılıq müddəti
                  </label>

                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontSize: "0.9rem",
                      color: "#000000",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={contractProvideAccessCustomer}
                      onChange={(e) =>
                        setContractProvideAccessCustomer(e.target.checked)
                      }
                      style={{
                        width: "1.1rem",
                        height: "1.1rem",
                        accentColor: "#5cb85c",
                      }}
                    />
                    Müştəriyə çıxışı təqdim et
                  </label>

                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontSize: "0.9rem",
                      color: "#000000",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={contractProvideAccessCarrier}
                      onChange={(e) =>
                        setContractProvideAccessCarrier(e.target.checked)
                      }
                      style={{
                        width: "1.1rem",
                        height: "1.1rem",
                        accentColor: "#5cb85c",
                      }}
                    />
                    Daşıyıcıya girişi təqdim et
                  </label>

                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontSize: "0.9rem",
                      color: "#000000",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={contractSendNotif}
                      onChange={(e) => setContractSendNotif(e.target.checked)}
                      style={{
                        width: "1.1rem",
                        height: "1.1rem",
                        accentColor: "#5cb85c",
                      }}
                    />
                    Göndərmə barədə məlumat verin
                  </label>
                </div>

                {/* Şərhlər */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.375rem",
                  }}
                >
                  <label style={{ fontSize: "0.85rem", color: "#8a99ad" }}>
                    Şərhlər
                  </label>
                  <textarea
                    value={contractComments}
                    onChange={(e) => setContractComments(e.target.value)}
                    rows={4}
                    style={{
                      width: "100%",
                      border: "1px solid #cbd5e1",
                      borderRadius: "0.375rem",
                      padding: "0.75rem",
                      outline: "none",
                      fontSize: "0.9rem",
                      boxSizing: "border-box",
                      resize: "both",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "1.25rem 2rem",
                display: "flex",
                justifyContent: "center",
                gap: "1rem",
                background: "transparent",
              }}
            >
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
                  cursor: "pointer",
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
                  cursor: "pointer",
                }}
              >
                Müqaviləni yaddaşda saxla və tamamla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className={styles.footer}>Ziyalog Copyright © 2013-2026</footer>
    </div>
  );
}
