// Tüm alanları string'e çeviren yardımcı fonksiyon
// Zorunlu alanlar eksikse bile boş string olarak ekle
const REQUIRED_FIELDS = [
  "number",
  "customerOrderRef",
  "status",
  "statusAssignedAt",
  "purpose",
  "transportType",
  "cargoInfo",
  "loadPlace",
  "recipient",
  "unloadPlace",
  "loadDate",
  "unloadDate",
  "seller",
  "priceOffers",
];

function toStringFields(fields: Record<string, any>) {
  const result: Record<string, string> = {};
  for (const key of REQUIRED_FIELDS) {
    result[key] = fields[key] == null ? "" : String(fields[key]);
  }
  // Diğer alanları da ekle (varsa)
  for (const [k, v] of Object.entries(fields)) {
    if (!(k in result)) {
      result[k] = v == null ? "" : String(v);
    }
  }
  return result;
}
("use client");

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppDispatch } from "../../common/store/hooks";
import { showNotification } from "../../common/store/modalSlice";
import Loading from "../../common/components/loading/Loading";
import type { SelectOption } from "../../common/components/select/Select";
import {
  SifarisActionBar,
  SifarisFilters,
  SifarisNewModal,
  SifarisPagination,
  SifarisTable,
  YukActionBar,
  YukFilters,
  YukTable,
  ReysFilters,
  ReysToolbar,
  ReysTable,
  EmekFilters,
  EmekSummaryBar,
  EmekTable,
  SifarisCopyModal,
  SifarisDeleteModal,
  type NewSifarisFormPayload,
} from "./components";
import styles from "./sifarisler.module.css";
import { ENDPOINTS } from "../../services/EndpointResources.g";
import {
  aggregateSifarisStats,
  applySifarisFilters,
} from "./lib/filterSifarisler";
import { aggregateYukStats, applyYukFilters } from "./lib/filterYukler";
import {
  aggregateReysStats,
  applyReysFilters,
  filterByTransport,
} from "./lib/filterReysler";
import { aggregateEmekStats, applyEmekFilters } from "./lib/filterEmek";
import { useSifarisPagination } from "./hooks/useSifarisPagination";
import { useYukPagination } from "./hooks/useYukPagination";
import { useReysPagination } from "./hooks/useReysPagination";
import { useEmekPagination } from "./hooks/useEmekPagination";
import type {
  SifarisFilterFormState,
  SifarisFilterSectionId,
  SifarisSubTab,
  SifarisOrderRow,
  OrderStatusKind,
} from "./types/sifaris.types";
import { emptySifarisFilter } from "./types/sifaris.types";
import type { YukFilterFormState, YukFilterSectionId } from "./types/yuk.types";
import { emptyYukFilter } from "./types/yuk.types";
import { YUK_USER_OPTIONS } from "./constants/yuk.constants";
import type {
  ReysFilterFormState,
  ReysFilterSectionId,
  ReysTransportMode,
} from "./types/reys.types";
import { emptyReysFilter } from "./types/reys.types";
import type {
  EmekFilterFormState,
  EmekFilterSectionId,
} from "./types/emek.types";
import { emptyEmekFilter } from "./types/emek.types";
import axios from "axios";

const YUK_ACCOUNT_OPTIONS: SelectOption[] = [
  { value: "", label: "Təfərrüatlı hesab irəli sür" },
  { value: "advance", label: "Avans hesabı" },
  { value: "closing", label: "Yekun hesab" },
];

const EMEK_SAVE_SELECTED_OPTIONS: SelectOption[] = [
  { value: "", label: "Seçilmişləri yaddaşda saxla" },
  { value: "template", label: "Şablon kimi saxla" },
];

