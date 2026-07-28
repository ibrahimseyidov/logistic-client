import { statusLabelAz } from "../../../common/components/StatusBadge";

export const ACTION_LABEL: Record<string, string> = {
  CREATE: "Yaratma",
  UPDATE: "Yeniləmə",
  DELETE: "Silmə",
  POST: "Yaratma",
  PUT: "Yeniləmə",
  PATCH: "Yeniləmə",
};

export type ActionTone = "create" | "update" | "delete" | "default";

export function actionTone(action: string): ActionTone {
  const a = String(action || "").toUpperCase();
  if (a === "CREATE" || a === "POST") return "create";
  if (a === "DELETE") return "delete";
  if (a === "UPDATE" || a === "PUT" || a === "PATCH") return "update";
  return "default";
}

export function actionLabelAz(action: string): string {
  const key = String(action || "").toUpperCase();
  return ACTION_LABEL[key] || ACTION_LABEL[action] || action || "—";
}

const ENTITY_LABEL: Record<string, string> = {
  finance: "Maliyyə",
  orders: "Sifariş",
  order: "Sifariş",
  query: "Sorğu",
  queries: "Sorğu",
  task: "Tapşırıq",
  tasks: "Tapşırıq",
  customer: "Müştəri",
  customers: "Müştəri",
  carrier: "Daşıyıcı",
  carriers: "Daşıyıcı",
  voyages: "Reys",
  voyage: "Reys",
  loads: "Yük",
  load: "Yük",
  invoices: "Hesab-faktura",
  invoice: "Hesab-faktura",
  user: "İstifadəçi",
  users: "İstifadəçi",
  documents: "Sənəd",
  document: "Sənəd",
  notifications: "Bildiriş",
  payrolls: "Əməkhaqqı",
  payroll: "Əməkhaqqı",
  lookup: "Parametr",
  company: "Şirkət",
  "contact-person": "Əlaqədar şəxs",
  system: "Sistem",
};

export function entityLabelAz(entityType?: string | null): string {
  if (!entityType) return "—";
  const key = String(entityType).trim().toLowerCase();
  return ENTITY_LABEL[key] || entityType;
}

export function entityDisplay(
  entityType?: string | null,
  entityId?: string | number | null,
): string {
  const label = entityLabelAz(entityType);
  if (label === "—") return "—";
  if (entityId != null && String(entityId).trim()) {
    return `${label} #${entityId}`;
  }
  return label;
}

/** Texniki / təkrarlanan sahələr — UI-da göstərilmir */
const HIDDEN_FIELDS = new Set([
  "password",
  "token",
  "accessToken",
  "refreshToken",
  "authorization",
  "secret",
  "apiKey",
  "apikey",
  "updatedAt",
  "createdAt",
  "path",
  "method",
]);

const FIELD_LABEL: Record<string, string> = {
  id: "ID",
  name: "Ad",
  title: "Başlıq",
  type: "Tip",
  status: "Status",
  amount: "Məbləğ",
  currency: "Valyuta",
  paymentMethod: "Ödəniş metodu",
  category: "Kateqoriya",
  partner: "Tərəfdaş",
  orderId: "Sifariş",
  customerId: "Müştəri ID",
  carrierId: "Daşıyıcı ID",
  customer: "Müştəri",
  carrier: "Daşıyıcı",
  company: "Şirkət",
  companyName: "Şirkət adı",
  costDate: "Xərc tarixi",
  date: "Tarix",
  user: "İstifadəçi",
  email: "E-poçt",
  role: "Rol",
  phone: "Telefon",
  description: "Təsvir",
  profit: "Qazanc",
  tarifPrice: "Tarif qiyməti",
  tarifCurrency: "Tarif valyutası",
  tarifAzn: "Tarif (AZN)",
  mesarifPrice: "Məsarif qiyməti",
  mesarifCurrency: "Məsarif valyutası",
  mesarifAzn: "Məsarif (AZN)",
  invoiceWritten: "Hesab yazılıb",
  invoiceReceived: "Hesab alınıb",
  createdByName: "Yaradan",
  updatedByName: "Redaktə edən",
  priceOffers: "Qiymət təklifləri",
  priceOffersJson: "Qiymət təklifləri",
  loadPlace: "Yükləmə yeri",
  unloadPlace: "Boşaltma yeri",
  loadDate: "Yükləmə tarixi",
  unloadDate: "Boşaltma tarixi",
  transportType: "Nəqliyyat növü",
  manager: "Menecer",
  number: "Nömrə",
  orderNumber: "Sifariş №",
  tripStatus: "Reys statusu",
  tripPrice: "Reys qiyməti",
  note: "Qeyd",
  comments: "Şərhlər",
  tags: "Teqlər",
  seller: "Satıcı",
  sender: "Göndərən",
  recipient: "Alan",
  confirmed: "Təsdiqlənib",
  archived: "Arxivdə",
  purpose: "Məqsəd",
  cargoInfo: "Yük məlumatı",
};

