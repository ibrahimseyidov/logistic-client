"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./musteriler.module.css";
import sorguLayoutStyles from "../sorgular/sorgular.module.css";
import sorguActionBarStyles from "../sorgular/components/SorgularActionBar.module.css";
import sorguTableStyles from "../sorgular/components/SorgularTable.module.css";
import Select from "../../common/components/select/Select";
import type { SelectOption } from "../../common/components/select/Select";
import { MOCK_ROWS, type CustomerRow } from "./data";
import { FiFilePlus, FiFilter, FiX } from "react-icons/fi";
import { FaEdit, FaTrash } from "react-icons/fa";
import {
  fetchCustomersAction,
  createCustomerAction,
  updateCustomerAction,
  deleteCustomerAction,
} from "../../common/actions/customer.actions";
import { fetchContactPersonsAction, ContactPersonRow } from "../../common/actions/contact.actions";
import { useAppDispatch } from "../../common/store/hooks";
import { showNotification } from "../../common/store/modalSlice";
import { ConfirmModal } from "../../common/components/ConfirmModal";

const PLACEHOLDER: SelectOption[] = [{ value: "", label: "Dəyəri seçin" }];

const STATUS_OPTIONS: SelectOption[] = [
  ...PLACEHOLDER,
  { value: "pending", label: "Gözləmədə" },
  { value: "paid", label: "Ödənilib" },
  { value: "error", label: "Xəta" },
];

const TYPE_OPTIONS: SelectOption[] = [
  ...PLACEHOLDER,
  { value: "new", label: "Yeni müştəri" },
  { value: "corporate", label: "Korporativ" },
];

