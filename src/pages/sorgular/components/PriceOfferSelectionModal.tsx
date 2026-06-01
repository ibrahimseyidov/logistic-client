import React, { useState, useEffect } from "react";
import styles from "./PriceOfferSelectionModal.module.css";
import { LogisticQueryRow } from "../types/sorgu.types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  query: LogisticQueryRow | null;
  onApprove: (selectedOffer: any) => void;
}

export default function PriceOfferSelectionModal({ isOpen, onClose, query, onApprove }: Props) {
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedOfferId(null);
    }
  }, [isOpen]);

  if (!isOpen || !query) return null;

  const offers = query.priceOfferItems && query.priceOfferItems.length > 0 
    ? query.priceOfferItems 
    : [];

  const handleApprove = () => {
    if (!selectedOfferId && offers.length > 0) {
      alert("Zəhmət olmasa bir qiymət təklifi seçin!");
      return;
    }
    const selectedOffer = offers.find((o: any) => o.id === selectedOfferId) || {};
    onApprove(selectedOffer);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.header}>
          <h2>Qiymət Təklifi Seçimi</h2>
          <button onClick={onClose} className={styles.closeIcon}>&times;</button>
        </div>
        <p className={styles.desc}>"{query.number}" nömrəli sorğunu təsdiqləmək və sifarişə çevirmək üçün qiymət təklifini seçin:</p>
        
        <div className={styles.offersList}>
          {offers.length === 0 ? (
            <p className={styles.noOffers}>Bu sorğu üçün bazarda qiymət təklifi tapılmadı. Boş təkliflə davam etmək istəyirsiniz?</p>
          ) : (
            offers.map((offer: any) => (
              <label key={offer.id} className={`${styles.offerItem} ${selectedOfferId === offer.id ? styles.selected : ""}`}>
                <input 
                  type="radio" 
                  name="priceOffer" 
                  value={offer.id}
                  checked={selectedOfferId === offer.id}
                  onChange={() => setSelectedOfferId(offer.id)}
                  className={styles.radioInput}
                />
                <div className={styles.offerDetails}>
                  <div className={styles.offerProvider}>{offer.carrierName || "Daşıyıcı"}</div>
                  <div className={styles.offerStats}>
                    <span><strong>Qiymət:</strong> {offer.price || 0} {offer.currency || "USD"}</span>
                    {offer.notes && <span><strong>Qeyd:</strong> {offer.notes}</span>}
                  </div>
                </div>
              </label>
            ))
          )}
        </div>

        <div className={styles.actions}>
          <button onClick={onClose} className={styles.cancelBtn}>Ləğv et</button>
          <button onClick={handleApprove} className={styles.approveBtn}>Sifarişi Yarat</button>
        </div>
      </div>
    </div>
  );
}
