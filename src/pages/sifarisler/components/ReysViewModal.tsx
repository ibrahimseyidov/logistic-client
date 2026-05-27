import React from "react";
import { FiX } from "react-icons/fi";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  voyage: {
    id: string;
    number: string;
    tags: string;
    sender: string;
    loadPlace: string;
    receiver: string;
    unloadPlace: string;
    status: string;
    loadDate: string;
    unloadDate: string;
    price: string;
    carrier: string;
    carNumber: string;
    expeditor: string;
    invoices: string;
    loads: string;
    rawPayload?: any;
  } | null;
}

export default function ReysViewModal({ isOpen, onClose, onEdit, voyage }: Props) {
  if (!isOpen || !voyage) return null;

  const satici = "Ulvi Adilzade";
  const phone = "+994555725271";
  const expeditor = voyage.expeditor || "Ulvi Adilzade";
  const price = voyage.rawPayload?.price 
    ? `${voyage.rawPayload.price} ${voyage.rawPayload.currency || "USD"} ƏDV ilə`
    : "1205 USD ƏDV ilə";
  
  const companyName = voyage.carrier || "Makeasy";
  const companyAddress = voyage.rawPayload?.loadingPlaces?.[0]?.country || "China";
  const companyEmail = "Gavin@makeasy-log.com";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Backdrop */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(4px)",
        }}
        onClick={onClose}
      />

      {/* Modal Card */}
      <div
        style={{
          position: "relative",
          background: "#f1f5f9",
          border: "1px solid #cbd5e1",
          borderRadius: "0.5rem",
          width: "min(96%, 860px)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "#ffffff",
            padding: "0.85rem 1.25rem",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#475569" }}>Reys</span>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: 0,
              cursor: "pointer",
              fontSize: "1.25rem",
              color: "#64748b",
              display: "flex",
              alignItems: "center",
              padding: "0.25rem",
            }}
          >
            <FiX />
          </button>
        </div>

        {/* Body Cards side-by-side */}
        <div
          style={{
            padding: "1.5rem",
            display: "grid",
            gridTemplateColumns: "1.1fr 0.9fr",
            gap: "1.25rem",
            boxSizing: "border-box",
          }}
        >
          {/* Card 1: Reys details */}
          <div style={{ border: "1px solid #e2e8f0", borderRadius: "0.25rem", background: "#ffffff", overflow: "hidden" }}>
            <div style={{ background: "#cbd5e1", padding: "0.45rem 0.75rem", fontSize: "0.85rem", fontWeight: 700, color: "#334155" }}>
              Reys {voyage.number}
            </div>
            <div style={{ display: "flex", flexDirection: "column", fontSize: "0.8rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 2fr", borderBottom: "1px solid #e2e8f0" }}>
                <div style={{ padding: "0.55rem 0.75rem", background: "#f8fafc", borderRight: "1px solid #e2e8f0", color: "#64748b", fontWeight: 600 }}>Satıcı</div>
                <div style={{ padding: "0.55rem 0.75rem", color: "#334155", fontWeight: 700 }}>{satici}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 2fr", borderBottom: "1px solid #e2e8f0" }}>
                <div style={{ padding: "0.55rem 0.75rem", background: "#f8fafc", borderRight: "1px solid #e2e8f0", color: "#64748b", fontWeight: 600 }}>Telefon nömrəsi</div>
                <div style={{ padding: "0.55rem 0.75rem", color: "#334155", fontWeight: 700 }}>{phone}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 2fr", borderBottom: "1px solid #e2e8f0" }}>
                <div style={{ padding: "0.55rem 0.75rem", background: "#f8fafc", borderRight: "1px solid #e2e8f0", color: "#64748b", fontWeight: 600 }}>Yükün nömrəsi:</div>
                <div style={{ padding: "0.55rem 0.75rem", color: "#334155", fontWeight: 700 }}>{voyage.number}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 2fr", borderBottom: "1px solid #e2e8f0" }}>
                <div style={{ padding: "0.55rem 0.75rem", background: "#f8fafc", borderRight: "1px solid #e2e8f0", color: "#64748b", fontWeight: 600 }}>Ekspeditor:</div>
                <div style={{ padding: "0.55rem 0.75rem", color: "#334155", fontWeight: 700 }}>{expeditor}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 2fr", borderBottom: "1px solid #e2e8f0" }}>
                <div style={{ padding: "0.55rem 0.75rem", background: "#f8fafc", borderRight: "1px solid #e2e8f0", color: "#64748b", fontWeight: 600 }}>Qiymət:</div>
                <div style={{ padding: "0.55rem 0.75rem", color: "#334155", fontWeight: 700 }}>{price}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 2fr" }}>
                <div style={{ padding: "0.55rem 0.75rem", background: "#f8fafc", borderRight: "1px solid #e2e8f0", color: "#64748b", fontWeight: 600 }}>Reysin daxili qiyməti:</div>
                <div style={{ padding: "0.55rem 0.75rem", color: "#334155", fontWeight: 700 }}>0</div>
              </div>
            </div>
          </div>

          {/* Card 2: Daşıyıcı details */}
          <div style={{ border: "1px solid #e2e8f0", borderRadius: "0.25rem", background: "#ffffff", overflow: "hidden", height: "fit-content" }}>
            <div style={{ background: "#cbd5e1", padding: "0.45rem 0.75rem", fontSize: "0.85rem", fontWeight: 700, color: "#334155" }}>
              Daşıyıcı
            </div>
            <div style={{ padding: "0.45rem 0.75rem", fontSize: "0.8rem", color: "#334155", fontWeight: 700, borderBottom: "1px solid #cbd5e1" }}>
              Şirkət haqqında məlumat:
            </div>
            <div style={{ display: "flex", flexDirection: "column", fontSize: "0.8rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 2fr", borderBottom: "1px solid #e2e8f0" }}>
                <div style={{ padding: "0.55rem 0.75rem", background: "#f8fafc", borderRight: "1px solid #e2e8f0", color: "#64748b", fontWeight: 600 }}>Şirkətin adı:</div>
                <div style={{ padding: "0.55rem 0.75rem", color: "#334155", fontWeight: 700 }}>{companyName}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 2fr", borderBottom: "1px solid #e2e8f0" }}>
                <div style={{ padding: "0.55rem 0.75rem", background: "#f8fafc", borderRight: "1px solid #e2e8f0", color: "#64748b", fontWeight: 600 }}>Ünvan:</div>
                <div style={{ padding: "0.55rem 0.75rem", color: "#334155" }}>{companyAddress}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 2fr" }}>
                <div style={{ padding: "0.55rem 0.75rem", background: "#f8fafc", borderRight: "1px solid #e2e8f0", color: "#64748b", fontWeight: 600 }}>El.poçt:</div>
                <div style={{ padding: "0.55rem 0.75rem", color: "#334155" }}>{companyEmail}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions bar */}
        <div
          style={{
            padding: "0.75rem 1.25rem",
            background: "#e2e8f0",
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.75rem",
          }}
        >
          <button
            type="button"
            style={{
              background: "#b0bec5",
              border: 0,
              borderRadius: "1.25rem",
              color: "#ffffff",
              fontSize: "0.8rem",
              fontWeight: 700,
              padding: "0.45rem 1.5rem",
              cursor: "pointer",
            }}
          >
            Yükləmə növbəsi
          </button>
          <button
            type="button"
            onClick={onEdit}
            style={{
              background: "#90a4ae",
              border: 0,
              borderRadius: "1.25rem",
              color: "#ffffff",
              fontSize: "0.8rem",
              fontWeight: 700,
              padding: "0.45rem 1.5rem",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#78909c")}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#90a4ae")}
          >
            Dəyiş
          </button>
        </div>
      </div>
    </div>
  );
}
