import React, { useState, useEffect, useCallback } from "react";
import styles from "./SorgularNewModal.module.css";
import { FiX, FiPlus, FiTrash2 } from "react-icons/fi";
import Select from "../../../common/components/select/Select";
import { fetchLookupAction, type LookupRow } from "../../../common/actions/lookup.actions";
import { fetchCarriersAction } from "../../../common/actions/carrier.actions";
import {
  CarrierCreateDrawer,
  type CreatedCarrierSummary,
} from "../../dasiyicilar/components/CarrierCreateDrawer";
import {
  calcExpenseFromPurchasePrice,
  getCarrierDisplayName,
  resolveCarrierTypePercentage,
} from "../lib/carrierExpense";
import { useAppDispatch } from "../../../common/store/hooks";
import { showNotification } from "../../../common/store/modalSlice";

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

const CURRENCY_OPTIONS = [
  { value: "EUR", label: "EUR" },
  { value: "USD", label: "USD" },
  { value: "AZN", label: "AZN" },
  { value: "TRY", label: "TRY" },
];

/** Total = alış + xərc; empty inputs treated as 0; both empty → "". */
function calcTotalFromPriceAndExpense(price?: string, expense?: string): string {
  const priceRaw = (price || "").replace(",", ".").trim();
  const expenseRaw = (expense || "").replace(",", ".").trim();
  if (!priceRaw && !expenseRaw) return "";
  const priceNum = Number.parseFloat(priceRaw);
  const expenseNum = Number.parseFloat(expenseRaw);
  const p = Number.isFinite(priceNum) ? priceNum : 0;
  const e = Number.isFinite(expenseNum) ? expenseNum : 0;
  return (p + e).toFixed(2);
}

