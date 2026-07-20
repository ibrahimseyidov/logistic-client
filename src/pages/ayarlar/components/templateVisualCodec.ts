import type { PlaceholderField } from "../../../common/actions/document.actions";

const FIELD_COLORS = [
  "#2563eb",
  "#16a34a",
  "#c41e3a",
  "#ca8a04",
  "#7c3aed",
  "#0891b2",
  "#db2777",
  "#ea580c",
];

export function fieldColor(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash + key.charCodeAt(i) * (i + 1)) % 997;
  return FIELD_COLORS[hash % FIELD_COLORS.length];
}

export function buildLabelMap(placeholders: PlaceholderField[]): Record<string, string> {
  const map: Record<string, string> = {
    queryNumber: "Sorğu nömrəsi",
    orderNumber: "Sifariş nömrəsi",
    documentDate: "Sənəd tarixi",
    invoiceDate: "Hesab tarixi",
    invoiceNumber: "Invoice №",
    customerName: "Müştəri",
    customerContact: "Əlaqədar şəxs",
    customerPhone: "Müştəri telefon",
    customerEmail: "Müştəri email",
    customerDirector: "Müştəri direktoru",
    managerName: "Menecer",
    managerPhone: "Menecer telefon",
    managerEmail: "Menecer email",
    carrierName: "Daşıyıcı",
    carrierDirector: "Daşıyıcı nümayəndəsi",
    companyName: "Şirkətimiz",
    companyLegalName: "Hüquqi ad",
    director: "Direktor",
    directorTitle: "Vəzifə",
    originLabel: "Yükləmə yeri",
    destinationLabel: "Boşaltma yeri",
    loadCountry: "Yükləmə ölkəsi",
    loadCity: "Yükləmə şəhəri",
    unloadCountry: "Boşaltma ölkəsi",
    unloadCity: "Boşaltma şəhəri",
    loadAddress: "Yükləmə ünvanı",
    loadCompany: "Göndərən",
    unloadCompany: "Alan",
    cargoName: "Yük adı",
    incoterms: "Incoterms",
    cargoSpecs: "Yük spesifikasiyası",
    cargoComposition: "Yük tərkibi",
    additionalInfo: "Əlavə məlumat",
    cargoAdditionalInfo: "Yük qeydi",
    dimensions: "Ölçülər",
    quantity: "Miqdar",
    packagingType: "Qablaşdırma",
    volume: "Həcm",
    weight: "Çəki",
    ldm: "LDM / CW",
    chargeableWeight: "Chargeable weight",
    transportType: "Nəqliyyat tipi",
    vehicleNumber: "Nəqliyyat №",
    salePrice: "Satış qiyməti",
    saleCurrency: "Valyuta",
    priceNote: "Qiymət qeydi",
    invoiceAmount: "Hesab məbləği",
    invoiceAmountAzn: "Məbləğ (AZN)",
    invoiceAmountWordsEn: "Məbləğ yazı ilə (EN)",
    invoiceAmountWordsAz: "Məbləğ yazı ilə (AZ)",
    carrierInvoiceNumber: "Daşıyıcı INV №",
    carrierInvoiceAmount: "Daşıyıcı məbləği",
    carrierInvoiceCurrency: "Daşıyıcı valyuta",
    carrierInvoiceWordsEn: "Daşıyıcı məbləğ (EN)",
    carrierInvoiceWordsAz: "Daşıyıcı məbləğ (AZ)",
    contractNumber: "Müqavilə №",
    contractDate: "Müqavilə tarixi",
    phone: "Telefon",
    email: "Email",
    website: "Vebsayt",
    address: "Ünvan",
    shortAddress: "Qısa ünvan",
  };
  for (const p of placeholders) {
    map[p.key] = p.label;
  }
  return map;
}

/** Template HTML (Handlebars) → visual editor HTML (chips, no code). */
export function templateToVisualHtml(
  html: string,
  placeholders: PlaceholderField[],
  logoDataUrl?: string,
): string {
  if (!html) return "<p></p>";
  const labels = buildLabelMap(placeholders);
  let out = html;

  // Drop handlebars logic tags but keep inner content
  out = out.replace(/\{\{else\}\}/gi, "");
  out = out.replace(/\{\{#(if|unless)\s+[^}]+\}\}/g, "");
  out = out.replace(/\{\{\/(if|unless)\}\}/g, "");

  // Replace logoHtml with visible image
  if (logoDataUrl) {
    out = out.replace(
      /\{\{\{logoHtml\}\}\}/g,
      `<img src="${logoDataUrl}" alt="Logo" class="doc-logo" style="max-height:64px;max-width:240px;" />`,
    );
  } else {
    out = out.replace(/\{\{\{logoHtml\}\}\}/g, `<div class="doc-logo-fallback" style="font-weight:800;color:#c41e3a;font-size:18px;">ZIYA FREIGHT</div>`);
  }

  // Triple and double mustache variables → colorful chips
  out = out.replace(/\{\{\{?(\w+)\}?\}\}/g, (_m, key: string) => {
    if (key === "logoHtml") return "";
    const label = labels[key] || key;
    const color = fieldColor(key);
    return `<span data-doc-field="${key}" data-label="${escapeAttr(label)}" class="doc-field-chip" style="background:${color}18;color:${color};border:1px solid ${color}55;border-radius:999px;padding:1px 8px;font-weight:700;font-size:12px;white-space:nowrap;">${escapeHtml(label)}</span>`;
  });

  return out;
}

/** Visual editor HTML → template HTML with {{placeholders}}. */
export function visualHtmlToTemplate(html: string): string {
  if (!html) return "";
  let out = html;

  // Chips → {{key}}
  out = out.replace(
    /<span[^>]*data-doc-field="([^"]+)"[^>]*>[\s\S]*?<\/span>/gi,
    (_m, key: string) => `{{${key}}}`,
  );

  // Logo img back to handlebars (PDF compile injects real logo)
  out = out.replace(
    /<img[^>]*(?:class="[^"]*doc-logo[^"]*"|alt="Logo")[^>]*\/?>/gi,
    "{{{logoHtml}}}",
  );
  out = out.replace(
    /<div[^>]*class="doc-logo-fallback"[^>]*>[\s\S]*?<\/div>/gi,
    "{{{logoHtml}}}",
  );

  return out;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s: string) {
  return escapeHtml(s).replace(/'/g, "&#39;");
}
