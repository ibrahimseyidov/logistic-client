import React from "react";
import styles from "../../components/SorgularTable.module.css";
import { FaPlus } from "react-icons/fa";

interface Props {
  offers: any[];
  onOpenAddModal?: () => void;
}

function parseMoney(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number.parseFloat(String(value).replace(",", ".").trim());
  return Number.isFinite(n) ? n : null;
}

/** Qazanc = satış − total (total includes xərc); fallback satış − alış */
function calcProfit(offer: {
  price?: string;
  totalPrice?: string;
  salesPrice?: string;
}): number | null {
  const sale = parseMoney(offer.salesPrice);
  if (sale == null) return null;

  const total = parseMoney(offer.totalPrice);
  if (total != null) return sale - total;

  const purchase = parseMoney(offer.price);
  if (purchase == null) return null;
  return sale - purchase;
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
                <th className={styles.headerCell}>Satış qiyməti</th>
                <th className={styles.headerCell}>Qazanc</th>
                <th className={styles.headerCell}>Qeyd</th>
                <th className={styles.headerCell}>Tarix</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((offer, index) => {
                const currency = offer.currency || "—";
                const profit = calcProfit(offer);
                const profitColor =
                  profit == null
                    ? "#64748b"
                    : profit > 0
                      ? "#059669"
                      : profit < 0
                        ? "#dc2626"
                        : "#64748b";

                return (
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
                      {offer.price || "—"}
                    </td>
                    <td className={styles.cell} style={{ textAlign: "center" }}>
                      {currency}
                    </td>
                    <td
                      className={styles.cell}
                      style={{
                        textAlign: "center",
                        color: "#7c3aed",
                        fontWeight: 700,
                      }}
                    >
                      {offer.totalPrice || "—"}
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
                      style={{
                        textAlign: "center",
                        color: profitColor,
                        fontWeight: 700,
                      }}
                    >
                      {profit == null
                        ? "—"
                        : `${profit.toFixed(2)} ${offer.currency || ""}`.trim()}
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
                );
              })}
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
