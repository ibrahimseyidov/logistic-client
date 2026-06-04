import React, { useState } from "react";
import styles from "../../components/SorgularTable.module.css";
import { FaPlus } from "react-icons/fa";

interface Props {
  offers: any[];
  onAddOffer?: (offer: any) => void;
}

export const QueryOffersList: React.FC<Props> = ({ offers, onAddOffer }) => {
  const [carrierName, setCarrierName] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [notes, setNotes] = useState("");

  const handleAdd = () => {
    if (!carrierName || !price) {
      alert("Daşıyıcı və Qiymət daxil edilməlidir!");
      return;
    }
    if (onAddOffer) {
      onAddOffer({
        carrierName,
        price,
        currency,
        notes,
        createdAt: new Date().toISOString()
      });
      setCarrierName("");
      setPrice("");
      setCurrency("EUR");
      setNotes("");
    }
  };

  return (
    <div className={styles.tableWrapper} style={{ marginTop: 0 }}>
      {offers && offers.length > 0 ? (
        <table className={styles.table} style={{ marginBottom: "2rem" }}>
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
      ) : (
        <p style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>Heç bir qiymət təklifi yoxdur.</p>
      )}

      {onAddOffer && (
        <div style={{ background: "#f8fafc", padding: "1.5rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0" }}>
          <h4 style={{ margin: "0 0 1rem 0", color: "#0f172a", fontSize: "0.95rem" }}>Yeni qiymət təklifi</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", alignItems: "end" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>Daşıyıcı <span style={{ color: "#ef4444" }}>*</span></label>
              <input value={carrierName} onChange={e => setCarrierName(e.target.value)} style={{ padding: "0.6rem", border: "1px solid #cbd5e1", borderRadius: "0.4rem", fontSize: "0.85rem", outline: "none" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>Qiymət <span style={{ color: "#ef4444" }}>*</span></label>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} style={{ padding: "0.6rem", border: "1px solid #cbd5e1", borderRadius: "0.4rem", fontSize: "0.85rem", outline: "none" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>Valyuta</label>
              <select value={currency} onChange={e => setCurrency(e.target.value)} style={{ padding: "0.6rem", border: "1px solid #cbd5e1", borderRadius: "0.4rem", fontSize: "0.85rem", outline: "none", backgroundColor: "white" }}>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="AZN">AZN</option>
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>Qeyd</label>
              <input value={notes} onChange={e => setNotes(e.target.value)} style={{ padding: "0.6rem", border: "1px solid #cbd5e1", borderRadius: "0.4rem", fontSize: "0.85rem", outline: "none" }} />
            </div>
            <div>
              <button type="button" onClick={handleAdd} style={{ width: "100%", padding: "0.6rem", background: "#2563eb", color: "white", border: "none", borderRadius: "0.4rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                <FaPlus /> Əlavə et
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
