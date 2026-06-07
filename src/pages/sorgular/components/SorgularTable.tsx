import { Link } from "react-router-dom";
import { FaCheck, FaClipboard, FaMinus, FaEdit, FaTrash, FaHandHoldingUsd, FaCheckCircle } from "react-icons/fa";
import { statusLabelAz } from "../../../common/components/StatusBadge";
import { type LogisticQueryRow, SorguStatus } from "../types/sorgu.types";
import styles from "./SorgularTable.module.css";

import React, { useState, useEffect } from "react";
import { SorgularEditModal, SorgularOfferModal, SorguStatusDropdown } from "./index";
import { useAppDispatch } from "../../../common/store/hooks";
import { showNotification } from "../../../common/store/modalSlice";
import {
  updateQueryAction,
  deleteQueryAction,
  fetchQueryDetailAction,
} from "../../../common/actions/query.actions";
import { ConfirmModal } from "../../../common/components/ConfirmModal";
import {
  CARGO_TRANSPORT_OPTIONS,
  COMPANY_OPTIONS,
  CUSTOMER_OPTIONS,
  PACKAGING_TYPE_OPTIONS,
  PERSON_OPTIONS,
} from "../constants/options.constants";

interface Props {
  rows: LogisticQueryRow[];
  customers?: any[];
  onUpdate?: (updated: LogisticQueryRow) => void;
  onDelete?: (id: string | number) => void;
  onApproveStatus?: (row: LogisticQueryRow, payload: any) => void;
}

const COLUMN_COUNT = 11;

