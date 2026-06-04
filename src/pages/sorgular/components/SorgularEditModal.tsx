import { SorguStatus } from "../types/sorgu.types";
const statusOptions: SelectOption[] = [
  { value: SorguStatus.Pending, label: "Gözləmədə" },
  { value: "completed", label: "Tamamlandı" },
  { value: "cancelled", label: "Ləğv edildi" },
  { value: SorguStatus.Approved, label: "Təsdiq edildi" },
];
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { FaInfoCircle, FaMapMarkerAlt } from "react-icons/fa";
import Select from "../../../common/components/select/Select";
import type { SelectOption } from "../../../common/components/select/Select";
import { useAppDispatch } from "../../../common/store/hooks";
import { showNotification } from "../../../common/store/modalSlice";
import styles from "./SorgularEditModal.module.css";
import {
  CARGO_CURRENCY_OPTIONS,
  CARGO_TRANSPORT_OPTIONS,
  COMPANY_OPTIONS,
  COUNTRY_OPTIONS,
  CUSTOMER_OPTIONS,
  DEPT_OPTIONS,
  PACKAGING_TYPE_OPTIONS,
  TRANSPORT_PARENT_KIND_OPTIONS,
} from "../constants/options.constants";
import { useAuth } from "../../../common/contexts/AuthContext";
import { fetchUsersAction } from "../../../common/actions/user.actions";
import { fetchContactPersonsAction } from "../../../common/actions/contact.actions";
import { fetchLookupAction, createLookupAction } from "../../../common/actions/lookup.actions";
import { fetchCustomersAction } from "../../../common/actions/customer.actions";
import { LookupManagerModal } from "../../../common/components/modal/LookupManagerModal";

const panelTransitionMs = 320;

const placeholderOpts = (extra: SelectOption[] = []): SelectOption[] => [
  { value: "", label: "Dəyəri seçin" },
  ...extra,
];

const companyOptions = placeholderOpts(COMPANY_OPTIONS);
const deptOptions = placeholderOpts(DEPT_OPTIONS);
const customerOptions = placeholderOpts(CUSTOMER_OPTIONS);
const simpleSelect = placeholderOpts();
const countryOptions = placeholderOpts(COUNTRY_OPTIONS);
const cargoTransportOptions = placeholderOpts(CARGO_TRANSPORT_OPTIONS);
const transportParentKindOptions = placeholderOpts(TRANSPORT_PARENT_KIND_OPTIONS);
const cargoCurrencyOptions = placeholderOpts(CARGO_CURRENCY_OPTIONS);
const packagingTypeOptions = placeholderOpts(PACKAGING_TYPE_OPTIONS);

export interface CargoPackagingRow {
  id: string;
  packagingType: string;
  packagingExtra: string;
  lengthM: string;
  widthM: string;
  heightM: string;
  volumeM3: string;
}

export interface CargoItemForm {
  id: string;
  name: string;
  weight: string;
  ldm: string;
  transportType: string;
  cargoValue: string;
  currency: string;
  packagingRows: CargoPackagingRow[];
  incompleteLoad: boolean;
  additionalInfo: string;
}

function createPackagingRow(): CargoPackagingRow {
  return {
    id: crypto.randomUUID(),
    packagingType: "",
    packagingExtra: "",
    lengthM: "",
    widthM: "",
    heightM: "",
    volumeM3: "",
  };
}

function createCargoItem(): CargoItemForm {
  return {
    id: crypto.randomUUID(),
    name: "",
    weight: "",
    ldm: "",
    transportType: "",
    cargoValue: "",
    currency: "",
    packagingRows: [createPackagingRow()],
    incompleteLoad: false,
    additionalInfo: "",
  };
}

export interface NewSorguFormPayload {
  tabSnapshot: "main" | "cargo";
  fields: Record<string, string | boolean | undefined>;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: NewSorguFormPayload) => void;
  title?: string;
  description?: string;
  submitLabel?: string;
  initialValues?: Record<string, any>;
}

function PlusButton({
  title,
  onClick,
  variant = "default",
  className = "",
}: {
  title: string;
  onClick: () => void;
  variant?: "default" | "emerald";
  className?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`${styles.plusButton} ${variant === "emerald" ? styles.plusButtonEmerald : ""} ${className}`}
      aria-label={title}
    >
      +
    </button>
  );
}

function Label({
  children,
  required,
}: {
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <span className={styles.label}>
      {children}
      {required ? <span className={styles.requiredMark}>*</span> : null}
    </span>
  );
}

function ModalSentenceLabel({
  children,
  required,
}: {
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <span className={styles.sentenceLabel}>
      {children}
      {required ? <span className={styles.requiredMark}>*</span> : null}
    </span>
  );
}

