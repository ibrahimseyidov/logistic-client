import { statusLabelAz } from "../../../common/components/StatusBadge";
import { formatStatusHistoryMeta } from "../../sifarisler/lib/statusHistory.utils";
import type { StatusHistoryItem } from "../types/sorgu.types";
import { getSorguStatusHistoryColor } from "../lib/sorguStatus";

interface Props {
  open: boolean;
  history?: StatusHistoryItem[] | null;
  onClose: () => void;
}

export default function SorguStatusHistoryModal({
  open,
  history,
  onClose,
}: Props) {
  if (!open) return null;

  const items = Array.isArray(history) ? history : [];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(4px)",
        }}
        onClick={onClose}
      />
      <div
        style={{
          position: "relative",
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "1.25rem",
          width: "min(100%, 28rem)",
          boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.15)",
          overflow: "hidden",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div
          style={{
            background: "#f8fafc",
            borderBottom: "1px solid #e2e8f0",
            padding: "1.25rem 1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "#1e293b",
            }}
          >
            Sorğunun Status Tarixçəsi
          </h3>
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
              borderRadius: "0.375rem",
            }}
            aria-label="Bağla"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 1L13 13M1 13L13 1"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        <div style={{ padding: "1.5rem", maxHeight: "60vh", overflowY: "auto" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {items.length > 0 ? (
              items.map((item, idx) => {
                const color = getSorguStatusHistoryColor(item.status);
                return (
                  <div
                    key={item.id ?? idx}
                    style={{
                      position: "relative",
                      paddingLeft: "1.5rem",
                      display: "flex",
                      gap: "0.75rem",
                      alignItems: "flex-start",
                    }}
                  >
                    {idx !== items.length - 1 && (
                      <div
                        style={{
                          position: "absolute",
                          left: "5px",
                          top: "16px",
                          bottom: "-12px",
                          width: "1px",
                          backgroundColor: "#cbd5e1",
                        }}
                      />
                    )}
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: "6px",
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        border: "2px solid #ffffff",
                        backgroundColor: color,
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.25rem",
                        flex: 1,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          color,
                        }}
                      >
                        {statusLabelAz(item.status)}
                      </span>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "#64748b",
                          fontWeight: 500,
                        }}
                      >
                        {formatStatusHistoryMeta(item)}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p
                style={{
                  margin: 0,
                  color: "#64748b",
                  fontStyle: "italic",
                  textAlign: "center",
                  padding: "1rem 0",
                }}
              >
                Tarixçə tapılmadı.
              </p>
            )}
          </div>
        </div>
        <div
          style={{
            background: "#f8fafc",
            borderTop: "1px solid #e2e8f0",
            padding: "1rem 1.5rem",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "1px solid #dbe4f0",
              background: "#ffffff",
              color: "#475569",
              borderRadius: "0.5rem",
              padding: "0.5rem 1.25rem",
              fontWeight: 600,
              fontSize: "0.85rem",
              cursor: "pointer",
              transition: "background-color 0.2s ease",
            }}
          >
            Bağla
          </button>
        </div>
      </div>
    </div>
  );
}
