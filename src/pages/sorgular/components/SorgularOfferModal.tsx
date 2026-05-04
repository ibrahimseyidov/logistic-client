import React, { useState, useEffect } from "react";
import styles from "./SorgularNewModal.module.css";
import { FiX, FiPlus, FiTrash2 } from "react-icons/fi";
import Select from "../../../common/components/select/Select";

interface PriceOfferItem {
  id: string;
  carrierName: string;
  price: string;
  currency: string;
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
      currency: "USD",
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
                  <div key={offer.id} className={styles.cargoCard} style={{ position: "relative" }}>
                    <div className={styles.threeColumnGrid}>
                      <label className={styles.fieldStack}>
                        <span className={styles.label}>Daşıyıcı Adı</span>
                        <input
                          className={styles.input}
                          value={offer.carrierName}
                          onChange={(e) => handleChange(offer.id, "carrierName", e.target.value)}
                          placeholder="Məs: Maersk"
                        />
                      </label>
                      <label className={styles.fieldStack}>
                        <span className={styles.label}>Qiymət</span>
                        <input
                          className={styles.input}
                          type="number"
                          value={offer.price}
                          onChange={(e) => handleChange(offer.id, "price", e.target.value)}
                          placeholder="0.00"
                        />
                      </label>
                      <label className={styles.fieldStack}>
                        <span className={styles.label}>Valyuta</span>
                        <Select
                          value={offer.currency}
                          onChange={(val) => handleChange(offer.id, "currency", val)}
                          options={[
                            { value: "USD", label: "USD" },
                            { value: "EUR", label: "EUR" },
                            { value: "AZN", label: "AZN" },
                            { value: "TRY", label: "TRY" },
                          ]}
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
                    <button
                      type="button"
                      className={styles.circleButtonDanger}
                      onClick={() => handleRemoveOffer(offer.id)}
                      style={{ position: "absolute", top: "0.5rem", right: "0.5rem" }}
                    >
                      <FiTrash2 />
                    </button>
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
    </div>
  );
};

export default SorgularOfferModal;
