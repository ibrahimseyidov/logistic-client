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
  useMemo,
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
import { calcCargoMetrics } from "../lib/cargoCalculations";
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
import { fetchContactPersonsAction, createContactPersonAction } from "../../../common/actions/contact.actions";
import { fetchLookupAction, createLookupAction } from "../../../common/actions/lookup.actions";
import { fetchCustomersAction } from "../../../common/actions/customer.actions";
import { CustomerCreateDrawer } from "../../musteriler/components/CustomerCreateDrawer";
import { LookupManagerModal } from "../../../common/components/modal/LookupManagerModal";
import { fetchLookupOptions } from "../../ayarlar/lib/lookupStorage";
import { fetchCompaniesAction, createCompanyAction } from "../../../common/actions/company.actions";
import {
  CONTACT_POSITIONS_LOOKUP_TYPE,
  lookupRowsToPositionOptions,
  withCustomPositionOption,
} from "../../../common/utils/contactPosition.utils";
import { normalizeCarrierContacts } from "../../../common/utils/carrierDisplay.utils";

function customerContactPersons(
  customerObj: { id?: string | number; contactPersons?: unknown } | undefined,
  contactsData: Array<{ entityType?: string; entityId?: string | number }>,
) {
  if (!customerObj) return [];
  const scopedDb = contactsData.filter(
    (contact) =>
      contact.entityType === "customer" &&
      customerObj.id != null &&
      String(contact.entityId) === String(customerObj.id),
  );
  return normalizeCarrierContacts(customerObj.contactPersons || [], scopedDb as any);
}

const panelTransitionMs = 320;

const placeholderOpts = (extra: SelectOption[] = []): SelectOption[] => [
  { value: "", label: "Dəyəri seçin" },
  ...extra,
];

// companyOptions is now dynamically generated in the component
const deptOptions = placeholderOpts(DEPT_OPTIONS);
const customerOptions = placeholderOpts(CUSTOMER_OPTIONS);
const simpleSelect = placeholderOpts();
const countryOptions = placeholderOpts(COUNTRY_OPTIONS);
const transportParentKindOptions = placeholderOpts(TRANSPORT_PARENT_KIND_OPTIONS);
const cargoCurrencyOptions = placeholderOpts(CARGO_CURRENCY_OPTIONS);
const packagingTypeOptions = placeholderOpts(PACKAGING_TYPE_OPTIONS);

export interface CargoPackagingRow {
  id: string;
  packagingType: string;
  packagingExtra: string;
  packagingCount: string;
  lengthM: string;
  widthM: string;
  heightM: string;
  volumeM3: string;
}

export interface CargoItemForm {
  id: string;
  name: string;
  weight: string;
  volumeM3: string;
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
    packagingCount: "1",
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
    volumeM3: "",
    ldm: "",
    transportType: "",
    cargoValue: "",
    currency: "",
    packagingRows: [createPackagingRow()],
    incompleteLoad: false,
    additionalInfo: "",
  };
}

function normalizePackagingRow(row: CargoPackagingRow): CargoPackagingRow {
  return {
    ...row,
    packagingCount: row.packagingCount ?? "1",
  };
}

function applyCargoMetrics(cargo: CargoItemForm): CargoItemForm {
  const metrics = calcCargoMetrics({
    weight: cargo.weight,
    packagingRows: cargo.packagingRows.map(normalizePackagingRow),
  });
  return {
    ...cargo,
    packagingRows: metrics.packagingRows as CargoPackagingRow[],
    volumeM3: metrics.totalVolumeM3,
    ldm: metrics.ldm,
  };
}

function normalizeCargoItem(cargo: CargoItemForm): CargoItemForm {
  return applyCargoMetrics({
    ...cargo,
    packagingRows: cargo.packagingRows.map(normalizePackagingRow),
  });
}

