"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FaChevronDown,
  FaFileAlt,
  FaPlus,
  FaDownload,
  FaTrash,
  FaMagic,
  FaEdit,
} from "react-icons/fa";
import {
  deleteOrderDocumentAction,
  fetchDocumentTemplatesAction,
  fetchOrderDocumentEditAction,
  fetchOrderDocumentsAction,
  generateDocumentAction,
  resolveUploadUrl,
  updateOrderDocumentHtmlAction,
  type DocumentTemplate,
  type OrderDocumentRow,
} from "../../actions/document.actions";
import { useAppDispatch } from "../../store/hooks";
import { showNotification } from "../../store/modalSlice";
import { usePermissions } from "../../hooks/usePermissions";
import DocumentEditModal from "./DocumentEditModal";

type Props = {
  scope: "query" | "order";
  queryId?: number | null;
  orderId?: number | null;
  /** İcazə: modul + child (məs. sifarisler/documents) */
  permModule?: string;
  permChild?: string;
  /** When documents are managed by parent (query docs), call after generate */
  onGenerated?: () => void;
  /** Existing uploaded docs for query page (optional display) */
  existingDocs?: Array<{
    id: number;
    name: string;
    url: string;
    size: number;
    createdAt: string;
  }>;
  onDeleteExisting?: (id: number) => void;
  onUpload?: (file: File) => void;
};

