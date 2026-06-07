import React, { useState, useEffect } from "react";
import styles from "./SorgularNewModal.module.css";
import { FiX, FiPlus, FiTrash2 } from "react-icons/fi";
import Select from "../../../common/components/select/Select";
import { fetchLookupAction } from "../../../common/actions/lookup.actions";
import { LookupManagerModal } from "../../../common/components/modal/LookupManagerModal";

interface PriceOfferItem {
  id: string;
  carrierName: string;
  price: string;
  expense?: string;
  currency: string;
  totalPrice?: string;
  totalCurrency?: string;
  salesPrice?: string;
  notes: string;
  createdAt: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (offers: PriceOfferItem[]) => void;
  initialOffers?: PriceOfferItem[];
  queryNumber?: string;
}

export const SorgularOfferModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  initialOffers = [],
  queryNumber,
}) => {
  const [offers, setOffers] = useState<PriceOfferItem[]>([]);
  const [isVisible, setIsVisible] = useState(false);
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
    if (isOpen) {
      loadCarriers();
    }
  }, [isOpen]);

  const getCarrierOptionsForValue = (val: string) => {
    if (!val) return carrierOptions;
    const exists = carrierOptions.some((opt) => opt.value === val);
    if (!exists) {
      return [...carrierOptions, { value: val, label: val }];
    }
    return carrierOptions;
  };

  useEffect(() => {
    if (isOpen) {
      setOffers(initialOffers.length > 0 ? [...initialOffers] : []);
      // Trigger animation
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
    }
  }, [isOpen, initialOffers]);

  if (!isOpen) return null;

  const handleAddOffer = () => {
    const newOffer: PriceOfferItem = {
      id: crypto.randomUUID(),
      carrierName: "",
      price: "",
      expense: "",
      currency: "EUR",
      totalPrice: "",
      totalCurrency: "EUR",
      salesPrice: "",
      notes: "",
      createdAt: new Date().toISOString(),
    };
    setOffers([...offers, newOffer]);
  };

  const handleRemoveOffer = (id: string) => {
    setOffers(offers.filter((o) => o.id !== id));
  };

  const handleChange = (id: string, field: keyof PriceOfferItem, value: string) => {
    setOffers(
      offers.map((o) => (o.id === id ? { ...o, [field]: value } : o))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(offers);
  };

  return (
    <div className={styles.dialogRoot}>
      <div 
        className={`${styles.dialogBackdrop} ${isVisible ? styles.dialogBackdropVisible : ""}`} 
        onClick={onClose} 
      />
      <aside className={`${styles.dialogPanel} ${isVisible ? styles.dialogPanelVisible : ""}`}>
        <div className={styles.dialogHeader}>
          <div className={styles.dialogHeaderText}>
            <h2 className={styles.dialogTitle}>Qiymət Təklifləri</h2>
            {queryNumber && <p className={styles.dialogDescription}>Sorğu: {queryNumber}</p>}
          </div>
          <button className={styles.closeButton} onClick={onClose} type="button">
            <FiX />
          </button>
        </div>

        <div className={styles.dialogBody}>
          <div className={styles.sectionStack}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 className={styles.cardTitle}>Təkliflər Siyahısı</h3>
              <button
                type="button"
                className={styles.addCargoButton}
                onClick={handleAddOffer}
              >
                <div className={styles.addCargoIcon}><FiPlus /></div>
                Yeni Təklif
              </button>
            </div>

            {offers.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "#64748b", border: "2px dashed #e2e8f0", borderRadius: "12px", background: "#fff" }}>
                Hələ heç bir təklif əlavə edilməyib.
              </div>
            ) : (
              <div className={styles.cargoStack}>
                {offers.map((offer, index) => (
                  <div key={offer.id} className={styles.cargoCard}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                      <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#475569" }}>Təklif #{index + 1}</span>
                      <button
                        type="button"
                        className={styles.circleButtonDanger}
                        onClick={() => handleRemoveOffer(offer.id)}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                    <div className={styles.threeColumnGrid}>
                      <div className={styles.fieldStack}>
                        <span className={styles.label}>Daşıyıcı Adı</span>
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <Select
                              value={offer.carrierName}
                              onChange={(val) => handleChange(offer.id, "carrierName", val)}
                              options={getCarrierOptionsForValue(offer.carrierName)}
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
                              borderRadius: "0.375rem",
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
                      <label className={styles.fieldStack}>
                        <span className={styles.label}>Alış qiyməti</span>
                        <input
                          className={styles.input}
                          type="number"
                          value={offer.price}
                          onChange={(e) => handleChange(offer.id, "price", e.target.value)}
                          placeholder="0.00"
                        />
                      </label>
                      <label className={styles.fieldStack}>
                        <span className={styles.label}>Xərc</span>
                        <input
                          className={styles.input}
                          type="number"
                          value={offer.expense || ""}
                          onChange={(e) => handleChange(offer.id, "expense", e.target.value)}
                          placeholder="0.00"
                        />
                      </label>
                      <label className={styles.fieldStack}>
                        <span className={styles.label}>Valyuta</span>
                        <Select
                          value={offer.currency}
                          onChange={(val) => handleChange(offer.id, "currency", val)}
                          options={[
                            { value: "EUR", label: "EUR" },
                            { value: "USD", label: "USD" },
                            { value: "AZN", label: "AZN" },
                            { value: "TRY", label: "TRY" },
                          ]}
                        />
                      </label>
                      <label className={styles.fieldStack}>
                        <span className={styles.label}>Total qiymət</span>
                        <input
                          className={styles.input}
                          type="number"
                          value={offer.totalPrice || ""}
                          onChange={(e) => handleChange(offer.id, "totalPrice", e.target.value)}
                          placeholder="0.00"
                        />
                      </label>
                      <label className={styles.fieldStack}>
                        <span className={styles.label}>Total valyuta</span>
                        <Select
                          value={offer.totalCurrency || "EUR"}
                          onChange={(val) => handleChange(offer.id, "totalCurrency", val)}
                          options={[
                            { value: "EUR", label: "EUR" },
                            { value: "USD", label: "USD" },
                            { value: "AZN", label: "AZN" },
                            { value: "TRY", label: "TRY" },
                          ]}
                        />
                      </label>
                      <label className={styles.fieldStack}>
                        <span className={styles.label}>Satış qiyməti</span>
                        <input
                          className={styles.input}
                          type="number"
                          value={offer.salesPrice || ""}
                          onChange={(e) => handleChange(offer.id, "salesPrice", e.target.value)}
                          placeholder="0.00"
                        />
                      </label>
                    </div>
                    <div className={styles.verticalStack} style={{ marginTop: "1rem" }}>
                      <label className={styles.fieldStack}>
                        <span className={styles.label}>Qeyd</span>
                        <textarea
                          className={styles.textarea}
                          value={offer.notes}
                          onChange={(e) => handleChange(offer.id, "notes", e.target.value)}
                          placeholder="Əlavə məlumat..."
                          style={{ minHeight: "80px" }}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.dialogFooter}>
          <button className={styles.secondaryButton} onClick={onClose} type="button">
            Ləğv et
          </button>
          <button className={styles.primaryButton} onClick={handleSubmit} type="button">
            Yadda saxla
          </button>
        </div>
      </aside>
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

export default SorgularOfferModal;
