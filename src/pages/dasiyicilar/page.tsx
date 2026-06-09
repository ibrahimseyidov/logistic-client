"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./dasiyicilar.module.css";
import sorguLayoutStyles from "../sorgular/sorgular.module.css";
import sorguActionBarStyles from "../sorgular/components/SorgularActionBar.module.css";
import sorguTableStyles from "../sorgular/components/SorgularTable.module.css";
import Select from "../../common/components/select/Select";
import type { SelectOption } from "../../common/components/select/Select";
import { MOCK_ROWS, type CarrierRow } from "./data";
import { FiFilePlus, FiFilter, FiX } from "react-icons/fi";
import { FaEdit, FaTrash } from "react-icons/fa";
import {
  fetchCarriersAction,
  createCarrierAction,
  updateCarrierAction,
  deleteCarrierAction,
} from "../../common/actions/carrier.actions";
import { fetchContactPersonsAction, ContactPersonRow, createContactPersonAction } from "../../common/actions/contact.actions";
import { useAppDispatch } from "../../common/store/hooks";
import { showNotification } from "../../common/store/modalSlice";
import { ConfirmModal } from "../../common/components/ConfirmModal";
import { fetchQueriesAction } from "../../common/actions/query.actions";
import { fetchUsersAction, UserRow } from "../../common/actions/user.actions";

const PLACEHOLDER: SelectOption[] = [{ value: "", label: "Dəyəri seçin" }];

const STATUS_OPTIONS: SelectOption[] = [
  ...PLACEHOLDER,
  { value: "pending", label: "Gözləmədə" },
  { value: "paid", label: "Ödənilib" },
  { value: "error", label: "Xəta" },
];

const TYPE_OPTIONS: SelectOption[] = [
  ...PLACEHOLDER,
  { value: "new", label: "Yeni daşıyıcı" },
  { value: "corporate", label: "Korporativ" },
];

