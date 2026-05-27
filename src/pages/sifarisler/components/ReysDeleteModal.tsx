import React from "react";
import { FiAlertTriangle, FiX } from "react-icons/fi";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  voyageNumber: string;
}

export default function ReysDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  voyageNumber,
}: Props) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10005,
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

      {/* Card */}
      <div
        style={{
          position: "relative",
          background: "#ffffff",
          width: "min(96%, 28rem)",
          borderRadius: "1.25rem",
          overflow: "hidden",
          border: "1px solid #fee2e2",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "#fef2f2",
            borderBottom: "1px solid #fee2e2",
            padding: "1.25rem 1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                display: "flex",
                width: "2.25rem",
                height: "2.25rem",
                borderRadius: "999px",
                background: "#fee2e2",
                color: "#dc2626",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FiAlertTriangle style={{ fontSize: "1.2rem" }} />
            </div>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#991b1b" }}>
              Reysi sil
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: 0,
              cursor: "pointer",
              fontSize: "1.25rem",
              color: "#991b1b",
              display: "flex",
              alignItems: "center",
              padding: "0.25rem",
            }}
            aria-label="Bağla"
          >
            <FiX />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "1.5rem" }}>
          <p
            style={{
              margin: 0,
              fontSize: "0.925rem",
              color: "#4b5563",
              lineHeight: "1.5rem",
            }}
          >
            <strong>{voyageNumber}</strong> nömrəli reysi silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz və bütün əlaqəli məlumatlar itəcəkdir.
          </p>
        </div>

        {/* Footer */}
        <div
          style={{
            background: "#f9fafb",
            borderTop: "1px solid #e5e7eb",
            padding: "1rem 1.5rem",
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.75rem",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "1px solid #d1d5db",
              background: "#ffffff",
              color: "#374151",
              borderRadius: "0.5rem",
              padding: "0.5rem 1.25rem",
              fontWeight: 600,
              fontSize: "0.85rem",
              cursor: "pointer",
              outline: "none",
            }}
          >
            Ləğv et
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              border: "1px solid #dc2626",
              background: "#dc2626",
              color: "#ffffff",
              borderRadius: "0.5rem",
              padding: "0.5rem 1.25rem",
              fontWeight: 600,
              fontSize: "0.85rem",
              cursor: "pointer",
              boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
              outline: "none",
            }}
          >
            Sil
          </button>
        </div>
      </div>
    </div>
  );
}
