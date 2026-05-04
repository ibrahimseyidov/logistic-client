import React from "react";
import styles from "../../components/SorgularTable.module.css";

interface Props {
  offers: any[];
}

export const QueryOffersList: React.FC<Props> = ({ offers }) => {
  if (!offers || offers.length === 0) {
    return <p style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>Heç bir qiymət təklifi yoxdur.</p>;
  }

  return (
    <div className={styles.tableWrapper} style={{ marginTop: 0 }}>
      <table className={styles.table}>
        <thead className={styles.head}>
          <tr>
            <th className={styles.headerCell}>Daşıyıcı</th>
            <th className={styles.headerCell}>Qiymət</th>
            <th className={styles.headerCell}>Valyuta</th>
            <th className={styles.headerCell}>Qeyd</th>
            <th className={styles.headerCell}>Tarix</th>
          </tr>
        </thead>
        <tbody>
          {offers.map((offer, index) => (
            <tr key={index} className={index % 2 === 0 ? styles.rowEven : styles.rowOdd}>
              <td className={styles.cell} style={{ textAlign: "center", fontWeight: 600 }}>{offer.carrierName}</td>
              <td className={styles.cell} style={{ textAlign: "center", color: "#059669", fontWeight: 700 }}>{offer.price}</td>
              <td className={styles.cell} style={{ textAlign: "center" }}>{offer.currency}</td>
              <td className={styles.cell} style={{ textAlign: "center", fontSize: "0.85rem", color: "#64748b" }}>{offer.notes || "—"}</td>
              <td className={styles.cell} style={{ textAlign: "center" }}>{new Date(offer.createdAt || Date.now()).toLocaleDateString("az-AZ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
