import React from "react";
import { FaTrash, FaEdit } from "react-icons/fa";
import { Link } from "react-router-dom";
import styles from "./SorgularTable.module.css";
import type { LogisticQueryRow } from "../types/sorgu.types";
import { CUSTOMER_OPTIONS } from "../constants/options.constants";

interface Props {
  rows: LogisticQueryRow[];
  onDeleteOffer: (queryId: number, offerId: string) => void;
  onEditQuery: (queryId: number) => void;
}

function getCustomerFullName(row: LogisticQueryRow) {
  const anyRow = row as any;
  const customer = anyRow.customer;
  const toText = (value: unknown) =>
    typeof value === "string" ? value.trim() : "";
  const joinName = (first: unknown, last: unknown) =>
    `${toText(first)} ${toText(last)}`.trim();
  const looksLikeFullName = (value: string) => value.split(/\s+/).length >= 2;

  if (customer && typeof customer === "object") {
    const fullName =
      joinName(
        customer.firstName ??
          customer.firstname ??
          customer.name ??
          customer.givenName ??
          customer.ad,
        customer.lastName ??
          customer.lastname ??
          customer.surname ??
          customer.familyName ??
          customer.soyad,
      ) ||
      toText(customer.fullName) ||
      toText(customer.displayName);
    if (fullName) return fullName;
  }

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
    toText(anyRow.fullName) ||
    toText(anyRow.customerName);
  if (fullName) return fullName;

  const customerText = toText(customer);
  if (customerText && looksLikeFullName(customerText)) return customerText;

  const contactPerson = toText(anyRow.contactPerson);
  if (contactPerson && looksLikeFullName(contactPerson)) return contactPerson;

  const matched = CUSTOMER_OPTIONS.find(
    (opt) => opt.value.toLowerCase() === customerText.toLowerCase()
  );
  if (matched) return matched.label;

  if (customerText) return customerText;
  if (contactPerson) return contactPerson;

  return "";
}

export const SorgularOffersTable: React.FC<Props> = ({ rows, onDeleteOffer, onEditQuery }) => {
  return (
    <div className={styles.tableWrapper}>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead className={styles.head}>
            <tr>
              <th className={styles.headerCell}>Sorğu №</th>
              <th className={styles.headerCell}>Daşıyıcı</th>
              <th className={styles.headerCell}>Qiymət</th>
              <th className={styles.headerCell}>Valyuta</th>
              <th className={styles.headerCell}>Qeyd</th>
              <th className={styles.headerCell}>Müştəri</th>
              <th className={styles.headerCell}>Satıcı</th>
              <th className={styles.headerCell}>Yükləmə / Boşaltma</th>
              <th className={styles.headerCell}>Tarix</th>
              <th className={styles.headerCell}>Əməliyyatlar</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any, index) => {
              const isEven = index % 2 === 0;
              return (
                <tr key={`${row.id}-${index}`} className={isEven ? styles.rowEven : styles.rowOdd}>
                  <td className={styles.cell} style={{ textAlign: "center" }}>
                    <Link to={`/sorgular/${row.originalId || row.id}`} className={styles.queryLink}>
                      {row.number}
                    </Link>
                  </td>
                  <td className={styles.cell} style={{ textAlign: "center", fontWeight: 600 }}>{row.offerItem?.carrierName || "—"}</td>
                  <td className={styles.cell} style={{ textAlign: "center", color: "#059669", fontWeight: 700 }}>{row.offerItem?.price || "—"}</td>
                  <td className={styles.cell} style={{ textAlign: "center" }}>{row.offerItem?.currency || "—"}</td>
                  <td className={styles.cell} style={{ fontSize: "0.85rem", color: "#64748b", maxWidth: "200px", textAlign: "center" }}>{row.offerItem?.notes || "—"}</td>
                  <td className={styles.cell} style={{ textAlign: "center" }}>{getCustomerFullName(row)}</td>
                  <td className={styles.cell} style={{ textAlign: "center" }}>{row.seller || row.createdByName || "—"}</td>
                  <td className={styles.cell} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "0.85rem" }}>
                      <div style={{ fontWeight: 500 }}>{row.loadPlace}</div>
                      <div style={{ color: "#94a3b8" }}>{row.unloadPlace}</div>
                    </div>
                  </td>
                  <td className={styles.cell} style={{ textAlign: "center" }}>{new Date(row.offerItem?.createdAt || row.createdAt).toLocaleDateString("az-AZ")}</td>
                  <td className={styles.cell}>
                    <div className={styles.actionRow}>
                      <button
                        className={`${styles.iconButton} ${styles.editButton}`}
                        onClick={() => onEditQuery(row.originalId || row.id)}
                        title="Sorğunu redaktə et"
                        type="button"
                      >
                        <FaEdit />
                      </button>
                      <button
                        className={`${styles.iconButton} ${styles.deleteButton}`}
                        onClick={() => onDeleteOffer(row.originalId || row.id, row.offerItem?.id)}
                        title="Təklifi sil"
                        type="button"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={10} style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
                  Heç bir qiymət təklifi tapılmadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SorgularOffersTable;