export default function MusterilerPage() {
  const dispatch = useAppDispatch();
  const PAGE_SIZE = 12;
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePanel, setActivePanel] = useState<"filter" | "new" | "edit" | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [customerIdToDelete, setCustomerIdToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newForm, setNewForm] = useState({
    company: "",
    shortName: "",
    customerType: "",
    activityType: "",
    voen: "",
    manager: "",
    contactPersons: [] as string[],
    contactInfo: "",
    address: "",
    country: "AZ",
    creditLimit: "0",
    salesGroup: "",
  });
  const [newCustomerTab, setNewCustomerTab] = useState<"main" | "contact">("main");
  const [filterDraft, setFilterDraft] = useState({
    author: "",
    counterparty: "",
    status: "",
    customerType: "",
    documentNo: "",
    registerNo: "",
    dateFrom: "",
    dateTo: "",
  });
  const [appliedFilter, setAppliedFilter] = useState({
    author: "",
    counterparty: "",
    status: "",
    customerType: "",
    documentNo: "",
    registerNo: "",
    dateFrom: "",
    dateTo: "",
  });
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [editForm, setEditForm] = useState({
    company: "",
    shortName: "",
    customerType: "",
    activityType: "",
    voen: "",
    manager: "",
    contactPersons: [] as string[],
    contactInfo: "",
    address: "",
    country: "AZ",
    creditLimit: "0",
    salesGroup: "",
  });
  
  const [availableContacts, setAvailableContacts] = useState<ContactPersonRow[]>([]);
  
  useEffect(() => {
    fetchContactPersonsAction().then(setAvailableContacts).catch(() => {});
  }, []);
  
  const contactOptions: SelectOption[] = [
    { value: "", label: "Şəxs seçin" },
    ...availableContacts.map(c => ({ 
      value: c.id, 
      label: `${c.fullName} ${c.company ? `(${c.company})` : ""}`.trim() 
    }))
  ];

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
        appliedFilter.customerType &&
        row.customerType !==
          TYPE_OPTIONS.find((x) => x.value === appliedFilter.customerType)?.label
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
      return true;
    });
  }, [appliedFilter, rows]);

  const activeFilterCount = useMemo(
    () =>
      Object.values(appliedFilter).filter((value) => value.trim() !== "").length,
    [appliedFilter],
  );

  const activeCustomersCount = useMemo(
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
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await fetchCustomersAction();
      // Backend datalarını frontend formatına çevir
      const mapped: CustomerRow[] = data.map((c: any) => ({
        id: String(c.id),
        company: c.name || c.company || "-",
        customerType: c.customerType || "Yeni müştəri",
        contactPerson: c.contactPerson || "-",
        contactPersons: c.contactPersons || [],
        contactInfo: c.phone || "-",
        address: c.address || "-",
        country: c.country || "AZ",
        manager: c.manager || "-",
        creditLimit: c.creditLimit || "0",
        daysSinceLastContact: 0,
        orderCount: 0,
        salesGroup: c.company || "-",
      }));
      setRows(mapped);
    } catch (error) {
      dispatch(
        showNotification({
          message: "Müştərilər yüklənərkən xata baş verdi",
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
      customerType: "",
      documentNo: "",
      registerNo: "",
      dateFrom: "",
      dateTo: "",
    };
    setFilterDraft(empty);
    setAppliedFilter(empty);
  };

  const handleCreateCustomer = async () => {
    if (!newForm.company.trim()) return;
    try {
      const payload = {
        name: newForm.company.trim(),
        customerType: TYPE_OPTIONS.find((x) => x.value === newForm.customerType)?.label || "Yeni müştəri",
        manager: newForm.manager.trim(),
        contactPersons: newForm.contactPersons,
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
      await createCustomerAction(payload);
      dispatch(
        showNotification({
          message: "Müştəri uğurla yaradıldı",
          type: "success",
        }),
      );
      loadCustomers();
      setActivePanel(null);
      setNewCustomerTab("main");
      setNewForm({
        company: "",
        shortName: "",
        customerType: "",
        activityType: "",
        voen: "",
        manager: "",
        contactPersons: [],
        contactInfo: "",
        address: "",
        country: "AZ",
        creditLimit: "0",
        salesGroup: "",
      });
    } catch (error) {
      dispatch(
        showNotification({
          message: "Müştəri yaradılarkən xata baş verdi",
          type: "error",
        }),
      );
    }
  };

  const openEditModal = (customer: CustomerRow) => {
    setEditingCustomerId(customer.id);
    setEditForm({
      company: customer.company,
      shortName: customer.company,
      customerType: TYPE_OPTIONS.find((x) => x.label === customer.customerType)?.value || customer.customerType,
      activityType: "",
      voen: "",
      manager: customer.manager,
      contactPersons: (customer as any).contactPersons || [],
      contactInfo: customer.contactInfo,
      address: customer.address,
      country: customer.country || "AZ",
      creditLimit: customer.creditLimit || "0",
      salesGroup: customer.salesGroup || "",
    });
    setActivePanel("edit");
  };

  const closeEditModal = () => {
    setEditingCustomerId(null);
    setActivePanel(null);
  };

  const saveEditedCustomer = async () => {
    if (!editingCustomerId) return;
    try {
      const payload = {
        name: editForm.company.trim(),
        customerType: TYPE_OPTIONS.find((x) => x.value === editForm.customerType)?.label || "Yeni müştəri",
        manager: editForm.manager.trim(),
        contactPersons: editForm.contactPersons,
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
      await updateCustomerAction(editingCustomerId, payload);
      dispatch(
        showNotification({
          message: "Müştəri məlumatları yeniləndi",
          type: "success",
        }),
      );
      loadCustomers();
      closeEditModal();
    } catch (error) {
      dispatch(
        showNotification({
          message: "Müştəri yenilənərkən xata baş verdi",
          type: "error",
        }),
      );
    }
  };

  const handleDeleteCustomerClick = (customerId: string) => {
    setCustomerIdToDelete(customerId);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!customerIdToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCustomerAction(customerIdToDelete);
      dispatch(
        showNotification({
          message: "Müştəri silindi",
          type: "success",
        }),
      );
      loadCustomers();
      setDeleteConfirmOpen(false);
      setCustomerIdToDelete(null);
    } catch (error) {
      dispatch(
        showNotification({
          message: "Müştəri silinərkən xata baş verdi",
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
              Yeni müştəri
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
            <span className={sorguActionBarStyles.statPill}>Aktiv: {activeCustomersCount}</span>
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
                <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min150}`}>Müştəri tipi</th>
                <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min170}`}>Əlaqədar şəxs</th>
                <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min170}`}>Əlaqə məlumatları</th>
                <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min180}`}>Ünvan</th>
                <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min120}`}>Ölkə</th>
                <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min150}`}>Menecer</th>
                <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min120}`}>Kredit limiti</th>
                <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min160}`}>Sonuncu əlaqədən günlər</th>
                <th className={`${sorguTableStyles.headerCell} ${sorguTableStyles.min140}`}>Sifarişlərin sayı</th>
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
                      to={`/musteriler/${row.id}`}
                      className={sorguTableStyles.link}
                    >
                      {row.company}
                    </Link>
                  </td>
                  <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>{row.customerType}</td>
                  <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>{row.contactPerson}</td>
                  <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>{row.contactInfo}</td>
                  <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>{row.address}</td>
                  <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>{row.country}</td>
                  <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>{row.manager}</td>
                  <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>{row.creditLimit}</td>
                  <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>{row.daysSinceLastContact}</td>
                  <td className={`${sorguTableStyles.cell} ${sorguTableStyles.center}`}>{row.orderCount}</td>
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
                        onClick={() => handleDeleteCustomerClick(row.id)}
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
                  <td colSpan={12} className={sorguTableStyles.center} style={{ padding: "40px" }}>
                    Yüklənir...
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={12} className={sorguTableStyles.center} style={{ padding: "40px" }}>
                    Müştəri tapılmadı
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
                <span>Müştəri tipi</span>
                <Select
                  value={filterDraft.customerType}
                  options={TYPE_OPTIONS}
                  onChange={(value) => handleFilterChange("customerType", value)}
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
          const isEdit = activePanel === "edit" && editingCustomerId;
          if (!isNew && !isEdit) return null;
          
          const form = isNew ? newForm : editForm;
          const setForm = isNew ? setNewForm : setEditForm;
          const handleSave = isNew ? handleCreateCustomer : saveEditedCustomer;
          const title = isNew ? "Yeni müştəri" : "Müştərini redaktə et";
          const description = isNew
            ? "Müştəri məlumatlarını doldurub yaddaşa əlavə edin."
            : "Mövcud müştəri məlumatlarını yeniləyin.";

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
                      <span>Müştəri tipi</span>
                      <Select
                        value={form.customerType}
                        options={TYPE_OPTIONS}
                        onChange={(value) =>
                          setForm((prev: any) => ({ ...prev, customerType: value }))
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
                      <input
                        value={form.manager}
                        onChange={(e) =>
                          setForm((prev: any) => ({ ...prev, manager: e.target.value }))
                        }
                        className={styles.input}
                        placeholder="Məsul menecer"
                      />
                    </label>
                  </div>
                </div>

                {/* 2. Əlaqə məlumatları */}
                <div className={styles.newPanelCard}>
                  <h3 className={styles.newPanelCardTitle}>Əlaqə məlumatları</h3>
                  <div className={styles.newPanelGrid}>
                    <label className={styles.field} style={{ gridColumn: '1 / -1' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Əlaqədar şəxslər</span>
                        <button 
                          type="button" 
                          onClick={() => setForm((prev: any) => ({ ...prev, contactPersons: [...prev.contactPersons, ""] }))}
                          style={{
                            background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '6px',
                            cursor: 'pointer', padding: '2px 8px', fontSize: '1rem', color: '#3b82f6'
                          }}
                          title="Əlavə et"
                        >
                          +
                        </button>
                      </div>
                      {form.contactPersons.length === 0 && (
                        <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Əlaqədar şəxs əlavə edilməyib</div>
                      )}
                      {form.contactPersons.map((personId: string, idx: number) => (
                        <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <div style={{ flex: 1 }}>
                            <Select
                              value={personId}
                              options={contactOptions}
                              onChange={(val) => {
                                const newList = [...form.contactPersons];
                                newList[idx] = val;
                                setForm((prev: any) => ({ ...prev, contactPersons: newList }));
                              }}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newList = [...form.contactPersons];
                              newList.splice(idx, 1);
                              setForm((prev: any) => ({ ...prev, contactPersons: newList }));
                            }}
                            style={{
                              background: '#fee2e2', border: 'none', borderRadius: '6px',
                              cursor: 'pointer', padding: '0.4rem 0.6rem', color: '#dc2626'
                            }}
                            title="Sil"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </label>
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
        title="Müştərini sil"
        message="Bu müştərini silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz."
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setCustomerIdToDelete(null);
        }}
        isLoading={isDeleting}
      />
    </div>
  );
}