export default function DasiyicilarPage() {
  const dispatch = useAppDispatch();
  const PAGE_SIZE = 12;
  const [rows, setRows] = useState<CarrierRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePanel, setActivePanel] = useState<"filter" | "new" | "edit" | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [carrierIdToDelete, setCarrierIdToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newForm, setNewForm] = useState({
    company: "",
    shortName: "",
    carrierType: "",
    activityType: "",
    voen: "",
    manager: "",
    contactPersons: [] as string[],
    contactPerson: "",
    contactInfo: "",
    address: "",
    country: "AZ",
    creditLimit: "0",
    salesGroup: "",
  });
  const [newCarrierTab, setNewCarrierTab] = useState<"main" | "contact">("main");
  const [filterDraft, setFilterDraft] = useState({
    author: "",
    counterparty: "",
    status: "",
    carrierType: "",
    documentNo: "",
    registerNo: "",
    dateFrom: "",
    dateTo: "",
    daysSinceLastContact: "",
  });
  const [appliedFilter, setAppliedFilter] = useState({
    author: "",
    counterparty: "",
    status: "",
    carrierType: "",
    documentNo: "",
    registerNo: "",
    dateFrom: "",
    dateTo: "",
    daysSinceLastContact: "",
  });
  const [editingCarrierId, setEditingCarrierId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [editForm, setEditForm] = useState({
    company: "",
    shortName: "",
    carrierType: "",
    activityType: "",
    voen: "",
    manager: "",
    contactPersons: [] as string[],
    contactPerson: "",
    contactInfo: "",
    address: "",
    country: "AZ",
    creditLimit: "0",
    salesGroup: "",
  });
  
  const [availableContacts, setAvailableContacts] = useState<ContactPersonRow[]>([]);
  const [usersData, setUsersData] = useState<UserRow[]>([]);
  
  useEffect(() => {
    fetchContactPersonsAction().then(setAvailableContacts).catch(() => {});
    fetchUsersAction().then(setUsersData).catch(() => {});
  }, []);

  const userOpts = [
    { value: "", label: "Menecer seçin" },
    ...usersData.map((u) => ({ value: String(u.id), label: u.name })),
  ];

  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    position: "",
  });

  const handleCreateContactPerson = async () => {
    if (!contactForm.fullName.trim()) {
      dispatch(showNotification({ message: "Ad Soyad mütləqdir", type: "error" }));
      return;
    }
    try {
      const currentForm = activePanel === "new" ? newForm : editForm;
      const setForm = activePanel === "new" ? setNewForm : setEditForm;
      
      const newContact = {
        id: Date.now().toString(),
        fullName: contactForm.fullName.trim(),
        phone: contactForm.phone.trim(),
        email: contactForm.email.trim(),
        position: contactForm.position.trim(),
        company: currentForm.company || "",
      };
      
      setForm((prev: any) => ({
        ...prev,
        contactPersons: [...prev.contactPersons, newContact],
      }));
      
      // Reset inputs to prevent duplicate addition
      setContactForm({
        fullName: "",
        phone: "",
        email: "",
        position: "",
      });

      dispatch(
        showNotification({
          message: "Yeni əlaqədar şəxs yaradıldı. Siyahıdan seçə bilərsiniz.",
          type: "success",
        }),
      );
    } catch (error) {
      dispatch(
        showNotification({
          message: "Əlaqədar şəxs yaradılarkən xəta baş verdi",
          type: "error",
        }),
      );
    }
  };
  
  // We don't need a global contactOptions here anymore because it depends on the specific form (newForm/editForm)

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (
        appliedFilter.status &&
        row.salesGroup !==
          STATUS_OPTIONS.find((x) => x.value === appliedFilter.status)?.label
      ) {
        return false;
      }
      if (
        appliedFilter.carrierType &&
        row.carrierType !==
          TYPE_OPTIONS.find((x) => x.value === appliedFilter.carrierType)?.label
      ) {
        return false;
      }
      if (
        appliedFilter.counterparty &&
        !row.company.toLowerCase().includes(appliedFilter.counterparty.toLowerCase())
      ) {
        return false;
      }
      if (
        appliedFilter.documentNo &&
        !row.contactPerson.toLowerCase().includes(appliedFilter.documentNo.toLowerCase())
      ) {
        return false;
      }
      if (
        appliedFilter.registerNo &&
        !row.contactInfo.toLowerCase().includes(appliedFilter.registerNo.toLowerCase())
      ) {
        return false;
      }
      if (
        appliedFilter.daysSinceLastContact &&
        row.daysSinceLastContact < parseInt(appliedFilter.daysSinceLastContact, 10)
      ) {
        return false;
      }
      return true;
    });
  }, [appliedFilter, rows]);

  const activeFilterCount = useMemo(
    () =>
      Object.values(appliedFilter).filter((value) => value.trim() !== "").length,
    [appliedFilter],
  );

  const activeCarriersCount = useMemo(
    () => filteredRows.filter((row) => row.salesGroup !== "Xəta").length,
    [filteredRows],
  );
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const paginatedRows = useMemo(
    () =>
      filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredRows, currentPage],
  );

  useEffect(() => {
    loadCarriers();
  }, []);

  const loadCarriers = async () => {
    setLoading(true);
    try {
      const [data, queries] = await Promise.all([
        fetchCarriersAction(),
        fetchQueriesAction()
      ]);
      // Backend datalarını frontend formatına çevir
      const mapped: CarrierRow[] = data.map((c: any) => {
        const carrierQueriesCount = queries.filter((q: any) => {
          const qCust = typeof q.carrier === "object" && q.carrier ? q.carrier.id : q.carrier;
          return String(qCust) === String(c.id);
        }).length;

        return {
          id: String(c.id),
          company: c.name || c.company || "-",
          carrierType: c.carrierType || "Yeni daşıyıcı",
          contactPerson: c.contactPerson || "-",
          contactPersons: c.contactPersons || [],
          contactInfo: c.phone || "-",
          address: c.address || "-",
          country: c.country || "AZ",
          manager: c.manager || "-",
          creditLimit: c.creditLimit || "0",
          daysSinceLastContact: typeof c.daysSinceLastContact === "number" 
            ? c.daysSinceLastContact 
            : (c.id === "1" ? 0 : c.id === "2" ? 18 : c.id === "3" ? 14 : (parseInt(c.id, 10) % 25 || 5)),
          orderCount: 0,
          queriesCount: carrierQueriesCount,
          salesGroup: c.company || "-",
        };
      });
      setRows(mapped);
    } catch (error) {
      dispatch(
        showNotification({
          message: "Daşıyıcılər yüklənərkən xata baş verdi",
          type: "error",
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!activePanel) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActivePanel(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activePanel]);

  useEffect(() => {
    setCurrentPage(1);
  }, [appliedFilter]);

  useEffect(() => {
    if (!activePanel) return undefined;
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, [activePanel]);

  const handleFilterChange = (field: keyof typeof filterDraft, value: string) => {
    setFilterDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyFilter = () => {
    setAppliedFilter({ ...filterDraft });
    setActivePanel(null);
  };

  const handleClearFilter = () => {
    const empty = {
      author: "",
      counterparty: "",
      status: "",
      carrierType: "",
      documentNo: "",
      registerNo: "",
      dateFrom: "",
      dateTo: "",
      daysSinceLastContact: "",
    };
    setFilterDraft(empty);
    setAppliedFilter(empty);
  };

  const handleCreateCarrier = async () => {
    if (!newForm.company.trim()) return;
    try {
      const payload = {
        name: newForm.company.trim(),
        carrierType: TYPE_OPTIONS.find((x) => x.value === newForm.carrierType)?.label || "Yeni daşıyıcı",
        manager: newForm.manager.trim(),
        contactPersons: newForm.contactPersons,
        contactPerson: newForm.contactPerson || "",
        phone: newForm.contactInfo.trim(),
        address: newForm.address.trim(),
        company: newForm.company.trim(),
        shortName: newForm.shortName.trim(),
        activityType: newForm.activityType.trim(),
        voen: newForm.voen.trim(),
        country: newForm.country.trim(),
        creditLimit: newForm.creditLimit.trim(),
        salesGroup: newForm.salesGroup.trim(),
      };
      await createCarrierAction(payload);
      dispatch(
        showNotification({
          message: "Daşıyıcı uğurla yaradıldı",
          type: "success",
        }),
      );
      loadCarriers();
      setActivePanel(null);
      setNewCarrierTab("main");
      setNewForm({
        company: "",
        shortName: "",
        carrierType: "",
        activityType: "",
        voen: "",
        manager: "",
        contactPersons: [],
        contactPerson: "",
        contactInfo: "",
        address: "",
        country: "AZ",
        creditLimit: "0",
        salesGroup: "",
      });
    } catch (error) {
      dispatch(
        showNotification({
          message: "Daşıyıcı yaradılarkən xata baş verdi",
          type: "error",
        }),
      );
    }
  };

  const openEditModal = (carrier: CarrierRow) => {
    setEditingCarrierId(carrier.id);
    setEditForm({
      company: carrier.company,
      shortName: carrier.company,
      carrierType: TYPE_OPTIONS.find((x) => x.label === carrier.carrierType)?.value || carrier.carrierType,
      activityType: "",
      voen: "",
      manager: carrier.manager,
      contactPersons: (carrier as any).contactPersons || [],
      contactPerson: carrier.contactPerson || "",
      contactInfo: carrier.contactInfo,
      address: carrier.address,
      country: carrier.country || "AZ",
      creditLimit: carrier.creditLimit || "0",
      salesGroup: carrier.salesGroup || "",
    });
    setActivePanel("edit");
  };

  const closeEditModal = () => {
    setEditingCarrierId(null);
    setActivePanel(null);
  };

  const saveEditedCarrier = async () => {
    if (!editingCarrierId) return;
    try {
      const payload = {
        name: editForm.company.trim(),
        carrierType: TYPE_OPTIONS.find((x) => x.value === editForm.carrierType)?.label || "Yeni daşıyıcı",
        manager: editForm.manager.trim(),
        contactPersons: editForm.contactPersons,
        contactPerson: editForm.contactPerson || "",
        phone: editForm.contactInfo.trim(),
        address: editForm.address.trim(),
        company: editForm.company.trim(),
        shortName: editForm.shortName.trim(),
        activityType: editForm.activityType.trim(),
        voen: editForm.voen.trim(),
        country: editForm.country.trim(),
        creditLimit: editForm.creditLimit.trim(),
        salesGroup: editForm.salesGroup.trim(),
      };
      await updateCarrierAction(editingCarrierId, payload);
      dispatch(
        showNotification({
          message: "Daşıyıcı məlumatları yeniləndi",
          type: "success",
        }),
      );
      loadCarriers();
      closeEditModal();
    } catch (error) {
      dispatch(
        showNotification({
          message: "Daşıyıcı yenilənərkən xata baş verdi",
          type: "error",
        }),
      );
    }
  };

  const handleDeleteCarrierClick = (carrierId: string) => {
    setCarrierIdToDelete(carrierId);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!carrierIdToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCarrierAction(carrierIdToDelete);
      dispatch(
        showNotification({
          message: "Daşıyıcı silindi",
          type: "success",
        }),
      );
      loadCarriers();
      setDeleteConfirmOpen(false);
      setCarrierIdToDelete(null);
    } catch (error) {
      dispatch(
        showNotification({
          message: "Daşıyıcı silinərkən xata baş verdi",
          type: "error",
        }),
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={sorguLayoutStyles.container}>
      <div className={sorguLayoutStyles.header}>
        <section className={sorguActionBarStyles.wrapper}>
          <div className={sorguActionBarStyles.group}>
            <button
              type="button"
              className={`${sorguActionBarStyles.buttonBase} ${sorguActionBarStyles.buttonPrimary}`}
              onClick={() => setActivePanel("new")}
            >
              <FiFilePlus />
              Yeni daşıyıcı
            </button>
            <button
              type="button"
              className={`${sorguActionBarStyles.buttonBase} ${sorguActionBarStyles.buttonSecondary}`}
              onClick={() => setActivePanel("filter")}
            >
              <FiFilter />
              Filtrlər
              {activeFilterCount > 0 ? (
                <span className={sorguActionBarStyles.badge}>{activeFilterCount}</span>
              ) : null}
            </button>
          </div>

          <div className={sorguActionBarStyles.statsGroup}>
            <span className={sorguActionBarStyles.statPill}>Cəmi: {filteredRows.length}</span>
            <span className={sorguActionBarStyles.statPill}>Aktiv: {activeCarriersCount}</span>
          </div>
          <div className={sorguActionBarStyles.group}>
            <button
              type="button"
              className={`${sorguActionBarStyles.buttonBase} ${sorguActionBarStyles.buttonSecondary}`}
            >
              Excel-dən idxal et
            </button>
            <button
              type="button"
              className={`${sorguActionBarStyles.buttonBase} ${sorguActionBarStyles.buttonSecondary}`}
            >
              Excel-ə ixrac et
            </button>
          </div>
        </section>
      </div>

      <div className={sorguLayoutStyles.body}>
        <table className={sorguTableStyles.table}>
            <thead className={sorguTableStyles.head}>
              <tr>
                <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min180}`}>Şirkətin adı</th>
                <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min150}`}>Daşıyıcı tipi</th>
                <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min170}`}>Əlaqədar şəxs</th>
                <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min170}`}>Əlaqə məlumatları</th>
                <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min180}`}>Ünvan</th>
                <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min120}`}>Ölkə</th>
                <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min150}`}>Menecer</th>
                <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min120}`}>Kredit limiti</th>
                <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min160}`}>Sonuncu əlaqədən günlər</th>
                <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min140}`}>Sifarişlərin sayı</th>
                <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min140}`}>Sorğuların sayı</th>
                <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min150}`}>Satışlar qrupu</th>
                <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min120}`}>Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row, index) => (
                <tr
                  key={row.id}
                  className={index % 2 === 0 ? sorguTableStyles.rowEven : sorguTableStyles.rowOdd}
                >
                  <td
                    className={`${sorguTableStyles.cell} ${sorguTableStyles.nowrap} ${sorguTableStyles.center}`}
                  >
                    <Link
                      to={`/dasiyicilar/${row.id}`}
                      className={sorguTableStyles.link}
                    >
                      {row.company}
                    </Link>
                  </td>
                  <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>{row.carrierType}</td>
                  <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>
                    {row.contactPerson && row.contactPerson !== "-"
                      ? row.contactPerson.split(',').map((id: string) => {
                          const cp: any = (row as any).contactPersons?.find((c: any) => String(c.id) === id);
                          return cp ? cp.fullName : null;
                        }).filter(Boolean).join(', ') || "-"
                      : "-"}
                  </td>
                  <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>{row.contactInfo}</td>
                  <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>{row.address}</td>
                  <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>{row.country}</td>
                  <td className={sorguTableStyles.cell}>
                    {usersData.find(u => String(u.id) === String(row.manager))?.name || row.manager}
                  </td>
                  <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>{row.creditLimit}</td>
                  <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>{row.daysSinceLastContact}</td>
                   <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>{row.orderCount}</td>
                  <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>{row.queriesCount}</td>
                  <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>{row.salesGroup}</td>
                  <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>
                    <div className={sorguTableStyles.actionRow}>
                      <button
                        type="button"
                        className={`${sorguTableStyles.iconButton} ${sorguTableStyles.detailsButton}`}
                        onClick={() => openEditModal(row)}
                        aria-label="Redaktə et"
                        title="Redaktə et"
                      >
                        <FaEdit />
                      </button>
                      <button
                        type="button"
                        className={`${sorguTableStyles.iconButton} ${sorguTableStyles.deleteButton}`}
                        onClick={() => handleDeleteCarrierClick(row.id)}
                        aria-label="Sil"
                        title="Sil"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {loading && (
                <tr>
                  <td colSpan={13} className={sorguTableStyles.center} style={{ padding: "40px" }}>
                    Yüklənir...
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={13} className={sorguTableStyles.center} style={{ padding: "40px" }}>
                    Daşıyıcı tapılmadı
                  </td>
                </tr>
              )}
            </tbody>
          </table>
      </div>

      <div className={sorguLayoutStyles.footer}>
        <div className={styles.paginationBar}>
          <span>Cəmi sətir: {filteredRows.length}</span>
          <div className={styles.paginationActions}>
            <button
              type="button"
              className={styles.paginationButton}
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            >
              Əvvəlki
            </button>
            <span className={styles.paginationCurrent}>{currentPage}</span>
            <button
              type="button"
              className={styles.paginationButton}
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Sonrakı
            </button>
          </div>
        </div>
      </div>

      <div
        className={`${sorguLayoutStyles.overlay} ${activePanel ? sorguLayoutStyles.overlayOpen : ""}`}
        onClick={() => setActivePanel(null)}
        aria-hidden={!activePanel}
      />

      <aside
        className={`${sorguLayoutStyles.drawer} ${activePanel ? sorguLayoutStyles.drawerOpen : ""}`}
        aria-hidden={!activePanel}
      >
        {activePanel === "filter" ? (
          <div className={styles.filterPanel}>
            <div className={styles.filterHeader}>
              <h3>Filtrlər</h3>
              <button type="button" onClick={() => setActivePanel(null)}>
                <FiX />
              </button>
            </div>
            <div className={styles.filtersGrid}>
              <label className={styles.field}>
                <span>Müəllif</span>
                <Select
                  value={filterDraft.author}
                  options={PLACEHOLDER}
                  onChange={(value) => handleFilterChange("author", value)}
                />
              </label>
              <label className={styles.field}>
                <span>Kontragentlər</span>
                <input
                  value={filterDraft.counterparty}
                  onChange={(event) =>
                    handleFilterChange("counterparty", event.target.value)
                  }
                  className={styles.input}
                  placeholder="Şirkət adı"
                />
              </label>
              <label className={styles.field}>
                <span>Status</span>
                <Select
                  value={filterDraft.status}
                  options={STATUS_OPTIONS}
                  onChange={(value) => handleFilterChange("status", value)}
                />
              </label>
              <label className={styles.field}>
                <span>Daşıyıcı tipi</span>
                <Select
                  value={filterDraft.carrierType}
                  options={TYPE_OPTIONS}
                  onChange={(value) => handleFilterChange("carrierType", value)}
                />
              </label>
              <label className={styles.field}>
                <span>Sənəd nömrəsi</span>
                <input
                  value={filterDraft.documentNo}
                  onChange={(event) =>
                    handleFilterChange("documentNo", event.target.value)
                  }
                  className={styles.input}
                  placeholder="Axtar..."
                />
              </label>
              <label className={styles.field}>
                <span>Hesab nömrəsi</span>
                <input
                  value={filterDraft.registerNo}
                  onChange={(event) =>
                    handleFilterChange("registerNo", event.target.value)
                  }
                  className={styles.input}
                  placeholder="Axtar..."
                />
              </label>
              <label className={styles.field}>
                <span>Tarixdən</span>
                <input
                  type="date"
                  value={filterDraft.dateFrom}
                  onChange={(event) => handleFilterChange("dateFrom", event.target.value)}
                  className={styles.input}
                />
              </label>
              <label className={styles.field}>
                <span>Tarixədək</span>
                <input
                  type="date"
                  value={filterDraft.dateTo}
                  onChange={(event) => handleFilterChange("dateTo", event.target.value)}
                  className={styles.input}
                />
              </label>
              <label className={styles.field}>
                <span>Sonuncu əlaqə (ən az gün)</span>
                <input
                  type="number"
                  min="0"
                  value={filterDraft.daysSinceLastContact}
                  onChange={(event) => handleFilterChange("daysSinceLastContact", event.target.value)}
                  className={styles.input}
                  placeholder="Gün sayı..."
                />
              </label>
            </div>
            <div className={styles.filterFooter}>
              <button type="button" className={styles.clearButton} onClick={handleClearFilter}>
                Filtrləri təmizlə
              </button>
              <button type="button" className={styles.applyButton} onClick={handleApplyFilter}>
                Filterdən keçir
              </button>
            </div>
          </div>
        ) : null}

        {(() => {
          const isNew = activePanel === "new";
          const isEdit = activePanel === "edit" && editingCarrierId;
          if (!isNew && !isEdit) return null;
          
          const form = isNew ? newForm : editForm;
          const setForm = isNew ? setNewForm : setEditForm;
          const handleSave = isNew ? handleCreateCarrier : saveEditedCarrier;
          const title = isNew ? "Yeni daşıyıcı" : "Daşıyıcıni redaktə et";
          const description = isNew
            ? "Daşıyıcı məlumatlarını doldurub yaddaşa əlavə edin."
            : "Mövcud daşıyıcı məlumatlarını yeniləyin.";

          return (
            <div className={styles.newPanel}>
              <div className={styles.newPanelHeader}>
                <div>
                  <h2 className={styles.newPanelTitle}>{title}</h2>
                  <p className={styles.newPanelDescription}>{description}</p>
                </div>
                <button
                  type="button"
                  className={styles.newPanelClose}
                  onClick={() => {
                    if (isEdit) closeEditModal();
                    else setActivePanel(null);
                  }}
                  aria-label="Bağla"
                >
                  ×
                </button>
              </div>
              <div className={styles.newPanelBody}>
                {/* 1. Əsas məlumatlar */}
                <div className={styles.newPanelCard}>
                  <h3 className={styles.newPanelCardTitle}>Əsas məlumatlar</h3>
                  <div className={styles.newPanelGrid}>
                    <label className={styles.field}>
                      <span>Şirkətin adı (Tam) *</span>
                      <input
                        value={form.company}
                        onChange={(e) =>
                          setForm((prev: any) => ({ ...prev, company: e.target.value }))
                        }
                        className={styles.input}
                        placeholder="Şirkətin tam adını daxil edin"
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Şirkətin adı (Qısa)</span>
                      <input
                        value={form.shortName}
                        onChange={(e) =>
                          setForm((prev: any) => ({ ...prev, shortName: e.target.value }))
                        }
                        className={styles.input}
                        placeholder="Qısa ad"
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Daşıyıcı tipi</span>
                      <Select
                        value={form.carrierType}
                        options={TYPE_OPTIONS}
                        onChange={(value) =>
                          setForm((prev: any) => ({ ...prev, carrierType: value }))
                        }
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Fəaliyyət növü</span>
                      <input
                        value={form.activityType}
                        onChange={(e) =>
                          setForm((prev: any) => ({ ...prev, activityType: e.target.value }))
                        }
                        className={styles.input}
                        placeholder="Məs: Logistika, İstehsalat"
                      />
                    </label>
                    <label className={styles.field}>
                      <span>VÖEN</span>
                      <input
                        value={form.voen}
                        onChange={(e) =>
                          setForm((prev: any) => ({ ...prev, voen: e.target.value }))
                        }
                        className={styles.input}
                        placeholder="VÖEN daxil edin"
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Menecer</span>
                      <Select
                        value={form.manager}
                        options={userOpts}
                        onChange={(value) =>
                          setForm((prev: any) => ({ ...prev, manager: value }))
                        }
                      />
                    </label>
                  </div>
                </div>

                {/* 2. Əlaqə məlumatları */}
                <div className={styles.newPanelCard}>
                  <h3 className={styles.newPanelCardTitle}>Əlaqə məlumatları</h3>
                  <div className={styles.newPanelGrid}>
                    <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                        <span style={{ fontWeight: 600 }}>Əlaqədar şəxslər (Sifarişlər üçün seçilmiş)</span>
                        <div style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '4px' }}>
                          Daşıyıcıyə aid bütün şəxsləri sağdakı "İdarə et" düyməsindən yarada bilərsiniz. Yaratdıqdan sonra Sifariş və Sorğularda görünməsini istədiyiniz şəxsləri bu siyahıdan seçin.
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <div style={{ flex: 1 }}>
                            <Select
                              isMulti
                              value={form.contactPerson ? form.contactPerson.split(',').filter((id: string) => form.contactPersons.some((c: any) => String(c.id) === id)) : []}
                              options={[
                                { value: "", label: "Şəxs seçin", disabled: true },
                                ...form.contactPersons.map((c: any) => ({
                                  value: String(c.id),
                                  label: c.fullName
                                }))
                              ]}
                              onChange={(val) => {
                                const valStr = Array.isArray(val) ? val.join(',') : val;
                                setForm((prev: any) => ({ ...prev, contactPerson: valStr }));
                              }}
                              placeholder="Şəxs seçin..."
                            />
                          </div>
                          <button 
                            type="button" 
                            onClick={() => {
                              setContactForm({
                                fullName: "",
                                phone: "",
                                email: "",
                                position: "",
                              });
                              setIsContactModalOpen(true);
                            }}
                            style={{
                              background: '#e0f2fe', border: '1px solid #bae6fd', borderRadius: '6px',
                              cursor: 'pointer', padding: '10px 16px', fontSize: '0.85rem', fontWeight: 600, color: '#0369a1',
                              whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                            title="Əlaqədar şəxsləri idarə et"
                          >
                            İdarə et
                          </button>
                        </div>
                      </div>
                      

                    </div>
                    <label className={styles.field}>
                      <span>Telefon nömrəsi</span>
                      <input
                        value={form.contactInfo}
                        onChange={(e) =>
                          setForm((prev: any) => ({ ...prev, contactInfo: e.target.value }))
                        }
                        className={styles.input}
                        placeholder="+994 XX XXX XX XX"
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Ölkə</span>
                      <input
                        value={form.country}
                        onChange={(e) =>
                          setForm((prev: any) => ({ ...prev, country: e.target.value }))
                        }
                        className={styles.input}
                        placeholder="Məs: AZ"
                      />
                    </label>
                    <label className={styles.field} style={{ gridColumn: '1 / -1' }}>
                      <span>Ünvan</span>
                      <input
                        value={form.address}
                        onChange={(e) =>
                          setForm((prev: any) => ({ ...prev, address: e.target.value }))
                        }
                        className={styles.input}
                        placeholder="Tam ünvanı daxil edin"
                      />
                    </label>
                  </div>
                </div>

                {/* 3. Maliyyə və Satış */}
                <div className={styles.newPanelCard}>
                  <h3 className={styles.newPanelCardTitle}>Maliyyə və Satış</h3>
                  <div className={styles.newPanelGrid}>
                    <label className={styles.field}>
                      <span>Kredit limiti</span>
                      <input
                        type="number"
                        value={form.creditLimit}
                        onChange={(e) =>
                          setForm((prev: any) => ({ ...prev, creditLimit: e.target.value }))
                        }
                        className={styles.input}
                        placeholder="0.00"
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Satışlar qrupu</span>
                      <input
                        value={form.salesGroup}
                        onChange={(e) =>
                          setForm((prev: any) => ({ ...prev, salesGroup: e.target.value }))
                        }
                        className={styles.input}
                        placeholder="Qrup adı"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className={styles.newPanelFooter}>
                <button
                  type="button"
                  className={styles.clearButton}
                  onClick={() => {
                    if (isEdit) closeEditModal();
                    else setActivePanel(null);
                  }}
                >
                  {isEdit ? "Ləğv et" : "Bağla"}
                </button>
                <button
                  type="button"
                  className={styles.applyButton}
                  onClick={handleSave}
                >
                  Yaddaşda saxlamaq
                </button>
              </div>
            </div>
          );
        })()}
      </aside>
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        title="Daşıyıcıni sil"
        message="Bu daşıyıcıni silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz."
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setCarrierIdToDelete(null);
        }}
        isLoading={isDeleting}
      />
      {isContactModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem"
          }}
          onClick={() => setIsContactModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #f1f5f9",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              padding: "1.75rem",
              width: "100%",
              maxWidth: "700px",
              maxHeight: "90vh",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a", marginBottom: "4px", marginTop: 0 }}>
                  Əlaqədar şəxslər
                </h3>
                <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0 }}>
                  {((activePanel === "new") ? newForm : editForm).company ? `${((activePanel === "new") ? newForm : editForm).company} üçün əlaqədar şəxslər` : "Yeni şirkət üçün əlaqədar şəxslər"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsContactModalOpen(false)}
                style={{
                  background: "transparent", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#64748b"
                }}
              >
                ×
              </button>
            </div>

            <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
                <thead style={{ background: "#f8fafc", color: "#475569" }}>
                  <tr>
                    <th style={{ padding: "10px", borderBottom: "1px solid #e2e8f0", fontWeight: 600 }}>Ad Soyad</th>
                    <th style={{ padding: "10px", borderBottom: "1px solid #e2e8f0", fontWeight: 600 }}>Telefon</th>
                    <th style={{ padding: "10px", borderBottom: "1px solid #e2e8f0", fontWeight: 600 }}>E-poçt</th>
                    <th style={{ padding: "10px", borderBottom: "1px solid #e2e8f0", fontWeight: 600 }}>Vəzifə</th>
                  </tr>
                </thead>
                <tbody>
                  {((activePanel === "new") ? newForm : editForm).contactPersons.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: "16px", textAlign: "center", color: "#94a3b8" }}>
                        Bu daşıyıcıyə aid heç bir əlaqədar şəxs tapılmadı.
                      </td>
                    </tr>
                  ) : (
                    ((activePanel === "new") ? newForm : editForm).contactPersons.map((c: any, i: number) => (
                      <tr key={i} style={{ borderBottom: "1px solid #e2e8f0" }}>
                        <td style={{ padding: "10px" }}>{c.fullName}</td>
                        <td style={{ padding: "10px" }}>{c.phone || "-"}</td>
                        <td style={{ padding: "10px" }}>{c.email || "-"}</td>
                        <td style={{ padding: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          {c.position || "-"}
                          <button
                            type="button"
                            onClick={() => {
                              const setForm = activePanel === "new" ? setNewForm : setEditForm;
                              setForm((prev: any) => ({
                                ...prev,
                                contactPersons: prev.contactPersons.filter((_: any, idx: number) => idx !== i)
                              }));
                            }}
                            style={{
                              background: '#fee2e2', border: 'none', borderRadius: '4px',
                              color: '#ef4444', cursor: 'pointer', padding: '4px 8px', fontSize: '0.75rem', fontWeight: 600
                            }}
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <h4 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#1e293b", marginBottom: "1rem", marginTop: 0 }}>Yeni şəxs əlavə et</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <label className={styles.field} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>Ad Soyad *</span>
                  <input
                    type="text"
                    value={contactForm.fullName}
                    onChange={(e) => setContactForm(prev => ({ ...prev, fullName: e.target.value }))}
                    className={styles.input}
                    placeholder="Məs: Nicat Namazov"
                    style={{ width: "100%", background: "#fff" }}
                  />
                </label>
                <label className={styles.field} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>Telefon nömrəsi</span>
                  <input
                    type="number"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                    className={styles.input}
                    placeholder="Məs: 500000000"
                    style={{ width: "100%", background: "#fff" }}
                  />
                </label>
                <label className={styles.field} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>E-poçt</span>
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                    className={styles.input}
                    placeholder="Məs: info@domain.com"
                    style={{ width: "100%", background: "#fff" }}
                  />
                </label>
                <label className={styles.field} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>Vəzifə</span>
                  <div style={{ background: "#fff" }}>
                    <Select
                      value={contactForm.position}
                      options={[
                        { value: "", label: "Vəzifə seçin" },
                        { value: "Direktor", label: "Direktor" },
                        { value: "Menecer", label: "Menecer" },
                        { value: "Mühasib", label: "Mühasib" },
                        { value: "Logistik", label: "Logistik" },
                        { value: "Digər", label: "Digər" },
                      ]}
                      onChange={(val) => setContactForm(prev => ({ ...prev, position: val }))}
                    />
                  </div>
                </label>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
                <button
                  type="button"
                  onClick={handleCreateContactPerson}
                  style={{
                    background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", padding: "0.5rem 1.25rem",
                    fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)"
                  }}
                >
                  Siyahıya əlavə et
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