function formatCreated(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("az-AZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateOnly(value: string) {
  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleDateString("az-AZ", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  const datePart = value.split("T")[0]?.trim();
  if (!datePart) return "—";

  const fallback = new Date(datePart);
  if (!Number.isNaN(fallback.getTime())) {
    return fallback.toLocaleDateString("az-AZ", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  return datePart;
}

function getCustomerFullName(row: LogisticQueryRow, customers?: any[]) {
  const anyRow = row as any;
  const customer = anyRow.customer;
  const toText = (value: unknown) =>
    typeof value === "string" ? value.trim() : "";

  if (customer && typeof customer === "object") {
    const name = customer.name || customer.companyName || customer.company || customer.fullName || customer.displayName;
    if (name) return name;
  }

  if (anyRow.customerName) return anyRow.customerName;

  const customerText = toText(customer);
  if (customerText) {
    if (Array.isArray(customers)) {
      const found = customers.find(c => c.id?.toString() === customerText);
      if (found) return found.name || found.companyName || found.fullName || found.company;
    }
    const matched = CUSTOMER_OPTIONS.find(
      (opt) => opt.value.toLowerCase() === customerText.toLowerCase()
    );
    if (matched) return matched.label;
    return customerText;
  }

  const joinName = (first: unknown, last: unknown) =>
    `${toText(first)} ${toText(last)}`.trim();
  const fullName =
    joinName(
      anyRow.customerFirstName ??
        anyRow.customerFirstname ??
        anyRow.firstName ??
        anyRow.firstname ??
        anyRow.name ??
        anyRow.givenName ??
        anyRow.ad,
      anyRow.customerLastName ??
        anyRow.customerLastname ??
        anyRow.lastName ??
        anyRow.lastname ??
        anyRow.surname ??
        anyRow.familyName ??
        anyRow.soyad,
    ) ||
    toText(anyRow.customerFullName) ||
    toText(anyRow.fullName);
  if (fullName) return fullName;

  const contactPerson = toText(anyRow.contactPerson);
  if (contactPerson) return contactPerson;

  return "";
}

function getCompanyLabel(value: string) {
  const matched = COMPANY_OPTIONS.find((opt) => opt.value === value);
  return matched ? matched.label : value;
}

function getPersonLabel(value: string) {
  const matched = PERSON_OPTIONS.find((opt) => opt.value === value);
  return matched ? matched.label : value;
}

function getCargoTransportLabel(value: string) {
  const matched = CARGO_TRANSPORT_OPTIONS.find((opt) => opt.value === value);
  return matched ? matched.label : value;
}

function getPackagingLabel(value: string) {
  const matched = PACKAGING_TYPE_OPTIONS.find((opt) => opt.value === value);
  return matched ? matched.label : value;
}

export default function SorgularTable({ rows, customers, onUpdate, onDelete, onApproveStatus }: Props) {
  const dispatch = useAppDispatch();
  // Modalı kapatmak için fonksiyon
  const handleEditClose = () => {
    setEditModalOpen(false);
    setEditRow(null);
  };
  // DEBUG: Gelen veriyi kontrol et
  if (rows && rows.length > 0) {
    // eslint-disable-next-line no-console
    console.log("[SorgularTable] İlk row:", rows[0]);
  }
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editRow, setEditRow] = useState<LogisticQueryRow | null>(null);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [offerRow, setOfferRow] = useState<LogisticQueryRow | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<LogisticQueryRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [localRows, setLocalRows] = useState<LogisticQueryRow[]>([]);
  // Sync localRows with props.rows
  useEffect(() => {
    setLocalRows(rows);
  }, [rows]);

  const handleEditClick = async (row: LogisticQueryRow) => {
    const actualId = (row as any).originalId || row.id;
    // Detay verisini backend'den çek
    try {
      const detail = await fetchQueryDetailAction(actualId);
      setEditRow(detail);
      setEditModalOpen(true);
    } catch (e) {
      setEditRow(row);
      setEditModalOpen(true);
    }
  };
  const handleEditSubmit = async (payload: any) => {
    if (!editRow) return;
    
    if (payload.fields.status === "approved" && onApproveStatus) {
      setEditModalOpen(false);
      onApproveStatus(editRow, payload.fields);
      setEditRow(null);
      return;
    }

    try {
      const updated = await updateQueryAction(editRow.id, payload.fields);
      setLocalRows((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r)),
      );
      if (onUpdate) onUpdate(updated);
    } catch (e) {
      // Hata yönetimi eklenebilir
    }
    setEditModalOpen(false);
    setEditRow(null);
  };

  const handleOfferClick = (row: LogisticQueryRow) => {
    setOfferRow(row);
    setOfferModalOpen(true);
  };

  const handleOfferSubmit = async (offers: any[]) => {
    if (!offerRow) return;
    const actualId = (offerRow as any).originalId || offerRow.id;
    try {
      const payload = {
        priceOffersJson: JSON.stringify(offers),
        // priceOffers alanını da ilk teklifin özeti olarak güncelleyelim
        priceOffers:
          offers.length > 0
            ? `${offers[0].carrierName}: ${offers[0].price} ${offers[0].currency}`
            : "",
      };
      const updated = await updateQueryAction(actualId, payload);
      setLocalRows((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r)),
      );
      if (onUpdate) onUpdate(updated);
    } catch (e) {
      // Hata yönetimi
    }
    setOfferModalOpen(false);
    setOfferRow(null);
  };

  const handleDeleteClick = (row: LogisticQueryRow) => {
    setRowToDelete(row);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!rowToDelete) return;
    setIsDeleting(true);
    const actualId = (rowToDelete as any).originalId || rowToDelete.id;
    try {
      await deleteQueryAction(actualId);
      setLocalRows((prev) => prev.filter((r) => r.id !== rowToDelete.id));
      if (onDelete) onDelete(rowToDelete.id);
      setDeleteConfirmOpen(false);
      setRowToDelete(null);
    } catch (e) {
      // Hata yönetimi
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className={styles.tableWrapper}>
        <div className={styles.tableContainer} style={{ minWidth: "1650px" }}>
          <table className={styles.table}>
        <thead className={styles.head}>
          <tr>
            <th className={`${styles.headerCell} ${styles.min150}`}>
              Sorğunun nömrəsi
            </th>
            <th className={`${styles.headerCell} ${styles.min140}`}>
              Sorğunun statusu
            </th>
            <th className={`${styles.headerCell} ${styles.min160}`}>
              Yaradıldı
            </th>
            <th className={`${styles.headerCell} ${styles.min240}`}>
              Yük haqqında məlumat
            </th>
            <th className={`${styles.headerCell} ${styles.min150}`}>
              Göndərən
            </th>
            <th className={`${styles.headerCell} ${styles.min160}`}>Müştəri</th>
            <th className={`${styles.headerCell} ${styles.min140}`}>Şirkət</th>
            <th className={`${styles.headerCell} ${styles.min140}`}>Satıcı</th>
            <th className={`${styles.headerCell} ${styles.min180}`}>
              Qiymət təklifləri
            </th>
            <th className={`${styles.headerCell} ${styles.min170}`}>
              Əlaqədar şəxs
            </th>
            <th className={`${styles.headerCell} ${styles.min120}`}>
              Əməliyyatlar
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr className={styles.rowEven}>
              {/* 0'dan 16'ya kadar 17 sütun için hücreler */}
              {[...Array(COLUMN_COUNT)].map((_, idx) => (
                <td key={idx} className={`${styles.cell} ${styles.center}`}>
                  <FaMinus className={styles.mutedText} />
                </td>
              ))}
            </tr>
          ) : (
            localRows.map((row, index) => (
              <tr
                key={row.id}
                className={index % 2 === 0 ? styles.rowEven : styles.rowOdd}
              >
                <td
                  className={`${styles.cell} ${styles.nowrap} ${styles.min150} ${styles.center}`}
                >
                  {row.id ? (
                    <Link
                      to={`/sorgular/${encodeURIComponent(row.id)}`}
                      className={styles.link}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {row.number}
                    </Link>
                  ) : (
                    <FaMinus className={styles.mutedText} />
                  )}
                </td>
                <td
                  className={`${styles.cell} ${styles.nowrap} ${styles.min140} ${styles.center}`}
                >
                  {row.status ? (
                    <SorguStatusDropdown
                      status={row.status}
                      onStatusChange={async (newStatus) => {
                        if (newStatus === SorguStatus.Approved) {
                          if (onApproveStatus) {
                            onApproveStatus(row, { status: "approved" });
                          }
                          return;
                        }
                        try {
                          const updated = await updateQueryAction(row.id, { status: newStatus });
                          setLocalRows((prev) =>
                            prev.map((r) => (r.id === updated.id ? updated : r)),
                          );
                          if (onUpdate) onUpdate(updated);
                          dispatch(
                            showNotification({
                              message: `Sorğunun statusu "${statusLabelAz(newStatus)}" olaraq dəyişdirildi.`,
                              type: "success",
                              autoCloseDuration: 2500,
                            }),
                          );
                        } catch (e) {
                          dispatch(
                            showNotification({
                              message: "Status dəyişdirilərkən xəta baş verdi.",
                              type: "error",
                              autoCloseDuration: 3000,
                            }),
                          );
                        }
                      }}
                    />
                  ) : (
                    <FaMinus className={styles.mutedText} />
                  )}
                </td>
                <td
                  className={`${styles.cell} ${styles.mutedText} ${styles.nowrap} ${styles.min160} ${styles.center}`}
                >
                  {row.createdAt ? (
                    formatCreated(row.createdAt)
                  ) : (
                    <FaMinus className={styles.mutedText} />
                  )}
                </td>
                <td
                  className={`${styles.cell} ${styles.bodyText} ${styles.preLine} ${styles.smallText} ${styles.min240}`}
                >
                  {Array.isArray(row.cargoItems) && row.cargoItems.length > 0 ? (
                    <div style={{ textAlign: "left" }}>
                      {row.cargoItems.map((item: any, idx: number) => (
                        <div
                          key={item.id || idx}
                          style={{
                            marginBottom:
                              idx < row.cargoItems!.length - 1 ? "8px" : 0,
                            paddingBottom:
                              idx < row.cargoItems!.length - 1
                                ? "6px"
                                : 0,
                            borderBottom:
                              idx < row.cargoItems!.length - 1
                                ? "1px dashed #e2e8f0"
                                : "none",
                          }}
                        >
                          <div style={{ fontWeight: 700, color: "#0f172a" }}>
                            {item.name || "Adsız yük"}
                          </div>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#64748b",
                              marginTop: "2px",
                            }}
                          >
                            {item.weight ? `${item.weight} kq` : ""}
                            {item.ldm ? ` | LDM: ${item.ldm}` : ""}
                            {item.transportType
                              ? ` | ${getCargoTransportLabel(item.transportType)}`
                              : ""}
                          </div>
                          {(item.cargoValue || item.currency) && (
                            <div
                              style={{
                                fontSize: "0.72rem",
                                color: "#2563eb",
                                marginTop: "2px",
                                fontWeight: 500,
                              }}
                            >
                              {item.cargoValue || "0"} {item.currency || ""}
                            </div>
                          )}
                          {Array.isArray(item.packagingRows) &&
                            item.packagingRows.length > 0 && (
                              <div
                                style={{
                                  fontSize: "0.68rem",
                                  color: "#94a3b8",
                                  marginTop: "3px",
                                  backgroundColor: "#f8fafc",
                                  padding: "2px 4px",
                                  borderRadius: "4px",
                                }}
                              >
                                {item.packagingRows.map(
                                  (p: any, pIdx: number) => (
                                    <div key={p.id || pIdx}>
                                      {p.packagingType
                                        ? `${getPackagingLabel(p.packagingType)}: `
                                        : ""}
                                      {p.lengthM || 0}x{p.widthM || 0}x
                                      {p.heightM || 0}m
                                      {p.volumeM3 ? ` | ${p.volumeM3}m³` : ""}
                                    </div>
                                  ),
                                )}
                              </div>
                            )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <FaMinus className={styles.mutedText} />
                  )}
                </td>
                <td
                  className={`${styles.cell} ${styles.bodyText} ${styles.min150} ${styles.center}`}
                >
                  {row.loadPlaceCompany || row.sender || <FaMinus className={styles.mutedText} />}
                </td>
                <td
                  className={`${styles.cell} ${styles.bodyText} ${styles.min160} ${styles.center}`}
                >
                  {getCustomerFullName(row, customers) || (
                    <FaMinus className={styles.mutedText} />
                  )}
                </td>
                <td
                  className={`${styles.cell} ${styles.bodyText} ${styles.nowrap} ${styles.min140} ${styles.center}`}
                >
                  {getCompanyLabel(row.company) || (
                    <FaMinus className={styles.mutedText} />
                  )}
                </td>
                <td
                  className={`${styles.cell} ${styles.mutedText} ${styles.min140} ${styles.center}`}
                >
                  {getPersonLabel(row.seller) || (
                    <FaMinus className={styles.mutedText} />
                  )}
                </td>
                <td
                  className={`${styles.cell} ${styles.bodyText} ${styles.min180}`}
                >
                  {Array.isArray(row.priceOfferItems) && row.priceOfferItems.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "2px 0" }}>
                      {row.priceOfferItems.map((offer: any, oIdx: number) => (
                        <div
                          key={offer.id || oIdx}
                          style={{
                            fontSize: "0.75rem",
                            background: "#f0fdf4",
                            borderRadius: 4,
                            padding: "3px 6px",
                            borderLeft: "3px solid #059669",
                          }}
                        >
                          <div style={{ fontWeight: 600, color: "#334155", marginBottom: 1 }}>
                            {offer.carrierName}
                          </div>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ color: "#059669", fontWeight: 700 }}>
                              Alış: {offer.price} {offer.currency}
                            </span>
                            {offer.totalPrice && (
                              <span style={{ color: "#7c3aed", fontWeight: 700 }}>
                                Total: {offer.totalPrice} {offer.totalCurrency || offer.currency}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : row.priceOffers ? (
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: "#059669",
                        fontWeight: 600,
                        textAlign: "center",
                      }}
                    >
                      {row.priceOffers}
                    </div>
                  ) : (
                    <FaMinus className={styles.mutedText} />
                  )}
                </td>
                <td
                  className={`${styles.cell} ${styles.bodyText} ${styles.min170} ${styles.center}`}
                >
                  {row.contactPerson || (
                    <FaMinus className={styles.mutedText} />
                  )}
                </td>
                <td
                  className={`${styles.actionCell} ${styles.min120} ${styles.center}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    className={styles.actionRow}
                    style={{ justifyContent: "center" }}
                  >
                    <button
                        type="button"
                        className={`${styles.iconButton} ${styles.detailsButton}`}
                        onClick={() => handleOfferClick(row)}
                        aria-label="Qiymət təklifi ver"
                        title="Qiymət təklifi ver"
                        style={{ color: "#059669", backgroundColor: "#ecfdf5" }}
                      >
                        <FaHandHoldingUsd />
                      </button>
                      <button
                        type="button"
                        className={`${styles.iconButton} ${styles.editButton}`}
                        onClick={() => handleEditClick(row)}
                        aria-label="Redaktə et"
                        title="Redaktə et"
                      >
                        <FaEdit />
                      </button>
                    <button
                      type="button"
                      title="Sil"
                      className={`${styles.iconButton} ${styles.deleteButton}`}
                      aria-label="Sil"
                      onClick={() => handleDeleteClick(row)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>
      </div>
      {editModalOpen && editRow && (
        <SorgularEditModal
          isOpen={editModalOpen}
          onClose={handleEditClose}
          onSubmit={handleEditSubmit}
          initialValues={editRow}
        />
      )}
      <SorgularOfferModal
        isOpen={offerModalOpen}
        onClose={() => {
          setOfferModalOpen(false);
          setOfferRow(null);
        }}
        onSubmit={handleOfferSubmit}
        initialOffers={(offerRow as any)?.priceOfferItems || []}
        queryNumber={offerRow?.number}
      />
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        title="Sorğunu sil"
        message="Bu sorğunu silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz."
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setRowToDelete(null);
        }}
        isLoading={isDeleting}
      />
    </>
  );
}