function normalizeLoadedCargoItem(item: Partial<CargoItemForm>): CargoItemForm {
  return normalizeCargoItem({
    ...createCargoItem(),
    ...item,
    packagingRows:
      item.packagingRows && item.packagingRows.length > 0
        ? item.packagingRows
        : [createPackagingRow()],
  });
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
  const [contactPositionsData, setContactPositionsData] = useState<any[]>([]);
  const [companiesData, setCompaniesData] = useState<any[]>([]);

  // Lookup Modal States
  const [lookupModalOpen, setLookupModalOpen] = useState(false);
  const [lookupModalType, setLookupModalType] = useState("");
  const [lookupModalTitle, setLookupModalTitle] = useState("");

  const [isNewContactModalOpen, setIsNewContactModalOpen] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPosition, setContactPosition] = useState("");

  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyManager, setNewCompanyManager] = useState("");
  const [newCompanyContact, setNewCompanyContact] = useState("");
  const [newCompanyPhone, setNewCompanyPhone] = useState("");
  const [newCompanyEmail, setNewCompanyEmail] = useState("");
  const [newCompanyAddress, setNewCompanyAddress] = useState("");

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
    normalizeCargoItem(createCargoItem()),
  ]);



  const [customerDrawerOpen, setCustomerDrawerOpen] = useState(false);
  const [cargoTransportOptions, setCargoTransportOptions] = useState<SelectOption[]>([]);

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
        setCargoItems(data.cargoItems.map((item: Partial<CargoItemForm>) => normalizeLoadedCargoItem(item)));
      } else if (typeof data.cargoItemsJson === "string") {
        try {
          const parsed = JSON.parse(data.cargoItemsJson);
          const items = Array.isArray(parsed) ? parsed : [createCargoItem()];
          setCargoItems(items.map((item: Partial<CargoItemForm>) => normalizeLoadedCargoItem(item)));
        } catch {
          setCargoItems([normalizeCargoItem(createCargoItem())]);
        }
      } else {
        setCargoItems([normalizeCargoItem(createCargoItem())]);
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
    setCargoItems([normalizeCargoItem(createCargoItem())]);
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



  const openNewCustomerModal = useCallback(() => {
    setCustomerDrawerOpen(true);
  }, []);

  const handleCustomerCreated = useCallback(
    async (created: { id: string; name: string }) => {
      try {
        const data = await fetchCustomersAction();
        setCustomersData(data);
        if (created.id) {
          setCustomer(created.id);
        } else {
          const found = data.find((c: any) => c.name === created.name);
          if (found) setCustomer(String(found.id));
        }
      } catch (error) {
        console.error("Failed to refresh customers", error);
      }
    },
    [],
  );

  const openNewCompanyModal = useCallback(() => {
    setNewCompanyName("");
    setNewCompanyManager("");
    setNewCompanyContact("");
    setNewCompanyPhone("");
    setNewCompanyEmail("");
    setNewCompanyAddress("");
    setCompanyModalOpen(true);
  }, []);

  const closeNewCompanyModal = useCallback(() => {
    setCompanyModalOpen(false);
  }, []);

  const saveNewCompanyModal = useCallback(async () => {
    if (!newCompanyName) {
      alert("Şirkətin adı mütləqdir!");
      return;
    }
    try {
      const payload = {
        name: newCompanyName,
        manager: newCompanyManager,
        contactPerson: newCompanyContact,
        phone: newCompanyPhone,
        email: newCompanyEmail,
        address: newCompanyAddress,
      };
      await createCompanyAction(payload);
      
      const comps = await fetchCompaniesAction();
      setCompaniesData(comps);
      setCompany(newCompanyName);
      
      dispatch(
        showNotification({
          message: "Şirkət uğurla əlavə edildi.",
          type: "success",
          autoCloseDuration: 3200,
        }),
      );
      setCompanyModalOpen(false);
    } catch (e: any) {
      console.error(e);
      dispatch(
        showNotification({
          message: e?.response?.data?.error || "Xəta baş verdi.",
          type: "error",
          autoCloseDuration: 3200,
        }),
      );
    }
  }, [
    newCompanyName,
    newCompanyManager,
    newCompanyContact,
    newCompanyPhone,
    newCompanyEmail,
    newCompanyAddress,
    dispatch
  ]);

  const loadData = useCallback(async () => {
    try {
      const [u, c, cust, t, s, p, sp, inc, positions, comps] = await Promise.all([
        fetchUsersAction(),
        fetchContactPersonsAction(),
        fetchCustomersAction(),
        fetchLookupAction("tags"),
        fetchLookupAction("inquiry-sources"),
        fetchLookupAction("inquiry-purposes"),
        fetchLookupAction("cargo-specs"),
        fetchLookupAction("incoterms"),
        fetchLookupAction(CONTACT_POSITIONS_LOOKUP_TYPE),
        fetchCompaniesAction()
      ]);
      setUsersData(u);
      setContactsData(c);
      setCustomersData(cust);
      setTagsData(t);
      setSourcesData(s);
      setPurposesData(p);
      setSpecsData(sp);
      setIncotermsData(inc);
      setContactPositionsData(positions);
      setCompaniesData(comps);
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
      const opts = fetchLookupOptions("transport-types", CARGO_TRANSPORT_OPTIONS);
      setCargoTransportOptions(placeholderOpts(opts.map((opt: any) => ({ value: opt.value, label: opt.label }))));
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
      case CONTACT_POSITIONS_LOOKUP_TYPE: setContactPositionsData(newData); break;
    }
  };

  const contactPositionOptions = useMemo(
    () =>
      withCustomPositionOption(
        lookupRowsToPositionOptions(contactPositionsData),
        contactPosition,
      ),
    [contactPositionsData, contactPosition],
  );

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
          cargo.id === cargoId
            ? applyCargoMetrics({ ...cargo, ...patch })
            : cargo,
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
          return applyCargoMetrics({
            ...cargo,
            packagingRows: cargo.packagingRows.map((row) =>
              row.id === rowId ? { ...row, ...patch } : row,
            ),
          });
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
          return applyCargoMetrics({ ...cargo, packagingRows: next });
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
        return applyCargoMetrics({
          ...cargo,
          packagingRows: cargo.packagingRows.filter((row) => row.id !== rowId),
        });
      }),
    );
  }, []);

  const removeCargo = useCallback((cargoId: string) => {
    setCargoItems((prev) =>
      prev.length <= 1 ? prev : prev.filter((cargo) => cargo.id !== cargoId),
    );
  }, []);

  const addCargo = useCallback(() => {
    setCargoItems((prev) => [...prev, normalizeCargoItem(createCargoItem())]);
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
      setCustomerDrawerOpen(false);
      setCompanyModalOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!companyModalOpen) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCompanyModalOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [companyModalOpen]);

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
  const selectedCustomerObj = customersData.find((c: any) => c.id?.toString() === customer);
  const selectedCustomerName = selectedCustomerObj?.name || selectedCustomerObj?.companyName || selectedCustomerObj?.fullName;
  
  const filteredContacts = customerContactPersons(selectedCustomerObj, contactsData);
  
  const contactOpts = placeholderOpts(filteredContacts.map((c: any) => ({ value: c.fullName, label: c.position ? `${c.fullName} (${c.position})` : c.fullName })));
  
  const customerOpts = placeholderOpts(customersData.map((c: any) => ({ value: c.id?.toString(), label: c.name || c.companyName || c.fullName })));
  const tagOpts = placeholderOpts(tagsData.map((t: any) => ({ value: t.value, label: t.value })));
  const sourceOpts = placeholderOpts(sourcesData.map((s: any) => ({ value: s.value, label: s.value })));
  const purposeOpts = placeholderOpts(purposesData.map((p: any) => ({ value: p.value, label: p.value })));
  const specsOpts = placeholderOpts(specsData.map((s: any) => ({ value: s.value, label: s.value })));
  const incotermOpts = placeholderOpts(incotermsData.map((i: any) => ({ value: i.value, label: i.value })));
  const companyOptions = placeholderOpts(companiesData.map((c: any) => ({ value: c.name, label: c.name })));

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
                {cargoItems.map((cargo, cargoIndex) => (
                  <div key={cargo.id} className={styles.cargoCard}>
                    <div className={styles.cargoCardHeader}>
                      <span className={styles.cargoCardTitle}>
                        {cargoItems.length > 1
                          ? `Yük ${cargoIndex + 1}`
                          : "Yük məlumatları"}
                      </span>
                      <button
                        type="button"
                        title="Yükü sil"
                        disabled={cargoItems.length <= 1}
                        onClick={() => removeCargo(cargo.id)}
                        className={styles.cargoRemoveButton}
                        aria-label="Yükü sil"
                      >
                        Sil
                      </button>
                    </div>
                    <div className={styles.cargoTopGrid}>
                        <div
                          className={`${styles.fieldStack} ${styles.cargoGridName}`}
                        >
                          <Label>Adı</Label>
                          <input
                            className={styles.input}
                            value={cargo.name}
                            onChange={(event) =>
                              patchCargo(cargo.id, { name: event.target.value })
                            }
                          />
                        </div>
                        <div
                          className={`${styles.fieldStack} ${styles.cargoGridMetric}`}
                        >
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
                        <div
                          className={`${styles.fieldStack} ${styles.cargoGridMetric}`}
                        >
                          <Label>Həcm (m³)</Label>
                          <input
                            className={`${styles.input} ${styles.inputReadOnly}`}
                            value={cargo.volumeM3 ?? ""}
                            readOnly
                            title="Qablaşdırmalardan avtomatik hesablanır"
                          />
                        </div>
                        <div
                          className={`${styles.fieldStack} ${styles.cargoGridMetric}`}
                        >
                          <Label>LDM (m)</Label>
                          <input
                            className={`${styles.input} ${styles.inputReadOnly}`}
                            value={cargo.ldm}
                            readOnly
                            title="max(yuvarlaq çəki, həcm × 167) — avtomatik"
                          />
                        </div>
                        <div
                          className={`${styles.fieldStack} ${styles.cargoGridTransport}`}
                        >
                          <Label>Nəqliyyatın tipi</Label>
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
                        <div
                          className={`${styles.fieldStack} ${styles.cargoGridValue}`}
                        >
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
                        <div
                          className={`${styles.fieldStack} ${styles.cargoGridCurrency}`}
                        >
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

                    <div className={styles.packagingArea}>
                      <div className={styles.packagingAreaHeader}>
                        <p className={styles.packagingAreaTitle}>
                          Qablaşdırma
                        </p>
                        <button
                          type="button"
                          title="Qablaşdırma sətri əlavə et"
                          onClick={() =>
                            addPackagingRowAfter(
                              cargo.id,
                              cargo.packagingRows.length - 1,
                            )
                          }
                          className={styles.packagingAddButton}
                          aria-label="Qablaşdırma sətri əlavə et"
                        >
                          +
                        </button>
                      </div>
                      <div className={styles.packagingRows}>
                        {cargo.packagingRows.map((row) => (
                          <div
                            key={row.id}
                            className={`${styles.packagingRow} ${styles.packagingRowWithExtra}`}
                          >
                              <div className={styles.packagingTypeGroup}>
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
                                <Label>Qeyd</Label>
                                <input
                                  className={styles.input}
                                  value={row.packagingExtra}
                                  onChange={(event) =>
                                    updatePackagingRow(cargo.id, row.id, {
                                      packagingExtra: event.target.value,
                                    })
                                  }
                                  placeholder="Əlavə"
                                />
                              </div>

                              <div className={styles.fieldStack}>
                                <Label>Sayı</Label>
                                <input
                                  className={styles.input}
                                  value={row.packagingCount ?? "1"}
                                  onChange={(event) =>
                                    updatePackagingRow(cargo.id, row.id, {
                                      packagingCount: event.target.value,
                                    })
                                  }
                                  inputMode="numeric"
                                />
                              </div>
                              <div className={styles.fieldStack}>
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
                              <div className={styles.fieldStack}>
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
                              <div className={styles.fieldStack}>
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
                              <div className={styles.fieldStack}>
                                <Label>Həcmi (m³)</Label>
                                <input
                                  className={`${styles.input} ${styles.inputReadOnly}`}
                                  value={row.volumeM3}
                                  readOnly
                                  title="(uzunluq × en × hündürlük × say) — avtomatik"
                                />
                              </div>

                              {cargo.packagingRows.length > 1 ? (
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
                        ))}
                      </div>
                    </div>

                    <div className={styles.cargoMetaSection}>
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



      <CustomerCreateDrawer
        isOpen={customerDrawerOpen}
        onClose={() => setCustomerDrawerOpen(false)}
        onCreated={handleCustomerCreated}
      />

      {isNewContactModalOpen ? (
        <div className={styles.nestedRoot} style={{ zIndex: 1205 }}>
          <div
            className={styles.nestedBackdrop}
            aria-hidden="true"
          />
          <div className={styles.nestedCard} style={{ transform: "scale(0.96) translateY(20px)" }}>
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
                <div className={styles.fieldStack}>
                  <ModalSentenceLabel>Vəzifə</ModalSentenceLabel>
                  <div className={styles.inlineControlRow}>
                    <div className={styles.grow}>
                      <Select
                        value={contactPosition}
                        options={contactPositionOptions}
                        onChange={setContactPosition}
                        placeholder="Vəzifə seçin"
                        className={styles.selectControl}
                      />
                    </div>
                    <PlusButton
                      title="Vəzifə əlavə et"
                      onClick={() => openLookupModal(CONTACT_POSITIONS_LOOKUP_TYPE, "Vəzifələr")}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.nestedFooter}>
              <button
                type="button"
                className={styles.nestedPrimaryButton}
                onClick={async () => {
                  if (!contactName.trim()) {
                    alert("Lütfən tam adı daxil edin!");
                    return;
                  }
                  try {
                    const linkedCustomer = customersData.find(
                      (c: any) => c.id?.toString() === customer,
                    );

                    await createContactPersonAction({
                      fullName: contactName,
                      phone: contactPhone,
                      email: contactEmail,
                      position: contactPosition,
                      company:
                        selectedCustomerName || linkedCustomer?.company || linkedCustomer?.name || "",
                      entityType: "customer",
                      entityId: linkedCustomer?.id,
                    });
                    const [freshContacts, freshCustomers] = await Promise.all([
                      fetchContactPersonsAction(),
                      fetchCustomersAction(),
                    ]);
                    setContactsData(freshContacts);
                    setCustomersData(freshCustomers);
                    setContactPerson(contactName);
                    dispatch(showNotification({ message: "Əlaqədar şəxs uğurla əlavə edildi.", type: "success", autoCloseDuration: 3200 }));
                    setIsNewContactModalOpen(false);
                  } catch (e) {
                    dispatch(showNotification({ message: "Xəta baş verdi.", type: "error", autoCloseDuration: 3200 }));
                  }
                }}
              >
                Yaddaşda saxlamaq
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {companyModalOpen ? (
        <div
          className={styles.nestedRoot}
          role="dialog"
          aria-modal="true"
          aria-labelledby="company-new-title"
          style={{ zIndex: 1205 }}
        >
          <div
            className={styles.nestedBackdrop}
            aria-hidden="true"
          />
          <div
            className={styles.nestedCard}
            onClick={(event) => event.stopPropagation()}
            style={{ transform: "scale(0.96) translateY(20px)" }}
          >
            <div className={styles.nestedHeader}>
              <h2 id="company-new-title" className={styles.nestedTitle}>
                Yeni şirkət
              </h2>
              <button
                type="button"
                className={styles.nestedCloseButton}
                onClick={closeNewCompanyModal}
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
                    value={newCompanyName}
                    onChange={(event) => setNewCompanyName(event.target.value)}
                    autoComplete="off"
                  />
                </div>

                <div className={styles.fieldStack}>
                  <ModalSentenceLabel>Əlaqə nömrəsi</ModalSentenceLabel>
                  <input
                    className={styles.input}
                    value={newCompanyPhone}
                    onChange={(event) => setNewCompanyPhone(event.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div className={styles.fieldStack}>
                  <ModalSentenceLabel>E-mail</ModalSentenceLabel>
                  <input
                    className={styles.input}
                    type="email"
                    value={newCompanyEmail}
                    onChange={(event) => setNewCompanyEmail(event.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div className={styles.fieldStack}>
                  <ModalSentenceLabel>Ünvan</ModalSentenceLabel>
                  <input
                    className={styles.input}
                    value={newCompanyAddress}
                    onChange={(event) => setNewCompanyAddress(event.target.value)}
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>

            <div className={styles.nestedFooter}>
              <button
                type="button"
                className={styles.nestedPrimaryButton}
                onClick={saveNewCompanyModal}
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
