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

const currencyOptions = placeholderOpts([
  { value: "AZN", label: "AZN" },
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
]);

const vatRateOptions = placeholderOpts([
  { value: "0", label: "0%" },
  { value: "18", label: "18%" },
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
}: {
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg leading-none text-slate-700 transition-colors hover:bg-slate-50"
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

  const [loadDate, setLoadDate] = useState("");
  const [loadTime, setLoadTime] = useState("");
  const [unloadDate, setUnloadDate] = useState("");
  const [unloadTime, setUnloadTime] = useState("");
  const [priceStandard, setPriceStandard] = useState("0");
  const [currency, setCurrency] = useState("AZN");
  const [vatWith, setVatWith] = useState("0");
  const [vatRate, setVatRate] = useState("0");
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

  const [cargoTransportType, setCargoTransportType] = useState("");
  const [cargoWeight, setCargoWeight] = useState("");
  const [cargoVolume, setCargoVolume] = useState("");
  const [cargoPackages, setCargoPackages] = useState("");
  const [cargoDescription, setCargoDescription] = useState("");
  const [cargoDangerous, setCargoDangerous] = useState(false);
  const [cargoTemp, setCargoTemp] = useState("");

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
    setLoadDate("");
    setLoadTime("");
    setUnloadDate("");
    setUnloadTime("");
    setPriceStandard("0");
    setCurrency("AZN");
    setVatWith("0");
    setVatRate("0");
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
    setCargoTransportType("");
    setCargoWeight("");
    setCargoVolume("");
    setCargoPackages("");
    setCargoDescription("");
    setCargoDangerous(false);
    setCargoTemp("");
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
      loadDate,
      loadTime,
      unloadDate,
      unloadTime,
      priceStandard,
      currency,
      vatWith,
      vatRate,
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
      cargoTransportType,
      cargoWeight,
      cargoVolume,
      cargoPackages,
      cargoDescription,
      cargoDangerous,
      cargoTemp,
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

        <div className="flex shrink-0 gap-2 border-b border-slate-200 bg-white px-6 py-3">
          <button
            type="button"
            onClick={() => setTab("main")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tab === "main"
                ? "bg-slate-800 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Əsas məlumat
          </button>
          <button
            type="button"
            onClick={() => setTab("cargo")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tab === "cargo"
                ? "bg-slate-800 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Yük haqqında məlumat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 text-slate-800">
          {tab === "main" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className={cardCls}>
                  <div className="mb-4 text-sm font-semibold text-slate-900">
                    Əsas məlumatlar
                  </div>
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
                  </div>
                </div>

                <div className={cardCls}>
                  <div className="mb-4 text-sm font-semibold text-slate-900">
                    Tarix və qiymət
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label>Yükləmə tarixi</Label>
                        <input
                          type="date"
                          className={inputCls}
                          value={loadDate}
                          onChange={(e) => setLoadDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="block select-none text-[11px] font-semibold uppercase tracking-[0.12em] text-transparent">
                          Saat
                        </span>
                        <input
                          type="time"
                          className={inputCls}
                          value={loadTime}
                          onChange={(e) => setLoadTime(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label>Boşaltma tarixi</Label>
                        <input
                          type="date"
                          className={inputCls}
                          value={unloadDate}
                          onChange={(e) => setUnloadDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="block select-none text-[11px] font-semibold uppercase tracking-[0.12em] text-transparent">
                          Saat
                        </span>
                        <input
                          type="time"
                          className={inputCls}
                          value={unloadTime}
                          onChange={(e) => setUnloadTime(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label>Qiymət (standart)</Label>
                      <input
                        className={inputCls}
                        value={priceStandard}
                        onChange={(e) => setPriceStandard(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label required>Valyuta</Label>
                      <Select
                        value={currency}
                        options={currencyOptions}
                        onChange={setCurrency}
                        className={selectCls}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>ƏDV ilə</Label>
                      <input
                        className={inputCls}
                        value={vatWith}
                        onChange={(e) => setVatWith(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>ƏDV-nin tarifi</Label>
                      <Select
                        value={vatRate}
                        options={vatRateOptions}
                        onChange={setVatRate}
                        className={selectCls}
                      />
                    </div>
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
            <div
              className={`${cardCls} grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-2`}
            >
              <div className="space-y-1">
                <Label>Nəqliyyatın tipi</Label>
                <Select
                  value={cargoTransportType}
                  options={placeholderOpts([
                    { value: "air", label: "Hava" },
                    { value: "sea", label: "Dəniz" },
                    { value: "road", label: "Quru" },
                    { value: "rail", label: "Dəmir yolu" },
                  ])}
                  onChange={setCargoTransportType}
                  className={selectCls}
                />
              </div>
              <div className="space-y-1">
                <Label>Ümumi çəki (kq)</Label>
                <input
                  className={inputCls}
                  value={cargoWeight}
                  onChange={(e) => setCargoWeight(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Həcm (m³)</Label>
                <input
                  className={inputCls}
                  value={cargoVolume}
                  onChange={(e) => setCargoVolume(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Paket / yer sayı</Label>
                <input
                  className={inputCls}
                  value={cargoPackages}
                  onChange={(e) => setCargoPackages(e.target.value)}
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>Yükün təsviri</Label>
                <textarea
                  className={textareaCls}
                  value={cargoDescription}
                  onChange={(e) => setCargoDescription(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>Temperature / xüsusi şərtlər</Label>
                <input
                  className={inputCls}
                  value={cargoTemp}
                  onChange={(e) => setCargoTemp(e.target.value)}
                />
              </div>
              <label className="flex items-center gap-2 md:col-span-2 cursor-pointer">
                <input
                  type="checkbox"
                  className={checkboxCls}
                  checked={cargoDangerous}
                  onChange={(e) => setCargoDangerous(e.target.checked)}
                />
                <span className="text-sm">Təhlükəli yüklər (ADR və s.)</span>
              </label>
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
            className="rounded-xl border border-slate-300 bg-slate-800 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-700"
            onClick={handleSubmit}
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
