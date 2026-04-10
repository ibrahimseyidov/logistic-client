import { useCallback, useEffect, useRef, useState } from "react";
import { FaInfoCircle, FaMapMarkerAlt } from "react-icons/fa";
import Select from "../../../common/components/select/Select";
import type { SelectOption } from "../../../common/components/select/Select";
import { useAppDispatch } from "../../../common/store/hooks";
import { showNotification } from "../../../common/store/modalSlice";

const inputCls =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 shadow-sm outline-none transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100";
const textareaCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 min-h-[88px] resize-y";
const selectCls =
  "h-11 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 shadow-sm transition-colors hover:border-slate-300 focus-within:border-emerald-300 focus-within:ring-2 focus-within:ring-emerald-100";
const cardCls = "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm";
const subtleCardCls = "rounded-2xl border border-slate-200 bg-slate-50 p-4";
const checkboxCls =
  "h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200";
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

/** «Nəqliyyatın yeni tipi» modalındakı üst qrup seçimi (şəkil: Avtoreyslər və s.) */
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
  /** bütün sahələrin düz mətn nüsxəsi (API üçün) */
  fields: Record<string, string | boolean>;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: NewSorguFormPayload) => void;
  title?: string;
  description?: string;
  submitLabel?: string;
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
  const ring =
    variant === "emerald"
      ? "border-emerald-300 bg-white text-emerald-600 hover:bg-emerald-50"
      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50";
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-lg leading-none transition-colors ${ring}`}
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
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </span>
  );
}

function ModalSentenceLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <span className="mb-1 block text-sm font-medium text-slate-800">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
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
}: Props) {
  const dispatch = useAppDispatch();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [tab, setTab] = useState<"main" | "cargo">("main");
  const openAnimationFrameRef = useRef<number | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);

  const [company, setCompany] = useState("ziyafreight");
  const [manager, setManager] = useState("ulvi");
  const [logist, setLogist] = useState("");
  const [department, setDepartment] = useState("");
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

  const [loadPlaceCompany, setLoadPlaceCompany] = useState("");
  const [loadCity, setLoadCity] = useState("");
  const [loadCountry, setLoadCountry] = useState("");
  const [loadPostal, setLoadPostal] = useState("");
  const [loadAddress, setLoadAddress] = useState("");
  const [loadCoordinates, setLoadCoordinates] = useState("");
  const [loadSaveTerminal, setLoadSaveTerminal] = useState(false);

  const [unloadPlaceCompany, setUnloadPlaceCompany] = useState("");
  const [unloadCity, setUnloadCity] = useState("");
  const [unloadCountry, setUnloadCountry] = useState("");
  const [unloadPostal, setUnloadPostal] = useState("");
  const [unloadAddress, setUnloadAddress] = useState("");
  const [unloadCoordinates, setUnloadCoordinates] = useState("");
  const [unloadSaveTerminal, setUnloadSaveTerminal] = useState(false);

  const [sender, setSender] = useState("");
  const [receiver, setReceiver] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");

  const [cargoItems, setCargoItems] = useState<CargoItemForm[]>([
    createCargoItem(),
  ]);

  const [transportTypeModalOpen, setTransportTypeModalOpen] = useState(false);
  const [newTransportName, setNewTransportName] = useState("");
  const [newTransportParentKind, setNewTransportParentKind] =
    useState("avtoreys");
  const [newTransportActive, setNewTransportActive] = useState(true);

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
        prev.map((c) => (c.id === cargoId ? { ...c, ...patch } : c)),
      );
    },
    [],
  );

  const updatePackagingRow = useCallback(
    (cargoId: string, rowId: string, patch: Partial<CargoPackagingRow>) => {
      setCargoItems((prev) =>
        prev.map((c) => {
          if (c.id !== cargoId) return c;
          return {
            ...c,
            packagingRows: c.packagingRows.map((r) =>
              r.id === rowId ? { ...r, ...patch } : r,
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
        prev.map((c) => {
          if (c.id !== cargoId) return c;
          const next = [...c.packagingRows];
          next.splice(afterIndex + 1, 0, createPackagingRow());
          return { ...c, packagingRows: next };
        }),
      );
    },
    [],
  );

  const removePackagingRow = useCallback((cargoId: string, rowId: string) => {
    setCargoItems((prev) =>
      prev.map((c) => {
        if (c.id !== cargoId) return c;
        if (c.packagingRows.length <= 1) return c;
        return {
          ...c,
          packagingRows: c.packagingRows.filter((r) => r.id !== rowId),
        };
      }),
    );
  }, []);

  const removeCargo = useCallback((cargoId: string) => {
    setCargoItems((prev) =>
      prev.length <= 1 ? prev : prev.filter((c) => c.id !== cargoId),
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
    if (!transportTypeModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTransportTypeModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [transportTypeModalOpen]);

  if (!mounted) return null;

  const handleClose = () => onClose();

  const buildPayload = (): NewSorguFormPayload => ({
    tabSnapshot: tab,
    fields: {
      company,
      manager,
      logist,
      department,
      customer,
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
      sender,
      receiver,
      additionalInfo,
      cargoItemsJson: JSON.stringify(cargoItems),
    },
  });

  const handleSubmit = () => {
    onSubmit(buildPayload());
  };

  const rowSelect = (
    label: React.ReactNode,
    value: string,
    options: SelectOption[],
    onChange: (v: string) => void,
    plus?: { title: string },
  ) => (
    <div className="space-y-1">
      {label}
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <Select
            value={value}
            options={options}
            onChange={onChange}
            placeholder="Dəyəri seçin"
            className={selectCls}
          />
        </div>
        {plus && (
          <PlusButton
            title={plus.title}
            onClick={() => notifyPlus(plus.title)}
          />
        )}
      </div>
    </div>
  );

  return (
    <>
    <div
      className="fixed inset-0 z-[1100] flex justify-end"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-slate-900/20 transition-opacity duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ opacity: visible ? 1 : 0 }}
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        className="relative flex h-full w-full max-w-6xl flex-col bg-slate-50 shadow-[0_24px_70px_rgba(15,23,42,0.18)] transition-[transform,opacity] duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
        style={{
          borderTopLeftRadius: 20,
          borderBottomLeftRadius: 20,
          transform: visible ? "translateX(0)" : "translateX(100%)",
          opacity: visible ? 1 : 0,
        }}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
              {title}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </div>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-2xl leading-none text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
            onClick={handleClose}
            aria-label="Bağla"
          >
            ×
          </button>
        </div>

        <div className="flex shrink-0 gap-6 border-b border-slate-200 bg-white px-6">
          <button
            type="button"
            onClick={() => setTab("main")}
            className={`border-b-2 px-0 py-3 text-sm font-medium transition-colors ${
              tab === "main"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            Əsas məlumat
          </button>
          <button
            type="button"
            onClick={() => setTab("cargo")}
            className={`border-b-2 px-0 py-3 text-sm font-medium transition-colors ${
              tab === "cargo"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            Yük haqqında məlumat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 text-slate-800">
          {tab === "main" && (
            <div className="space-y-6">
              <div className={cardCls}>
                <div className="mb-4 text-sm font-semibold text-slate-900">
                  Əsas məlumatlar
                </div>
                <div className="grid grid-cols-1 gap-x-8 gap-y-3 lg:grid-cols-2 lg:items-start">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label required>Şirkət</Label>
                      <Select
                        value={company}
                        options={companyOptions}
                        onChange={setCompany}
                        className={selectCls}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label required>Menecer</Label>
                        <Select
                          value={manager}
                          options={personOptions}
                          onChange={setManager}
                          className={selectCls}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Logist</Label>
                        <Select
                          value={logist}
                          options={personOptions}
                          onChange={setLogist}
                          className={selectCls}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label>Şöbə</Label>
                      <Select
                        value={department}
                        options={deptOptions}
                        onChange={setDepartment}
                        className={selectCls}
                      />
                    </div>
                    {rowSelect(
                      <Label required>Müştəri</Label>,
                      customer,
                      customerOptions,
                      setCustomer,
                      { title: "Yeni müştəri" },
                    )}
                    <div className="space-y-1">
                      <Label>Müştəri ilə müqavilənin nömrəsi</Label>
                      <Select
                        value={contractNumber}
                        options={contractOptions}
                        onChange={setContractNumber}
                        className={selectCls}
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    {rowSelect(
                      <Label>Əlaqədar şəxs</Label>,
                      contactPerson,
                      personOptions,
                      setContactPerson,
                      { title: "Yeni əlaqədar şəxs" },
                    )}
                    <label className="flex cursor-pointer items-center gap-2 pt-1 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        className={checkboxCls}
                        checked={extremelyUrgent}
                        onChange={(e) => setExtremelyUrgent(e.target.checked)}
                      />
                      <span>Son dərəcə təcilidir</span>
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

              <div
                className={`${cardCls} grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3`}
              >
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
                <div className="space-y-1">
                  <Label>Cargo Composition</Label>
                  <input
                    className={inputCls}
                    value={cargoComposition}
                    onChange={(e) => setCargoComposition(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Cargo Specifications</Label>
                  <Select
                    value={cargoSpecs}
                    options={simpleSelect}
                    onChange={setCargoSpecs}
                    className={selectCls}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Incoterms</Label>
                  <Select
                    value={incoterms}
                    options={incotermsOptions}
                    onChange={setIncoterms}
                    className={selectCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <section className={cardCls}>
                  <h3 className="mb-3 text-sm font-semibold text-slate-900">
                    Yükləmə yeri
                  </h3>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label>Yer / Şirkət</Label>
                      <input
                        className={inputCls}
                        value={loadPlaceCompany}
                        onChange={(e) => setLoadPlaceCompany(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Şəhər</Label>
                      <input
                        className={inputCls}
                        value={loadCity}
                        onChange={(e) => setLoadCity(e.target.value)}
                      />
                    </div>
                    {rowSelect(
                      <Label required>Ölkə</Label>,
                      loadCountry,
                      countryOptions,
                      setLoadCountry,
                      { title: "Yeni ölkə" },
                    )}
                    <div className="space-y-1">
                      <Label>Poçt kodu</Label>
                      <input
                        className={inputCls}
                        value={loadPostal}
                        onChange={(e) => setLoadPostal(e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      className="text-sm font-medium text-slate-700 transition-colors hover:text-slate-900"
                      onClick={() =>
                        notifyPlus("Əlaqədar şəxs və telefon (yükləmə)")
                      }
                    >
                      Əlaqədar şəxs və telefon
                    </button>
                    <div className="space-y-1">
                      <Label>Ünvan</Label>
                      <textarea
                        className={textareaCls}
                        value={loadAddress}
                        onChange={(e) => setLoadAddress(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Coordinates</Label>
                      <div className="relative">
                        <input
                          className={`${inputCls} pr-9`}
                          value={loadCoordinates}
                          onChange={(e) => setLoadCoordinates(e.target.value)}
                          placeholder="En, uzunluq"
                        />
                        <FaMapMarkerAlt className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className={checkboxCls}
                        checked={loadSaveTerminal}
                        onChange={(e) => setLoadSaveTerminal(e.target.checked)}
                      />
                      <span>Terminalı yaddaşda saxla</span>
                      <FaInfoCircle
                        className="text-slate-500 text-base"
                        title="Məlumat"
                        aria-hidden
                      />
                    </label>
                  </div>
                </section>

                <section className={cardCls}>
                  <h3 className="mb-3 text-sm font-semibold text-slate-900">
                    Boşaltma yeri
                  </h3>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label>Yer / Şirkət</Label>
                      <input
                        className={inputCls}
                        value={unloadPlaceCompany}
                        onChange={(e) => setUnloadPlaceCompany(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Şəhər</Label>
                      <input
                        className={inputCls}
                        value={unloadCity}
                        onChange={(e) => setUnloadCity(e.target.value)}
                      />
                    </div>
                    {rowSelect(
                      <Label required>Ölkə</Label>,
                      unloadCountry,
                      countryOptions,
                      setUnloadCountry,
                      { title: "Yeni ölkə" },
                    )}
                    <div className="space-y-1">
                      <Label>Poçt kodu</Label>
                      <input
                        className={inputCls}
                        value={unloadPostal}
                        onChange={(e) => setUnloadPostal(e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      className="text-sm font-medium text-slate-700 transition-colors hover:text-slate-900"
                      onClick={() =>
                        notifyPlus("Əlaqədar şəxs və telefon (boşaltma)")
                      }
                    >
                      Əlaqədar şəxs və telefon
                    </button>
                    <div className="space-y-1">
                      <Label>Ünvan</Label>
                      <textarea
                        className={textareaCls}
                        value={unloadAddress}
                        onChange={(e) => setUnloadAddress(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Coordinates</Label>
                      <div className="relative">
                        <input
                          className={`${inputCls} pr-9`}
                          value={unloadCoordinates}
                          onChange={(e) => setUnloadCoordinates(e.target.value)}
                          placeholder="En, uzunluq"
                        />
                        <FaMapMarkerAlt className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className={checkboxCls}
                        checked={unloadSaveTerminal}
                        onChange={(e) =>
                          setUnloadSaveTerminal(e.target.checked)
                        }
                      />
                      <span>Terminalı yaddaşda saxla</span>
                      <FaInfoCircle
                        className="text-slate-500 text-base"
                        title="Məlumat"
                        aria-hidden
                      />
                    </label>
                  </div>
                </section>
              </div>

              <div className={subtleCardCls}>
                <div className="space-y-3">
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
                  <div className="space-y-1">
                    <Label>Əlavə məlumat</Label>
                    <textarea
                      className={textareaCls}
                      value={additionalInfo}
                      onChange={(e) => setAdditionalInfo(e.target.value)}
                      rows={4}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "cargo" && (
            <div className="space-y-6">
              {cargoItems.map((cargo) => (
                <div key={cargo.id} className={`${cardCls} space-y-4`}>
                  <div className="overflow-x-auto">
                    <div className="flex min-w-[52rem] items-end gap-2">
                      <button
                        type="button"
                        title="Yükü sil"
                        disabled={cargoItems.length <= 1}
                        onClick={() => removeCargo(cargo.id)}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-red-200 bg-white text-lg leading-none text-red-500 transition-colors hover:bg-red-50 disabled:pointer-events-none disabled:opacity-35"
                        aria-label="Yükü sil"
                      >
                        −
                      </button>
                      <div className="min-w-[8rem] flex-1 space-y-1">
                        <Label>Adı</Label>
                        <input
                          className={inputCls}
                          value={cargo.name}
                          onChange={(e) =>
                            patchCargo(cargo.id, { name: e.target.value })
                          }
                        />
                      </div>
                      <div className="w-[5.5rem] shrink-0 space-y-1">
                        <Label>Çəkisi</Label>
                        <input
                          className={inputCls}
                          value={cargo.weight}
                          onChange={(e) =>
                            patchCargo(cargo.id, { weight: e.target.value })
                          }
                        />
                      </div>
                      <div className="w-[5.5rem] shrink-0 space-y-1">
                        <Label>LDM (m)</Label>
                        <input
                          className={inputCls}
                          value={cargo.ldm}
                          onChange={(e) =>
                            patchCargo(cargo.id, { ldm: e.target.value })
                          }
                        />
                      </div>
                      <div className="min-w-[14rem] flex-[1.2] space-y-1">
                        <Label>Nəqliyyatın tipi</Label>
                        <div className="flex items-center gap-2">
                          <div className="min-w-0 flex-1">
                            <Select
                              value={cargo.transportType}
                              options={cargoTransportOptions}
                              onChange={(v) =>
                                patchCargo(cargo.id, { transportType: v })
                              }
                              placeholder="Dəyəri seçin"
                              className={selectCls}
                            />
                          </div>
                          <PlusButton
                            variant="emerald"
                            title="Yeni nəqliyyat tipi"
                            onClick={openNewTransportTypeModal}
                          />
                        </div>
                      </div>
                      <div className="w-[6.5rem] shrink-0 space-y-1">
                        <Label>Yükün dəyəri</Label>
                        <input
                          className={inputCls}
                          value={cargo.cargoValue}
                          onChange={(e) =>
                            patchCargo(cargo.id, {
                              cargoValue: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="w-[5.5rem] shrink-0 space-y-1">
                        <Label>Valyuta</Label>
                        <Select
                          value={cargo.currency}
                          options={cargoCurrencyOptions}
                          onChange={(v) =>
                            patchCargo(cargo.id, { currency: v })
                          }
                          placeholder="Dəyəri seçin"
                          className={selectCls}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-slate-100 pt-3">
                    {cargo.packagingRows.map((row, rowIndex) => (
                      <div key={row.id} className="overflow-x-auto">
                        <div className="flex min-w-[48rem] items-end gap-2">
                          <div className="flex w-11 shrink-0 items-end pb-0.5">
                            {rowIndex === 0 ? (
                              cargo.packagingRows.length <= 1 ? (
                                <button
                                  type="button"
                                  title="Qablaşdırma sətri əlavə et"
                                  onClick={() =>
                                    addPackagingRowAfter(cargo.id, 0)
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-300 bg-white text-base leading-none text-emerald-600 transition-colors hover:bg-emerald-50"
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
                                  className="flex h-9 w-9 items-center justify-center rounded-full border border-red-200 bg-white text-base leading-none text-red-500 transition-colors hover:bg-red-50"
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
                                className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-300 bg-white text-base leading-none text-emerald-600 transition-colors hover:bg-emerald-50"
                                aria-label="Qablaşdırma sətri əlavə et"
                              >
                                +
                              </button>
                            )}
                          </div>
                          <div className="flex min-w-[13rem] flex-[1.2] flex-col gap-1 sm:flex-row sm:items-end">
                            <div className="min-w-0 flex-1 space-y-1">
                              <Label>Qablaşdırmanın tipi</Label>
                              <Select
                                value={row.packagingType}
                                options={packagingTypeOptions}
                                onChange={(v) =>
                                  updatePackagingRow(cargo.id, row.id, {
                                    packagingType: v,
                                  })
                                }
                                placeholder="Dəyəri seçin"
                                className={selectCls}
                              />
                            </div>
                            <div className="w-full min-w-[3.5rem] max-w-[5rem] space-y-1 sm:w-auto">
                              <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                &nbsp;
                              </span>
                              <input
                                className={inputCls}
                                value={row.packagingExtra}
                                onChange={(e) =>
                                  updatePackagingRow(cargo.id, row.id, {
                                    packagingExtra: e.target.value,
                                  })
                                }
                                placeholder="…"
                                aria-label="Qablaşdırma əlavə"
                              />
                            </div>
                          </div>
                          <div className="w-[5rem] shrink-0 space-y-1">
                            <Label>Uzunluğu (m)</Label>
                            <input
                              className={inputCls}
                              value={row.lengthM}
                              onChange={(e) =>
                                updatePackagingRow(cargo.id, row.id, {
                                  lengthM: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="w-[5rem] shrink-0 space-y-1">
                            <Label>Eni (m)</Label>
                            <input
                              className={inputCls}
                              value={row.widthM}
                              onChange={(e) =>
                                updatePackagingRow(cargo.id, row.id, {
                                  widthM: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="w-[5rem] shrink-0 space-y-1">
                            <Label>Hündürlüyü (m)</Label>
                            <input
                              className={inputCls}
                              value={row.heightM}
                              onChange={(e) =>
                                updatePackagingRow(cargo.id, row.id, {
                                  heightM: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="w-[5rem] shrink-0 space-y-1">
                            <Label>Həcmi (m³)</Label>
                            <input
                              className={inputCls}
                              value={row.volumeM3}
                              onChange={(e) =>
                                updatePackagingRow(cargo.id, row.id, {
                                  volumeM3: e.target.value,
                                })
                              }
                            />
                          </div>
                          {cargo.packagingRows.length > 1 && rowIndex > 0 && (
                            <button
                              type="button"
                              title="Sətri sil"
                              onClick={() =>
                                removePackagingRow(cargo.id, row.id)
                              }
                              className="flex h-11 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg leading-none text-slate-500 transition-colors hover:bg-slate-50"
                              aria-label="Sətri sil"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      className={checkboxCls}
                      checked={cargo.incompleteLoad}
                      onChange={(e) =>
                        patchCargo(cargo.id, {
                          incompleteLoad: e.target.checked,
                        })
                      }
                    />
                    <span>Natamam yük</span>
                  </label>

                  <div className="space-y-1">
                    <span className="text-sm font-semibold text-emerald-600">
                      Əlavə məlumat
                    </span>
                    <textarea
                      className={textareaCls}
                      value={cargo.additionalInfo}
                      onChange={(e) =>
                        patchCargo(cargo.id, {
                          additionalInfo: e.target.value,
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
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-sm font-medium text-emerald-800 transition-colors hover:bg-emerald-100"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-300 bg-white text-lg leading-none text-emerald-600">
                  +
                </span>
                Yükü əlavə et
              </button>
            </div>
          )}
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-slate-200 bg-white px-6 py-4">
          <button
            type="button"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            onClick={handleClose}
          >
            Bağla
          </button>
          <button
            type="button"
            className="rounded-xl border border-emerald-600 bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
            onClick={handleSubmit}
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>

    {transportTypeModalOpen && (
      <div
        className="fixed inset-0 z-[1200] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="transport-type-new-title"
      >
        <button
          type="button"
          className="absolute inset-0 bg-slate-900/45"
          aria-label="Bağla"
          onClick={closeNewTransportTypeModal}
        />
        <div
          className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.2)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
            <h2
              id="transport-type-new-title"
              className="text-lg font-semibold text-slate-900"
            >
              Nəqliyyatın yeni tipi
            </h2>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-xl leading-none text-slate-500 transition-colors hover:bg-slate-50"
              onClick={closeNewTransportTypeModal}
              aria-label="Bağla"
            >
              ×
            </button>
          </div>

          <div className="max-h-[min(70vh,520px)] overflow-y-auto px-5 py-4">
            <div className="space-y-4">
              <div>
                <ModalSentenceLabel required>Adı</ModalSentenceLabel>
                <input
                  className={inputCls}
                  value={newTransportName}
                  onChange={(e) => setNewTransportName(e.target.value)}
                  placeholder=""
                  autoComplete="off"
                />
              </div>
              <div>
                <ModalSentenceLabel required>
                  Nəqliyyatın tipi
                </ModalSentenceLabel>
                <Select
                  value={newTransportParentKind}
                  options={transportParentKindOptions}
                  onChange={setNewTransportParentKind}
                  placeholder="Dəyəri seçin"
                  className={selectCls}
                />
              </div>
              <label className="flex cursor-pointer items-center gap-2 pt-1 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className={checkboxCls}
                  checked={newTransportActive}
                  onChange={(e) =>
                    setNewTransportActive(e.target.checked)
                  }
                />
                <span>Aktiv</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-100 bg-slate-50/80 px-5 py-4">
            <button
              type="button"
              className="rounded-xl border border-emerald-600 bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
              onClick={saveNewTransportTypeModal}
            >
              Yaddaşda saxlamaq
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
