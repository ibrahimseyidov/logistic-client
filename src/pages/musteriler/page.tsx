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
    customerType: "",
    manager: "",
    contactPerson: "",
    contactInfo: "",
    address: "",
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
    contactPerson: "",
    contactInfo: "",
    address: "",
    notificationsLang: "",
    notes: "",
  });

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
        contactPerson: newForm.contactPerson.trim(),
        phone: newForm.contactInfo.trim(),
        address: newForm.address.trim(),
        company: newForm.company.trim(),
        country: "AZ",
        creditLimit: "0",
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
        customerType: "",
        manager: "",
        contactPerson: "",
        contactInfo: "",
        address: "",
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
      customerType: customer.customerType,
      activityType: "",
      voen: "",
      manager: customer.manager,
      contactPerson: customer.contactPerson,
      contactInfo: customer.contactInfo,
      address: customer.address,
      notificationsLang: "",
      notes: "",
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
        customerType: editForm.customerType.trim(),
        manager: editForm.manager.trim(),
        contactPerson: editForm.contactPerson.trim(),
        phone: editForm.contactInfo.trim(),
        address: editForm.address.trim(),
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

        {activePanel === "new" ? (
          <div className={styles.newPanel}>
            <div className={styles.newPanelHeader}>
              <div>
                <h2 className={styles.newPanelTitle}>Yeni müştəri</h2>
                <p className={styles.newPanelDescription}>
                  Müştəri məlumatlarını doldurub yaddaşa əlavə edin.
                </p>
              </div>
              <button
                type="button"
                className={styles.newPanelClose}
                onClick={() => setActivePanel(null)}
                aria-label="Bağla"
              >
                ×
              </button>
            </div>
            <div className={styles.newTabBar}>
              <button
                type="button"
                onClick={() => setNewCustomerTab("main")}
                className={`${styles.newTabButton} ${
                  newCustomerTab === "main" ? styles.newTabButtonActive : ""
                }`}
              >
                Əsas məlumat
              </button>
              <button
                type="button"
                onClick={() => setNewCustomerTab("contact")}
                className={`${styles.newTabButton} ${
                  newCustomerTab === "contact" ? styles.newTabButtonActive : ""
                }`}
              >
                Əlaqə məlumatları
              </button>
            </div>

            <div className={styles.newPanelBody}>
              <div className={styles.newPanelCard}>
                <h3 className={styles.newPanelCardTitle}>Müştəri məlumatları</h3>
                <div className={styles.newPanelGrid}>
                  <label className={styles.field}>
                    <span>Şirkətin adı *</span>
                    <input
                      value={newForm.company}
                      onChange={(e) =>
                        setNewForm((prev) => ({ ...prev, company: e.target.value }))
                      }
                      className={styles.input}
                      placeholder="Şirkətin adı"
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Müştəri tipi</span>
                    <Select
                      value={newForm.customerType}
                      options={TYPE_OPTIONS}
                      onChange={(value) =>
                        setNewForm((prev) => ({ ...prev, customerType: value }))
                      }
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Menecer</span>
                    <input
                      value={newForm.manager}
                      onChange={(e) =>
                        setNewForm((prev) => ({ ...prev, manager: e.target.value }))
                      }
                      className={styles.input}
                    />
                  </label>

                  {newCustomerTab === "contact" ? (
                    <>
                      <label className={styles.field}>
                        <span>Əlaqədar şəxs</span>
                        <input
                          value={newForm.contactPerson}
                          onChange={(e) =>
                            setNewForm((prev) => ({ ...prev, contactPerson: e.target.value }))
                          }
                          className={styles.input}
                        />
                      </label>
                      <label className={styles.field}>
                        <span>Əlaqə məlumatları</span>
                        <input
                          value={newForm.contactInfo}
                          onChange={(e) =>
                            setNewForm((prev) => ({ ...prev, contactInfo: e.target.value }))
                          }
                          className={styles.input}
                        />
                      </label>
                      <label className={styles.field}>
                        <span>Ünvan</span>
                        <input
                          value={newForm.address}
                          onChange={(e) =>
                            setNewForm((prev) => ({ ...prev, address: e.target.value }))
                          }
                          className={styles.input}
                        />
                      </label>
                    </>
                  ) : null}
                </div>
              </div>
            </div>

            <div className={styles.newPanelFooter}>
              <button
                type="button"
                className={styles.clearButton}
                onClick={() => setActivePanel(null)}
              >
                Bağla
              </button>
              <button
                type="button"
                className={styles.applyButton}
                onClick={handleCreateCustomer}
              >
                Yaddaşda saxlamaq
              </button>
            </div>
          </div>
        ) : null}

        {activePanel === "edit" && editingCustomerId ? (
          <div className={styles.newPanel}>
            <div className={styles.newPanelHeader}>
              <div>
                <h2 className={styles.newPanelTitle}>Müştərini redaktə et</h2>
                <p className={styles.newPanelDescription}>
                  Mövcud müştəri məlumatlarını yeniləyin.
                </p>
              </div>
              <button
                type="button"
                className={styles.newPanelClose}
                onClick={closeEditModal}
                aria-label="Bağla"
              >
                ×
              </button>
            </div>

            <div className={styles.newTabBar}>
              <button type="button" className={`${styles.newTabButton} ${styles.newTabButtonActive}`}>
                Əsas məlumatlar
              </button>
              <button type="button" className={styles.newTabButton}>
                Əlaqə məlumatları
              </button>
              <button type="button" className={styles.newTabButton}>
                Maliyyələr
              </button>
            </div>

            <div className={styles.newPanelBody}>
              <div className={styles.newPanelCard}>
                <h3 className={styles.newPanelCardTitle}>Şirkətin rekvizitləri</h3>
                <div className={styles.newPanelGrid}>
                  <label className={styles.field}>
                    <span>Name (full)</span>
                    <input
                      value={editForm.company}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, company: e.target.value }))}
                      className={styles.input}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Name (abbreviated)</span>
                    <input
                      value={editForm.shortName}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, shortName: e.target.value }))}
                      className={styles.input}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Müştəri tipi</span>
                    <input
                      value={editForm.customerType}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, customerType: e.target.value }))}
                      className={styles.input}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Fəaliyyət növü</span>
                    <input
                      value={editForm.activityType}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, activityType: e.target.value }))}
                      className={styles.input}
                      placeholder="Dəyəri seçin"
                    />
                  </label>
                  <label className={styles.field}>
                    <span>VÖEN</span>
                    <input
                      value={editForm.voen}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, voen: e.target.value }))}
                      className={styles.input}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Menecerlər</span>
                    <input
                      value={editForm.manager}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, manager: e.target.value }))}
                      className={styles.input}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Əlaqədar şəxs</span>
                    <input
                      value={editForm.contactPerson}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, contactPerson: e.target.value }))}
                      className={styles.input}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Telefon nömrəsi</span>
                    <input
                      value={editForm.contactInfo}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, contactInfo: e.target.value }))}
                      className={styles.input}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Ünvan</span>
                    <input
                      value={editForm.address}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, address: e.target.value }))}
                      className={styles.input}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className={styles.newPanelFooter}>
              <button type="button" className={styles.clearButton} onClick={closeEditModal}>
                Ləğv et
              </button>
              <button type="button" className={styles.applyButton} onClick={saveEditedCustomer}>
                Yaddaşda saxlamaq
              </button>
            </div>
          </div>
        ) : null}
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