export const SorgularOfferModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  initialOffers = [],
  queryNumber,
}) => {
  const dispatch = useAppDispatch();
  const [offers, setOffers] = useState<PriceOfferItem[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [carrierOptions, setCarrierOptions] = useState<{ value: string; label: string }[]>([]);
  const [carrierRecords, setCarrierRecords] = useState<any[]>([]);
  const [carrierTypes, setCarrierTypes] = useState<LookupRow[]>([]);
  const [carrierPlusOfferId, setCarrierPlusOfferId] = useState<string | null>(null);

  const loadReferenceData = useCallback(async () => {
    try {
      const [carriers, types] = await Promise.all([
        fetchCarriersAction(),
        fetchLookupAction("carrier-types"),
      ]);
      setCarrierRecords(carriers);
      setCarrierTypes(types);
      setCarrierOptions(
        carriers
          .map((carrier) => {
            const name = getCarrierDisplayName(carrier);
            return name ? { value: name, label: name } : null;
          })
          .filter(Boolean) as { value: string; label: string }[],
      );
    } catch (e) {
      console.error(e);
    }
  }, []);

  const applyAutoExpense = useCallback(
    (offer: PriceOfferItem): PriceOfferItem => {
      const carrier = carrierRecords.find(
        (item) => getCarrierDisplayName(item) === offer.carrierName,
      );
      const percentage = resolveCarrierTypePercentage(
        carrier?.carrierType,
        carrierTypes,
      );
      return {
        ...offer,
        expense: calcExpenseFromPurchasePrice(offer.price, percentage),
      };
    },
    [carrierRecords, carrierTypes],
  );

  useEffect(() => {
    if (isOpen) {
      void loadReferenceData();
    }
  }, [isOpen, loadReferenceData]);

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
      if (initialOffers.length > 0) {
        setOffers([...initialOffers]);
      } else {
        setOffers([
          {
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
          },
        ]);
      }
      setCarrierPlusOfferId(null);
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
    }
    // Yalnız açılışda hydrate et — parent re-render formu sıfırlamasın
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

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
      offers.map((offer) => {
        if (offer.id !== id) return offer;
        let next: PriceOfferItem = { ...offer, [field]: value };

        if (field === "currency") {
          next.totalCurrency = value;
        }

        if (field === "carrierName" || field === "price") {
          next = applyAutoExpense(next);
          next.totalPrice = calcTotalFromPriceAndExpense(next.price, next.expense);
          return next;
        }

        if (field === "expense") {
          next.totalPrice = calcTotalFromPriceAndExpense(next.price, next.expense);
          return next;
        }

        return next;
      }),
    );
  };

  const openCarrierPlusModal = (offerId: string) => {
    setCarrierPlusOfferId(offerId);
  };

  const closeCarrierPlusModal = () => {
    setCarrierPlusOfferId(null);
  };

  const handleCarrierCreated = async (created: CreatedCarrierSummary) => {
    await loadReferenceData();
    const displayName =
      getCarrierDisplayName(created) ||
      created.shortName?.trim() ||
      created.name;
    if (carrierPlusOfferId && displayName) {
      handleChange(carrierPlusOfferId, "carrierName", displayName);
    }
    setCarrierPlusOfferId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!offers.length) {
      dispatch(
        showNotification({
          message: "Ən azı bir qiymət təklifi əlavə edin!",
          type: "error",
          autoCloseDuration: 3500,
        }),
      );
      return;
    }

    const missingCarrier = offers.findIndex(
      (o) => !String(o.carrierName || "").trim(),
    );
    if (missingCarrier !== -1) {
      dispatch(
        showNotification({
          message: `Təklif #${missingCarrier + 1}: daşıyıcı seçilməlidir!`,
          type: "error",
          autoCloseDuration: 3500,
        }),
      );
      return;
    }

    onSubmit(offers);
  };

  return (
    <div className={styles.dialogRoot}>
      <div
        className={`${styles.dialogBackdrop} ${isVisible ? styles.dialogBackdropVisible : ""}`}
      />
      <aside className={`${styles.dialogPanel} ${isVisible ? styles.dialogPanelVisible : ""}`}>
        <div className={styles.dialogHeader}>
          <div className={styles.dialogHeaderText}>
            <h2 className={styles.dialogTitle}>
              {initialOffers.length > 0 ? "Qiymət təkliflərini redaktə et" : "Yeni qiymət təklifi"}
            </h2>
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
                <div className={styles.addCargoIcon}>
                  <FiPlus />
                </div>
                Yeni Təklif
              </button>
            </div>

            {offers.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "3rem",
                  color: "#64748b",
                  border: "2px dashed #e2e8f0",
                  borderRadius: "12px",
                  background: "#fff",
                }}
              >
                Hələ heç bir təklif əlavə edilməyib.
              </div>
            ) : (
              <div className={styles.cargoStack}>
                {offers.map((offer, index) => (
                  <div key={offer.id} className={styles.cargoCard}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "0.75rem",
                      }}
                    >
                      <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#475569" }}>
                        Təklif #{index + 1}
                      </span>
                      <button
                        type="button"
                        className={styles.circleButtonDanger}
                        onClick={() => handleRemoveOffer(offer.id)}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                    <div className={styles.offerCardForm}>
                      <div className={styles.offerFormRow}>
                        <div className={`${styles.fieldStack} ${styles.offerSpan12}`}>
                          <span className={styles.label}>Daşıyıcı adı</span>
                          <div className={styles.offerCarrierRow}>
                            <div className={styles.offerCarrierSelectGrow}>
                              <Select
                                value={offer.carrierName}
                                onChange={(val) =>
                                  handleChange(offer.id, "carrierName", val)
                                }
                                options={getCarrierOptionsForValue(offer.carrierName)}
                                placeholder="Daşıyıcı seçin"
                                className={styles.selectControl}
                              />
                            </div>
                            <button
                              type="button"
                              className={styles.offerCarrierPlus}
                              onClick={() => openCarrierPlusModal(offer.id)}
                              title="Yeni daşıyıcı əlavə et"
                              aria-label="Yeni daşıyıcı əlavə et"
                            >
                              <FiPlus size={18} aria-hidden />
                            </button>
                          </div>
                        </div>
                      </div>

                      <p className={styles.offerGroupTitle}>Alış</p>
                      <div className={styles.offerFormRow}>
                        <label className={`${styles.fieldStack} ${styles.offerSpan5}`}>
                          <span className={styles.label}>Alış qiyməti</span>
                          <input
                            className={styles.input}
                            type="number"
                            value={offer.price}
                            onChange={(e) =>
                              handleChange(offer.id, "price", e.target.value)
                            }
                            placeholder="0.00"
                          />
                        </label>
                        <label className={`${styles.fieldStack} ${styles.offerSpan3}`}>
                          <span className={styles.label}>Valyuta</span>
                          <Select
                            value={offer.currency}
                            onChange={(val) => handleChange(offer.id, "currency", val)}
                            options={CURRENCY_OPTIONS}
                            className={styles.selectControl}
                          />
                        </label>
                        <label className={`${styles.fieldStack} ${styles.offerSpan4}`}>
                          <span className={styles.label}>Xərc</span>
                          <input
                            className={styles.input}
                            type="number"
                            value={offer.expense || ""}
                            onChange={(e) =>
                              handleChange(offer.id, "expense", e.target.value)
                            }
                            title="Daşıyıcı tipinə görə avtomatik doldurulur, lakin əl ilə dəyişdirilə bilər"
                            placeholder="0.00"
                          />
                        </label>
                      </div>

                      <p className={styles.offerGroupTitle}>Total</p>
                      <div className={styles.offerFormRow}>
                        <label className={`${styles.fieldStack} ${styles.offerSpan12}`}>
                          <span className={styles.label}>Total qiymət</span>
                          <input
                            className={styles.input}
                            type="number"
                            value={offer.totalPrice || ""}
                            onChange={(e) =>
                              handleChange(offer.id, "totalPrice", e.target.value)
                            }
                            placeholder="0.00"
                            title="Alış + xərc avtomatik hesablanır; əl ilə dəyişdirilə bilər"
                          />
                        </label>
                      </div>

                      <p className={styles.offerGroupTitle}>Satış</p>
                      <div className={styles.offerFormRow}>
                        <label className={`${styles.fieldStack} ${styles.offerSpan5}`}>
                          <span className={styles.label}>Satış qiyməti</span>
                          <input
                            className={styles.input}
                            type="number"
                            value={offer.salesPrice || ""}
                            onChange={(e) =>
                              handleChange(offer.id, "salesPrice", e.target.value)
                            }
                            placeholder="0.00"
                          />
                        </label>
                      </div>

                      <label className={styles.fieldStack}>
                        <span className={styles.label}>Qeyd</span>
                        <textarea
                          className={styles.textarea}
                          value={offer.notes}
                          onChange={(e) => handleChange(offer.id, "notes", e.target.value)}
                          placeholder="Əlavə məlumat..."
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

      <CarrierCreateDrawer
        isOpen={Boolean(carrierPlusOfferId)}
        onClose={closeCarrierPlusModal}
        onCreated={handleCarrierCreated}
      />
    </div>
  );
};

export default SorgularOfferModal;