export default function SorgularEditModal({
  isOpen,
  onClose,
  onSubmit,
  title = "Yeni sorğu",
  description = "Sorğu məlumatlarını doldurub yaddaşa əlavə edin.",
  submitLabel = "Yaddaşda saxlamaq",
  initialValues = {},
}: Props) {
  const dispatch = useAppDispatch();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [tab, setTab] = useState<"main" | "cargo">("main");
  const openAnimationFrameRef = useRef<number | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  const { user } = useAuth();

  // Real data states
  const [usersData, setUsersData] = useState<any[]>([]);
  const [contactsData, setContactsData] = useState<any[]>([]);
  const [customersData, setCustomersData] = useState<any[]>([]);
  const [tagsData, setTagsData] = useState<any[]>([]);
  const [sourcesData, setSourcesData] = useState<any[]>([]);
  const [purposesData, setPurposesData] = useState<any[]>([]);
  const [specsData, setSpecsData] = useState<any[]>([]);
  const [incotermsData, setIncotermsData] = useState<any[]>([]);

  // Lookup Modal States
  const [lookupModalOpen, setLookupModalOpen] = useState(false);
  const [lookupModalType, setLookupModalType] = useState("");
  const [lookupModalTitle, setLookupModalTitle] = useState("");

  const [isNewContactModalOpen, setIsNewContactModalOpen] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  // Ana form state'leri
  const [company, setCompany] = useState("ziyafreight");
  const [manager, setManager] = useState(user?.id?.toString() ?? "");
  const [logist, setLogist] = useState("");
  const [customer, setCustomer] = useState("");
  const [contractNumber, setContractNumber] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [extremelyUrgent, setExtremelyUrgent] = useState(false);
  const [tags, setTags] = useState("");
  const [inquirySource, setInquirySource] = useState("");
  const [inquiryPurpose, setInquiryPurpose] = useState("");
  const [cargoComposition, setCargoComposition] = useState("");
  const [cargoSpecs, setCargoSpecs] = useState("");
  const [incoterms, setIncoterms] = useState("");

  // Yükləmə yeri
  const [loadPlaceCompany, setLoadPlaceCompany] = useState("");
  const [loadCity, setLoadCity] = useState("");
  const [loadCountry, setLoadCountry] = useState("");
  const [loadPostal, setLoadPostal] = useState("");
  const [loadAddress, setLoadAddress] = useState("");
  const [loadCoordinates, setLoadCoordinates] = useState("");
  const [loadSaveTerminal, setLoadSaveTerminal] = useState(false);

  // Boşaltma yeri
  const [unloadPlaceCompany, setUnloadPlaceCompany] = useState("");
  const [unloadCity, setUnloadCity] = useState("");
  const [unloadCountry, setUnloadCountry] = useState("");
  const [unloadPostal, setUnloadPostal] = useState("");
  const [unloadAddress, setUnloadAddress] = useState("");
  const [unloadCoordinates, setUnloadCoordinates] = useState("");
  const [unloadSaveTerminal, setUnloadSaveTerminal] = useState(false);

  const [additionalInfo, setAdditionalInfo] = useState("");

  // Yük məlumatları
  const [cargoItems, setCargoItems] = useState<CargoItemForm[]>([
    createCargoItem(),
  ]);

  // Transport type modal
  const [transportTypeModalOpen, setTransportTypeModalOpen] = useState(false);
  const [newTransportName, setNewTransportName] = useState("");
  const [newTransportParentKind, setNewTransportParentKind] =
    useState("avtoreys");
  const [newTransportActive, setNewTransportActive] = useState(true);

  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerManager, setNewCustomerManager] = useState("");
  const [newCustomerContact, setNewCustomerContact] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerAddress, setNewCustomerAddress] = useState("");

  // Query modelindən gələn əlavə state'lər
  const [createdAt, setCreatedAt] = useState("");
  const [status, setStatus] = useState("");
  const [transportType, setTransportType] = useState("");
  const [cargoInfo, setCargoInfo] = useState("");
  const [loadPlace, setLoadPlace] = useState("");
  const [recipient, setRecipient] = useState("");
  const [unloadPlace, setUnloadPlace] = useState("");
  const [loadDate, setLoadDate] = useState("");
  const [unloadDate, setUnloadDate] = useState("");
  const [priceOffers, setPriceOffers] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [archived, setArchived] = useState(false);
  const [seller, setSeller] = useState("");
  const [purpose, setPurpose] = useState("");

  // Initial values-ları modal açıldığında doldur
  useEffect(() => {
    if (!isOpen) return;

    if (initialValues && Object.keys(initialValues).length > 0) {
      const data = initialValues as Record<string, any>;

      // Ana alanlar
      setCompany(data.company || "ziyafreight");
      setManager(data.manager || "");
      setLogist(data.logist || "");
      setCustomer(data.customer || "");
      setContractNumber(data.contractNumber || "");
      setContactPerson(data.contactPerson || "");
      setExtremelyUrgent(data.extremelyUrgent === true);
      setTags(data.tags || "");
      setInquirySource(data.inquirySource || "");
      setInquiryPurpose(data.inquiryPurpose || "");
      setCargoComposition(data.cargoComposition || "");
      setCargoSpecs(data.cargoSpecs || "");
      setIncoterms(data.incoterms || "");

      // Yükləmə yeri
      setLoadPlaceCompany(data.loadPlaceCompany || "");
      setLoadCity(data.loadCity || "");
      setLoadCountry(data.loadCountry || "");
      setLoadPostal(data.loadPostal || "");
      setLoadAddress(data.loadAddress || "");
      setLoadCoordinates(data.loadCoordinates || "");
      setLoadSaveTerminal(data.loadSaveTerminal === true);

      // Boşaltma yeri
      setUnloadPlaceCompany(data.unloadPlaceCompany || "");
      setUnloadCity(data.unloadCity || "");
      setUnloadCountry(data.unloadCountry || "");
      setUnloadPostal(data.unloadPostal || "");
      setUnloadAddress(data.unloadAddress || "");
      setUnloadCoordinates(data.unloadCoordinates || "");
      setUnloadSaveTerminal(data.unloadSaveTerminal === true);

      // Göndərən/Alıcı (Silindi)
      setAdditionalInfo(data.additionalInfo || "");

      // Yük məlumatları
      if (Array.isArray(data.cargoItems)) {
        setCargoItems(data.cargoItems);
      } else if (typeof data.cargoItemsJson === "string") {
        try {
          const parsed = JSON.parse(data.cargoItemsJson);
          setCargoItems(Array.isArray(parsed) ? parsed : [createCargoItem()]);
        } catch {
          setCargoItems([createCargoItem()]);
        }
      } else {
        setCargoItems([createCargoItem()]);
      }

      // Query modelindən gələn alanlar
      setCreatedAt(data.createdAt || "");
      setStatus(data.status || "");
      setTransportType(data.transportType || "");
      setCargoInfo(data.cargoInfo || "");
      setLoadPlace(data.loadPlace || "");
      setRecipient(data.recipient || "");
      setUnloadPlace(data.unloadPlace || "");
      setLoadDate(data.loadDate || "");
      setUnloadDate(data.unloadDate || "");
      setPriceOffers(data.priceOffers || "");
      setConfirmed(data.confirmed === true);
      setArchived(data.archived === true);
      setSeller(data.seller || "");
      setPurpose(data.purpose || "");
    } else {
      // Yeni qeyd olduqda varsayılan dəyərləri təyin et
      resetFormStates();
    }
  }, [isOpen, initialValues]);

  const resetFormStates = useCallback(() => {
    setTab("main");
    setCompany("ziyafreight");
    setManager(user?.id?.toString() ?? "");
    setLogist("");
    setCustomer("");
    setContractNumber("");
    setContactPerson("");
    setExtremelyUrgent(false);
    setTags("");
    setInquirySource("");
    setInquiryPurpose("");
    setCargoComposition("");
    setCargoSpecs("");
    setIncoterms("");
    setLoadPlaceCompany("");
    setLoadCity("");
    setLoadCountry("");
    setLoadPostal("");
    setLoadAddress("");
    setLoadCoordinates("");
    setLoadSaveTerminal(false);
    setUnloadPlaceCompany("");
    setUnloadCity("");
    setUnloadCountry("");
    setUnloadPostal("");
    setUnloadAddress("");
    setUnloadCoordinates("");
    setUnloadSaveTerminal(false);
    setAdditionalInfo("");
    setCargoItems([createCargoItem()]);
    setCreatedAt("");
    setStatus("");
    setTransportType("");
    setCargoInfo("");
    setLoadPlace("");
    setRecipient("");
    setUnloadPlace("");
    setLoadDate("");
    setUnloadDate("");
    setPriceOffers("");
    setConfirmed(false);
    setArchived(false);
    setSeller("");
    setPurpose("");
  }, []);

  const openNewTransportTypeModal = useCallback(() => {
    setNewTransportName("");
    setNewTransportParentKind("avtoreys");
    setNewTransportActive(true);
    setTransportTypeModalOpen(true);
  }, []);

  const closeNewTransportTypeModal = useCallback(() => {
    setTransportTypeModalOpen(false);
  }, []);

  const saveNewTransportTypeModal = useCallback(() => {
    dispatch(
      showNotification({
        message: "Nəqliyyat tipi yadda saxlanıldı (demo).",
        type: "success",
        autoCloseDuration: 3200,
      }),
    );
    setTransportTypeModalOpen(false);
  }, [dispatch]);

  const openNewCustomerModal = useCallback(() => {
    setNewCustomerName("");
    setNewCustomerManager("");
    setNewCustomerContact("");
    setNewCustomerPhone("");
    setNewCustomerAddress("");
    setCustomerModalOpen(true);
  }, []);

  const closeNewCustomerModal = useCallback(() => {
    setCustomerModalOpen(false);
  }, []);

  const saveNewCustomerModal = useCallback(() => {
    dispatch(
      showNotification({
        message: "Yeni müştəri yadda saxlanıldı (demo).",
        type: "success",
        autoCloseDuration: 3200,
      }),
    );
    setCustomerModalOpen(false);
  }, [dispatch]);

  const loadData = useCallback(async () => {
    try {
      const [u, c, cust, t, s, p, sp, inc] = await Promise.all([
        fetchUsersAction(),
        fetchContactPersonsAction(),
        fetchCustomersAction(),
        fetchLookupAction("tags"),
        fetchLookupAction("inquiry-sources"),
        fetchLookupAction("inquiry-purposes"),
        fetchLookupAction("cargo-specs"),
        fetchLookupAction("incoterms")
      ]);
      setUsersData(u);
      setContactsData(c);
      setCustomersData(cust);
      setTagsData(t);
      setSourcesData(s);
      setPurposesData(p);
      setSpecsData(sp);
      setIncotermsData(inc);
      if (!manager && user?.id) {
        setManager(user.id.toString());
      }
    } catch (e) {
      console.error("Data load failed", e);
    }
  }, [manager, user]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, loadData]);

  const openLookupModal = (type: string, title: string) => {
    setLookupModalType(type);
    setLookupModalTitle(title);
    setLookupModalOpen(true);
  };

  const handleLookupDataChanged = (newData: any[]) => {
    switch (lookupModalType) {
      case "tags": setTagsData(newData); break;
      case "inquiry-sources": setSourcesData(newData); break;
      case "inquiry-purposes": setPurposesData(newData); break;
      case "cargo-specs": setSpecsData(newData); break;
      case "incoterms": setIncotermsData(newData); break;
    }
  };

  const notifyPlus = useCallback(
    (label: string) => {
      dispatch(
        showNotification({
          message: `${label} — yeni qeyd tezliklə əlavə olunacaq.`,
          type: "info",
          autoCloseDuration: 2800,
        }),
      );
    },
    [dispatch],
  );

  const patchCargo = useCallback(
    (cargoId: string, patch: Partial<CargoItemForm>) => {
      setCargoItems((prev) =>
        prev.map((cargo) =>
          cargo.id === cargoId ? { ...cargo, ...patch } : cargo,
        ),
      );
    },
    [],
  );

  const updatePackagingRow = useCallback(
    (cargoId: string, rowId: string, patch: Partial<CargoPackagingRow>) => {
      setCargoItems((prev) =>
        prev.map((cargo) => {
          if (cargo.id !== cargoId) return cargo;
          return {
            ...cargo,
            packagingRows: cargo.packagingRows.map((row) =>
              row.id === rowId ? { ...row, ...patch } : row,
            ),
          };
        }),
      );
    },
    [],
  );

  const addPackagingRowAfter = useCallback(
    (cargoId: string, afterIndex: number) => {
      setCargoItems((prev) =>
        prev.map((cargo) => {
          if (cargo.id !== cargoId) return cargo;
          const next = [...cargo.packagingRows];
          next.splice(afterIndex + 1, 0, createPackagingRow());
          return { ...cargo, packagingRows: next };
        }),
      );
    },
    [],
  );

  const removePackagingRow = useCallback((cargoId: string, rowId: string) => {
    setCargoItems((prev) =>
      prev.map((cargo) => {
        if (cargo.id !== cargoId || cargo.packagingRows.length <= 1) {
          return cargo;
        }
        return {
          ...cargo,
          packagingRows: cargo.packagingRows.filter((row) => row.id !== rowId),
        };
      }),
    );
  }, []);

  const removeCargo = useCallback((cargoId: string) => {
    setCargoItems((prev) =>
      prev.length <= 1 ? prev : prev.filter((cargo) => cargo.id !== cargoId),
    );
  }, []);

  const addCargo = useCallback(() => {
    setCargoItems((prev) => [...prev, createCargoItem()]);
  }, []);

  // Modal animasiyası
  useEffect(() => {
    if (openAnimationFrameRef.current !== null) {
      cancelAnimationFrame(openAnimationFrameRef.current);
      openAnimationFrameRef.current = null;
    }
    if (closeTimeoutRef.current !== null) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    if (isOpen) {
      setMounted(true);
      setVisible(false);
      openAnimationFrameRef.current = requestAnimationFrame(() => {
        openAnimationFrameRef.current = requestAnimationFrame(() => {
          setVisible(true);
          openAnimationFrameRef.current = null;
        });
      });
      return undefined;
    }

    setVisible(false);
    closeTimeoutRef.current = window.setTimeout(() => {
      setMounted(false);
      closeTimeoutRef.current = null;
    }, panelTransitionMs);

    return undefined;
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (openAnimationFrameRef.current !== null) {
        cancelAnimationFrame(openAnimationFrameRef.current);
      }
      if (closeTimeoutRef.current !== null) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setTransportTypeModalOpen(false);
      setCustomerModalOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!transportTypeModalOpen && !customerModalOpen) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setTransportTypeModalOpen(false);
        setCustomerModalOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [transportTypeModalOpen, customerModalOpen]);

  if (!mounted) return null;

  // Backend'e gidəcək payload
  const buildPayload = (): NewSorguFormPayload => ({
    tabSnapshot: tab,
    fields: {
      // Core Query alanları
      company,
      customer,
      status,
      purpose,
      transportType,
      cargoInfo,
      loadPlace,
      recipient,
      unloadPlace,
      loadDate,
      unloadDate,
      seller,
      priceOffers: priceOffers || undefined,
      confirmed,
      archived,

      // Əlaqə məlumatları
      manager,
      logist: logist || undefined,
      contractNumber: contractNumber || undefined,
      contactPerson: contactPerson || undefined,
      extremelyUrgent,

      // Sorğu məlumatları
      tags: tags || undefined,
      inquirySource: inquirySource || undefined,
      inquiryPurpose: inquiryPurpose || undefined,

      // Yük xüsusiyyətləri
      cargoComposition: cargoComposition || undefined,
      cargoSpecs: cargoSpecs || undefined,
      incoterms: incoterms || undefined,

      // Yükləmə yeri
      loadPlaceCompany: loadPlaceCompany || undefined,
      loadCity: loadCity || undefined,
      loadCountry: loadCountry || undefined,
      loadPostal: loadPostal || undefined,
      loadAddress: loadAddress || undefined,
      loadCoordinates: loadCoordinates || undefined,
      loadSaveTerminal,

      // Boşaltma yeri
      unloadPlaceCompany: unloadPlaceCompany || undefined,
      unloadCity: unloadCity || undefined,
      unloadCountry: unloadCountry || undefined,
      unloadPostal: unloadPostal || undefined,
      unloadAddress: unloadAddress || undefined,
      unloadCoordinates: unloadCoordinates || undefined,
      unloadSaveTerminal,

      // Əlavə məlumatlar
      additionalInfo: additionalInfo || undefined,
      cargoItemsJson: JSON.stringify(cargoItems),
    },
  });

  const userOpts = placeholderOpts(usersData.map((u: any) => ({ value: u.id?.toString(), label: u.name })));
  const contactOpts = placeholderOpts(contactsData.map((c: any) => ({ value: c.id?.toString(), label: c.fullName })));
  const customerOpts = placeholderOpts(customersData.map((c: any) => ({ value: c.id?.toString(), label: c.name || c.companyName || c.fullName })));
  const tagOpts = placeholderOpts(tagsData.map((t: any) => ({ value: t.value, label: t.value })));
  const sourceOpts = placeholderOpts(sourcesData.map((s: any) => ({ value: s.value, label: s.value })));
  const purposeOpts = placeholderOpts(purposesData.map((p: any) => ({ value: p.value, label: p.value })));
  const specsOpts = placeholderOpts(specsData.map((s: any) => ({ value: s.value, label: s.value })));
  const incotermOpts = placeholderOpts(incotermsData.map((i: any) => ({ value: i.value, label: i.value })));

  const rowSelect = (
    label: ReactNode,
    value: string,
    options: SelectOption[],
    onChange: (nextValue: string) => void,
    plus?: { title: string; className?: string; onClick?: () => void },
  ) => (
    <div className={styles.fieldStack}>
      {label}
      <div className={styles.inlineControlRow}>
        <div className={styles.grow}>
          <Select
            value={value}
            options={options}
            onChange={onChange}
            placeholder="Dəyəri seçin"
            className={`${styles.selectControl} ${plus?.className || ""}`}
          />
        </div>
        {plus ? (
          <PlusButton
            title={plus.title}
            onClick={plus.onClick ? plus.onClick : () => notifyPlus(plus.title)}
            className={plus.className}
          />
        ) : null}
      </div>
    </div>
  );

  return (
    <>
      <div className={styles.dialogRoot} role="dialog" aria-modal="true">
        <div
          className={`${styles.dialogBackdrop} ${
            visible ? styles.dialogBackdropVisible : ""
          }`}
          onClick={onClose}
          aria-hidden="true"
        />

        <div
          className={`${styles.dialogPanel} ${
            visible ? styles.dialogPanelVisible : ""
          }`}
        >
          <div className={styles.dialogHeader}>
            <div className={styles.dialogHeaderText}>
              <h2 className={styles.dialogTitle}>{title}</h2>
              <p className={styles.dialogDescription}>{description}</p>
            </div>
            <button
              type="button"
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Bağla"
            >
              ×
            </button>
          </div>

          <div className={styles.tabBar}>
            <button
              type="button"
              onClick={() => setTab("main")}
              className={`${styles.tabButton} ${
                tab === "main" ? styles.tabButtonActive : ""
              }`}
            >
              Əsas məlumat
            </button>
            <button
              type="button"
              onClick={() => setTab("cargo")}
              className={`${styles.tabButton} ${
                tab === "cargo" ? styles.tabButtonActive : ""
              }`}
            >
              Yük haqqında məlumat
            </button>
          </div>

          <div className={styles.dialogBody}>
            {tab === "main" ? (
              <div className={styles.sectionStack}>
                <div className={styles.card}>
                  <div className={styles.cardTitle}>Əsas məlumatlar</div>
                  <div className={styles.twoColumnGrid}>
                    <div className={styles.verticalStack}>
                      <div className={styles.fieldStack}>
                        <Label required>Şirkət</Label>
                        <Select
                          value={company}
                          options={companyOptions}
                          onChange={setCompany}
                          className={styles.selectControl}
                        />
                      </div>

                      {/* STATUS FIELD ADDED HERE */}
                      <div className={styles.fieldStack}>
                        <Label required>Status</Label>
                        <Select
                          value={status}
                          options={statusOptions}
                          onChange={setStatus}
                          placeholder="Status seçin"
                          className={styles.selectControl}
                        />
                      </div>

                      <div className={styles.pairGrid}>
                        <div className={styles.fieldStack}>
                          <Label required>Menecer</Label>
                          <Select
                            value={manager}
                            options={userOpts}
                            onChange={setManager}
                            className={styles.selectControl}
                          />
                        </div>
                        <div className={styles.fieldStack}>
                          <Label>Logist</Label>
                          <Select
                            value={logist}
                            options={userOpts}
                            onChange={setLogist}
                            className={styles.selectControl}
                          />
                        </div>
                      </div>
                      {rowSelect(
                        <Label>Teqlər</Label>,
                        tags,
                        tagOpts,
                        setTags,
                        { title: "Teqlər", onClick: () => openLookupModal("tags", "Teqlər") },
                      )}
                    </div>

                    <div className={styles.verticalStack}>
                      {rowSelect(
                        <Label required>Müştəri</Label>,
                        customer,
                        customerOpts,
                        setCustomer,
                        { title: "Yeni müştəri", onClick: openNewCustomerModal },
                      )}

                      <div className={styles.fieldStack}>
                        <Label>Müştəri ilə müqavilənin nömrəsi</Label>
                        <input
                          className={styles.input}
                          value={contractNumber}
                          onChange={(e) => setContractNumber(e.target.value)}
                        />
                      </div>

                      {rowSelect(
                        <Label>Əlaqədar şəxs</Label>,
                        contactPerson,
                        contactOpts,
                        setContactPerson,
                        { title: "Yeni əlaqədar şəxs", onClick: () => { setContactName(""); setContactPhone(""); setContactEmail(""); setIsNewContactModalOpen(true); } },
                      )}
                    </div>
                  </div>
                </div>

                <div className={styles.card}>
                  <div className={styles.threeColumnGrid}>
                    {rowSelect(
                      <Label>Sorğunun mənbəyi</Label>,
                      inquirySource,
                      sourceOpts,
                      setInquirySource,
                      { title: "Sorğunun mənbəyi", onClick: () => openLookupModal("inquiry-sources", "Sorğunun mənbəyi") },
                    )}
                    {rowSelect(
                      <Label>Sorğunun məqsədi</Label>,
                      inquiryPurpose,
                      purposeOpts,
                      setInquiryPurpose,
                      { title: "Sorğunun məqsədi", onClick: () => openLookupModal("inquiry-purposes", "Sorğunun məqsədi") },
                    )}
                    <div className={styles.fieldStack}>
                      <Label>Cargo Composition</Label>
                      <input
                        className={styles.input}
                        value={cargoComposition}
                        onChange={(event) =>
                          setCargoComposition(event.target.value)
                        }
                      />
                    </div>
                    <div className={styles.fieldStack}>
                      <Label>Cargo Specifications</Label>
                      <div className={styles.inlineControlRow}>
                        <div className={styles.grow}>
                          <Select
                            value={cargoSpecs}
                            options={specsOpts}
                            onChange={setCargoSpecs}
                            className={styles.selectControl}
                          />
                        </div>
                        <PlusButton
                          title="Cargo Specifications"
                          onClick={() => openLookupModal("cargo-specs", "Cargo Specifications")}
                        />
                      </div>
                    </div>
                    <div className={styles.fieldStack}>
                      <Label>Incoterms</Label>
                      <div className={styles.inlineControlRow}>
                        <div className={styles.grow}>
                          <Select
                            value={incoterms}
                            options={incotermOpts}
                            onChange={setIncoterms}
                            className={styles.selectControl}
                          />
                        </div>
                        <PlusButton
                          title="Incoterms"
                          onClick={() => openLookupModal("incoterms", "Incoterms")}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.locationGrid}>
                  <section className={styles.card}>
                    <h3 className={styles.cardTitle}>Yükləmə yeri</h3>
                    <div className={styles.verticalStack}>
                      <div className={styles.fieldStack}>
                        <Label>Yer / Şirkət</Label>
                        <input
                          className={styles.input}
                          value={loadPlaceCompany}
                          onChange={(event) =>
                            setLoadPlaceCompany(event.target.value)
                          }
                        />
                      </div>
                      <div className={styles.fieldStack}>
                        <Label>Şəhər</Label>
                        <input
                          className={styles.input}
                          value={loadCity}
                          onChange={(event) => setLoadCity(event.target.value)}
                        />
                      </div>
                      {rowSelect(
                        <Label required>Ölkə</Label>,
                        loadCountry,
                        countryOptions,
                        setLoadCountry,
                        { title: "Yeni ölkə" },
                      )}
                      <div className={styles.fieldStack}>
                        <Label>Poçt kodu</Label>
                        <input
                          className={styles.input}
                          value={loadPostal}
                          onChange={(event) =>
                            setLoadPostal(event.target.value)
                          }
                        />
                      </div>
                      <button
                        type="button"
                        className={styles.inlineTextButton}
                        onClick={() =>
                          notifyPlus("Əlaqədar şəxs və telefon (yükləmə)")
                        }
                      >
                        Əlaqədar şəxs və telefon
                      </button>
                      <div className={styles.fieldStack}>
                        <Label>Ünvan</Label>
                        <textarea
                          className={styles.textarea}
                          value={loadAddress}
                          onChange={(event) =>
                            setLoadAddress(event.target.value)
                          }
                          rows={3}
                        />
                      </div>
                      <div className={styles.fieldStack}>
                        <Label>Coordinates</Label>
                        <div className={styles.coordinatesWrap}>
                          <input
                            className={`${styles.input} ${styles.coordinatesInput}`}
                            value={loadCoordinates}
                            onChange={(event) =>
                              setLoadCoordinates(event.target.value)
                            }
                            placeholder="En, uzunluq"
                          />
                          <FaMapMarkerAlt className={styles.mapIcon} />
                        </div>
                      </div>
                      <label className={styles.checkboxRow}>
                        <input
                          type="checkbox"
                          className={styles.checkbox}
                          checked={loadSaveTerminal}
                          onChange={(event) =>
                            setLoadSaveTerminal(event.target.checked)
                          }
                        />
                        <span className={styles.helperText}>
                          Terminalı yaddaşda saxla
                        </span>
                        <FaInfoCircle className={styles.infoIcon} aria-hidden />
                      </label>
                    </div>
                  </section>

                  <section className={styles.card}>
                    <h3 className={styles.cardTitle}>Boşaltma yeri</h3>
                    <div className={styles.verticalStack}>
                      <div className={styles.fieldStack}>
                        <Label>Yer / Şirkət</Label>
                        <input
                          className={styles.input}
                          value={unloadPlaceCompany}
                          onChange={(event) =>
                            setUnloadPlaceCompany(event.target.value)
                          }
                        />
                      </div>
                      <div className={styles.fieldStack}>
                        <Label>Şəhər</Label>
                        <input
                          className={styles.input}
                          value={unloadCity}
                          onChange={(event) =>
                            setUnloadCity(event.target.value)
                          }
                        />
                      </div>
                      {rowSelect(
                        <Label required>Ölkə</Label>,
                        unloadCountry,
                        countryOptions,
                        setUnloadCountry,
                        { title: "Yeni ölkə" },
                      )}
                      <div className={styles.fieldStack}>
                        <Label>Poçt kodu</Label>
                        <input
                          className={styles.input}
                          value={unloadPostal}
                          onChange={(event) =>
                            setUnloadPostal(event.target.value)
                          }
                        />
                      </div>
                      <button
                        type="button"
                        className={styles.inlineTextButton}
                        onClick={() =>
                          notifyPlus("Əlaqədar şəxs və telefon (boşaltma)")
                        }
                      >
                        Əlaqədar şəxs və telefon
                      </button>
                      <div className={styles.fieldStack}>
                        <Label>Ünvan</Label>
                        <textarea
                          className={styles.textarea}
                          value={unloadAddress}
                          onChange={(event) =>
                            setUnloadAddress(event.target.value)
                          }
                          rows={3}
                        />
                      </div>
                      <div className={styles.fieldStack}>
                        <Label>Coordinates</Label>
                        <div className={styles.coordinatesWrap}>
                          <input
                            className={`${styles.input} ${styles.coordinatesInput}`}
                            value={unloadCoordinates}
                            onChange={(event) =>
                              setUnloadCoordinates(event.target.value)
                            }
                            placeholder="En, uzunluq"
                          />
                          <FaMapMarkerAlt className={styles.mapIcon} />
                        </div>
                      </div>
                      <label className={styles.checkboxRow}>
                        <input
                          type="checkbox"
                          className={styles.checkbox}
                          checked={unloadSaveTerminal}
                          onChange={(event) =>
                            setUnloadSaveTerminal(event.target.checked)
                          }
                        />
                        <span className={styles.helperText}>
                          Terminalı yaddaşda saxla
                        </span>
                        <FaInfoCircle className={styles.infoIcon} aria-hidden />
                      </label>
                    </div>
                  </section>
                </div>

                <div className={styles.subtleCard}>
                  <div className={styles.verticalStack}>
                    <div className={styles.fieldStack}>
                      <Label>Əlavə məlumat</Label>
                      <textarea
                        className={styles.textarea}
                        value={additionalInfo}
                        onChange={(event) =>
                          setAdditionalInfo(event.target.value)
                        }
                        rows={4}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.cargoStack}>
                {cargoItems.map((cargo) => (
                  <div key={cargo.id} className={styles.cargoCard}>
                    <div className={styles.scrollX}>
                      <div className={styles.cargoTopRow}>
                        <button
                          type="button"
                          title="Yükü sil"
                          disabled={cargoItems.length <= 1}
                          onClick={() => removeCargo(cargo.id)}
                          className={styles.circleButtonDanger}
                          aria-label="Yükü sil"
                        >
                          −
                        </button>
                        <div className={styles.fieldAuto}>
                          <Label>Adı</Label>
                          <input
                            className={styles.input}
                            value={cargo.name}
                            onChange={(event) =>
                              patchCargo(cargo.id, { name: event.target.value })
                            }
                          />
                        </div>
                        <div className={styles.fieldNarrow}>
                          <Label>Çəkisi</Label>
                          <input
                            className={styles.input}
                            value={cargo.weight}
                            onChange={(event) =>
                              patchCargo(cargo.id, {
                                weight: event.target.value,
                              })
                            }
                          />
                        </div>
                        <div className={styles.fieldNarrow}>
                          <Label>LDM (m)</Label>
                          <input
                            className={styles.input}
                            value={cargo.ldm}
                            onChange={(event) =>
                              patchCargo(cargo.id, { ldm: event.target.value })
                            }
                          />
                        </div>
                        <div className={styles.fieldWide}>
                          <Label>Nəqliyyatın tipi</Label>
                          <div className={styles.inlineControlRow}>
                            <div className={styles.grow}>
                              <Select
                                value={cargo.transportType}
                                options={cargoTransportOptions}
                                onChange={(value) =>
                                  patchCargo(cargo.id, {
                                    transportType: value,
                                  })
                                }
                                placeholder="Dəyəri seçin"
                                className={styles.selectControl}
                              />
                            </div>
                            <PlusButton
                              variant="emerald"
                              title="Yeni nəqliyyat tipi"
                              onClick={openNewTransportTypeModal}
                            />
                          </div>
                        </div>
                        <div className={styles.fieldMedium}>
                          <Label>Yükün dəyəri</Label>
                          <input
                            className={styles.input}
                            value={cargo.cargoValue}
                            onChange={(event) =>
                              patchCargo(cargo.id, {
                                cargoValue: event.target.value,
                              })
                            }
                          />
                        </div>
                        <div className={styles.fieldNarrow}>
                          <Label>Valyuta</Label>
                          <Select
                            value={cargo.currency}
                            options={cargoCurrencyOptions}
                            onChange={(value) =>
                              patchCargo(cargo.id, { currency: value })
                            }
                            placeholder="Dəyəri seçin"
                            className={styles.selectControl}
                          />
                        </div>
                      </div>
                    </div>

                    <div className={styles.packagingArea}>
                      <div className={styles.packagingRows}>
                        {cargo.packagingRows.map((row, rowIndex) => (
                          <div key={row.id} className={styles.scrollX}>
                            <div className={styles.packagingRow}>
                              <div className={styles.packagingActionSlot}>
                                {rowIndex === 0 ? (
                                  cargo.packagingRows.length <= 1 ? (
                                    <button
                                      type="button"
                                      title="Qablaşdırma sətri əlavə et"
                                      onClick={() =>
                                        addPackagingRowAfter(cargo.id, 0)
                                      }
                                      className={styles.circleButtonSuccess}
                                      aria-label="Qablaşdırma sətri əlavə et"
                                    >
                                      +
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      title="Sətri sil"
                                      onClick={() =>
                                        removePackagingRow(cargo.id, row.id)
                                      }
                                      className={styles.circleButtonDanger}
                                      aria-label="Qablaşdırma sətri sil"
                                    >
                                      −
                                    </button>
                                  )
                                ) : (
                                  <button
                                    type="button"
                                    title="Qablaşdırma sətri əlavə et"
                                    onClick={() =>
                                      addPackagingRowAfter(cargo.id, rowIndex)
                                    }
                                    className={styles.circleButtonSuccess}
                                    aria-label="Qablaşdırma sətri əlavə et"
                                  >
                                    +
                                  </button>
                                )}
                              </div>

                              <div className={styles.packagingTypeGroup}>
                                <div className={styles.grow}>
                                  <div className={styles.fieldStack}>
                                    <Label>Qablaşdırmanın tipi</Label>
                                    <Select
                                      value={row.packagingType}
                                      options={packagingTypeOptions}
                                      onChange={(value) =>
                                        updatePackagingRow(cargo.id, row.id, {
                                          packagingType: value,
                                        })
                                      }
                                      placeholder="Dəyəri seçin"
                                      className={styles.selectControl}
                                    />
                                  </div>
                                </div>
                                <div
                                  className={`${styles.packagingExtraField} ${styles.fieldStack}`}
                                >
                                  <span className={styles.packagingSpacer}>
                                    &nbsp;
                                  </span>
                                  <input
                                    className={styles.input}
                                    value={row.packagingExtra}
                                    onChange={(event) =>
                                      updatePackagingRow(cargo.id, row.id, {
                                        packagingExtra: event.target.value,
                                      })
                                    }
                                    placeholder="…"
                                    aria-label="Qablaşdırma əlavə"
                                  />
                                </div>
                              </div>

                              <div className={styles.fieldTiny}>
                                <Label>Uzunluğu (m)</Label>
                                <input
                                  className={styles.input}
                                  value={row.lengthM}
                                  onChange={(event) =>
                                    updatePackagingRow(cargo.id, row.id, {
                                      lengthM: event.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div className={styles.fieldTiny}>
                                <Label>Eni (m)</Label>
                                <input
                                  className={styles.input}
                                  value={row.widthM}
                                  onChange={(event) =>
                                    updatePackagingRow(cargo.id, row.id, {
                                      widthM: event.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div className={styles.fieldTiny}>
                                <Label>Hündürlüyü (m)</Label>
                                <input
                                  className={styles.input}
                                  value={row.heightM}
                                  onChange={(event) =>
                                    updatePackagingRow(cargo.id, row.id, {
                                      heightM: event.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div className={styles.fieldTiny}>
                                <Label>Həcmi (m³)</Label>
                                <input
                                  className={styles.input}
                                  value={row.volumeM3}
                                  onChange={(event) =>
                                    updatePackagingRow(cargo.id, row.id, {
                                      volumeM3: event.target.value,
                                    })
                                  }
                                />
                              </div>

                              {cargo.packagingRows.length > 1 &&
                              rowIndex > 0 ? (
                                <button
                                  type="button"
                                  title="Sətri sil"
                                  onClick={() =>
                                    removePackagingRow(cargo.id, row.id)
                                  }
                                  className={styles.miniIconButton}
                                  aria-label="Sətri sil"
                                >
                                  ×
                                </button>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <label className={styles.checkboxRow}>
                      <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={cargo.incompleteLoad}
                        onChange={(event) =>
                          patchCargo(cargo.id, {
                            incompleteLoad: event.target.checked,
                          })
                        }
                      />
                      <span className={styles.helperText}>Natamam yük</span>
                    </label>

                    <div className={styles.fieldStack}>
                      <span className={styles.cargoMetaLabel}>
                        Əlavə məlumat
                      </span>
                      <textarea
                        className={styles.textarea}
                        value={cargo.additionalInfo}
                        onChange={(event) =>
                          patchCargo(cargo.id, {
                            additionalInfo: event.target.value,
                          })
                        }
                        rows={4}
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addCargo}
                  className={styles.addCargoButton}
                >
                  <span className={styles.addCargoIcon}>+</span>
                  Yükü əlavə et
                </button>
              </div>
            )}
          </div>

          <div className={styles.dialogFooter}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={onClose}
            >
              Bağla
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => onSubmit(buildPayload())}
            >
              {submitLabel}
            </button>
          </div>
        </div>
      </div>

      {transportTypeModalOpen ? (
        <div
          className={styles.nestedRoot}
          role="dialog"
          aria-modal="true"
          aria-labelledby="transport-type-new-title"
        >
          <button
            type="button"
            className={styles.nestedBackdrop}
            aria-label="Bağla"
            onClick={closeNewTransportTypeModal}
          />
          <div
            className={styles.nestedCard}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.nestedHeader}>
              <h2 id="transport-type-new-title" className={styles.nestedTitle}>
                Nəqliyyatın yeni tipi
              </h2>
              <button
                type="button"
                className={styles.nestedCloseButton}
                onClick={closeNewTransportTypeModal}
                aria-label="Bağla"
              >
                ×
              </button>
            </div>

            <div className={styles.nestedBody}>
              <div className={styles.verticalStack}>
                <div className={styles.fieldStack}>
                  <ModalSentenceLabel required>Adı</ModalSentenceLabel>
                  <input
                    className={styles.input}
                    value={newTransportName}
                    onChange={(event) =>
                      setNewTransportName(event.target.value)
                    }
                    autoComplete="off"
                  />
                </div>
                <div className={styles.fieldStack}>
                  <ModalSentenceLabel required>
                    Nəqliyyatın tipi
                  </ModalSentenceLabel>
                  <Select
                    value={newTransportParentKind}
                    options={transportParentKindOptions}
                    onChange={setNewTransportParentKind}
                    placeholder="Dəyəri seçin"
                    className={styles.selectControl}
                  />
                </div>
                <label className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={newTransportActive}
                    onChange={(event) =>
                      setNewTransportActive(event.target.checked)
                    }
                  />
                  <span className={styles.helperText}>Aktiv</span>
                </label>
              </div>
            </div>

            <div className={styles.nestedFooter}>
              <button
                type="button"
                className={styles.nestedPrimaryButton}
                onClick={saveNewTransportTypeModal}
              >
                Yaddaşda saxlamaq
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {customerModalOpen ? (
        <div
          className={styles.nestedRoot}
          role="dialog"
          aria-modal="true"
          aria-labelledby="customer-new-title"
        >
          <button
            type="button"
            className={styles.nestedBackdrop}
            aria-label="Bağla"
            onClick={closeNewCustomerModal}
          />
          <div
            className={styles.nestedCard}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.nestedHeader}>
              <h2 id="customer-new-title" className={styles.nestedTitle}>
                Yeni müştəri
              </h2>
              <button
                type="button"
                className={styles.nestedCloseButton}
                onClick={closeNewCustomerModal}
                aria-label="Bağla"
              >
                ×
              </button>
            </div>

            <div className={styles.nestedBody}>
              <div className={styles.verticalStack}>
                <div className={styles.fieldStack}>
                  <ModalSentenceLabel required>Şirkətin adı</ModalSentenceLabel>
                  <input
                    className={styles.input}
                    value={newCustomerName}
                    onChange={(event) => setNewCustomerName(event.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div className={styles.fieldStack}>
                  <ModalSentenceLabel>Menecer</ModalSentenceLabel>
                  <input
                    className={styles.input}
                    value={newCustomerManager}
                    onChange={(event) => setNewCustomerManager(event.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div className={styles.fieldStack}>
                  <ModalSentenceLabel>Əlaqədar şəxs</ModalSentenceLabel>
                  <input
                    className={styles.input}
                    value={newCustomerContact}
                    onChange={(event) => setNewCustomerContact(event.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div className={styles.fieldStack}>
                  <ModalSentenceLabel>Əlaqə nömrəsi</ModalSentenceLabel>
                  <input
                    className={styles.input}
                    value={newCustomerPhone}
                    onChange={(event) => setNewCustomerPhone(event.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div className={styles.fieldStack}>
                  <ModalSentenceLabel>Ünvan</ModalSentenceLabel>
                  <input
                    className={styles.input}
                    value={newCustomerAddress}
                    onChange={(event) => setNewCustomerAddress(event.target.value)}
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>

            <div className={styles.nestedFooter}>
              <button
                type="button"
                className={styles.nestedPrimaryButton}
                onClick={saveNewCustomerModal}
              >
                Yaddaşda saxlamaq
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isNewContactModalOpen ? (
        <div className={styles.nestedRoot}>
          <div
            className={styles.nestedBackdrop}
            onClick={() => setIsNewContactModalOpen(false)}
            aria-hidden="true"
          />
          <div className={styles.nestedCard}>
            <div className={styles.nestedHeader}>
              <h3 className={styles.nestedTitle}>Yeni əlaqədar şəxs</h3>
              <button
                type="button"
                className={styles.nestedCloseButton}
                onClick={() => setIsNewContactModalOpen(false)}
                aria-label="Bağla"
              >
                ×
              </button>
            </div>

            <div className={styles.nestedBody}>
              <div className={styles.verticalStack}>
                <div className={styles.fieldStack}>
                  <ModalSentenceLabel required>Tam adı</ModalSentenceLabel>
                  <input
                    className={styles.input}
                    value={contactName}
                    onChange={(event) => setContactName(event.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div className={styles.fieldStack}>
                  <ModalSentenceLabel>Telefon nömrələri</ModalSentenceLabel>
                  <input
                    className={styles.input}
                    value={contactPhone}
                    onChange={(event) => setContactPhone(event.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div className={styles.fieldStack}>
                  <ModalSentenceLabel>El.poçtu</ModalSentenceLabel>
                  <input
                    className={styles.input}
                    value={contactEmail}
                    onChange={(event) => setContactEmail(event.target.value)}
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>

            <div className={styles.nestedFooter}>
              <button
                type="button"
                className={styles.nestedPrimaryButton}
                onClick={() => {
                  if (!contactName.trim()) {
                    alert("Lütfən tam adı daxil edin!");
                    return;
                  }
                  dispatch(showNotification({ message: "Əlaqədar şəxs yadda saxlanıldı (demo).", type: "success", autoCloseDuration: 3200 }));
                  setIsNewContactModalOpen(false);
                }}
              >
                Yaddaşda saxlamaq
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <LookupManagerModal
        isOpen={lookupModalOpen}
        onClose={() => setLookupModalOpen(false)}
        lookupType={lookupModalType}
        title={lookupModalTitle}
        onDataChanged={handleLookupDataChanged}
      />
    </>
  );
}
