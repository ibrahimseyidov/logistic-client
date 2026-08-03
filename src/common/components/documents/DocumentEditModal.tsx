"use client";

import { useEffect, useRef, useState } from "react";
import { FiSave, FiX } from "react-icons/fi";

type Props = {
  open: boolean;
  title: string;
  html: string;
  saving?: boolean;
  onClose: () => void;
  onSave: (html: string) => void;
};

/**
 * Yaradılmış sənədin HTML məzmununu redaktə — rəqəm / mətn dəyişikliyi.
 * iframe designMode ilə bütün sənəd redaktə olunur.
 */
export default function DocumentEditModal({
  open,
  title,
  html,
  saving,
  onClose,
  onSave,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!open) {
      setReady(false);
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, saving, onClose]);

  useEffect(() => {
    if (!open || !iframeRef.current) return;
    const iframe = iframeRef.current;
    const doc = iframe.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(html || "<html><body><p>Məzmun yoxdur</p></body></html>");
    doc.close();

    try {
      doc.designMode = "on";
      // Redaktə rahatlığı
      doc.body.style.cursor = "text";
      doc.body.style.minHeight = "100%";
      doc.body.contentEditable = "true";
    } catch {
      /* ignore */
    }
    setReady(true);
  }, [open, html]);

  const handleSave = () => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    const serialized =
      "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
    onSave(serialized);
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 12000,
        display: "flex",
        alignItems: "stretch",
        justifyContent: "center",
        background: "rgba(15, 23, 42, 0.45)",
        padding: "1.25rem",
      }}
      onClick={() => {
        if (!saving) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Sənədi redaktə et"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(960px, 100%)",
          maxHeight: "100%",
          background: "#fff",
          borderRadius: "0.75rem",
          boxShadow: "0 24px 64px rgba(15,23,42,0.28)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            padding: "0.9rem 1.15rem",
            borderBottom: "1px solid #e2e8f0",
            background: "#fafbfc",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: "#0f172a",
              }}
            >
              Sənədi redaktə et
            </div>
            <div
              style={{
                fontSize: "0.78rem",
                color: "#64748b",
                marginTop: 2,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {title} — rəqəm və mətnləri birbaşa dəyişin, sonra saxlayın
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                height: "2.25rem",
                padding: "0 0.85rem",
                borderRadius: "0.45rem",
                border: "1px solid #e2e8f0",
                background: "#fff",
                color: "#475569",
                fontWeight: 600,
                fontSize: "0.825rem",
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              <FiX />
              Ləğv et
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !ready}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                height: "2.25rem",
                padding: "0 0.95rem",
                borderRadius: "0.45rem",
                border: 0,
                background: "#0f172a",
                color: "#fff",
                fontWeight: 600,
                fontSize: "0.825rem",
                cursor: saving || !ready ? "not-allowed" : "pointer",
                opacity: saving || !ready ? 0.7 : 1,
              }}
            >
              <FiSave />
              {saving ? "Saxlanılır..." : "Yadda saxla"}
            </button>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            minHeight: 0,
            background: "#e8edf3",
            padding: "0.75rem",
          }}
        >
          <iframe
            ref={iframeRef}
            title="Sənəd redaktoru"
            style={{
              width: "100%",
              height: "100%",
              minHeight: "70vh",
              border: "1px solid #cbd5e1",
              borderRadius: "0.5rem",
              background: "#fff",
            }}
          />
        </div>
      </div>
    </div>
  );
}
