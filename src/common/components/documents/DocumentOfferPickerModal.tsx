import { useEffect, useState } from "react";

export type DocumentPriceOffer = {
  id?: string | number;
  carrierName?: string;
  price?: string | number;
  salesPrice?: string | number;
  totalPrice?: string | number;
  currency?: string;
  notes?: string;
};

interface Props {
  isOpen: boolean;
  offers: DocumentPriceOffer[];
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: (offer: DocumentPriceOffer, index: number) => void;
}

function offerKey(offer: DocumentPriceOffer, index: number) {
  return offer.id != null && String(offer.id) !== ""
    ? String(offer.id)
    : `idx-${index}`;
}

export default function DocumentOfferPickerModal({
  isOpen,
  offers,
  isLoading = false,
  onClose,
  onConfirm,
}: Props) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (offers.length === 1) {
      setSelectedKey(offerKey(offers[0], 0));
    } else {
      setSelectedKey(null);
    }
  }, [isOpen, offers]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (offers.length === 0) return;
    const index = offers.findIndex((o, i) => offerKey(o, i) === selectedKey);
    if (index < 0) return;
    onConfirm(offers[index], index);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        background: "rgba(15, 23, 42, 0.4)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          width: "min(100%, 32rem)",
          background: "#fff",
          borderRadius: "0.85rem",
          boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.18)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "1.15rem 1.4rem",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}>
            Qiymət təklifi seçin
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            style={{
              background: "none",
              border: 0,
              fontSize: "1.4rem",
              color: "#64748b",
              cursor: "pointer",
              lineHeight: 1,
            }}
            aria-label="Bağla"
          >
            ×
          </button>
        </div>
        <p
          style={{
            margin: 0,
            padding: "1.1rem 1.4rem 0",
            fontSize: "0.875rem",
            color: "#475569",
          }}
        >
          Request sənədinə hansı qiymət təklifinin düşəcəyini seçin.
        </p>
        <div
          style={{
            padding: "1.1rem 1.4rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.7rem",
            maxHeight: "55vh",
            overflowY: "auto",
          }}
        >
          {offers.length === 0 ? (
            <p
              style={{
                margin: 0,
                fontSize: "0.875rem",
                color: "#b45309",
                background: "#fef3c7",
                padding: "0.9rem",
                borderRadius: "0.5rem",
              }}
            >
              Bu sorğuda qiymət təklifi yoxdur. Əvvəlcə təklif əlavə edin.
            </p>
          ) : (
            offers.map((offer, index) => {
              const key = offerKey(offer, index);
              const selected = selectedKey === key;
              const currency = offer.currency || "";
              return (
                <label
                  key={key}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.85rem",
                    padding: "0.9rem",
                    border: selected ? "1px solid #3b82f6" : "1px solid #e2e8f0",
                    background: selected ? "#eff6ff" : "#fff",
                    borderRadius: "0.55rem",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="request-price-offer"
                    checked={selected}
                    onChange={() => setSelectedKey(key)}
                    style={{ marginTop: "0.2rem" }}
                  />
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                    <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#0f172a" }}>
                      {offer.carrierName || "Daşıyıcı"}
                    </span>
                    <span style={{ fontSize: "0.8rem", color: "#475569" }}>
                      {offer.salesPrice
                        ? `Satış: ${offer.salesPrice} ${currency}`.trim()
                        : offer.totalPrice
                          ? `Total: ${offer.totalPrice} ${currency}`.trim()
                          : offer.price
                            ? `Qiymət: ${offer.price} ${currency}`.trim()
                            : "Qiymət yoxdur"}
                      {offer.notes ? ` · ${offer.notes}` : ""}
                    </span>
                  </div>
                </label>
              );
            })
          )}
        </div>
        <div
          style={{
            padding: "1rem 1.4rem",
            borderTop: "1px solid #e2e8f0",
            background: "#f8fafc",
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.65rem",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            style={{
              padding: "0.5rem 1rem",
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "#475569",
              background: "#fff",
              border: "1px solid #cbd5e1",
              borderRadius: "0.45rem",
              cursor: "pointer",
            }}
          >
            Ləğv et
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading || offers.length === 0 || !selectedKey}
            style={{
              padding: "0.5rem 1rem",
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "#fff",
              background: "#16a34a",
              border: "1px solid #16a34a",
              borderRadius: "0.45rem",
              cursor:
                isLoading || offers.length === 0 || !selectedKey
                  ? "not-allowed"
                  : "pointer",
              opacity: isLoading || offers.length === 0 || !selectedKey ? 0.65 : 1,
            }}
          >
            {isLoading ? "Hazırlanır..." : "Sənədi hazırla"}
          </button>
        </div>
      </div>
    </div>
  );
}
