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
import { SorguStatus } from "../types/sorgu.types";
import styles from "./SorgularNewModal.module.css";

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

const companyOptions = placeholderOpts([
  { value: "ziyafreight", label: "Ziyafreight" },
  { value: "elmry", label: "Elmry ERP" },
]);

const personOptions = placeholderOpts([
  { value: "ulvi", label: "Ulvi Adilzade" },
  { value: "nargiz", label: "Nərgiz K." },
]);

const deptOptions = placeholderOpts([
  { value: "logistics", label: "Logistika" },
  { value: "sales", label: "Satış" },
]);

const customerOptions = placeholderOpts([
  { value: "mm", label: "M&M Militzer & Munch" },
  { value: "caspian", label: "Caspian Trade" },
]);

const contractOptions = placeholderOpts([
  { value: "ctr-2026-01", label: "CTR-2026/01" },
]);

const simpleSelect = placeholderOpts();

const incotermsOptions = placeholderOpts([
  { value: "EXW", label: "EXW" },
  { value: "FOB", label: "FOB" },
  { value: "CIF", label: "CIF" },
]);

const countryOptions = placeholderOpts([
  { value: "AZ", label: "Azərbaycan" },
  { value: "TR", label: "Türkiyə" },
  { value: "CN", label: "Çin" },
  { value: "DE", label: "Almaniya" },
]);

const cargoTransportOptions = placeholderOpts([
  { value: "air", label: "Hava" },
  { value: "sea", label: "Dəniz" },
  { value: "road", label: "Quru" },
  { value: "rail", label: "Dəmir yolu" },
]);

const transportParentKindOptions = placeholderOpts([
  { value: "avtoreys", label: "Avtoreyslər" },
  { value: "konteyner", label: "Konteynerlər" },
  { value: "tanker", label: "Tankerlər" },
]);

const cargoCurrencyOptions = placeholderOpts([
  { value: "AZN", label: "AZN" },
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
]);

