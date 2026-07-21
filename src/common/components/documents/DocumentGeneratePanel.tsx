"use client";

import { useEffect, useMemo, useState } from "react";
import { FaFileAlt, FaPlus, FaDownload, FaTrash, FaMagic } from "react-icons/fa";
import {
  createDocumentTemplateAction,
  deleteDocumentTemplateAction,
  deleteOrderDocumentAction,
  fetchDocumentPlaceholdersAction,
  fetchDocumentTemplatesAction,
  fetchOrderDocumentsAction,
  generateDocumentAction,
  resolveUploadUrl,
  type DocumentTemplate,
  type OrderDocumentRow,
  type PlaceholderField,
} from "../../actions/document.actions";
import { useAppDispatch } from "../../store/hooks";
import { showNotification } from "../../store/modalSlice";

type Props = {
  scope: "query" | "order";
  queryId?: number | null;
  orderId?: number | null;
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
  onGenerated,
  existingDocs,
  onDeleteExisting,
  onUpload,
}: Props) {
  const dispatch = useAppDispatch();
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [placeholders, setPlaceholders] = useState<PlaceholderField[]>([]);
  const [orderDocs, setOrderDocs] = useState<OrderDocumentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyCode, setBusyCode] = useState<string | null>(null);

  const [customOpen, setCustomOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customBody, setCustomBody] = useState(
    "Sənəd tarixi: {{documentDate}}\nMüştəri: {{customerName}}\nMarşrut: {{originLabel}} → {{destinationLabel}}\n",
  );
  const [customScope, setCustomScope] = useState<"query" | "order" | "both">(scope);

  const load = async () => {
    setLoading(true);
    try {
      const [tpls, ph] = await Promise.all([
        fetchDocumentTemplatesAction(scope),
        fetchDocumentPlaceholdersAction(),
      ]);
      setTemplates(tpls);
      setPlaceholders(ph);
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

  const scopedPlaceholders = useMemo(
    () =>
      placeholders.filter(
        (p) => p.scopes.includes(scope) || p.scopes.includes("both"),
      ),
    [placeholders, scope],
  );

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

  const handleCreateCustom = async () => {
    if (!customName.trim()) return;
    try {
      await createDocumentTemplateAction({
        name: customName.trim(),
        scope: customScope,
        bodyText: customBody,
        description: "İstifadəçi şablonu",
      });
      setCustomOpen(false);
      setCustomName("");
      dispatch(
        showNotification({
          message: "Yeni şablon əlavə edildi.",
          type: "success",
          autoCloseDuration: 2500,
        }),
      );
      await load();
    } catch (err: any) {
      dispatch(
        showNotification({
          message: err?.response?.data?.message || "Şablon yaradılmadı.",
          type: "error",
          autoCloseDuration: 3000,
        }),
      );
    }
  };

  const handleDeleteTemplate = async (tpl: DocumentTemplate) => {
    if (tpl.isSystem) return;
    try {
      await deleteDocumentTemplateAction(tpl.id);
      await load();
    } catch (err: any) {
      dispatch(
        showNotification({
          message: err?.response?.data?.message || "Silinmədi.",
          type: "error",
          autoCloseDuration: 3000,
        }),
      );
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

  const formatSize = (bytes: number) => {
    if (!bytes) return "0 B";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / 1024 ** i).toFixed(1)} ${["B", "KB", "MB"][i]}`;
  };

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
            Sənəd hazırla
          </h3>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "#64748b" }}>
            Məlumatlar sorğu/sifarişdən avtomatik doldurulur. İstəsəniz öz şablonunuzu da əlavə
            edə bilərsiniz.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {onUpload ? (
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
          <button
            type="button"
            onClick={() => setCustomOpen(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              background: "#0f172a",
              color: "#fff",
              border: 0,
              borderRadius: "0.5rem",
              padding: "0.55rem 0.9rem",
              fontSize: "0.825rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <FaPlus /> Yeni şablon
          </button>
        </div>
      </div>

      {loading ? (
        <p style={{ color: "#94a3b8", fontSize: "0.875rem" }}>Yüklənir...</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "0.85rem",
          }}
        >
          {visibleTemplates.map((tpl) => (
            <div
              key={tpl.id}
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "0.65rem",
                padding: "1rem",
                background: "#fff",
                display: "flex",
                flexDirection: "column",
                gap: "0.65rem",
              }}
            >
              <div style={{ display: "flex", gap: "0.65rem", alignItems: "flex-start" }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: "#f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#475569",
                    flexShrink: 0,
                  }}
                >
                  <FaFileAlt />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "#0f172a" }}>
                    {tpl.name}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 2 }}>
                    {tpl.isSystem ? "Sistem şablonu" : "Özəl şablon"} · {tpl.code}
                  </div>
                  {tpl.description ? (
                    <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 4 }}>
                      {tpl.description}
                    </div>
                  ) : null}
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button
                  type="button"
                  disabled={busyCode === tpl.code}
                  onClick={() => void handleGenerate(tpl)}
                  style={{
                    flex: 1,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.35rem",
                    background: "#16a34a",
                    color: "#fff",
                    border: 0,
                    borderRadius: "0.4rem",
                    padding: "0.45rem 0.6rem",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    opacity: busyCode === tpl.code ? 0.7 : 1,
                  }}
                >
                  <FaMagic /> {busyCode === tpl.code ? "Hazırlanır..." : "Hazırla (PDF)"}
                </button>
                {!tpl.isSystem ? (
                  <button
                    type="button"
                    onClick={() => void handleDeleteTemplate(tpl)}
                    title="Şablonu sil"
                    style={{
                      border: "1px solid #fecaca",
                      background: "#fff",
                      color: "#dc2626",
                      borderRadius: "0.4rem",
                      padding: "0.45rem 0.55rem",
                      cursor: "pointer",
                    }}
                  >
                    <FaTrash />
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

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
                <a
                  href={resolveUploadUrl(doc.url)}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#475569", padding: 6 }}
                  title="Yüklə"
                >
                  <FaDownload />
                </a>
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
                >
                  <FaTrash />
                </button>
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
              {onDeleteExisting ? (
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

      {customOpen ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.45)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setCustomOpen(false)}
        >
          <div
            style={{
              width: "min(640px, 100%)",
              background: "#fff",
              borderRadius: 12,
              padding: 20,
              maxHeight: "90vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 0.75rem", fontSize: "1.05rem" }}>Yeni sənəd şablonu</h3>
            <p style={{ margin: "0 0 1rem", fontSize: "0.8rem", color: "#64748b" }}>
              Mətndə avtomatik sahələr üçün{" "}
              <code>{"{{orderNumber}}"}</code>, <code>{"{{customerName}}"}</code> kimi
              placeholder yazın.
            </p>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
              Ad
            </label>
            <input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              style={{
                width: "100%",
                marginBottom: 12,
                padding: "0.55rem 0.7rem",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
              }}
              placeholder="Məs: Xüsusi təsdiq məktubu"
            />
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
              Harada istifadə olunur
            </label>
            <select
              value={customScope}
              onChange={(e) => setCustomScope(e.target.value as any)}
              style={{
                width: "100%",
                marginBottom: 12,
                padding: "0.55rem 0.7rem",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
              }}
            >
              <option value="query">Yalnız sorğular</option>
              <option value="order">Yalnız sifarişlər</option>
              <option value="both">Hər ikisi</option>
            </select>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
              Şablon mətni
            </label>
            <textarea
              value={customBody}
              onChange={(e) => setCustomBody(e.target.value)}
              rows={8}
              style={{
                width: "100%",
                marginBottom: 8,
                padding: "0.55rem 0.7rem",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                fontFamily: "ui-monospace, monospace",
                fontSize: 12,
              }}
            />
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 14 }}>
              Mövcud sahələr:{" "}
              {scopedPlaceholders
                .slice(0, 12)
                .map((p) => `{{${p.key}}}`)
                .join(", ")}
              {scopedPlaceholders.length > 12 ? " ..." : ""}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                type="button"
                onClick={() => setCustomOpen(false)}
                style={{
                  border: "1px solid #e2e8f0",
                  background: "#fff",
                  borderRadius: 8,
                  padding: "0.5rem 0.9rem",
                  cursor: "pointer",
                }}
              >
                Ləğv et
              </button>
              <button
                type="button"
                onClick={() => void handleCreateCustom()}
                style={{
                  border: 0,
                  background: "#16a34a",
                  color: "#fff",
                  borderRadius: 8,
                  padding: "0.5rem 0.9rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Saxla
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
