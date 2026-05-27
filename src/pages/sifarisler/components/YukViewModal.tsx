import React from "react";
import { FiX, FiEdit } from "react-icons/fi";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  load: {
    id: string;
    number: string;
    name: string;
    containerNumber: string;
    params: string;
    sender: string;
    loadPlace: string;
    loadDate: string;
    receiver: string;
    unloadPlace: string;
    unloadDate: string;
    voyage: string;
    rawPayload?: any;
  } | null;
}

export default function YukViewModal({ isOpen, onClose, onEdit, load }: Props) {
  if (!isOpen || !load) return null;

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
          width: "min(96%, 800px)",
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
          <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#475569" }}>
            Yükün detalları: {load.number}
          </span>
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

        {/* Body content */}
        <div
          style={{
            padding: "1.5rem",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1.25rem",
            boxSizing: "border-box",
          }}
        >
          {/* Column 1: Main details */}
          <div style={{ border: "1px solid #e2e8f0", borderRadius: "0.25rem", background: "#ffffff", overflow: "hidden" }}>
            <div style={{ background: "#cbd5e1", padding: "0.45rem 0.75rem", fontSize: "0.85rem", fontWeight: 700, color: "#334155" }}>
              Əsas Məlumatlar
            </div>
            <div style={{ display: "flex", flexDirection: "column", fontSize: "0.8rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 2fr", borderBottom: "1px solid #e2e8f0" }}>
                <div style={{ padding: "0.55rem 0.75rem", background: "#f8fafc", borderRight: "1px solid #e2e8f0", color: "#64748b", fontWeight: 600 }}>Yükün nömrəsi</div>
                <div style={{ padding: "0.55rem 0.75rem", color: "#334155", fontWeight: 700 }}>{load.number}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 2fr", borderBottom: "1px solid #e2e8f0" }}>
                <div style={{ padding: "0.55rem 0.75rem", background: "#f8fafc", borderRight: "1px solid #e2e8f0", color: "#64748b", fontWeight: 600 }}>Adı</div>
                <div style={{ padding: "0.55rem 0.75rem", color: "#334155" }}>{load.name}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 2fr", borderBottom: "1px solid #e2e8f0" }}>
                <div style={{ padding: "0.55rem 0.75rem", background: "#f8fafc", borderRight: "1px solid #e2e8f0", color: "#64748b", fontWeight: 600 }}>Konteyner №</div>
                <div style={{ padding: "0.55rem 0.75rem", color: "#334155" }}>{load.containerNumber || "—"}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 2fr" }}>
                <div style={{ padding: "0.55rem 0.75rem", background: "#f8fafc", borderRight: "1px solid #e2e8f0", color: "#64748b", fontWeight: 600 }}>Reys</div>
                <div style={{ padding: "0.55rem 0.75rem", color: "#16a34a", fontWeight: 700 }}>{load.voyage || "—"}</div>
              </div>
            </div>
          </div>

          {/* Column 2: Route / Places details */}
          <div style={{ border: "1px solid #e2e8f0", borderRadius: "0.25rem", background: "#ffffff", overflow: "hidden" }}>
            <div style={{ background: "#cbd5e1", padding: "0.45rem 0.75rem", fontSize: "0.85rem", fontWeight: 700, color: "#334155" }}>
              Marşrut Məlumatları
            </div>
            <div style={{ display: "flex", flexDirection: "column", fontSize: "0.8rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 2fr", borderBottom: "1px solid #e2e8f0" }}>
                <div style={{ padding: "0.55rem 0.75rem", background: "#f8fafc", borderRight: "1px solid #e2e8f0", color: "#64748b", fontWeight: 600 }}>Göndərən</div>
                <div style={{ padding: "0.55rem 0.75rem", color: "#334155" }}>{load.sender || "—"}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 2fr", borderBottom: "1px solid #e2e8f0" }}>
                <div style={{ padding: "0.55rem 0.75rem", background: "#f8fafc", borderRight: "1px solid #e2e8f0", color: "#64748b", fontWeight: 600 }}>Yükləmə yeri</div>
                <div style={{ padding: "0.55rem 0.75rem", color: "#334155" }}>{load.loadPlace || "—"}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 2fr", borderBottom: "1px solid #e2e8f0" }}>
                <div style={{ padding: "0.55rem 0.75rem", background: "#f8fafc", borderRight: "1px solid #e2e8f0", color: "#64748b", fontWeight: 600 }}>Alıcı</div>
                <div style={{ padding: "0.55rem 0.75rem", color: "#334155" }}>{load.receiver || "—"}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 2fr" }}>
                <div style={{ padding: "0.55rem 0.75rem", background: "#f8fafc", borderRight: "1px solid #e2e8f0", color: "#64748b", fontWeight: 600 }}>Boşaltma yeri</div>
                <div style={{ padding: "0.55rem 0.75rem", color: "#334155" }}>{load.unloadPlace || "—"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Parametrlər row */}
        <div style={{ padding: "0 1.5rem 1.5rem", boxSizing: "border-box" }}>
          <div style={{ border: "1px solid #e2e8f0", borderRadius: "0.25rem", background: "#ffffff", overflow: "hidden" }}>
            <div style={{ background: "#cbd5e1", padding: "0.45rem 0.75rem", fontSize: "0.85rem", fontWeight: 700, color: "#334155" }}>
              Yükün Parametrləri
            </div>
            <div style={{ padding: "1rem", fontSize: "0.8rem", color: "#475569", whiteSpace: "pre-line", lineHeight: 1.5 }}>
              {load.params}
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
            onClick={onClose}
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
            Bağla
          </button>
          <button
            type="button"
            onClick={onEdit}
            style={{
              background: "#16a34a",
              border: 0,
              borderRadius: "1.25rem",
              color: "#ffffff",
              fontSize: "0.8rem",
              fontWeight: 700,
              padding: "0.45rem 1.5rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              transition: "background-color 0.2s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#15803d")}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#16a34a")}
          >
            <FiEdit /> Dəyiş
          </button>
        </div>
      </div>
    </div>
  );
}
