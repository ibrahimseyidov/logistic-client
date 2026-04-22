"use client";

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./musteriler.module.css";
import Select from "../../common/components/select/Select";
import type { SelectOption } from "../../common/components/select/Select";
import { MOCK_ROWS, type CustomerRow } from "./data";

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
  const navigate = useNavigate();
  const [rows, setRows] = useState<CustomerRow[]>(MOCK_ROWS);
  const [author, setAuthor] = useState("");
  const [counterparty, setCounterparty] = useState("");
  const [status, setStatus] = useState("");
  const [customerType, setCustomerType] = useState("");
  const [documentNo, setDocumentNo] = useState("");
  const [registerNo, setRegisterNo] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [applyRequested, setApplyRequested] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
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
      if (status && row.salesGroup !== STATUS_OPTIONS.find((x) => x.value === status)?.label) {
        return false;
      }
      if (
        customerType &&
        row.customerType !== TYPE_OPTIONS.find((x) => x.value === customerType)?.label
      ) {
        return false;
      }
      if (counterparty && !row.company.toLowerCase().includes(counterparty.toLowerCase())) {
        return false;
      }
      if (
        documentNo &&
        !row.contactPerson.toLowerCase().includes(documentNo.toLowerCase())
      ) {
        return false;
      }
      if (registerNo && !row.contactInfo.toLowerCase().includes(registerNo.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [counterparty, customerType, documentNo, registerNo, rows, status]);

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
  };

  const closeEditModal = () => {
    setEditingCustomerId(null);
  };

  const saveEditedCustomer = () => {
    if (!editingCustomerId) return;
    setRows((prev) =>
      prev.map((row) =>
        row.id === editingCustomerId
          ? {
              ...row,
              company: editForm.company.trim() || row.company,
              customerType: editForm.customerType.trim() || row.customerType,
              manager: editForm.manager.trim() || row.manager,
              contactPerson: editForm.contactPerson.trim() || row.contactPerson,
              contactInfo: editForm.contactInfo.trim() || row.contactInfo,
              address: editForm.address.trim() || row.address,
            }
          : row,
      ),
    );
    closeEditModal();
  };

  return (
    <div className={styles.container}>
      <section className={styles.filtersCard}>
        <div className={styles.filtersTopRow}>
          <button
            type="button"
            className={styles.applyButton}
            onClick={() => setApplyRequested((prev) => !prev)}
          >
            Filtrləri seçib yaddaşda saxla
          </button>
          <button type="button" className={styles.clearButton}>
            Filtrləri təmizlə
          </button>
        </div>

        <div className={styles.filtersGrid}>
          <label className={styles.field}>
            <span>Müəllif</span>
            <Select value={author} options={PLACEHOLDER} onChange={setAuthor} />
          </label>
          <label className={styles.field}>
            <span>Kontragentlər</span>
            <input
              value={counterparty}
              onChange={(event) => setCounterparty(event.target.value)}
              className={styles.input}
              placeholder="Şirkət adı"
            />
          </label>
          <label className={styles.field}>
            <span>Status</span>
            <Select value={status} options={STATUS_OPTIONS} onChange={setStatus} />
          </label>
          <label className={styles.field}>
            <span>Müştəri tipi</span>
            <Select
              value={customerType}
              options={TYPE_OPTIONS}
              onChange={setCustomerType}
            />
          </label>
          <label className={styles.field}>
            <span>Sənəd nömrəsi</span>
            <input
              value={documentNo}
              onChange={(event) => setDocumentNo(event.target.value)}
              className={styles.input}
              placeholder="Axtar..."
            />
          </label>
          <label className={styles.field}>
            <span>Hesab nömrəsi</span>
            <input
              value={registerNo}
              onChange={(event) => setRegisterNo(event.target.value)}
              className={styles.input}
              placeholder="Axtar..."
            />
          </label>
          <label className={styles.field}>
            <span>Tarixdən</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              className={styles.input}
            />
          </label>
          <label className={styles.field}>
            <span>Tarixədək</span>
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              className={styles.input}
            />
          </label>
        </div>
      </section>

      <section className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <span>Nəticələr: {filteredRows.length}</span>
          {applyRequested ? <span className={styles.savedTag}>Yadda saxlanıldı</span> : null}
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Şirkətin adı</th>
                <th>Müştəri tipi</th>
                <th>Əlaqədar şəxs</th>
                <th>Əlaqə məlumatları</th>
                <th>Ünvan</th>
                <th>Ölkə</th>
                <th>Menecer</th>
                <th>Kredit limiti</th>
                <th>Sonuncu əlaqədən günlər</th>
                <th>Sifarişlərin sayı</th>
                <th>Satışlar qrupu</th>
                <th>Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <button
                      type="button"
                      className={styles.companyButton}
                      onClick={() => navigate(`/musteriler/${row.id}`)}
                    >
                      {row.company}
                    </button>
                  </td>
                  <td>{row.customerType}</td>
                  <td>{row.contactPerson}</td>
                  <td>{row.contactInfo}</td>
                  <td>{row.address}</td>
                  <td>{row.country}</td>
                  <td>{row.manager}</td>
                  <td>{row.creditLimit}</td>
                  <td>{row.daysSinceLastContact}</td>
                  <td>{row.orderCount}</td>
                  <td>{row.salesGroup}</td>
                  <td>
                    <button
                      type="button"
                      className={styles.editActionButton}
                      onClick={() => openEditModal(row)}
                    >
                      Redaktə et
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {editingCustomerId ? (
        <div className={styles.editModalOverlay} role="dialog" aria-modal="true">
          <div className={styles.editModalCard}>
            <div className={styles.editModalHeader}>
              <h3>Müştərini redaktə et</h3>
              <button type="button" onClick={closeEditModal}>
                x
              </button>
            </div>
            <div className={styles.editTabs}>
              <button type="button" className={styles.editTabActive}>
                Əsas məlumatlar
              </button>
              <button type="button">Əlaqə məlumatları</button>
              <button type="button">Maliyyələr</button>
            </div>

            <div className={styles.editModalGrid}>
              <section className={styles.editColumn}>
                <h4>Şirkətin rekvizitləri</h4>
                <label>
                  <span>Name (full)</span>
                  <input
                    value={editForm.company}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, company: e.target.value }))}
                  />
                </label>
                <label>
                  <span>Name (abbreviated)</span>
                  <input
                    value={editForm.shortName}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, shortName: e.target.value }))
                    }
                  />
                </label>
                <label>
                  <span>Müştəri tipi</span>
                  <input
                    value={editForm.customerType}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, customerType: e.target.value }))
                    }
                  />
                </label>
                <label>
                  <span>Fəaliyyət növü</span>
                  <input
                    value={editForm.activityType}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, activityType: e.target.value }))
                    }
                    placeholder="Dəyəri seçin"
                  />
                </label>
                <label>
                  <span>VÖEN</span>
                  <input
                    value={editForm.voen}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, voen: e.target.value }))}
                  />
                </label>
              </section>

              <section className={styles.editColumn}>
                <h4>Client settings</h4>
                <label>
                  <span>Yaradılması tarixi</span>
                  <input value="16.01.2026" readOnly />
                </label>
                <label>
                  <span>Language of notifications</span>
                  <input
                    value={editForm.notificationsLang}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        notificationsLang: e.target.value,
                      }))
                    }
                    placeholder="Dəyəri seçin"
                  />
                </label>
                <label>
                  <span>Menecerlər</span>
                  <input
                    value={editForm.manager}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, manager: e.target.value }))
                    }
                  />
                </label>
                <label>
                  <span>Əlaqədar şəxs</span>
                  <input
                    value={editForm.contactPerson}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, contactPerson: e.target.value }))
                    }
                  />
                </label>
                <label>
                  <span>Telefon nömrəsi</span>
                  <input
                    value={editForm.contactInfo}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, contactInfo: e.target.value }))
                    }
                  />
                </label>
                <label>
                  <span>Ünvan</span>
                  <input
                    value={editForm.address}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, address: e.target.value }))
                    }
                  />
                </label>
                <label>
                  <span>Əlavə məlumat</span>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, notes: e.target.value }))}
                  />
                </label>
              </section>
            </div>

            <div className={styles.editModalFooter}>
              <button type="button" className={styles.clearButton} onClick={closeEditModal}>
                Ləğv et
              </button>
              <button type="button" className={styles.applyButton} onClick={saveEditedCustomer}>
                Yaddaşda saxlamaq
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

