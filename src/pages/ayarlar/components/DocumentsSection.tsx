"use client";

import React, { useEffect, useState } from "react";
import { FiEye, FiPlus, FiRefreshCw, FiSave, FiUpload, FiX } from "react-icons/fi";
import {
  createDocumentTemplateAction,
  deleteDocumentTemplateAction,
  fetchDocumentBrandAction,
  fetchDocumentPlaceholdersAction,
  fetchDocumentTemplatesAction,
  previewDocumentHtmlAction,
  resetDocumentTemplateAction,
  resolveUploadUrl,
  updateDocumentBrandAction,
  updateDocumentTemplateAction,
  uploadDocumentBrandAssetAction,
  type DocumentDesign,
  type DocumentTemplate,
  type PlaceholderField,
} from "../../../common/actions/document.actions";
import { ConfirmModal } from "../../../common/components/ConfirmModal";
import { useAppDispatch } from "../../../common/store/hooks";
import { showNotification } from "../../../common/store/modalSlice";
import actionStyles from "../../sorgular/components/SorgularActionBar.module.css";
import { AyarlarToolbar } from "./AyarlarToolbar";
import { DocumentTemplatesTable } from "./DocumentTemplatesTable";
import DocumentVisualEditor from "./DocumentVisualEditor";
import styles from "./DocumentsSection.module.css";

type EditorTab = "brand" | "templates";

const FONT_OPTIONS = [
  "Arial, Helvetica, sans-serif",
  "'Times New Roman', Times, serif",
  "Georgia, serif",
  "'Segoe UI', Tahoma, sans-serif",
  "Calibri, Candara, sans-serif",
];