export default function SifarislerPage() {
  // Data yükleniyor state'i
  const [loading, setLoading] = useState(true);
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const initialTab: SifarisSubTab =
    requestedTab === "loads" ||
    requestedTab === "voyages" ||
    requestedTab === "payroll"
      ? requestedTab
      : "orders";
  const [subTab, setSubTab] = useState<SifarisSubTab>(initialTab);
  const [openFilterPanel, setOpenFilterPanel] = useState<SifarisSubTab | null>(
    null,
  );
  const [isSifarisNewOpen, setIsSifarisNewOpen] = useState(false);

  const [orders, setOrders] = useState<SifarisOrderRow[]>([]);
  const [reysler, setReysler] = useState<any[]>([]);
  const [yukler, setYukler] = useState<any[]>([]);
  const [emekler, setEmekler] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (subTab === "orders") {
          const res = await axios.get(ENDPOINTS.ORDERS.BASE, { headers: { Authorization: "Bearer " + localStorage.getItem("token") } }).catch(() => ({ data: [] }));
          const mapped = (res.data || []).map((o: any) => {
            const voyages = o.voyages || [];
            const loads = o.loads || [];
            return {
              ...o,
              queryNumber: o.query?.number || "—",
              queryDate: o.query?.createdAt ? new Date(o.query.createdAt).toLocaleDateString("az-AZ") : "—",
              customer: o.customerName || "—",
              voyageNumber: voyages.length > 0 ? voyages.map((v: any) => v.tripRef || (v.id ? `R-${v.id}` : "—")).join(", ") : "—",
              carriers: voyages.length > 0 ? voyages.map((v: any) => v.carrier || "—").join(", ") : "—",
              route: voyages.length > 0 ? voyages.map((v: any) => `${v.loading || "—"} → ${v.unloading || "—"}`).join(" | ") : "—",
              cargoParams: loads.length > 0 ? loads.map((l: any) => l.cargoName || "—").join(", ") : "—",
              freight: o.freight ? o.freight.split(" + ")[0] : "—"
            };
          });
          setOrders(mapped);
        } else if (subTab === "voyages") {
          const res = await axios.get(ENDPOINTS.VOYAGES.BASE, { headers: { Authorization: "Bearer " + localStorage.getItem("token") } }).catch(() => ({ data: [] }));
          const mapped = (res.data || []).map((v: any) => ({
            ...v,
            orderRef: v.order?.orderNumber || "—",
            orderDate: v.order?.orderDate ? new Date(v.order.orderDate).toLocaleDateString("az-AZ") : "—"
          }));
          setReysler(mapped);
        } else if (subTab === "loads") {
          const res = await axios.get(ENDPOINTS.LOADS.BASE, { headers: { Authorization: "Bearer " + localStorage.getItem("token") } }).catch(() => ({ data: [] }));
          const mapped = (res.data || []).map((l: any) => ({
            ...l,
            orderRef: l.order?.orderNumber || "—",
            tripId: l.voyage?.tripRef || l.voyage?.id || "—",
            cargoStatus: l.status || "—",
            recipient: l.receiver || "—",
            cargoNumber: l.id ? `Y-${l.id}` : "—",
            company: l.order?.company || "—",
            customer: l.order?.customerName || "—",
            carrier: l.voyage?.carrier || "—"
          }));
          setYukler(mapped);
        } else if (subTab === "payroll") {
          const res = await axios.get(ENDPOINTS.PAYROLLS.BASE, { headers: { Authorization: "Bearer " + localStorage.getItem("token") } }).catch(() => ({ data: [] }));
          setEmekler(res.data || []);
        }
      } catch (e) {
        console.error("Data fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [subTab]);

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [duplicateTargetId, setDuplicateTargetId] = useState<string | null>(null);

  const deleteTargetOrder = useMemo(() => {
    if (!deleteTargetId) return null;
    return orders.find((o) => String(o.id) === String(deleteTargetId)) || null;
  }, [deleteTargetId, orders]);

  const duplicateTargetOrder = useMemo(() => {
    if (!duplicateTargetId) return null;
    return orders.find((o) => String(o.id) === String(duplicateTargetId)) || null;
  }, [duplicateTargetId, orders]);

  const [activeSections, setActiveSections] = useState<
    Set<SifarisFilterSectionId>
  >(() => new Set(["id", "dates"]));
  const [filterDraft, setFilterDraft] =
    useState<SifarisFilterFormState>(emptySifarisFilter);
  const [appliedFilter, setAppliedFilter] =
    useState<SifarisFilterFormState>(emptySifarisFilter);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const [templates, setTemplates] = useState<Array<{ name: string; filter: SifarisFilterFormState; activeSections: SifarisFilterSectionId[] }>>(() => {
    try {
      const saved = localStorage.getItem("logistic_sifaris_templates");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    return [
      {
        name: "Davam edən sifarişlər",
        filter: {
          ...emptySifarisFilter(),
          status: "progress",
        },
        activeSections: ["id" as SifarisFilterSectionId],
      },
      {
        name: "Planlaşdırılmış Ziyafreight sifarişləri",
        filter: {
          ...emptySifarisFilter(),
          status: "planned",
          company: "Ziyafreight",
        },
        activeSections: ["id" as SifarisFilterSectionId],
      },
    ];
  });

  const [yukActiveSections, setYukActiveSections] = useState<
    Set<YukFilterSectionId>
  >(() => new Set(["id"]));
  const [yukFilterDraft, setYukFilterDraft] =
    useState<YukFilterFormState>(emptyYukFilter);
  const [yukAppliedFilter, setYukAppliedFilter] =
    useState<YukFilterFormState>(emptyYukFilter);
  const [yukSelectedIds, setYukSelectedIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [yukAccountAction, setYukAccountAction] = useState("");

  const [reysActiveSections, setReysActiveSections] = useState<
    Set<ReysFilterSectionId>
  >(() => new Set(["id", "dates"]));
  const [reysFilterDraft, setReysFilterDraft] =
    useState<ReysFilterFormState>(emptyReysFilter);
  const [reysAppliedFilter, setReysAppliedFilter] =
    useState<ReysFilterFormState>(emptyReysFilter);
  const [reysTransportMode, setReysTransportMode] =
    useState<ReysTransportMode>("all");

  const [emekActiveSections, setEmekActiveSections] = useState<
    Set<EmekFilterSectionId>
  >(() => new Set(["id", "dates", "customers"]));
  const [emekFilterDraft, setEmekFilterDraft] =
    useState<EmekFilterFormState>(emptyEmekFilter);
  const [emekAppliedFilter, setEmekAppliedFilter] =
    useState<EmekFilterFormState>(emptyEmekFilter);
  const [emekSelectedIds, setEmekSelectedIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [emekSaveSelected, setEmekSaveSelected] = useState("");
  
  
  // Məlumatlar artıq useEffect daxilində API-dən gəlir, bu dummy useEffect-ə ehtiyac qalmır.

  useEffect(() => {
    const nextTab: SifarisSubTab =
      requestedTab === "loads" ||
      requestedTab === "voyages" ||
      requestedTab === "payroll"
        ? requestedTab
        : "orders";

    setSubTab((prev) => (prev === nextTab ? prev : nextTab));
  }, [requestedTab]);

  useEffect(() => {
    if (!openFilterPanel) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenFilterPanel(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openFilterPanel]);

  const toggleSection = useCallback((id: SifarisFilterSectionId) => {
    setActiveSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleYukSection = useCallback((id: YukFilterSectionId) => {
    setYukActiveSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleReysSection = useCallback((id: ReysFilterSectionId) => {
    setReysActiveSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleEmekSection = useCallback((id: EmekFilterSectionId) => {
    setEmekActiveSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const onFilterChange = useCallback(
    (field: keyof SifarisFilterFormState, value: string) => {
      setFilterDraft((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const onYukFilterChange = useCallback(
    (field: keyof YukFilterFormState, value: string) => {
      setYukFilterDraft((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const onReysFilterChange = useCallback(
    (field: keyof ReysFilterFormState, value: string) => {
      setReysFilterDraft((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const onEmekFilterChange = useCallback(
    (field: keyof EmekFilterFormState, value: string) => {
      setEmekFilterDraft((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const companyOptions: SelectOption[] = useMemo(() => {
    const names = [...new Set(orders.map((r) => r.company))].sort();
    return [
      { value: "", label: "Hamısı" },
      ...names.map((n) => ({ value: n, label: n })),
    ];
  }, [orders]);

  const reysCompanyOptions: SelectOption[] = useMemo(() => {
    const names = [...new Set(reysler.map((r) => r.company))].sort();
    return [
      { value: "", label: "Hamısı" },
      ...names.map((n) => ({ value: n, label: n })),
    ];
  }, [reysler]);

  const emekCompanyOptions: SelectOption[] = useMemo(() => {
    const names = [...new Set(emekler.map((r) => r.company))].sort();
    return [
      { value: "", label: "Hamısı" },
      ...names.map((n) => ({ value: n, label: n })),
    ];
  }, [emekler]);

  const emekCustomerOptions: SelectOption[] = useMemo(() => {
    const names = [...new Set(emekler.map((r) => r.customer))].sort();
    return [
      { value: "", label: "Hamısı" },
      ...names.map((n) => ({ value: n, label: n })),
    ];
  }, [emekler]);

  const emekCarrierOptions: SelectOption[] = useMemo(() => {
    const names = [...new Set(emekler.map((r) => r.carrier))].sort();
    return [
      { value: "", label: "Hamısı" },
      ...names.map((n) => ({ value: n, label: n })),
    ];
  }, [emekler]);

  const filteredRows = useMemo(
    () => applySifarisFilters(orders, appliedFilter),
    [orders, appliedFilter],
  );

  const stats = useMemo(
    () => aggregateSifarisStats(filteredRows),
    [filteredRows],
  );

  const sifarisActiveFilterCount = useMemo(
    () =>
      Object.values(appliedFilter).filter((value) =>
        typeof value === "string" ? value.trim() !== "" : !!value,
      ).length,
    [appliedFilter],
  );

  const {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedRows,
    getVisiblePages,
  } = useSifarisPagination(filteredRows);

  const yukFilteredRows = useMemo(
    () => applyYukFilters(yukler as any, yukAppliedFilter),
    [yukler, yukAppliedFilter],
  );

  const yukStats = useMemo(
    () => aggregateYukStats(yukFilteredRows),
    [yukFilteredRows],
  );

  const yukActiveFilterCount = useMemo(
    () =>
      Object.values(yukAppliedFilter).filter((value) => value.trim() !== "")
        .length,
    [yukAppliedFilter],
  );

  const {
    currentPage: yukPage,
    setCurrentPage: setYukPage,
    totalPages: yukTotalPages,
    paginatedRows: yukPaginated,
    getVisiblePages: yukGetVisiblePages,
  } = useYukPagination(yukFilteredRows);

  const reysFilteredRows = useMemo(() => {
    const after = applyReysFilters(reysler as any, reysAppliedFilter);
    return filterByTransport(after, reysTransportMode);
  }, [reysler, reysAppliedFilter, reysTransportMode]);

  const reysStats = useMemo(
    () => aggregateReysStats(reysFilteredRows),
    [reysFilteredRows],
  );

  const reysActiveFilterCount = useMemo(
    () =>
      Object.values(reysAppliedFilter).filter((value) => value.trim() !== "")
        .length,
    [reysAppliedFilter],
  );

  const {
    currentPage: reysPage,
    setCurrentPage: setReysPage,
    totalPages: reysTotalPages,
    paginatedRows: reysPaginated,
    getVisiblePages: reysGetVisiblePages,
  } = useReysPagination(reysFilteredRows);

  const emekFilteredRows = useMemo(
    () => applyEmekFilters(emekler as any, emekAppliedFilter),
    [emekler, emekAppliedFilter],
  );

  const emekStats = useMemo(
    () => aggregateEmekStats(emekFilteredRows),
    [emekFilteredRows],
  );

  const emekActiveFilterCount = useMemo(
    () =>
      Object.values(emekAppliedFilter).filter((value) => value.trim() !== "")
        .length,
    [emekAppliedFilter],
  );

  const {
    currentPage: emekPage,
    setCurrentPage: setEmekPage,
    totalPages: emekTotalPages,
    paginatedRows: emekPaginated,
    getVisiblePages: emekGetVisiblePages,
  } = useEmekPagination(emekFilteredRows);

  useEffect(() => {
    setOpenFilterPanel(null);
    setCurrentPage(1);
    setYukPage(1);
    setReysPage(1);
    setEmekPage(1);
    setSelectedIds(new Set());
    setYukSelectedIds(new Set());
    setEmekSelectedIds(new Set());
  }, [subTab, setCurrentPage, setYukPage, setReysPage, setEmekPage]);

  const handleApplyFilter = () => {
    setAppliedFilter({ ...filterDraft });
    setCurrentPage(1);
    setSelectedIds(new Set());
    setOpenFilterPanel(null);
  };

  const handleClear = () => {
    const empty = emptySifarisFilter();
    setFilterDraft(empty);
    setAppliedFilter(empty);
    setCurrentPage(1);
    setSelectedIds(new Set());
  };

  const handleYukApplyFilter = () => {
    setYukAppliedFilter({ ...yukFilterDraft });
    setYukPage(1);
    setYukSelectedIds(new Set());
    setOpenFilterPanel(null);
  };

  const handleYukClear = () => {
    const empty = emptyYukFilter();
    setYukFilterDraft(empty);
    setYukAppliedFilter(empty);
    setYukPage(1);
    setYukSelectedIds(new Set());
  };

  const handleReysApplyFilter = () => {
    setReysAppliedFilter({ ...reysFilterDraft });
    setReysPage(1);
    setOpenFilterPanel(null);
  };

  const handleReysClear = () => {
    const empty = emptyReysFilter();
    setReysFilterDraft(empty);
    setReysAppliedFilter(empty);
    setReysTransportMode("all");
    setReysPage(1);
  };

  const handleReysSaveTemplate = () => {
    dispatch(
      showNotification({
        message: "Reys filtri şablonu yadda saxlanıldı (demo).",
        type: "success",
        autoCloseDuration: 3000,
      }),
    );
  };

  const handleReysExcel = () => {
    dispatch(
      showNotification({
        message: "Excel ixrac (demo).",
        type: "info",
        autoCloseDuration: 2500,
      }),
    );
  };

  const handleReysTransportChange = (mode: ReysTransportMode) => {
    setReysTransportMode(mode);
    setReysPage(1);
  };

  const handleEmekApplyFilter = () => {
    setEmekAppliedFilter({ ...emekFilterDraft });
    setEmekPage(1);
    setEmekSelectedIds(new Set());
    setOpenFilterPanel(null);
  };

  const handleEmekClear = () => {
    const empty = emptyEmekFilter();
    setEmekFilterDraft(empty);
    setEmekAppliedFilter(empty);
    setEmekPage(1);
    setEmekSelectedIds(new Set());
  };

  const handleEmekSaveTemplate = () => {
    dispatch(
      showNotification({
        message: "Əmək haqqı filtri şablonu yadda saxlanıldı (demo).",
        type: "success",
        autoCloseDuration: 3000,
      }),
    );
  };

  const handleEmekExcel = () => {
    dispatch(
      showNotification({
        message: "Excel ixrac (demo).",
        type: "info",
        autoCloseDuration: 2500,
      }),
    );
  };

  const handleEmekPerformActions = () => {
    dispatch(
      showNotification({
        message: "Hərəkətlər yerinə yetirildi (demo).",
        type: "success",
        autoCloseDuration: 2800,
      }),
    );
  };

  const handleSaveTemplate = useCallback((name: string) => {
    if (!name.trim()) return;
    setTemplates((prev) => {
      const next = prev.filter((t) => t.name !== name);
      const newTemplate = {
        name,
        filter: { ...filterDraft },
        activeSections: Array.from(activeSections),
      };
      const updated = [...next, newTemplate];
      try {
        localStorage.setItem("logistic_sifaris_templates", JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
    dispatch(
      showNotification({
        message: `"${name}" şablonu uğurla yadda saxlanıldı.`,
        type: "success",
        autoCloseDuration: 3000,
      }),
    );
  }, [filterDraft, activeSections, dispatch]);

  const handleLoadTemplate = useCallback((name: string) => {
    const found = templates.find((t) => t.name === name);
    if (found) {
      setFilterDraft({
        ...emptySifarisFilter(),
        ...found.filter,
      });
      setActiveSections(new Set(found.activeSections));
      dispatch(
        showNotification({
          message: `"${name}" şablonu yükləndi.`,
          type: "info",
          autoCloseDuration: 2000,
        }),
      );
    }
  }, [templates, dispatch]);

  const handleYukSaveTemplate = () => {
    dispatch(
      showNotification({
        message: "Yük filtri şablonu yadda saxlanıldı (demo).",
        type: "success",
        autoCloseDuration: 3000,
      }),
    );
  };

  const handleExportExcel = () => {
    dispatch(
      showNotification({
        message: "Excel ixrac tezliklə əlavə olunacaq.",
        type: "info",
        autoCloseDuration: 3500,
      }),
    );
  };

  const handleNewOrder = () => {
    setIsSifarisNewOpen(true);
  };

  const handleNewOrderSubmit = async (_payload: NewSifarisFormPayload) => {
    // Tüm alanları string'e çevir, boş/undefined ise "" gönder
    const fields = _payload.fields || {};
    const fixedFields = toStringFields(fields);
    setIsSifarisNewOpen(false);

    const newOrder: SifarisOrderRow = {
      id: `order_${Date.now()}`,
      orderNumber: fixedFields.number || `SF-${Math.floor(1000 + Math.random() * 9000)}`,
      queryNumber: `SQ-${Math.floor(100 + Math.random() * 900)}`,
      queryDate: new Date().toLocaleDateString("az-AZ").split("T")[0],
      orderDate: new Date().toLocaleDateString("az-AZ").split("T")[0],
      actCreatedAt: "",
      actDate: "",
      cmrUnloadDate: "",
      invoicedDate: "",
      statusKind: (fixedFields.status as any) || "planned",
      statusLabel: fixedFields.status === "progress" ? "Davam edir" : fixedFields.status === "completed" ? "Tamamlanıb" : "Planlaşdırılır",
      customer: fixedFields.recipient || "Demo Müştəri",
      customerRefs: fixedFields.customerOrderRef || "",
      customerOrderRef: fixedFields.customerOrderRef || "",
      carriers: "Daşıyıcı A",
      voyageNumber: `VOY-${Math.floor(100 + Math.random() * 900)}`,
      route: `${fixedFields.loadPlace || "Bakı"} → ${fixedFields.unloadPlace || "Sumqayıt"}`,
      cargoParams: fixedFields.cargoInfo || "1 x 20ft Container",
      freight: "2,500 AZN",
      extraCosts: "100 AZN",
      profit: "2,400 AZN",
      documents: "1 sənəd",
      company: fixedFields.seller || "Ziyafreight",
      weightKg: 1000,
      volumeM3: 10,
      ldm: 0.5,
      freightAzn: 2500,
      profitAzn: 2400,
      hasSentInvoice: false,
      hasReceivedInvoice: false,
      hasTransportDoc: false,
      hasHandoverAct: false,
    };

    try {
      const res = await axios.post(ENDPOINTS.ORDERS.BASE, newOrder, {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") }
      });
      setOrders((prev) => [res.data, ...prev]);
      dispatch(
        showNotification({
          message: "Yeni sifariş uğurla yaradıldı.",
          type: "success",
          autoCloseDuration: 3000,
        }),
      );
    } catch (error) {
      dispatch(
        showNotification({
          message: "Sifariş yaradılarkən xəta baş verdi.",
          type: "error",
          autoCloseDuration: 3000,
        }),
      );
    }
  };

  const handleDeleteOrder = useCallback(async () => {
    if (!deleteTargetId) return;
    try {
      await axios.delete(ENDPOINTS.ORDERS.BY_ID(deleteTargetId), {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") }
      });
      setOrders((prev) => prev.filter((o) => String(o.id) !== String(deleteTargetId)));
      setDeleteTargetId(null);
      dispatch(
        showNotification({
          message: "Sifariş uğurla silindi.",
          type: "success",
          autoCloseDuration: 3000,
        }),
      );
    } catch (e) {
      dispatch(
        showNotification({
          message: "Sifariş silinərkən xəta baş verdi.",
          type: "error",
          autoCloseDuration: 3000,
        }),
      );
    }
  }, [deleteTargetId, dispatch]);

  const handleDuplicateOrder = useCallback(async (newNumber: string, checkedOptions: Record<string, boolean>) => {
    if (!duplicateTargetId || !duplicateTargetOrder) return;
    
    const newOrderPayload: any = {
      ...duplicateTargetOrder,
      orderNumber: newNumber,
      customerOrderRef: checkedOptions.customerOrderRef ? duplicateTargetOrder.customerOrderRef : "",
      statusKind: checkedOptions.status ? duplicateTargetOrder.statusKind : "planned",
      statusLabel: checkedOptions.status ? duplicateTargetOrder.statusLabel : "Planlaşdırılır",
      carriers: checkedOptions.expeditor ? duplicateTargetOrder.carriers : "",
      voyageNumber: checkedOptions.voyages ? duplicateTargetOrder.voyageNumber : "",
      cargoParams: checkedOptions.loads ? duplicateTargetOrder.cargoParams : "",
      extraCosts: checkedOptions.expenses ? duplicateTargetOrder.extraCosts : "",
      profit: checkedOptions.expenses ? duplicateTargetOrder.profit : duplicateTargetOrder.freight,
      profitAzn: checkedOptions.expenses ? duplicateTargetOrder.profitAzn : duplicateTargetOrder.freightAzn,
    };
    
    // Remove the original ID before sending to the backend so it creates a new one
    delete newOrderPayload.id;

    try {
      const res = await axios.post(ENDPOINTS.ORDERS.BASE, newOrderPayload, {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") }
      });

      setOrders((prev) => [res.data, ...prev]);
      setDuplicateTargetId(null);

      dispatch(
        showNotification({
          message: `Sifarişin surəti "${newNumber}" adı ilə yaradıldı.`,
          type: "success",
          autoCloseDuration: 3000,
        }),
      );
    } catch (e) {
      dispatch(
        showNotification({
          message: "Surət yaradılarkən xəta baş verdi.",
          type: "error",
          autoCloseDuration: 3000,
        }),
      );
    }
  }, [duplicateTargetId, duplicateTargetOrder, dispatch]);

  const handleStatusChange = useCallback(async (id: string, nextStatus: OrderStatusKind) => {
    let label = "Planlaşdırılıb";
    if (nextStatus === "progress") label = "Davam edir";
    else if (nextStatus === "completed") label = "Tamamlandı";
    else if (nextStatus === "finance_closed") label = "Maliyyə cəhətdən bağlandı";
    else if (nextStatus === "cancelled") label = "Sifariş ləğv edildi";
    
    try {
      const res = await axios.put(ENDPOINTS.ORDERS.BY_ID(id), { statusKind: nextStatus, statusLabel: label }, {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") }
      });
      
      setOrders((prev) => 
        prev.map((o) => {
          if (String(o.id) === String(id)) {
            return {
              ...o,
              statusKind: res.data.statusKind || nextStatus,
              statusLabel: res.data.statusLabel || label,
              statusHistory: res.data.statusHistory || []
            };
          }
          return o;
        })
      );

      dispatch(
        showNotification({
          message: "Sifarişin statusu yeniləndi.",
          type: "success",
          autoCloseDuration: 2500,
        }),
      );
    } catch (error) {
      dispatch(
        showNotification({
          message: "Status yenilənərkən xəta baş verdi.",
          type: "error",
          autoCloseDuration: 3000,
        }),
      );
    }
  }, [dispatch]);

  const handleYukTrackingImport = () => {
    dispatch(
      showNotification({
        message: "Tracking idxal (demo).",
        type: "info",
        autoCloseDuration: 2500,
      }),
    );
  };

  const handleYukExcel = () => {
    dispatch(
      showNotification({
        message: "Excel əməliyyatı (demo).",
        type: "info",
        autoCloseDuration: 2500,
      }),
    );
  };

  const handleYukPerformActions = () => {
    dispatch(
      showNotification({
        message: "Hərəkətlər yerinə yetirildi (demo).",
        type: "success",
        autoCloseDuration: 2800,
      }),
    );
  };

  const toggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllPage = (ids: string[], checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => {
        if (checked) next.add(id);
        else next.delete(id);
      });
      return next;
    });
  };

  const toggleYukRow = (id: string) => {
    setYukSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleYukAllPage = (ids: string[], checked: boolean) => {
    setYukSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => {
        if (checked) next.add(id);
        else next.delete(id);
      });
      return next;
    });
  };

  const toggleEmekRow = (id: string) => {
    setEmekSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleEmekAllPage = (ids: string[], checked: boolean) => {
    setEmekSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => {
        if (checked) next.add(id);
        else next.delete(id);
      });
      return next;
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        {subTab === "payroll" && (
          <EmekSummaryBar
            profitAzn={emekStats.profit}
            bonusAzn={emekStats.bonus}
            rewardAzn={emekStats.reward}
            saveSelectedValue={emekSaveSelected}
            onSaveSelectedChange={setEmekSaveSelected}
            saveSelectedOptions={EMEK_SAVE_SELECTED_OPTIONS}
            onToggleFilters={() => setOpenFilterPanel("payroll")}
            onExcel={handleEmekExcel}
            onPerformActions={handleEmekPerformActions}
            activeFilterCount={emekActiveFilterCount}
          />
        )}
        {subTab === "orders" && (
          <SifarisActionBar
            stats={stats}
            onNew={handleNewOrder}
            onToggleFilters={() => setOpenFilterPanel("orders")}
            onExportExcel={handleExportExcel}
            activeFilterCount={sifarisActiveFilterCount}
          />
        )}
        {subTab === "voyages" && (
          <ReysToolbar
            transportMode={reysTransportMode}
            onTransportChange={handleReysTransportChange}
            onToggleFilters={() => setOpenFilterPanel("voyages")}
            count={reysStats.count}
            totalValueAzn={reysStats.totalValueAzn}
            onExcel={handleReysExcel}
            activeFilterCount={reysActiveFilterCount}
          />
        )}
        {subTab === "loads" && (
          <YukActionBar
            stats={yukStats}
            accountAction={yukAccountAction}
            onAccountActionChange={setYukAccountAction}
            accountOptions={YUK_ACCOUNT_OPTIONS}
            onToggleFilters={() => setOpenFilterPanel("loads")}
            onTrackingImport={handleYukTrackingImport}
            onExcel={handleYukExcel}
            onPerformActions={handleYukPerformActions}
            activeFilterCount={yukActiveFilterCount}
          />
        )}
      </div>

      {/* Tablo gövdesi ve loading */}
      <div className={styles.body}>
        {loading ? (
          <div className={styles.statePanel}>
            <Loading />
          </div>
        ) : (
          <>
            {subTab === "orders" && (
              <>
                <div className={styles.tableBody}>
                  <SifarisTable
                    rows={paginatedRows}
                    selectedIds={selectedIds}
                    onToggleRow={toggleRow}
                    onToggleAllPage={toggleAllPage}
                    onDeleteClick={setDeleteTargetId}
                    onDuplicateClick={setDuplicateTargetId}
                    onStatusChange={handleStatusChange}
                  />
                </div>
                <div className={styles.footer}>
                  <SifarisPagination
                    totalRows={filteredRows.length}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    getVisiblePages={getVisiblePages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              </>
            )}
            {subTab === "voyages" && (
              <>
                <div className={styles.tableBody}>
                  <ReysTable rows={reysPaginated} />
                </div>
                <div className={styles.footer}>
                  <SifarisPagination
                    totalRows={reysFilteredRows.length}
                    currentPage={reysPage}
                    totalPages={reysTotalPages}
                    getVisiblePages={reysGetVisiblePages}
                    onPageChange={setReysPage}
                  />
                </div>
              </>
            )}
            {subTab === "loads" && (
              <>
                <div className={styles.tableBody}>
                  <YukTable
                    rows={yukPaginated}
                    selectedIds={yukSelectedIds}
                    onToggleRow={toggleYukRow}
                    onToggleAllPage={toggleYukAllPage}
                  />
                </div>
                <div className={styles.footer}>
                  <SifarisPagination
                    totalRows={yukFilteredRows.length}
                    currentPage={yukPage}
                    totalPages={yukTotalPages}
                    getVisiblePages={yukGetVisiblePages}
                    onPageChange={setYukPage}
                  />
                </div>
              </>
            )}
            {subTab === "payroll" && (
              <>
                <div className={styles.tableBody}>
                  <EmekTable
                    rows={emekPaginated}
                    selectedIds={emekSelectedIds}
                    onToggleRow={toggleEmekRow}
                    onToggleAllPage={toggleEmekAllPage}
                  />
                </div>
                <div className={styles.footer}>
                  <SifarisPagination
                    totalRows={emekFilteredRows.length}
                    currentPage={emekPage}
                    totalPages={emekTotalPages}
                    getVisiblePages={emekGetVisiblePages}
                    onPageChange={setEmekPage}
                  />
                </div>
              </>
            )}
          </>
        )}
      </div>
      <SifarisNewModal
        isOpen={isSifarisNewOpen}
        onClose={() => setIsSifarisNewOpen(false)}
        onSubmit={handleNewOrderSubmit}
      />

      {deleteTargetOrder && (
        <SifarisDeleteModal
          isOpen={!!deleteTargetId}
          onClose={() => setDeleteTargetId(null)}
          onConfirm={handleDeleteOrder}
          orderNumber={deleteTargetOrder.orderNumber}
        />
      )}

      {duplicateTargetOrder && (
        <SifarisCopyModal
          isOpen={!!duplicateTargetId}
          onClose={() => setDuplicateTargetId(null)}
          onConfirm={handleDuplicateOrder}
          order={duplicateTargetOrder}
        />
      )}

      <div
        className={`${styles.overlay} ${
          openFilterPanel ? styles.overlayOpen : ""
        }`}
        onClick={() => setOpenFilterPanel(null)}
        aria-hidden={!openFilterPanel}
      />

      <aside
        className={`${styles.drawer} ${
          openFilterPanel ? styles.drawerOpen : ""
        }`}
        aria-hidden={!openFilterPanel}
      >
        {openFilterPanel === "orders" ? (
          <SifarisFilters
            activeSections={activeSections}
            toggleSection={toggleSection}
            filter={filterDraft}
            onFilterChange={onFilterChange}
            companyOptions={companyOptions}
            onClose={() => setOpenFilterPanel(null)}
            onClear={handleClear}
            onApplyFilter={handleApplyFilter}
            onSaveTemplate={handleSaveTemplate}
            templates={templates}
            onLoadTemplate={handleLoadTemplate}
          />
        ) : null}

        {openFilterPanel === "loads" ? (
          <YukFilters
            activeSections={yukActiveSections}
            toggleSection={toggleYukSection}
            filter={yukFilterDraft}
            onFilterChange={onYukFilterChange}
            userOptions={YUK_USER_OPTIONS}
            onClose={() => setOpenFilterPanel(null)}
            onClear={handleYukClear}
            onApplyFilter={handleYukApplyFilter}
            onSaveTemplate={handleYukSaveTemplate}
          />
        ) : null}

        {openFilterPanel === "voyages" ? (
          <ReysFilters
            activeSections={reysActiveSections}
            toggleSection={toggleReysSection}
            filter={reysFilterDraft}
            onFilterChange={onReysFilterChange}
            companyOptions={reysCompanyOptions}
            onClose={() => setOpenFilterPanel(null)}
            onSaveTemplate={handleReysSaveTemplate}
            onClear={handleReysClear}
            onApplyFilter={handleReysApplyFilter}
          />
        ) : null}

        {openFilterPanel === "payroll" ? (
          <EmekFilters
            activeSections={emekActiveSections}
            toggleSection={toggleEmekSection}
            filter={emekFilterDraft}
            onFilterChange={onEmekFilterChange}
            companyOptions={emekCompanyOptions}
            customerOptions={emekCustomerOptions}
            carrierOptions={emekCarrierOptions}
            onClose={() => setOpenFilterPanel(null)}
            onSaveTemplate={handleEmekSaveTemplate}
            onClear={handleEmekClear}
            onApplyFilter={handleEmekApplyFilter}
          />
        ) : null}
      </aside>
    </div>
  );
}
