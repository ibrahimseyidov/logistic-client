import React, { useState, useEffect, useRef } from "react";
import styles from "./PriceOfferSelectionModal.module.css";
import { LogisticQueryRow } from "../types/sorgu.types";
import {
  isQueryAlreadyConfirmed,
  QUERY_ALREADY_CONFIRMED_MESSAGE,
} from "../lib/sorguStatus";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  query: LogisticQueryRow | null;
  onApprove: (selectedOffer: any) => void | Promise<void>;
  isSubmitting?: boolean;
}

export default function PriceOfferSelectionModal({
  isOpen,
  onClose,
  query,
  onApprove,
  isSubmitting = false,
}: Props) {
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submitLock = useRef(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedOfferId(null);
      setSubmitting(false);
      submitLock.current = false;
    }
  }, [isOpen]);

  if (!isOpen || !query) return null;

  const offers = query.priceOfferItems && query.priceOfferItems.length > 0 
    ? query.priceOfferItems 
    : [];
  const alreadyConfirmed = isQueryAlreadyConfirmed(query);
  const busy = submitting || isSubmitting || submitLock.current;

  const requestClose = () => {
    if (busy || submitLock.current) return;
    onClose();
  };

  const handleApprove = () => {
    if (busy || submitLock.current || alreadyConfirmed) return;
    if (!selectedOfferId && offers.length > 0) {
      alert("Zəhmət olmasa bir qiymət təklifi seçin!");
      return;
    }
    const selectedOffer =
      offers.find((o: any) => String(o.id) === String(selectedOfferId)) || {};
    submitLock.current = true;
    setSubmitting(true);
    Promise.resolve(onApprove(selectedOffer)).finally(() => {
      submitLock.current = false;
      setSubmitting(false);
    });
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.header}>
          <h2>Qiymət Təklifi Seçimi</h2>
          <button type="button" onClick={requestClose} className={styles.closeIcon} disabled={busy}>&times;</button>
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
                    {offer.expense ? (
                      <span><strong>Xərc:</strong> {offer.expense} {offer.currency || "USD"}</span>
                    ) : null}
                    {offer.salesPrice ? (
                      <span><strong>Satış:</strong> {offer.salesPrice} {offer.currency || "USD"}</span>
                    ) : null}
                    {offer.notes && <span><strong>Qeyd:</strong> {offer.notes}</span>}
                  </div>
                </div>
              </label>
            ))
          )}
        </div>

        {alreadyConfirmed ? (
          <p className={styles.alreadyConfirmed}>{QUERY_ALREADY_CONFIRMED_MESSAGE}</p>
        ) : null}

        <div className={styles.actions}>
          <button type="button" onClick={requestClose} className={styles.cancelBtn} disabled={busy}>Ləğv et</button>
          <button
            type="button"
            onClick={handleApprove}
            className={styles.approveBtn}
            disabled={busy || alreadyConfirmed}
          >
            {busy ? "Yaradılır..." : "Sifarişi Yarat"}
          </button>
        </div>
      </div>
    </div>
  );
}