export const DocumentsSection: React.FC = () => {
  const dispatch = useAppDispatch();
  const [tab, setTab] = useState<EditorTab>("brand");
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [placeholders, setPlaceholders] = useState<PlaceholderField[]>([]);
  const [design, setDesign] = useState<DocumentDesign | null>(null);

  const [selected, setSelected] = useState<DocumentTemplate | null>(null);
  const [editing, setEditing] = useState(false);
  const [htmlTemplate, setHtmlTemplate] = useState("");
  const [cssStyles, setCssStyles] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newScope, setNewScope] = useState("both");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [tpls, brand, ph] = await Promise.all([
        fetchDocumentTemplatesAction(),
        fetchDocumentBrandAction(),
        fetchDocumentPlaceholdersAction(),
      ]);
      setTemplates(tpls);
      setDesign(brand.design);
      setPlaceholders(ph);
      if (selected) {
        const fresh = tpls.find((t) => t.id === selected.id);
        if (fresh) {
          setSelected(fresh);
          if (editing) {
            setHtmlTemplate(fresh.htmlTemplate || "");
            setCssStyles(fresh.cssStyles || "");
          }
        }
      }
    } catch {
      dispatch(showNotification({ message: "Sənəd ayarları yüklənmədi", type: "error" }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectTemplate = (tpl: DocumentTemplate) => {
    setSelected(tpl);
    setHtmlTemplate(tpl.htmlTemplate || "");
    setCssStyles(tpl.cssStyles || "");
    setPreviewHtml("");
    setPreviewOpen(false);
    setShowCode(false);
    setEditing(true);
  };

  const closeEditor = () => {
    setEditing(false);
    setSelected(null);
    setHtmlTemplate("");
    setCssStyles("");
    setPreviewHtml("");
    setPreviewOpen(false);
    setShowCode(false);
  };

  const setDesignField = <K extends keyof DocumentDesign>(key: K, value: DocumentDesign[K]) => {
    setDesign((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSaveBrand = async () => {
    if (!design) return;
    setSaving(true);
    try {
      const res = await updateDocumentBrandAction(design);
      setDesign(res.design);
      dispatch(showNotification({ message: "Brend ayarları saxlanıldı", type: "success" }));
    } catch {
      dispatch(showNotification({ message: "Saxlanılarkən xəta", type: "error" }));
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (kind: "logo" | "stamp", file?: File | null) => {
    if (!file || !design) return;
    try {
      const { url } = await uploadDocumentBrandAssetAction(file, kind);
      const nextDesign: DocumentDesign = {
        ...design,
        ...(kind === "logo" ? { logoUrl: url } : { stampUrl: url }),
      };
      setDesign(nextDesign);
      // Dərhal qlobal brendə yaz — bütün sənədlər yeni logo/möhürlə yaranır
      const res = await updateDocumentBrandAction(nextDesign);
      setDesign(res.design);
      dispatch(
        showNotification({
          message:
            kind === "logo"
              ? "Logo yeniləndi — bütün sənədlərdə tətbiq olunur"
              : "Möhür yeniləndi — bütün sənədlərdə tətbiq olunur",
          type: "success",
        }),
      );
    } catch {
      dispatch(showNotification({ message: "Fayl yüklənmədi", type: "error" }));
    }
  };

  const handleSaveTemplate = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const updated = await updateDocumentTemplateAction(selected.id, {
        name: selected.name,
        scope: selected.scope,
        description: selected.description || "",
        htmlTemplate,
        cssStyles,
      });
      setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setSelected(updated);
      dispatch(showNotification({ message: "Şablon saxlanıldı", type: "success" }));
    } catch (err: any) {
      dispatch(
        showNotification({
          message: err?.response?.data?.message || "Şablon saxlanılmadı",
          type: "error",
        }),
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    if (!selected) return;
    setPreviewing(true);
    try {
      const res = await previewDocumentHtmlAction({
        templateId: selected.id,
        htmlTemplate,
        cssStyles,
        designJson: design || undefined,
      });
      setPreviewHtml(res.html);
      setPreviewOpen(true);
    } catch (err: any) {
      dispatch(
        showNotification({
          message: err?.response?.data?.message || "Preview alınmadı",
          type: "error",
        }),
      );
    } finally {
      setPreviewing(false);
    }
  };

  const handleReset = async () => {
    if (!selected?.isSystem) return;
    try {
      const updated = await resetDocumentTemplateAction(selected.id);
      setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      selectTemplate(updated);
      dispatch(showNotification({ message: "Sistem şablonu bərpa edildi", type: "success" }));
    } catch (err: any) {
      dispatch(
        showNotification({
          message: err?.response?.data?.message || "Bərpa olunmadı",
          type: "error",
        }),
      );
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const created = await createDocumentTemplateAction({
        name: newName.trim(),
        scope: newScope,
        description: "Özəl sənəd şablonu",
        htmlTemplate: `<div class="page">
  <h2 style="text-align:center;color:#c41e3a;">Yeni sənəd</h2>
  <p><strong>Müştəri:</strong> {{customerName}}</p>
  <p><strong>Tarix:</strong> {{documentDate}}</p>
  <p><strong>Marşrut:</strong> {{originLabel}} → {{destinationLabel}}</p>
  <p><strong>Yük:</strong> {{cargoName}}</p>
</div>`,
        cssStyles: "",
      });
      setTemplates((prev) => [...prev, created]);
      selectTemplate(created);
      setCreateOpen(false);
      setNewName("");
      setTab("templates");
      dispatch(showNotification({ message: "Yeni şablon yaradıldı", type: "success" }));
    } catch (err: any) {
      dispatch(
        showNotification({
          message: err?.response?.data?.message || "Yaradılmadı",
          type: "error",
        }),
      );
    }
  };

  const handleDelete = async () => {
    if (deleteId == null) return;
    try {
      await deleteDocumentTemplateAction(deleteId);
      setTemplates((prev) => prev.filter((t) => t.id !== deleteId));
      if (selected?.id === deleteId) {
        closeEditor();
      }
      setDeleteId(null);
      dispatch(showNotification({ message: "Şablon silindi", type: "success" }));
    } catch (err: any) {
      dispatch(
        showNotification({
          message: err?.response?.data?.message || "Silinmədi",
          type: "error",
        }),
      );
    }
  };

  if (loading || !design) {
    return <div className={styles.loading}>Yüklənir...</div>;
  }

  return (
    <div className={styles.root}>
      <AyarlarToolbar>
        <div className={actionStyles.wrapper}>
          <div className={actionStyles.group}>
            <button
              type="button"
              className={`${actionStyles.buttonBase} ${tab === "brand" ? actionStyles.buttonPrimary : actionStyles.buttonSecondary}`}
              onClick={() => {
                setTab("brand");
                closeEditor();
              }}
            >
              Brend / Dizayn
            </button>
            <button
              type="button"
              className={`${actionStyles.buttonBase} ${tab === "templates" ? actionStyles.buttonPrimary : actionStyles.buttonSecondary}`}
              onClick={() => setTab("templates")}
            >
              Şablonlar
            </button>
            <button
              type="button"
              className={`${actionStyles.buttonBase} ${actionStyles.buttonSecondary}`}
              onClick={() => setCreateOpen(true)}
            >
              <FiPlus /> Yeni şablon
            </button>
          </div>
        </div>
      </AyarlarToolbar>

      {tab === "brand" ? (
        <div className={styles.grid2}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Şirkət məlumatları</h3>
            <div className={styles.formGrid}>
              {(
                [
                  ["companyName", "Şirkət adı"],
                  ["companyLegalName", "Hüquqi ad"],
                  ["tagline", "Slogan"],
                  ["phone", "Telefon"],
                  ["website", "Vebsayt"],
                  ["email", "Email"],
                  ["director", "Direktor"],
                  ["directorTitle", "Vəzifə"],
                ] as Array<[keyof DocumentDesign, string]>
              ).map(([key, label]) => (
                <label key={key} className={styles.field}>
                  <span>{label}</span>
                  <input
                    value={String(design[key] ?? "")}
                    onChange={(e) => setDesignField(key, e.target.value as any)}
                  />
                </label>
              ))}
              <label className={`${styles.field} ${styles.full}`}>
                <span>Ünvan (qısa — Request)</span>
                <input
                  value={design.shortAddress}
                  onChange={(e) => setDesignField("shortAddress", e.target.value)}
                />
              </label>
              <label className={`${styles.field} ${styles.full}`}>
                <span>Ünvan (tam — Invoice)</span>
                <textarea
                  rows={2}
                  value={design.address}
                  onChange={(e) => setDesignField("address", e.target.value)}
                />
              </label>
            </div>

            <h3 className={styles.cardTitle} style={{ marginTop: 18 }}>
              Bank rekvizitləri
            </h3>
            <div className={styles.formGrid}>
              {(
                [
                  ["bankName", "Bank adı"],
                  ["bankCode", "Code"],
                  ["bankTin", "TIN"],
                  ["bankSwift", "SWIFT"],
                  ["bankIbanAzn", "IBAN AZN"],
                  ["bankIbanUsd", "IBAN USD"],
                  ["bankIbanEur", "IBAN EUR"],
                  ["bankIbanGbp", "IBAN GBP"],
                ] as Array<[keyof DocumentDesign, string]>
              ).map(([key, label]) => (
                <label key={key} className={styles.field}>
                  <span>{label}</span>
                  <input
                    value={String(design[key] ?? "")}
                    onChange={(e) => setDesignField(key, e.target.value as any)}
                  />
                </label>
              ))}
            </div>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Görünüş</h3>
            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span>Əsas rəng (logo)</span>
                <input
                  type="color"
                  value={design.primaryColor}
                  onChange={(e) => setDesignField("primaryColor", e.target.value)}
                />
              </label>
              <label className={styles.field}>
                <span>Vurğu rəngi (qırmızı yazılar)</span>
                <input
                  type="color"
                  value={design.accentColor}
                  onChange={(e) => setDesignField("accentColor", e.target.value)}
                />
              </label>
              <label className={styles.field}>
                <span>Mətn rəngi</span>
                <input
                  type="color"
                  value={design.textColor}
                  onChange={(e) => setDesignField("textColor", e.target.value)}
                />
              </label>
              <label className={styles.field}>
                <span>Sərhəd rəngi</span>
                <input
                  type="color"
                  value={design.borderColor}
                  onChange={(e) => setDesignField("borderColor", e.target.value)}
                />
              </label>
              <label className={styles.field}>
                <span>Şrift (Request / Invoice)</span>
                <select
                  value={design.fontFamily}
                  onChange={(e) => setDesignField("fontFamily", e.target.value)}
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span>Şrift (Aktlar)</span>
                <select
                  value={design.actFontFamily}
                  onChange={(e) => setDesignField("actFontFamily", e.target.value)}
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span>Şrift ölçüsü</span>
                <input
                  value={design.fontSize}
                  onChange={(e) => setDesignField("fontSize", e.target.value)}
                  placeholder="10.5pt"
                />
              </label>
              <label className={styles.field}>
                <span>Səhifə margin</span>
                <input
                  value={design.pageMargin}
                  onChange={(e) => setDesignField("pageMargin", e.target.value)}
                  placeholder="12mm 14mm"
                />
              </label>
            </div>

            <div className={styles.checks}>
              <label>
                <input
                  type="checkbox"
                  checked={design.showLogo}
                  onChange={(e) => setDesignField("showLogo", e.target.checked)}
                />
                Logo göstər
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={design.showStamp}
                  onChange={(e) => setDesignField("showStamp", e.target.checked)}
                />
                Möhür göstər
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={design.showFieldNumbers}
                  onChange={(e) => setDesignField("showFieldNumbers", e.target.checked)}
                />
                Sahə nömrələrini göstər (1)(2)…
              </label>
            </div>

            <div className={styles.uploadRow}>
              <div>
                <div className={styles.uploadLabel}>Logo</div>
                {design.logoUrl ? (
                  <img
                    src={resolveUploadUrl(design.logoUrl)}
                    alt="logo"
                    className={styles.previewImg}
                  />
                ) : (
                  <div className={styles.previewEmpty}>Avtomatik SVG logo</div>
                )}
                <label className={styles.uploadBtn}>
                  <FiUpload /> Yüklə
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => void handleUpload("logo", e.target.files?.[0])}
                  />
                </label>
              </div>
              <div>
                <div className={styles.uploadLabel}>Möhür / stamp</div>
                {design.stampUrl ? (
                  <img
                    src={resolveUploadUrl(design.stampUrl)}
                    alt="stamp"
                    className={styles.previewImg}
                  />
                ) : (
                  <div className={styles.previewEmpty}>Yoxdur</div>
                )}
                <label className={styles.uploadBtn}>
                  <FiUpload /> Yüklə
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => void handleUpload("stamp", e.target.files?.[0])}
                  />
                </label>
              </div>
            </div>

            <button
              type="button"
              className={`${actionStyles.buttonBase} ${actionStyles.buttonPrimary}`}
              onClick={() => void handleSaveBrand()}
              disabled={saving}
              style={{ marginTop: 16 }}
            >
              <FiSave /> {saving ? "Saxlanılır..." : "Brendi saxla"}
            </button>
          </div>
        </div>
      ) : editing && selected ? (
        <div className={styles.editorPaneFull}>
          <div className={styles.editorHeader}>
            <div>
              <input
                className={styles.nameInput}
                value={selected.name}
                onChange={(e) =>
                  setSelected({ ...selected, name: e.target.value })
                }
              />
              <div className={styles.sideMeta}>{selected.description}</div>
            </div>
            <div className={styles.editorActions}>
              <button
                type="button"
                className={`${actionStyles.buttonBase} ${actionStyles.buttonSecondary}`}
                onClick={() => void handlePreview()}
                disabled={previewing}
              >
                <FiEye /> {previewing ? "..." : "Preview"}
              </button>
              {selected.isSystem ? (
                <button
                  type="button"
                  className={`${actionStyles.buttonBase} ${actionStyles.buttonSecondary}`}
                  onClick={() => void handleReset()}
                >
                  <FiRefreshCw /> Standarta qayıt
                </button>
              ) : null}
              <button
                type="button"
                className={`${actionStyles.buttonBase} ${actionStyles.buttonPrimary}`}
                onClick={() => void handleSaveTemplate()}
                disabled={saving}
              >
                <FiSave /> Saxla
              </button>
              <button
                type="button"
                className={`${actionStyles.buttonBase} ${actionStyles.buttonSecondary}`}
                onClick={closeEditor}
                title="Siyahıya qayıt"
              >
                <FiX /> Geri
              </button>
            </div>
          </div>

          <p className={styles.hint}>
            Soldan sahə seçib sənədə əlavə edin. Bitəndə Saxla, sonra Geri ilə
            siyahıya qayıdın.
          </p>

          <DocumentVisualEditor
            key={selected.id}
            value={htmlTemplate}
            onChange={setHtmlTemplate}
            placeholders={placeholders}
            logoUrl={
              design.logoUrl ? resolveUploadUrl(design.logoUrl) : undefined
            }
          />

          <div className={styles.codeToggleRow}>
            <button
              type="button"
              className={styles.codeToggle}
              onClick={() => setShowCode((v) => !v)}
            >
              {showCode ? "Kod rejimini gizlət" : "Texniki kod rejimi (istəyə görə)"}
            </button>
          </div>

          {showCode ? (
            <div className={styles.editorGrid}>
              <label className={styles.field}>
                <span>HTML</span>
                <textarea
                  className={styles.codeArea}
                  value={htmlTemplate}
                  onChange={(e) => setHtmlTemplate(e.target.value)}
                  spellCheck={false}
                />
              </label>
              <label className={styles.field}>
                <span>Əlavə CSS</span>
                <textarea
                  className={styles.codeArea}
                  value={cssStyles}
                  onChange={(e) => setCssStyles(e.target.value)}
                  spellCheck={false}
                />
              </label>
            </div>
          ) : null}
        </div>
      ) : (
        <div className={styles.tableOnly}>
          <div className={styles.tablePane}>
            <DocumentTemplatesTable
              rows={templates}
              selectedId={null}
              onEdit={selectTemplate}
              onDelete={(tpl) => setDeleteId(tpl.id)}
            />
          </div>
        </div>
      )}

      {previewOpen ? (
        <div
          className={styles.modalOverlay}
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className={styles.previewModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.previewModalHeader}>
              <strong>Preview — {selected?.name}</strong>
              <button
                type="button"
                className={styles.previewClose}
                onClick={() => setPreviewOpen(false)}
              >
                <FiX /> Bağla
              </button>
            </div>
            <iframe
              title="document-preview"
              className={styles.previewModalFrame}
              srcDoc={previewHtml}
            />
          </div>
        </div>
      ) : null}

      {createOpen ? (
        <div className={styles.modalOverlay} onClick={() => setCreateOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>Yeni sənəd şablonu</h3>
            <label className={styles.field}>
              <span>Ad</span>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} />
            </label>
            <label className={styles.field}>
              <span>Scope</span>
              <select value={newScope} onChange={(e) => setNewScope(e.target.value)}>
                <option value="query">Sorğu</option>
                <option value="order">Sifariş</option>
                <option value="both">Hər ikisi</option>
              </select>
            </label>
            <div className={styles.modalActions}>
              <button type="button" onClick={() => setCreateOpen(false)}>
                Ləğv
              </button>
              <button type="button" className={styles.primaryBtn} onClick={() => void handleCreate()}>
                Yarat
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmModal
        isOpen={deleteId != null}
        title="Şablonu sil"
        message="Bu özəl şablonu silmək istəyirsiniz?"
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};