export function fieldLabelAz(field: string): string {
  if (!field) return "—";
  if (FIELD_LABEL[field]) return FIELD_LABEL[field];
  // camelCase → oxunaqlı
  const spaced = field
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

const STATUS_LIKE =
  /status|tripStatus|orderStatus|cargoStatus|kind/i;

function translateScalar(value: string, field?: string): string {
  const v = value.trim();
  if (!v) return "—";

  if (field && STATUS_LIKE.test(field)) {
    return statusLabelAz(v);
  }

  const lower = v.toLowerCase();
  if (
    lower === "pending" ||
    lower === "approved" ||
    lower === "cancelled" ||
    lower === "canceled" ||
    lower === "completed" ||
    lower === "planned" ||
    lower === "progress" ||
    lower === "in_progress"
  ) {
    return statusLabelAz(v);
  }

  if (lower === "true" || lower === "yes") return "Bəli";
  if (lower === "false" || lower === "no") return "Xeyr";

  return v;
}

function formatPriceOffers(raw: unknown): string {
  let list: any[] = [];
  if (typeof raw === "string") {
    const text = raw.trim();
    if (!text) return "—";
    // "adfsadfs: 500 EUR" kimi sadə mətn
    if (!text.startsWith("[") && !text.startsWith("{")) return text;
    try {
      const parsed = JSON.parse(text);
      list = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return text.length > 120 ? `${text.slice(0, 120)}…` : text;
    }
  } else if (Array.isArray(raw)) {
    list = raw;
  } else if (raw && typeof raw === "object") {
    list = [raw];
  } else {
    return "—";
  }

  const lines = list
    .map((o) => {
      if (!o || typeof o !== "object") return null;
      const name = String(o.carrierName || o.carrier || o.name || "").trim();
      const price = o.price ?? o.salesPrice ?? o.totalPrice;
      const currency = String(o.currency || "AZN").trim();
      if (!name && price == null) return null;
      if (price == null || price === "") return name || null;
      return `${name || "Təklif"}: ${price} ${currency}`.trim();
    })
    .filter(Boolean) as string[];

  return lines.length ? lines.join(" · ") : "—";
}

export function formatLogValue(value: unknown, field?: string): string {
  if (value === null || value === undefined || value === "") return "—";

  if (field === "priceOffers" || field === "priceOffersJson") {
    return formatPriceOffers(value);
  }

  if (typeof value === "boolean") return value ? "Bəli" : "Xeyr";
  if (typeof value === "number") return String(value);

  if (typeof value === "string") {
    const trimmed = value.trim();
    // JSON string kimi gələn mürəkkəb sahələr
    if (
      (trimmed.startsWith("{") || trimmed.startsWith("[")) &&
      field &&
      /offer|json|payload/i.test(field)
    ) {
      try {
        const parsed = JSON.parse(trimmed);
        if (field.toLowerCase().includes("offer")) {
          return formatPriceOffers(parsed);
        }
        return formatLogValue(parsed, field);
      } catch {
        // fall through
      }
    }
    return translateScalar(trimmed, field);
  }

  if (Array.isArray(value)) {
    if (field && /offer/i.test(field)) return formatPriceOffers(value);
    if (value.every((x) => typeof x !== "object" || x === null)) {
      return value.map((x) => formatLogValue(x, field)).join(", ");
    }
    try {
      // Qısa oxunaqlı siyahı
      return value
        .slice(0, 8)
        .map((item, i) => {
          if (item && typeof item === "object") {
            const o = item as Record<string, unknown>;
            const label =
              o.name || o.title || o.carrierName || o.number || `#${i + 1}`;
            return String(label);
          }
          return formatLogValue(item);
        })
        .join(" · ");
    } catch {
      return `${value.length} element`;
    }
  }

  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    if (o.carrierName || o.price != null) return formatPriceOffers(value);
    const bits = Object.entries(o)
      .filter(([k]) => !HIDDEN_FIELDS.has(k))
      .slice(0, 6)
      .map(([k, v]) => `${fieldLabelAz(k)}: ${formatLogValue(v, k)}`);
    return bits.length ? bits.join(" · ") : "—";
  }

  return String(value);
}

export function shouldShowField(field: string, data?: Record<string, unknown>): boolean {
  if (!field || HIDDEN_FIELDS.has(field)) return false;
  // priceOffersJson — yalnız oxunaqlı priceOffers yoxdursa göstər
  if (field === "priceOffersJson") {
    if (data && data.priceOffers != null && String(data.priceOffers).trim()) {
      return false;
    }
  }
  return true;
}

