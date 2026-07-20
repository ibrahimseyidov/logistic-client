"use client";

import { useEffect, useMemo, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import Image from "@tiptap/extension-image";
import type { PlaceholderField } from "../../../common/actions/document.actions";
import { DocField } from "./docFieldExtension";
import {
  buildLabelMap,
  fieldColor,
  templateToVisualHtml,
  visualHtmlToTemplate,
} from "./templateVisualCodec";
import styles from "./DocumentVisualEditor.module.css";

type Props = {
  /** Raw Handlebars template HTML from API */
  value: string;
  /** Emits raw Handlebars template HTML for API */
  onChange: (html: string) => void;
  placeholders: PlaceholderField[];
  logoUrl?: string;
};

const FONTS = [
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Calibri", value: "Calibri, Candara, sans-serif" },
  { label: "Segoe UI", value: "'Segoe UI', Tahoma, sans-serif" },
];

const COLORS = [
  "#111111",
  "#c41e3a",
  "#16a34a",
  "#2563eb",
  "#ca8a04",
  "#7c3aed",
  "#64748b",
  "#ffffff",
];

const FIELD_GROUPS: Array<{ title: string; keys: string[] }> = [
  {
    title: "Nömrə / Tarix",
    keys: [
      "queryNumber",
      "orderNumber",
      "documentDate",
      "invoiceDate",
      "invoiceNumber",
      "contractNumber",
      "contractDate",
    ],
  },
  {
    title: "Müştəri",
    keys: [
      "customerName",
      "customerContact",
      "customerPhone",
      "customerEmail",
      "customerDirector",
    ],
  },
  {
    title: "Marşrut / Yükləmə",
    keys: [
      "originLabel",
      "destinationLabel",
      "loadCountry",
      "loadCity",
      "unloadCountry",
      "unloadCity",
      "loadAddress",
      "loadCompany",
      "unloadCompany",
    ],
  },
  {
    title: "Yük",
    keys: [
      "cargoName",
      "incoterms",
      "cargoSpecs",
      "cargoComposition",
      "additionalInfo",
      "cargoAdditionalInfo",
      "dimensions",
      "quantity",
      "packagingType",
      "volume",
      "weight",
      "ldm",
      "chargeableWeight",
      "transportType",
      "vehicleNumber",
    ],
  },
  {
    title: "Maliyyə",
    keys: [
      "salePrice",
      "saleCurrency",
      "priceNote",
      "invoiceAmount",
      "invoiceAmountAzn",
      "invoiceAmountWordsEn",
      "invoiceAmountWordsAz",
    ],
  },
  {
    title: "Daşıyıcı",
    keys: [
      "carrierName",
      "carrierDirector",
      "carrierInvoiceNumber",
      "carrierInvoiceAmount",
      "carrierInvoiceCurrency",
      "carrierInvoiceWordsEn",
      "carrierInvoiceWordsAz",
    ],
  },
  {
    title: "Şirkətimiz",
    keys: [
      "companyName",
      "companyLegalName",
      "director",
      "directorTitle",
      "managerName",
      "managerPhone",
      "managerEmail",
      "phone",
      "email",
      "website",
      "address",
      "shortAddress",
    ],
  },
];

const FALLBACK_LOGO =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="72" viewBox="0 0 240 72">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#c41e3a"/><stop offset="1" stop-color="#7f1d1d"/></linearGradient></defs>
      <path d="M22 52 L52 16 L82 52" fill="none" stroke="url(#g)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M52 16 L52 56" fill="none" stroke="url(#g)" stroke-width="5" stroke-linecap="round"/>
      <rect x="78" y="30" width="40" height="20" rx="3" fill="#c41e3a"/>
      <circle cx="88" cy="54" r="6" fill="#111"/><circle cx="110" cy="54" r="6" fill="#111"/>
      <text x="132" y="36" font-family="Arial Black,Arial,sans-serif" font-size="20" font-weight="800" fill="#111">ZIYA FREIGHT</text>
      <text x="132" y="52" font-family="Arial,sans-serif" font-size="9" letter-spacing="2" fill="#444">MORE THAN DELIVERY</text>
    </svg>`,
  );

export default function DocumentVisualEditor({
  value,
  onChange,
  placeholders,
  logoUrl,
}: Props) {
  const labels = useMemo(() => buildLabelMap(placeholders), [placeholders]);
  const logoSrc = logoUrl || FALLBACK_LOGO;
  const lastEmitted = useRef("");

  const groupedFields = useMemo(() => {
    const byKey = new Map(placeholders.map((p) => [p.key, p]));
    const used = new Set<string>();
    const groups = FIELD_GROUPS.map((g) => {
      const fields = g.keys
        .map((k) => byKey.get(k))
        .filter((p): p is PlaceholderField => Boolean(p));
      fields.forEach((f) => used.add(f.key));
      return { title: g.title, fields };
    }).filter((g) => g.fields.length > 0);

    const other = placeholders.filter((p) => !used.has(p.key));
    if (other.length) groups.push({ title: "Digər", fields: other });
    return groups;
  }, [placeholders]);

  const visualInitial = useMemo(
    () => templateToVisualHtml(value || "", placeholders, logoSrc),
    // only for first mount / template switch via key
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [value],
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextStyle,
      Color,
      FontFamily,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({
        placeholder: "Sənədi burada redaktə edin — kod yox, rəngli sahələr…",
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Image.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            class: {
              default: null,
              parseHTML: (element: HTMLElement) => element.getAttribute("class"),
              renderHTML: (attributes: { class?: string | null }) =>
                attributes.class ? { class: attributes.class } : {},
            },
          };
        },
      }).configure({ inline: true, allowBase64: true }),
      DocField,
    ],
    content: visualInitial || "<p></p>",
    onUpdate: ({ editor: ed }) => {
      const templateHtml = visualHtmlToTemplate(ed.getHTML());
      lastEmitted.current = templateHtml;
      onChange(templateHtml);
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (value === lastEmitted.current) return;
    const visual = templateToVisualHtml(value || "", placeholders, logoSrc);
    editor.commands.setContent(visual, { emitUpdate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) return null;

  const insertField = (key: string) => {
    const label = labels[key] || key;
    editor
      .chain()
      .focus()
      .insertDocField({ key, label })
      .insertContent(" ")
      .run();
  };

  const insertLogo = () => {
    editor
      .chain()
      .focus()
      .insertContent(
        `<img src="${logoSrc}" alt="Logo" class="doc-logo" style="max-height:64px;max-width:240px;" />`,
      )
      .run();
  };

  const btn = (active: boolean) =>
    `${styles.toolBtn} ${active ? styles.toolBtnActive : ""}`;

  return (
    <div className={styles.root}>
      <div className={styles.logoBanner}>
        <img src={logoSrc} alt="Logo" className={styles.logoBannerImg} />
        <div className={styles.logoBannerText}>
          <strong>Logo sənəddə belə görünəcək</strong>
          <span>Brend ayarlarından dəyişə bilərsiniz. Soldakı rəngli sahələr avtomatik məlumatdır.</span>
        </div>
        <button type="button" className={styles.toolBtn} onClick={insertLogo}>
          Logonu sənədə əlavə et
        </button>
      </div>

      <div className={styles.ribbon}>
        <div className={styles.ribbonGroup}>
          <span className={styles.ribbonLabel}>Şrift</span>
          <select
            className={styles.select}
            defaultValue=""
            onChange={(e) => {
              if (!e.target.value) return;
              editor.chain().focus().setFontFamily(e.target.value).run();
            }}
          >
            <option value="">Şrift seç</option>
            {FONTS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.ribbonGroup}>
          <span className={styles.ribbonLabel}>Format</span>
          <button type="button" className={btn(editor.isActive("bold"))} onClick={() => editor.chain().focus().toggleBold().run()}>B</button>
          <button type="button" className={btn(editor.isActive("italic"))} onClick={() => editor.chain().focus().toggleItalic().run()}>I</button>
          <button type="button" className={btn(editor.isActive("underline"))} onClick={() => editor.chain().focus().toggleUnderline().run()}>U</button>
        </div>

        <div className={styles.ribbonGroup}>
          <span className={styles.ribbonLabel}>Rəng</span>
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={styles.colorSwatch}
              style={{ background: c, borderColor: c === "#ffffff" ? "#cbd5e1" : c }}
              onClick={() => editor.chain().focus().setColor(c).run()}
            />
          ))}
        </div>

        <div className={styles.ribbonGroup}>
          <span className={styles.ribbonLabel}>Hizalama</span>
          <button type="button" className={btn(editor.isActive({ textAlign: "left" }))} onClick={() => editor.chain().focus().setTextAlign("left").run()}>⬅</button>
          <button type="button" className={btn(editor.isActive({ textAlign: "center" }))} onClick={() => editor.chain().focus().setTextAlign("center").run()}>↔</button>
          <button type="button" className={btn(editor.isActive({ textAlign: "right" }))} onClick={() => editor.chain().focus().setTextAlign("right").run()}>➡</button>
        </div>

        <div className={styles.ribbonGroup}>
          <span className={styles.ribbonLabel}>Cədvəl</span>
          <button type="button" className={styles.toolBtn} onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>+ Cədvəl</button>
          <button type="button" className={styles.toolBtn} onClick={() => editor.chain().focus().addRowAfter().run()}>+ Sətir</button>
          <button type="button" className={styles.toolBtn} onClick={() => editor.chain().focus().addColumnAfter().run()}>+ Sütun</button>
        </div>
      </div>

      <div className={styles.workspace}>
        <aside className={styles.fieldSidebar}>
          <span className={styles.fieldBarTitle}>
            Məlumat sahələri — kliklə əlavə et
          </span>
          <div className={styles.fieldGroups}>
            {groupedFields.map((group) => (
              <div key={group.title} className={styles.fieldGroup}>
                <div className={styles.fieldGroupTitle}>{group.title}</div>
                <div className={styles.fieldChips}>
                  {group.fields.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      className={styles.fieldChip}
                      style={{
                        borderColor: `${fieldColor(p.key)}88`,
                        color: fieldColor(p.key),
                      }}
                      onClick={() => insertField(p.key)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <div className={styles.sheet}>
          <EditorContent editor={editor} className={styles.editor} />
        </div>
      </div>
    </div>
  );
}
