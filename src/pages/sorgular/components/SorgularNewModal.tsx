import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { FaInfoCircle } from "react-icons/fa";
import Select from "../../../common/components/select/Select";
import type { SelectOption } from "../../../common/components/select/Select";
import { useAppDispatch } from "../../../common/store/hooks";
import { showNotification } from "../../../common/store/modalSlice";
import { SorguStatus } from "../types/sorgu.types";
import styles from "./SorgularNewModal.module.css";
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
import { calcCargoMetrics } from "../lib/cargoCalculations";
import { useAuth } from "../../../common/contexts/AuthContext";
import { fetchUsersAction } from "../../../common/actions/user.actions";
import { fetchContactPersonsAction, createContactPersonAction } from "../../../common/actions/contact.actions";
import { fetchLookupAction, createLookupAction } from "../../../common/actions/lookup.actions";
import { createCustomerAction, fetchCustomersAction } from "../../../common/actions/customer.actions";
import { LookupManagerModal } from "../../../common/components/modal/LookupManagerModal";
import { fetchLookupOptions } from "../../ayarlar/lib/lookupStorage";
import { fetchCompaniesAction, createCompanyAction } from "../../../common/actions/company.actions";

// Zorunlu alanlar
const requiredFields = [
  "company",
  "manager",
  "customer",
  "loadCountry",
  "unloadCountry",
];

function validateRequired({
  company,
  manager,
  customer,
  loadCountry,
  unloadCountry,
}: any) {
  return {
    company: !company,
    manager: !manager,
    customer: !customer,
    loadCountry: !loadCountry,
    unloadCountry: !unloadCountry,
  };
}

const panelTransitionMs = 320;

const placeholderOpts = (extra: SelectOption[] = []): SelectOption[] => [
  { value: "", label: "Dəyəri seçin" },
  ...extra,
];

// companyOptions is now dynamically generated in the component
const deptOptions = placeholderOpts(DEPT_OPTIONS);
const customerOptions = placeholderOpts(CUSTOMER_OPTIONS);
const contractOptions = placeholderOpts([
  { value: "ctr-2026-01", label: "CTR-2026/01" },
]);
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

export interface NewSorguFormPayload {
  tabSnapshot: "main" | "cargo";
  fields: Record<string, string | boolean>;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: NewSorguFormPayload) => void;
  title?: string;
  description?: string;
  submitLabel?: string;
  initialValues?: any;
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
      className={`${styles.plusButton} ${
        variant === "emerald" ? styles.plusButtonEmerald : ""
      } ${className}`}
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