export default function DocumentGeneratePanel({
  scope,
  queryId,
  orderId,
  permModule,
  permChild,
  onGenerated,
  existingDocs,
  onDeleteExisting,
  onUpload,
}: Props) {
  const dispatch = useAppDispatch();
  const { canCreate, canDelete, canEdit } = usePermissions();
  const allowCreate =
    !permModule || canCreate(permModule, permChild);
  const allowDelete =
    !permModule || canDelete(permModule, permChild);
  const allowEdit = !permModule || canEdit(permModule, permChild);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [orderDocs, setOrderDocs] = useState<OrderDocumentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyCode, setBusyCode] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editHtml, setEditHtml] = useState("");
  const [editDocId, setEditDocId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const tpls = await fetchDocumentTemplatesAction(scope);
      setTemplates(tpls);
      if (orderId) {
        const docs = await fetchOrderDocumentsAction(orderId);
        setOrderDocs(docs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [scope, orderId, queryId]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const visibleTemplates = useMemo(() => {
    if (scope !== "order") return templates;
    // Sifarişdə yalnız order şablonları — Request / Daşıma sorğuya məxsusdur
    return templates.filter(
      (t) => t.code !== "request" && t.code !== "shipping_info",
    );
  }, [templates, scope]);

  const handleGenerate = async (template: DocumentTemplate) => {
    if (scope === "query" && !queryId) {
      dispatch(
        showNotification({
          message: "Sorğu seçilməyib.",
          type: "error",
          autoCloseDuration: 3000,
        }),
      );
      return;
    }
    if (scope === "order" && !orderId) {
      dispatch(
        showNotification({
          message: "Sifariş seçilməyib.",
          type: "error",
          autoCloseDuration: 3000,
        }),
      );
      return;
    }

    setMenuOpen(false);
    setBusyCode(template.code);
    try {
      const meta = await generateDocumentAction({
        templateCode: template.code,
        queryId: queryId ?? null,
        orderId: orderId ?? null,
        save: true,
      });

      const fullUrl = resolveUploadUrl(meta.url);
      const a = document.createElement("a");
      a.href = fullUrl;
      a.download = meta.fileName || `${template.code}.pdf`;
      a.target = "_blank";
      a.rel = "noreferrer";
      a.click();

      dispatch(
        showNotification({
          message: `"${template.name}" hazırlandı.`,
          type: "success",
          autoCloseDuration: 2800,
        }),
      );
      if (orderId) {
        setOrderDocs(await fetchOrderDocumentsAction(orderId));
      }
      onGenerated?.();
    } catch (err: any) {
      console.error(err);
      dispatch(
        showNotification({
          message: err?.response?.data?.message || "Sənəd hazırlanarkən xəta.",
          type: "error",
          autoCloseDuration: 3500,
        }),
      );
    } finally {
      setBusyCode(null);
    }
  };

  const handleDeleteOrderDoc = async (id: number) => {
    try {
      await deleteOrderDocumentAction(id);
      setOrderDocs((prev) => prev.filter((d) => d.id !== id));
    } catch {
      /* ignore */
    }
  };

  const handleOpenEdit = async (doc: OrderDocumentRow) => {
    try {
      const payload = await fetchOrderDocumentEditAction(doc.id);
      setEditDocId(payload.id);
      setEditTitle(payload.name);
      setEditHtml(payload.html);
      setEditOpen(true);
    } catch (err: any) {
      dispatch(
        showNotification({
          message:
            err?.response?.data?.message ||
            "Bu sənəd redaktə edilə bilmir (yalnız şablondan hazırlananlar).",
          type: "error",
          autoCloseDuration: 3500,
        }),
      );
    }
  };

  const handleSaveEdit = async (html: string) => {
    if (!editDocId) return;
    setEditSaving(true);
    try {
      const updated = await updateOrderDocumentHtmlAction(editDocId, html);
      setOrderDocs((prev) =>
        prev.map((d) => (d.id === updated.id ? { ...d, ...updated } : d)),
      );
      setEditOpen(false);
      setEditDocId(null);
      setEditHtml("");
      dispatch(
        showNotification({
          message: "Sənəd yeniləndi.",
          type: "success",
          autoCloseDuration: 2800,
        }),
      );
    } catch (err: any) {
      dispatch(
        showNotification({
          message: err?.response?.data?.message || "Saxlanarkən xəta.",
          type: "error",
          autoCloseDuration: 3500,
        }),
      );
    } finally {
      setEditSaving(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return "0 B";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / 1024 ** i).toFixed(1)} ${["B", "KB", "MB"][i]}`;
  };

  const isBusy = Boolean(busyCode);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "0.75rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>
            Sənədlər
          </h3>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "#64748b" }}>
            Şablondan PDF hazırlayın və ya fayl yükləyin.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          {onUpload && allowCreate ? (
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                background: "#fff",
                color: "#0f172a",
                border: "1px solid #e2e8f0",
                borderRadius: "0.5rem",
                padding: "0.55rem 0.9rem",
                fontSize: "0.825rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <FaPlus /> Fayl yüklə
              <input
                type="file"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onUpload(file);
                  e.target.value = "";
                }}
              />
            </label>
          ) : null}

          {allowCreate ? (
          <div ref={menuRef} style={{ position: "relative" }}>
            <button
              type="button"
              disabled={loading || isBusy || visibleTemplates.length === 0}
              onClick={() => setMenuOpen((open) => !open)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.45rem",
                background: "#16a34a",
                color: "#fff",
                border: 0,
                borderRadius: "0.5rem",
                padding: "0.55rem 0.95rem",
                fontSize: "0.825rem",
                fontWeight: 600,
                cursor: loading || isBusy || visibleTemplates.length === 0 ? "not-allowed" : "pointer",
                opacity: loading || isBusy || visibleTemplates.length === 0 ? 0.7 : 1,
              }}
            >
              <FaMagic />
              {isBusy ? "Hazırlanır..." : "Sənəd hazırla"}
              <FaChevronDown style={{ fontSize: "0.7rem", opacity: 0.9 }} />
            </button>

            {menuOpen ? (
              <div
                role="menu"
                style={{
                  position: "absolute",
                  top: "calc(100% + 0.4rem)",
                  right: 0,
                  zIndex: 30,
                  minWidth: 280,
                  maxWidth: 360,
                  maxHeight: 360,
                  overflowY: "auto",
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "0.65rem",
                  boxShadow: "0 12px 28px rgba(15, 23, 42, 0.12)",
                  padding: "0.35rem",
                }}
              >
                {visibleTemplates.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    role="menuitem"
                    disabled={isBusy}
                    onClick={() => void handleGenerate(tpl)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.65rem",
                      textAlign: "left",
                      border: 0,
                      background: "transparent",
                      borderRadius: "0.45rem",
                      padding: "0.65rem 0.7rem",
                      cursor: isBusy ? "not-allowed" : "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#f8fafc";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <span
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: "#f1f5f9",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#475569",
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      <FaFileAlt />
                    </span>
                    <span style={{ minWidth: 0, flex: 1 }}>
                      <span
                        style={{
                          display: "block",
                          fontWeight: 700,
                          fontSize: "0.85rem",
                          color: "#0f172a",
                        }}
                      >
                        {tpl.name}
                      </span>
                      <span
                        style={{
                          display: "block",
                          fontSize: "0.72rem",
                          color: "#94a3b8",
                          marginTop: 2,
                        }}
                      >
                        {tpl.isSystem ? "Sistem şablonu" : "Özəl şablon"}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          ) : null}
        </div>
      </div>

      {loading ? (
        <p style={{ color: "#94a3b8", fontSize: "0.875rem", margin: 0 }}>Yüklənir...</p>
      ) : null}

      {/* Saved / existing docs */}
      <div>
        <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.9rem", fontWeight: 700, color: "#334155" }}>
          Hazırlanmış / yüklənmiş sənədlər
        </h4>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "0.75rem",
          }}
        >
          {scope === "order" &&
            orderDocs.map((doc) => (
              <div
                key={`o-${doc.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.85rem",
                  border: "1px solid #e2e8f0",
                  borderRadius: "0.5rem",
                  background: "#fff",
                }}
              >
                <FaFileAlt style={{ color: "#64748b" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "0.825rem",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {doc.name}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                    {formatSize(doc.size)} · {new Date(doc.createdAt).toLocaleDateString("az-AZ")}
                    {doc.templateCode ? ` · ${doc.templateCode}` : ""}
                  </div>
                </div>
                {allowEdit ? (
                  <button
                    type="button"
                    onClick={() => void handleOpenEdit(doc)}
                    style={{
                      border: 0,
                      background: "transparent",
                      color: "#2563eb",
                      cursor: "pointer",
                      padding: 6,
                    }}
                    title="Redaktə et"
                  >
                    <FaEdit />
                  </button>
                ) : null}
                <a
                  href={resolveUploadUrl(doc.url)}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#475569", padding: 6 }}
                  title="Yüklə"
                >
                  <FaDownload />
                </a>
                {allowDelete ? (
                <button
                  type="button"
                  onClick={() => void handleDeleteOrderDoc(doc.id)}
                  style={{
                    border: 0,
                    background: "transparent",
                    color: "#dc2626",
                    cursor: "pointer",
                    padding: 6,
                  }}
                  title="Sil"
                >
                  <FaTrash />
                </button>
                ) : null}
              </div>
            ))}

          {existingDocs?.map((doc) => (
            <div
              key={`e-${doc.id}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.85rem",
                border: "1px solid #e2e8f0",
                borderRadius: "0.5rem",
                background: "#fff",
              }}
            >
              <FaFileAlt style={{ color: "#64748b" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "0.825rem",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {doc.name}
                </div>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                  {formatSize(doc.size)} · {new Date(doc.createdAt).toLocaleDateString("az-AZ")}
                </div>
              </div>
              <a
                href={resolveUploadUrl(doc.url)}
                target="_blank"
                rel="noreferrer"
                style={{ color: "#475569", padding: 6 }}
              >
                <FaDownload />
              </a>
              {onDeleteExisting && allowDelete ? (
                <button
                  type="button"
                  onClick={() => onDeleteExisting(doc.id)}
                  style={{
                    border: 0,
                    background: "transparent",
                    color: "#dc2626",
                    cursor: "pointer",
                    padding: 6,
                  }}
                >
                  <FaTrash />
                </button>
              ) : null}
            </div>
          ))}

          {scope === "order" && orderDocs.length === 0 && (!existingDocs || existingDocs.length === 0) ? (
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: 0 }}>Hələ sənəd yoxdur</p>
          ) : null}
          {scope === "query" && (!existingDocs || existingDocs.length === 0) ? (
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: 0 }}>
              Hələ yüklənmiş/hazırlanmış sənəd yoxdur
            </p>
          ) : null}
        </div>
      </div>

      <DocumentEditModal
        open={editOpen}
        title={editTitle}
        html={editHtml}
        saving={editSaving}
        onClose={() => {
          if (editSaving) return;
          setEditOpen(false);
          setEditDocId(null);
          setEditHtml("");
        }}
        onSave={(html) => void handleSaveEdit(html)}
      />
    </div>
  );
}
