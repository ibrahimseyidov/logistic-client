import React from "react";
import styles from "../../components/SorgularTable.module.css";
import { FaPlus } from "react-icons/fa";

interface Props {
  offers: any[];
  onOpenAddModal?: () => void;
}

export const QueryOffersList: React.FC<Props> = ({ offers, onOpenAddModal }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {onOpenAddModal ? (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onOpenAddModal}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "#0f172a",
              color: "white",
              padding: "0.6rem 1rem",
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
              border: "none",
            }}
          >
            <FaPlus /> Qiymət təklifi əlavə et
          </button>
        </div>
      ) : null}

      {offers && offers.length > 0 ? (
        <div className={styles.tableWrapper} style={{ marginTop: 0 }}>
          <table className={styles.table}>
            <thead className={styles.head}>
              <tr>
                <th className={styles.headerCell}>Daşıyıcı</th>
                <th className={styles.headerCell}>Alış qiyməti</th>
                <th className={styles.headerCell}>Valyuta</th>
                <th className={styles.headerCell}>Total qiymət</th>
                <th className={styles.headerCell}>Total valyuta</th>
                <th className={styles.headerCell}>Satış qiyməti</th>
                <th className={styles.headerCell}>Qeyd</th>
                <th className={styles.headerCell}>Tarix</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((offer, index) => (
                <tr
                  key={offer.id || index}
                  className={index % 2 === 0 ? styles.rowEven : styles.rowOdd}
                >
                  <td
                    className={styles.cell}
                    style={{ textAlign: "center", fontWeight: 600 }}
                  >
                    {offer.carrierName}
                  </td>
                  <td
                    className={styles.cell}
                    style={{
                      textAlign: "center",
                      color: "#059669",
                      fontWeight: 700,
                    }}
                  >
                    {offer.price} {offer.currency}
                  </td>
                  <td className={styles.cell} style={{ textAlign: "center" }}>
                    {offer.currency}
                  </td>
                  <td
                    className={styles.cell}
                    style={{
                      textAlign: "center",
                      color: "#7c3aed",
                      fontWeight: 700,
                    }}
                  >
                    {offer.totalPrice
                      ? `${offer.totalPrice} ${offer.totalCurrency || offer.currency}`
                      : "—"}
                  </td>
                  <td className={styles.cell} style={{ textAlign: "center" }}>
                    {offer.totalCurrency || offer.currency}
                  </td>
                  <td
                    className={styles.cell}
                    style={{
                      textAlign: "center",
                      color: "#2563eb",
                      fontWeight: 700,
                    }}
                  >
                    {offer.salesPrice || "—"}
                  </td>
                  <td
                    className={styles.cell}
                    style={{ textAlign: "center", color: "#64748b" }}
                  >
                    {offer.notes || "—"}
                  </td>
                  <td className={styles.cell} style={{ textAlign: "center" }}>
                    {new Date(offer.createdAt || Date.now()).toLocaleDateString(
                      "az-AZ",
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          style={{
            textAlign: "center",
            padding: "3rem",
            background: "#f8fafc",
            border: "1px dashed #e2e8f0",
            borderRadius: "0.5rem",
            color: "#94a3b8",
          }}
        >
          Heç bir qiymət təklifi yoxdur.
        </div>
      )}
    </div>
  );
};