const packagingTypeOptions = placeholderOpts([
  { value: "pallet", label: "Palet" },
  { value: "box", label: "Qutu" },
  { value: "crate", label: "Taxta qutu" },
]);

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
}: {
  title: string;
  onClick: () => void;
  variant?: "default" | "emerald";
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`${styles.plusButton} ${
        variant === "emerald" ? styles.plusButtonEmerald : ""
      }`}
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

  // Ana form state'leri
  const [company, setCompany] = useState(
    initialValues?.company ?? "ziyafreight",
  );
  const [manager, setManager] = useState(initialValues?.manager ?? "ulvi");
  const [logist, setLogist] = useState(initialValues?.logist ?? "");
  const [department, setDepartment] = useState(initialValues?.department ?? "");
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
  const [loadPostal, setLoadPostal] = useState(initialValues?.loadPostal ?? "");
  const [loadAddress, setLoadAddress] = useState(
    initialValues?.loadAddress ?? "",
  );
  const [loadCoordinates, setLoadCoordinates] = useState(
    initialValues?.loadCoordinates ?? "",
  );
  const [loadSaveTerminal, setLoadSaveTerminal] = useState(
    initialValues?.loadSaveTerminal ?? false,
  );
  const [unloadPlaceCompany, setUnloadPlaceCompany] = useState(
    initialValues?.unloadPlaceCompany ?? "",
  );
  const [unloadCity, setUnloadCity] = useState(initialValues?.unloadCity ?? "");
  const [unloadPostal, setUnloadPostal] = useState(
    initialValues?.unloadPostal ?? "",
  );
  const [unloadAddress, setUnloadAddress] = useState(
    initialValues?.unloadAddress ?? "",
  );
  const [unloadCoordinates, setUnloadCoordinates] = useState(
    initialValues?.unloadCoordinates ?? "",
  );
  const [unloadSaveTerminal, setUnloadSaveTerminal] = useState(
    initialValues?.unloadSaveTerminal ?? false,
  );
  const [sender, setSender] = useState(initialValues?.sender ?? "");
  const [receiver, setReceiver] = useState(initialValues?.receiver ?? "");
  const [additionalInfo, setAdditionalInfo] = useState(
    initialValues?.additionalInfo ?? "",
  );
  const [cargoItems, setCargoItems] = useState<CargoItemForm[]>(
    initialValues?.cargoItems
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
        : [createCargoItem()],
  );
  const [transportTypeModalOpen, setTransportTypeModalOpen] = useState(false);
  const [newTransportName, setNewTransportName] = useState("");
  const [newTransportParentKind, setNewTransportParentKind] =
    useState("avtoreys");
  const [newTransportActive, setNewTransportActive] = useState(true);

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

  const resetForm = useCallback(() => {
    setTab("main");
    setCompany("ziyafreight");
    setManager("ulvi");
    setLogist("");
    setDepartment("");
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
    setSender("");
    setReceiver("");
    setAdditionalInfo("");
    setCargoItems([createCargoItem()]);
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
    if (!isOpen) setTransportTypeModalOpen(false);
  }, [isOpen]);

  useEffect(() => {
    if (!transportTypeModalOpen) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setTransportTypeModalOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [transportTypeModalOpen]);

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
      department,
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
      loadPostal,
      loadAddress,
      loadCoordinates,
      loadSaveTerminal,
      unloadPlaceCompany,
      unloadCity,
      unloadCountry,
      unloadPostal,
      unloadAddress,
      unloadCoordinates,
      unloadSaveTerminal,
      additionalInfo,
      cargoItemsJson: JSON.stringify(cargoItems),
      customerOrderRef: contractNumber,
    },
  });

  const rowSelect = (
    label: ReactNode,
    value: string,
    options: SelectOption[],
    onChange: (nextValue: string) => void,
    plus?: { title: string },
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
            className={styles.selectControl}
          />
        </div>
        {plus ? (
          <PlusButton
            title={plus.title}
            onClick={() => notifyPlus(plus.title)}
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
                          className={
                            styles.selectControl +
                            (showErrors && errors.company
                              ? " " + styles.inputError
                              : "")
                          }
                        />
                      </div>

                      <div className={styles.pairGrid}>
                        <div className={styles.fieldStack}>
                          <Label required>Menecer</Label>
                          <Select
                            value={manager}
                            options={personOptions}
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
                            options={personOptions}
                            onChange={setLogist}
                            className={styles.selectControl}
                          />
                        </div>
                      </div>

                      <div className={styles.fieldStack}>
                        <Label>Şöbə</Label>
                        <Select
                          value={department}
                          options={deptOptions}
                          onChange={setDepartment}
                          className={styles.selectControl}
                        />
                      </div>

                      {rowSelect(
                        <Label required>Müştəri</Label>,
                        customer,
                        customerOptions,
                        setCustomer,
                        {
                          title: "Yeni müştəri",
                          className:
                            showErrors && errors.customer
                              ? styles.inputError
                              : undefined,
                        },
                      )}

                      <div className={styles.fieldStack}>
                        <Label>Müştəri ilə müqavilənin nömrəsi</Label>
                        <Select
                          value={contractNumber}
                          options={contractOptions}
                          onChange={setContractNumber}
                          className={styles.selectControl}
                        />
                      </div>
                    </div>

                    <div className={styles.verticalStack}>
                      {rowSelect(
                        <Label>Əlaqədar şəxs</Label>,
                        contactPerson,
                        personOptions,
                        setContactPerson,
                        { title: "Yeni əlaqədar şəxs" },
                      )}

                      <label className={styles.checkboxRow}>
                        <input
                          type="checkbox"
                          className={styles.checkbox}
                          checked={extremelyUrgent}
                          onChange={(event) =>
                            setExtremelyUrgent(event.target.checked)
                          }
                        />
                        <span className={styles.helperText}>
                          Son dərəcə təcilidir
                        </span>
                      </label>

                      {rowSelect(
                        <Label>Teqlər</Label>,
                        tags,
                        simpleSelect,
                        setTags,
                        { title: "Yeni teq" },
                      )}
                    </div>
                  </div>
                </div>

                <div className={styles.card}>
                  <div className={styles.threeColumnGrid}>
                    {rowSelect(
                      <Label>Sorğunun mənbəyi</Label>,
                      inquirySource,
                      simpleSelect,
                      setInquirySource,
                      { title: "Yeni mənbə" },
                    )}
                    {rowSelect(
                      <Label>Sorğunun məqsədi</Label>,
                      inquiryPurpose,
                      simpleSelect,
                      setInquiryPurpose,
                      { title: "Yeni məqsəd" },
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
                      <Select
                        value={cargoSpecs}
                        options={simpleSelect}
                        onChange={setCargoSpecs}
                        className={styles.selectControl}
                      />
                    </div>
                    <div className={styles.fieldStack}>
                      <Label>Incoterms</Label>
                      <Select
                        value={incoterms}
                        options={incotermsOptions}
                        onChange={setIncoterms}
                        className={styles.selectControl}
                      />
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
                        {
                          title: "Yeni ölkə",
                          className:
                            showErrors && errors.unloadCountry
                              ? styles.inputError
                              : undefined,
                        },
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
                    {rowSelect(
                      <Label>Göndərən</Label>,
                      sender,
                      simpleSelect,
                      setSender,
                      { title: "Yeni göndərən" },
                    )}
                    {rowSelect(
                      <Label>Alıcı</Label>,
                      receiver,
                      simpleSelect,
                      setReceiver,
                      { title: "Yeni alıcı" },
                    )}
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
    </>
  );
}
