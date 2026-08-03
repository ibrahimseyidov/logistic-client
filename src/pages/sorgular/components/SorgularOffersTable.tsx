import React from "react";
import { FaTrash, FaEdit } from "react-icons/fa";
import { Link } from "react-router-dom";
import styles from "./SorgularTable.module.css";
import type { LogisticQueryRow } from "../types/sorgu.types";
import { CUSTOMER_OPTIONS } from "../constants/options.constants";
import { usePermissions } from "../../../common/hooks/usePermissions";

interface Props {
  rows: LogisticQueryRow[];
  customers?: any[];
  onDeleteOffer: (queryId: number, offerId: string) => void;
  onEditQuery: (queryId: number) => void;
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

function getLoadPlaceLabel(row: LogisticQueryRow) {
  const anyRow = row as any;
  const toText = (value: unknown) =>
    typeof value === "string" ? value.trim() : "";

  const city = toText(anyRow.loadCity);
  const country = toText(anyRow.loadCountry);
  const fromParts = [city, country].filter(Boolean).join(", ");
  if (fromParts) return fromParts;

  const loadPlace = toText(anyRow.loadPlace);
  if (loadPlace) return loadPlace;

  const company = toText(anyRow.loadPlaceCompany);
  if (company) return company;

  return "—";
}

export const SorgularOffersTable: React.FC<Props> = ({ rows, customers, onDeleteOffer, onEditQuery }) => {
  const { canEdit, canDelete } = usePermissions();
  const allowEdit = canEdit("sorgular", "offers");
  const allowDelete = canDelete("sorgular", "offers");
  const showActions = allowEdit || allowDelete;

  return (
    <div className={styles.tableWrapper}>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead className={styles.head}>
            <tr>
              <th className={styles.headerCell}>Sorğu №</th>
              <th className={styles.headerCell}>Daşıyıcı</th>
              <th className={styles.headerCell}>Alış</th>
              <th className={styles.headerCell}>Valyuta</th>
              <th className={styles.headerCell}>Satış qiyməti</th>
              <th className={styles.headerCell}>Müştəri</th>
              <th className={styles.headerCell}>Satıcı</th>
              <th className={styles.headerCell}>Yükləmə</th>
              <th className={styles.headerCell}>Tarix</th>
              {showActions ? (
                <th className={styles.headerCell}>Əməliyyatlar</th>
              ) : null}
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
                  <td className={styles.cell} style={{ textAlign: "center", color: "#2563eb", fontWeight: 700 }}>{row.offerItem?.salesPrice || "—"}</td>
                  <td className={styles.cell} style={{ textAlign: "center" }}>{getCustomerFullName(row, customers)}</td>
                  <td className={styles.cell} style={{ textAlign: "center" }}>{row.seller || row.createdByName || "—"}</td>
                  <td className={styles.cell} style={{ textAlign: "center", fontWeight: 500 }}>
                    {getLoadPlaceLabel(row)}
                  </td>
                  <td className={styles.cell} style={{ textAlign: "center" }}>{new Date(row.offerItem?.createdAt || row.createdAt).toLocaleDateString("az-AZ")}</td>
                  {showActions ? (
                    <td className={styles.cell}>
                      <div className={styles.actionRow}>
                        {allowEdit ? (
                          <button
                            className={`${styles.iconButton} ${styles.editButton}`}
                            onClick={() => onEditQuery(row.originalId || row.id)}
                            title="Sorğunu redaktə et"
                            type="button"
                          >
                            <FaEdit />
                          </button>
                        ) : null}
                        {allowDelete ? (
                          <button
                            className={`${styles.iconButton} ${styles.deleteButton}`}
                            onClick={() => onDeleteOffer(row.originalId || row.id, row.offerItem?.id)}
                            title="Təklifi sil"
                            type="button"
                          >
                            <FaTrash />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  ) : null}
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={showActions ? 10 : 9} style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
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