export function filterLogObject(
  data: unknown,
): Record<string, unknown> | null {
  if (data == null) return null;
  if (typeof data !== "object" || Array.isArray(data)) return null;
  const src = data as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(src)) {
    if (!shouldShowField(k, src)) continue;
    if (v === undefined) continue;
    out[k] = v;
  }
  return Object.keys(out).length ? out : null;
}

const TECHNICAL_NOTE_RE =
  /göndərilən sahələr|sorğu gövdəsi|əvvəlki\/sonrakı|xidmət loqunda|PUT\s*\/api|PATCH\s*\/api|DELETE\s*\/api|POST\s*\/api/i;

export function cleanNote(note?: string | null): string | null {
  if (!note) return null;
  const t = String(note).trim();
  if (!t) return null;
  if (TECHNICAL_NOTE_RE.test(t)) {
    if (/yarad/i.test(t)) return "Yeni qeyd yaradıldı";
    if (/sil/i.test(t)) return "Qeyd silindi";
    if (/yenil|dəyiş/i.test(t)) return "Məlumat yeniləndi";
    return null;
  }
  // API path sətirlərini çıxar
  return t
    .replace(/\b(PUT|POST|PATCH|DELETE)\s+\/api\/[^\s.]+/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim() || null;
}

export function cleanSummary(
  summary?: string | null,
  entityType?: string | null,
  entityId?: string | number | null,
  action?: string | null,
): string {
  let text = String(summary || "").trim();
  if (!text) {
    const ent = entityDisplay(entityType, entityId);
    const act = actionLabelAz(action || "");
    if (ent !== "—" && act !== "—") return `${ent} — ${act.toLowerCase()}`;
    return ent !== "—" ? ent : "—";
  }

  // Texniki API hissələrini sil
  text = text
    .replace(/\b(PUT|POST|PATCH|DELETE)\s+\/api\/[^\s.]+/gi, "")
    .replace(/Yeniləmə sorğusunda göndərilən sahələr[^.]*\.?/gi, "")
    .replace(/\(əvvəlki\/sonrakı[^)]*\)/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+\./g, ".")
    .trim();

  // İngiliscə entity adlarını əvəz et
  text = text.replace(
    /\b(query|order|orders|finance|carrier|customer|invoice|invoices|voyage|voyages|task|user|load|loads)\b/gi,
    (m) => entityLabelAz(m.toLowerCase()),
  );

  // status dəyərləri
  text = text.replace(
    /\b(approved|pending|cancelled|canceled|completed|planned|progress)\b/gi,
    (m) => statusLabelAz(m),
  );

  return text || entityDisplay(entityType, entityId);
}

export function humanizePreview(
  preview?: string | null,
  changes?: Array<{ field: string; from: unknown; to: unknown }>,
  payload?: unknown,
): string {
  if (changes?.length) {
    const parts = changes.slice(0, 3).map((c) => {
      const label = fieldLabelAz(c.field);
      return `${label}: ${formatLogValue(c.from, c.field)} → ${formatLogValue(c.to, c.field)}`;
    });
    const extra =
      changes.length > 3 ? ` (+${changes.length - 3})` : "";
    return parts.join(" · ") + extra;
  }

  if (preview) {
    let p = String(preview).trim();
    // "Sahələr: priceOffersJson, status" → təmizlə
    p = p.replace(/^Sahələr:\s*/i, "");
    if (/^\/api\//i.test(p) || /^(PUT|POST|PATCH|DELETE)\s+\//i.test(p)) {
      return "Detallar mövcuddur";
    }
    const keys = p.split(/,\s*/).filter(Boolean);
    if (keys.length && keys.every((k) => /^[a-zA-Z0-9_]+$/.test(k))) {
      const labels = keys
        .filter((k) => shouldShowField(k))
        .map((k) => fieldLabelAz(k));
      if (!labels.length) return "Məlumat yeniləndi";
      return `Sahələr: ${labels.join(", ")}`;
    }
    p = p
      .replace(/\b(approved|pending|cancelled|canceled|completed)\b/gi, (m) =>
        statusLabelAz(m),
      )
      .replace(/\bpriceOffersJson\b/gi, "Qiymət təklifləri")
      .replace(/\bpriceOffers\b/gi, "Qiymət təklifləri")
      .replace(/\bstatus\b/gi, "Status");
    return p.length > 100 ? `${p.slice(0, 100)}…` : p;
  }

  const filtered = filterLogObject(payload);
  if (filtered) {
    const keys = Object.keys(filtered).slice(0, 5).map(fieldLabelAz);
    return keys.length ? `Sahələr: ${keys.join(", ")}` : "—";
  }

  return "—";
}
