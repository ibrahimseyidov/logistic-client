import React, { useState, useEffect } from "react";
import styles from "../../components/SorgularTable.module.css";
import { FaPlus } from "react-icons/fa";
import Select from "../../../../common/components/select/Select";
import { LookupManagerModal } from "../../../../common/components/modal/LookupManagerModal";
import { fetchLookupAction } from "../../../../common/actions/lookup.actions";

interface Props {
  offers: any[];
  onAddOffer?: (offer: any) => void;
}

export const QueryOffersList: React.FC<Props> = ({ offers, onAddOffer }) => {
  const [carrierName, setCarrierName] = useState("");
  const [price, setPrice] = useState("");
  const [expense, setExpense] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [totalPrice, setTotalPrice] = useState("");
  const [totalCurrency, setTotalCurrency] = useState("EUR");
  const [salesPrice, setSalesPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [carrierOptions, setCarrierOptions] = useState<{ value: string; label: string }[]>([]);
  const [isLookupModalOpen, setIsLookupModalOpen] = useState(false);

  const loadCarriers = async () => {
    try {
      const data = await fetchLookupAction("carriers");
      setCarrierOptions(data.map((item) => ({ value: item.value, label: item.value })));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadCarriers();
  }, []);

  const handleAdd = () => {
    if (!carrierName || !price) {
      alert("Daşıyıcı və Qiymət daxil edilməlidir!");
      return;
    }
    if (onAddOffer) {
      onAddOffer({
        carrierName,
        price,
        expense,
        currency,
        totalPrice,
        totalCurrency,
        salesPrice,
        notes,
        createdAt: new Date().toISOString()
      });
      setCarrierName("");
      setPrice("");
      setExpense("");
      setCurrency("EUR");
      setTotalPrice("");
      setTotalCurrency("EUR");
      setSalesPrice("");
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
              <th className={styles.headerCell}>Alış qiyməti</th>
              <th className={styles.headerCell}>Valyuta</th>
              <th className={styles.headerCell}>Total qiymət</th>
              <th className={styles.headerCell}>Total valyuta</th>
              <th className={styles.headerCell}>Satış qiyməti</th>
              <th className={styles.headerCell}>Tarix</th>
            </tr>
          </thead>
          <tbody>
            {offers.map((offer, index) => (
              <tr key={index} className={index % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                <td className={styles.cell} style={{ textAlign: "center", fontWeight: 600 }}>{offer.carrierName}</td>
                <td className={styles.cell} style={{ textAlign: "center", color: "#059669", fontWeight: 700 }}>{offer.price} {offer.currency}</td>
                <td className={styles.cell} style={{ textAlign: "center" }}>{offer.currency}</td>
                <td className={styles.cell} style={{ textAlign: "center", color: "#7c3aed", fontWeight: 700 }}>{offer.totalPrice ? `${offer.totalPrice} ${offer.totalCurrency || offer.currency}` : "—"}</td>
                <td className={styles.cell} style={{ textAlign: "center" }}>{offer.totalCurrency || offer.currency}</td>
                <td className={styles.cell} style={{ textAlign: "center", color: "#2563eb", fontWeight: 700 }}>{offer.salesPrice || "—"}</td>
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", alignItems: "end" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>Daşıyıcı <span style={{ color: "#ef4444" }}>*</span></label>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Select
                    value={carrierName}
                    options={carrierOptions}
                    onChange={setCarrierName}
                    placeholder="Daşıyıcı seçin"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsLookupModalOpen(true)}
                  style={{
                    width: "38px",
                    height: "38px",
                    flexShrink: 0,
                    background: "#e2e8f0",
                    border: "1px solid #cbd5e1",
                    borderRadius: "0.4rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                    color: "#475569"
                  }}
                  title="Yeni daşıyıcı əlavə et"
                >
                  +
                </button>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>Alış qiyməti <span style={{ color: "#ef4444" }}>*</span></label>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} style={{ padding: "0.6rem", border: "1px solid #cbd5e1", borderRadius: "0.4rem", fontSize: "0.85rem", outline: "none" }} placeholder="0.00" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>Xərc</label>
              <input type="number" value={expense} onChange={e => setExpense(e.target.value)} style={{ padding: "0.6rem", border: "1px solid #cbd5e1", borderRadius: "0.4rem", fontSize: "0.85rem", outline: "none" }} placeholder="0.00" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>Valyuta</label>
              <select value={currency} onChange={e => setCurrency(e.target.value)} style={{ padding: "0.6rem", border: "1px solid #cbd5e1", borderRadius: "0.4rem", fontSize: "0.85rem", outline: "none", backgroundColor: "white", height: "38px" }}>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="AZN">AZN</option>
                <option value="TRY">TRY</option>
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>Total qiymət</label>
              <input type="number" value={totalPrice} onChange={e => setTotalPrice(e.target.value)} style={{ padding: "0.6rem", border: "1px solid #cbd5e1", borderRadius: "0.4rem", fontSize: "0.85rem", outline: "none" }} placeholder="0.00" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>Total valyuta</label>
              <select value={totalCurrency} onChange={e => setTotalCurrency(e.target.value)} style={{ padding: "0.6rem", border: "1px solid #cbd5e1", borderRadius: "0.4rem", fontSize: "0.85rem", outline: "none", backgroundColor: "white", height: "38px" }}>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="AZN">AZN</option>
                <option value="TRY">TRY</option>
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>Satış qiyməti</label>
              <input type="number" value={salesPrice} onChange={e => setSalesPrice(e.target.value)} style={{ padding: "0.6rem", border: "1px solid #cbd5e1", borderRadius: "0.4rem", fontSize: "0.85rem", outline: "none" }} placeholder="0.00" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>Qeyd</label>
              <input value={notes} onChange={e => setNotes(e.target.value)} style={{ padding: "0.6rem", border: "1px solid #cbd5e1", borderRadius: "0.4rem", fontSize: "0.85rem", outline: "none" }} placeholder="Əlavə məlumat..." />
            </div>
            <div>
              <button type="button" onClick={handleAdd} style={{ width: "100%", padding: "0.6rem", background: "#2563eb", color: "white", border: "none", borderRadius: "0.4rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                <FaPlus /> Əlavə et
              </button>
            </div>
          </div>
        </div>
      )}
      <LookupManagerModal
        isOpen={isLookupModalOpen}
        onClose={() => setIsLookupModalOpen(false)}
        lookupType="carriers"
        title="Daşıyıcılar siyahısı"
        onDataChanged={(newData) => {
          setCarrierOptions(newData.map((item) => ({ value: item.value, label: item.value })));
        }}
      />
    </div>
  );
};