export default function SorgularNewModal({
  isOpen,
  onClose,
  onSubmit,
  title = "Yeni sorğu",
  description = "Sorğu məlumatlarını doldurub yaddaşa əlavə edin.",
  submitLabel = "Yaddaşda saxlamaq",
  initialValues = {},
}: Props) {
  // Edit modunda modal açıldığında initialValues'ı consola yazdır
  useEffect(() => {
    if (isOpen && initialValues && Object.keys(initialValues).length > 0) {
      console.log("[Sorgular Edit Modal] initialValues:", initialValues);
    }
  }, [isOpen, initialValues]);
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
  const [companiesData, setCompaniesData] = useState<any[]>([]);

  // Lookup Modal States
  const [lookupModalOpen, setLookupModalOpen] = useState(false);
  const [lookupModalType, setLookupModalType] = useState("");
  const [lookupModalTitle, setLookupModalTitle] = useState("");

  const [isNewContactModalOpen, setIsNewContactModalOpen] = useState(false);
  const [newContactSource, setNewContactSource] = useState<"main" | "customer">("main");
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
  
  const [isCustomerCreated, setIsCustomerCreated] = useState(false);

  // Ana form state'leri
  const [company, setCompany] = useState(
    initialValues?.company ?? "ziyafreight",
  );
  const [manager, setManager] = useState(initialValues?.manager ?? user?.id?.toString() ?? "");
  const [logist, setLogist] = useState(initialValues?.logist ?? "");
  const [customer, setCustomer] = useState(initialValues?.customer ?? "");
  const [loadCountry, setLoadCountry] = useState(
    initialValues?.loadCountry ?? "",
  );
  const [unloadCountry, setUnloadCountry] = useState(
    initialValues?.unloadCountry ?? "",
  );
  const [showErrors, setShowErrors] = useState(false);

  const errors = validateRequired({
    company,
    manager,
    customer,
    loadCountry,
    unloadCountry,
  });
  const [contractNumber, setContractNumber] = useState(
    initialValues?.contractNumber ?? "",
  );
  const [contactPerson, setContactPerson] = useState(
    initialValues?.contactPerson ?? "",
  );
  const [extremelyUrgent, setExtremelyUrgent] = useState(
    initialValues?.extremelyUrgent ?? false,
  );
  const [tags, setTags] = useState(initialValues?.tags ?? "");
  const [inquirySource, setInquirySource] = useState(
    initialValues?.inquirySource ?? "",
  );
  const [inquiryPurpose, setInquiryPurpose] = useState(
    initialValues?.inquiryPurpose ?? "",
  );
  const [cargoComposition, setCargoComposition] = useState(
    initialValues?.cargoComposition ?? "",
  );
  const [cargoSpecs, setCargoSpecs] = useState(initialValues?.cargoSpecs ?? "");
  const [incoterms, setIncoterms] = useState(initialValues?.incoterms ?? "");
  const [loadPlaceCompany, setLoadPlaceCompany] = useState(
    initialValues?.loadPlaceCompany ?? "",
  );
  const [loadCity, setLoadCity] = useState(initialValues?.loadCity ?? "");
  const [loadAddress, setLoadAddress] = useState(
    initialValues?.loadAddress ?? "",
  );
  const [loadSaveTerminal, setLoadSaveTerminal] = useState(
    initialValues?.loadSaveTerminal ?? false,
  );
  const [unloadPlaceCompany, setUnloadPlaceCompany] = useState(
    initialValues?.unloadPlaceCompany ?? "",
  );
  const [unloadCity, setUnloadCity] = useState(initialValues?.unloadCity ?? "");
  const [unloadAddress, setUnloadAddress] = useState(
    initialValues?.unloadAddress ?? "",
  );
  const [unloadSaveTerminal, setUnloadSaveTerminal] = useState(
    initialValues?.unloadSaveTerminal ?? false,
  );
  const [sender, setSender] = useState(initialValues?.sender ?? "");
  const [receiver, setReceiver] = useState(initialValues?.receiver ?? "");
  const [additionalInfo, setAdditionalInfo] = useState(
    initialValues?.additionalInfo ?? "",
  );
  const [cargoItems, setCargoItems] = useState<CargoItemForm[]>(() => {
    const raw: CargoItemForm[] = initialValues?.cargoItems
      ? initialValues.cargoItems
      : initialValues?.cargoItemsJson
        ? (() => {
            try {
              const parsed = JSON.parse(initialValues.cargoItemsJson);
              return Array.isArray(parsed) ? parsed : [createCargoItem()];
            } catch {
              return [createCargoItem()];
            }
          })()
        : [createCargoItem()];
    return raw.map(normalizeCargoItem);
  });


  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerManager, setNewCustomerManager] = useState("");
  const [newCustomerContact, setNewCustomerContact] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newCustomerAddress, setNewCustomerAddress] = useState("");
  const [cargoTransportOptions, setCargoTransportOptions] = useState<SelectOption[]>([]);

  // Query modelinde olup eksik olan state'ler (hepsi burada, blok dışında):
  const [createdAt, setCreatedAt] = useState(initialValues?.createdAt ?? "");
  const [status, setStatus] = useState(
    initialValues?.status ?? SorguStatus.Pending,
  );
  const [transportType, setTransportType] = useState(
    initialValues?.transportType ?? "",
  );
  const [cargoInfo, setCargoInfo] = useState(initialValues?.cargoInfo ?? "");
  const [loadPlace, setLoadPlace] = useState(initialValues?.loadPlace ?? "");
  const [recipient, setRecipient] = useState(initialValues?.recipient ?? "");
  const [unloadPlace, setUnloadPlace] = useState(
    initialValues?.unloadPlace ?? "",
  );
  const [loadDate, setLoadDate] = useState(initialValues?.loadDate ?? "");
  const [unloadDate, setUnloadDate] = useState(initialValues?.unloadDate ?? "");
  const [priceOffers, setPriceOffers] = useState(
    initialValues?.priceOffers ?? "",
  );
  const [confirmed, setConfirmed] = useState(initialValues?.confirmed ?? false);
  const [archived, setArchived] = useState(initialValues?.archived ?? false);
  const [seller, setSeller] = useState(initialValues?.seller ?? "");
  const [purpose, setPurpose] = useState(initialValues?.purpose ?? "");



  const openNewCustomerModal = useCallback(() => {
    setNewCustomerName("");
    setNewCustomerManager("");
    setNewCustomerContact("");
    setNewCustomerPhone("");
    setNewCustomerEmail("");
    setNewCustomerAddress("");
    setIsCustomerCreated(false);
    setCustomerModalOpen(true);
  }, []);

  const handleCreateCustomerAndEnableContacts = async () => {
    if (!newCustomerName.trim()) {
      dispatch(
        showNotification({
          message: "Lütfən şirkətin adını daxil edin!",
          type: "warning",
          autoCloseDuration: 3200,
        })
      );
      return;
    }
    try {
      const created = await createCustomerAction({
        name: newCustomerName,
        companyName: newCustomerName,
        manager: newCustomerManager,
        phone: newCustomerPhone,
        email: newCustomerEmail,
        address: newCustomerAddress
      });
      const data = await fetchCustomersAction();
      setCustomersData(data);
      if (created && created.id) {
        setCustomer(created.id.toString());
      } else {
        // Fallback matching by name
        const found = data.find((c: any) => c.name === newCustomerName);
        if (found) setCustomer(found.id.toString());
      }
      setIsCustomerCreated(true);
      dispatch(
        showNotification({
          message: "Şirkət (Müştəri) uğurla yaradıldı! İndi əlaqədar şəxs əlavə edə bilərsiniz.",
          type: "success",
          autoCloseDuration: 3200,
        })
      );
    } catch (error) {
      console.error("Failed to create customer", error);
      dispatch(
        showNotification({
          message: "Müştəri yaradılarkən xəta baş verdi",
          type: "error",
          autoCloseDuration: 3200,
        })
      );
    }
  };

  const closeNewCustomerModal = () => {
    setCustomerModalOpen(false);
    setNewCustomerName("");
    setNewCustomerManager("");
    setNewCustomerContact("");
    setNewCustomerPhone("");
    setNewCustomerEmail("");
    setNewCustomerAddress("");
    setIsCustomerCreated(false);
  };

  const saveNewCustomerModal = useCallback(async () => {
    if (!newCustomerName) {
      alert("Şirkətin adı mütləqdir!");
      return;
    }
    try {
      const payload = {
        name: newCustomerName,
        manager: newCustomerManager,
        contactPerson: newCustomerContact,
        phone: newCustomerPhone,
        email: newCustomerEmail,
        address: newCustomerAddress,
      };
      await createCustomerAction(payload);
      
      // Reload customers to get the new one in the dropdown
      const cust = await fetchCustomersAction();
      setCustomersData(cust);
      
      // Auto-select the newly created customer
      setCustomer(newCustomerName);
      
      dispatch(
        showNotification({
          message: "Müştəri uğurla əlavə edildi.",
          type: "success",
          autoCloseDuration: 3200,
        }),
      );
      setCustomerModalOpen(false);
    } catch (e) {
      console.error(e);
      dispatch(
        showNotification({
          message: "Xəta baş verdi.",
          type: "error",
          autoCloseDuration: 3200,
        }),
      );
    }
  }, [
    newCustomerEmail,
    newCustomerAddress,
    dispatch
  ]);

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
      const [u, c, cust, t, s, p, sp, inc, comps] = await Promise.all([
        fetchUsersAction(),
        fetchContactPersonsAction(),
        fetchCustomersAction(),
        fetchLookupAction("tags"),
        fetchLookupAction("inquiry-sources"),
        fetchLookupAction("inquiry-purposes"),
        fetchLookupAction("cargo-specs"),
        fetchLookupAction("incoterms"),
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

  const resetForm = useCallback(() => {
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
    setLoadAddress("");
    setLoadSaveTerminal(false);
    setUnloadPlaceCompany("");
    setUnloadCity("");
    setUnloadCountry("");
    setUnloadAddress("");
    setUnloadSaveTerminal(false);
    setSender("");
    setReceiver("");
    setAdditionalInfo("");
    setCargoItems([normalizeCargoItem(createCargoItem())]);
  }, []);

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
    if (isOpen) resetForm();
  }, [isOpen, resetForm]);

  useEffect(() => {
    if (!isOpen) {
      setCustomerModalOpen(false);
      setCompanyModalOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!customerModalOpen) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCustomerModalOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [customerModalOpen]);

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

  // Backend'e gidecek tüm alanları Query DTO'suna uygun şekilde mapliyoruz
  const buildPayload = (): NewSorguFormPayload => ({
    tabSnapshot: tab,
    fields: {
      company,
      customer,
      status,
      statusAssignedAt: new Date().toISOString(),
      purpose,
      createdAt: createdAt || new Date().toISOString(),
      transportType,
      cargoInfo,
      sender,
      loadPlace,
      recipient,
      unloadPlace,
      loadDate,
      unloadDate,
      seller,
      priceOffers,
      confirmed,
      archived,
      manager,
      logist,
      contractNumber,
      contactPerson,
      extremelyUrgent,
      tags,
      inquirySource,
      inquiryPurpose,
      cargoComposition,
      cargoSpecs,
      incoterms,
      loadPlaceCompany,
      loadCity,
      loadCountry,
      loadAddress,
      loadSaveTerminal,
      unloadPlaceCompany,
      unloadCity,
      unloadCountry,
      unloadAddress,
      unloadSaveTerminal,
      additionalInfo,
      cargoItemsJson: JSON.stringify(cargoItems),
      customerOrderRef: contractNumber,
    },
  });

  const userOpts = placeholderOpts(usersData.map((u: any) => ({ value: u.id?.toString(), label: u.name })));
  
  const selectedCustomerObj = customersData.find((c: any) => c.id?.toString() === customer);
  const selectedCustomerName = selectedCustomerObj?.name || selectedCustomerObj?.companyName || selectedCustomerObj?.fullName;
  
  const filteredContacts = (selectedCustomerObj?.contactPersons || []).filter((c: any) => 
    selectedCustomerObj?.contactPerson ? selectedCustomerObj.contactPerson.split(',').includes(String(c.id)) : true
  );
  
  const contactOpts = placeholderOpts(filteredContacts.map((c: any) => ({ value: c.fullName, label: c.position ? `${c.fullName} (${c.position})` : c.fullName })));
  
  const newCustomerObj = customersData.find((c: any) => c.name === newCustomerName);
  const filteredNewCustomerContacts = (newCustomerObj?.contactPersons || []).filter((c: any) => 
    newCustomerObj?.contactPerson ? newCustomerObj.contactPerson.split(',').includes(String(c.id)) : true
  );
  const newCustomerContactOpts = placeholderOpts(filteredNewCustomerContacts.map((c: any) => ({ value: c.fullName, label: c.position ? `${c.fullName} (${c.position})` : c.fullName })));

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
                      <div className={styles.pairGrid}>
                        <div className={styles.fieldStack}>
                          <Label required>Menecer</Label>
                          <Select
                            value={manager}
                            options={userOpts}
                            onChange={setManager}
                            className={
                              styles.selectControl +
                              (showErrors && errors.manager
                                ? " " + styles.inputError
                                : "")
                            }
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
                        {
                          title: "Yeni müştəri",
                          onClick: openNewCustomerModal,
                          className:
                            showErrors && errors.customer
                              ? styles.inputError
                              : undefined,
                        },
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
                        { title: "Yeni əlaqədar şəxs", onClick: () => { setContactName(""); setContactPhone(""); setContactEmail(""); setNewContactSource("main"); setIsNewContactModalOpen(true); } },
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
                        {
                          title: "Yeni ölkə",
                          className:
                            showErrors && errors.loadCountry
                              ? styles.inputError
                              : undefined,
                        },
                      )}
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
                        {
                          title: "Yeni ölkə",
                          className:
                            showErrors && errors.unloadCountry
                              ? styles.inputError
                              : undefined,
                        },
                      )}
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
                          <Label>Həcm (m³)</Label>
                          <input
                            className={styles.input}
                            value={cargo.volumeM3 ?? ""}
                            readOnly
                            title="Qablaşdırmalardan avtomatik hesablanır"
                          />
                        </div>
                        <div className={styles.fieldNarrow}>
                          <Label>LDM (m)</Label>
                          <input
                            className={styles.input}
                            value={cargo.ldm}
                            readOnly
                            title="max(yuvarlaq çəki, həcm × 167) — avtomatik"
                          />
                        </div>
                        <div className={styles.fieldWide}>
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
                              </div>

                              <div className={styles.fieldTiny}>
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
                                  readOnly
                                  title="(uzunluq × en × hündürlük × say) — avtomatik"
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
              onClick={() => {
                setShowErrors(true);
                if (Object.values(errors).some(Boolean)) return;
                onSubmit(buildPayload());
              }}
            >
              {submitLabel}
            </button>
          </div>
        </div>
      </div>



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
                  <ModalSentenceLabel required>Müştəri adı</ModalSentenceLabel>
                  <input
                    className={styles.input}
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    disabled={isCustomerCreated}
                    autoComplete="off"
                  />
                </div>
                <div className={styles.fieldStack}>
                  <ModalSentenceLabel>Menecer</ModalSentenceLabel>
                  <Select
                    value={newCustomerManager}
                    options={userOpts}
                    onChange={setNewCustomerManager}
                    placeholder="Menecer seçin"
                    className={styles.selectControl}
                  />
                </div>
                <div className={styles.fieldStack} style={{ opacity: isCustomerCreated ? 1 : 0.5, pointerEvents: isCustomerCreated ? 'auto' : 'none' }}>
                  <ModalSentenceLabel>Əlaqədar şəxs</ModalSentenceLabel>
                  <div className={styles.inlineControlRow}>
                    <div className={styles.grow}>
                      <Select
                        value={newCustomerContact}
                        options={newCustomerContactOpts}
                        onChange={setNewCustomerContact}
                        placeholder={isCustomerCreated ? "Əlaqədar şəxs seçin" : "Əvvəlcə şirkəti yaradın"}
                        className={styles.selectControl}
                        disabled={!isCustomerCreated}
                      />
                    </div>
                    <PlusButton
                      title="Yeni əlaqədar şəxs"
                      onClick={() => {
                        if (!isCustomerCreated) return;
                        setContactName("");
                        setContactPhone("");
                        setContactEmail("");
                        setContactPosition("");
                        setNewContactSource("customer");
                        setIsNewContactModalOpen(true);
                      }}
                    />
                  </div>
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
                  <ModalSentenceLabel>E-mail</ModalSentenceLabel>
                  <input
                    className={styles.input}
                    type="email"
                    value={newCustomerEmail}
                    onChange={(event) => setNewCustomerEmail(event.target.value)}
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
              {!isCustomerCreated ? (
                <button
                  type="button"
                  className={styles.nestedPrimaryButton}
                  onClick={handleCreateCustomerAndEnableContacts}
                >
                  Şirkəti yarat
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.nestedPrimaryButton}
                  onClick={closeNewCustomerModal}
                >
                  Tamamla
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
      
      {isNewContactModalOpen ? (
        <div className={styles.nestedRoot} style={{ zIndex: 1205 }}>
          <div
            className={styles.nestedBackdrop}
            onClick={() => setIsNewContactModalOpen(false)}
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
                  <ModalSentenceLabel>Email</ModalSentenceLabel>
                  <input
                    className={styles.input}
                    type="email"
                    value={contactEmail}
                    onChange={(event) => setContactEmail(event.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div className={styles.fieldStack}>
                  <ModalSentenceLabel>Vəzifə</ModalSentenceLabel>
                  <Select
                    value={contactPosition}
                    options={[
                      { value: "Rəhbər", label: "Rəhbər" },
                      { value: "Menecer", label: "Menecer" },
                      { value: "Satış təmsilçisi", label: "Satış təmsilçisi" },
                      { value: "Mühasib", label: "Mühasib" },
                      { value: "Agent", label: "Agent" },
                      { value: "Digər", label: "Digər" },
                    ]}
                    onChange={setContactPosition}
                    placeholder="Vəzifə seçin"
                    className={styles.selectControl}
                  />
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
                    await createContactPersonAction({
                      fullName: contactName,
                      phone: contactPhone,
                      email: contactEmail,
                      position: contactPosition,
                      company: newContactSource === "main" ? (selectedCustomerName || customer) : newCustomerName
                    });
                    const c = await fetchContactPersonsAction();
                    setContactsData(c);
                    if (newContactSource === "main") {
                      setContactPerson(contactName);
                    } else {
                      setNewCustomerContact(contactName);
                    }
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
          <button
            type="button"
            className={styles.nestedBackdrop}
            aria-label="Bağla"
            onClick={closeNewCompanyModal}
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
