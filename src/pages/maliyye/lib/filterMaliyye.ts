import {
  SYSTEM_PARTNER_LABEL,
  isIncomeTx,
  isSimpleExpenseTx,
  isSystemBalanceAdjustment,
  normalizeWallet,
  resolveTxCashAzn,
  type CashWallet,
} from "./financeWallet.utils";

export type MaliyyeFilterState = {
  search: string;
  type: string;
  dateFrom: string;
  dateTo: string;
  category: string;
  partner: string;
  orderId: string;
  amountMin: string;
  amountMax: string;
  paymentMethod: string;
  createdBy: string;
};

export function emptyMaliyyeFilter(): MaliyyeFilterState {
  return {
    search: "",
    type: "",
    dateFrom: "",
    dateTo: "",
    category: "",
    partner: "",
    orderId: "",
    amountMin: "",
    amountMax: "",
    paymentMethod: "",
    createdBy: "",
  };
}

function parseTxDate(tx: any): Date | null {
  const raw = tx?.date || tx?.costDate || tx?.createdAt || tx?.updatedAt;
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function dayStart(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function dayEnd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999);
}

export function partnerLabel(tx: any): string {
  if (isSystemBalanceAdjustment(tx)) return SYSTEM_PARTNER_LABEL;
  return (
    tx?.customer?.name ||
    tx?.customer?.company ||
    tx?.carrier?.name ||
    tx?.carrier?.companyName ||
    tx?.partner ||
    ""
  );
}

/** Cədvəl / axtarış üçün sənəd tipi */
export function resolveDocType(tx: any): string {
  const cat = String(tx?.category || "").trim();
  if (cat) return cat;
  const name = String(tx?.name || "").trim();
  if (/balans\s*düzəlişi|balans\s*duzelisi/i.test(name)) {
    return isIncomeTx(tx)
      ? "Kassa düzəlişi — mədaxil"
      : "Kassa düzəlişi — məxaric";
  }
  if (isSimpleExpenseTx(tx)) return "Ümumi xərc";
  if (isIncomeTx(tx)) return "Gəlir";
  return "Xərc";
}

function formatSearchDate(tx: any): string {
  const d = parseTxDate(tx);
  if (!d) return "";
  return d.toLocaleDateString("az-AZ");
}

/** Bütün görünən + gizli sahələr üzrə axtarış haystack */
function buildSearchHaystack(
  tx: any,
  rates?: Record<string, number> | null,
): string {
  const azn = resolveTxCashAzn(tx, rates);
  const amount = Number(tx?.amount);
  const currency = String(tx?.currency || "AZN").toUpperCase();
  const income = isIncomeTx(tx);
  const wallet = normalizeWallet(tx?.paymentMethod) || "Bank";

  return [
    tx?.id,
    `#${tx?.id}`,
    income ? "gəlir" : "xərc",
    income ? "gelir" : "xerc",
    income ? "giriş" : "çıxış",
    income ? "giris" : "cixis",
    wallet,
    tx?.paymentMethod,
    tx?.name,
    tx?.category,
    resolveDocType(tx),
    partnerLabel(tx),
    tx?.orderId != null ? String(tx.orderId) : "",
    tx?.orderId != null ? `#${tx.orderId}` : "",
    tx?.order?.orderNumber,
    tx?.orderNumber,
    Number.isFinite(amount) ? String(amount) : "",
    Number.isFinite(amount) ? amount.toFixed(2) : "",
    currency,
    azn > 0 ? azn.toFixed(2) : "",
    azn > 0 ? String(Math.round(azn)) : "",
    azn > 0 ? `+${azn.toFixed(2)}` : "",
    azn > 0 ? `-${azn.toFixed(2)}` : "",
    `${azn.toFixed(2)} azn`,
    formatSearchDate(tx),
    tx?.createdByName,
    tx?.updatedByName,
    tx?.user,
    tx?.description,
    tx?.note,
    tx?.notes,
    tx?.comment,
    tx?.type,
  ]
    .filter((v) => v != null && String(v).trim() !== "")
    .join(" ")
    .toLowerCase();
}

export function applyMaliyyeFilters(
  txs: any[],
  filter: MaliyyeFilterState,
  rates?: Record<string, number> | null,
): any[] {
  const search = filter.search.trim().toLowerCase();
  const category = filter.category.trim().toLowerCase();
  const partner = filter.partner.trim().toLowerCase();
  const orderId = filter.orderId.trim().replace(/^#/, "");
  const createdBy = filter.createdBy.trim().toLowerCase();
  const amountMin = Number.parseFloat(
    String(filter.amountMin).replace(",", "."),
  );
  const amountMax = Number.parseFloat(
    String(filter.amountMax).replace(",", "."),
  );
  const hasMin = Number.isFinite(amountMin);
  const hasMax = Number.isFinite(amountMax);
  const walletFilter = filter.paymentMethod
    ? (normalizeWallet(filter.paymentMethod) as CashWallet | null)
    : null;

  // Çoxsözlü axtarış: hər söz haystack-də olmalıdır
  const searchTokens = search
    ? search.split(/\s+/).filter(Boolean)
    : [];

  return txs.filter((tx) => {
    if (filter.type === "INCOME" && !isIncomeTx(tx)) return false;
    if (filter.type === "EXPENSE" && isIncomeTx(tx)) return false;

    if (walletFilter) {
      const w = normalizeWallet(tx.paymentMethod);
      const effective: CashWallet = w || "Bank";
      if (effective !== walletFilter) return false;
    }

    if (filter.dateFrom || filter.dateTo) {
      const d = parseTxDate(tx);
      if (!d) return false;
      if (filter.dateFrom && d < dayStart(filter.dateFrom)) return false;
      if (filter.dateTo && d > dayEnd(filter.dateTo)) return false;
    }

    if (category) {
      const cat = String(tx.category || "").toLowerCase();
      const doc = resolveDocType(tx).toLowerCase();
      if (!cat.includes(category) && !doc.includes(category)) return false;
    }

    if (partner) {
      const p = partnerLabel(tx).toLowerCase();
      if (!p.includes(partner)) return false;
    }

    if (orderId) {
      const oid = String(tx.orderId ?? "");
      const onum = String(tx.order?.orderNumber || tx.orderNumber || "");
      if (!oid.includes(orderId) && !onum.includes(orderId)) return false;
    }

    if (createdBy) {
      const by = String(
        tx.createdByName || tx.user || tx.updatedByName || "",
      ).toLowerCase();
      if (!by.includes(createdBy)) return false;
    }

    if (hasMin || hasMax) {
      const azn = resolveTxCashAzn(tx, rates);
      if (hasMin && azn < amountMin) return false;
      if (hasMax && azn > amountMax) return false;
    }

    if (searchTokens.length > 0) {
      const hay = buildSearchHaystack(tx, rates);
      if (!searchTokens.every((token) => hay.includes(token))) return false;
    }

    return true;
  });
}

export function countActiveMaliyyeFilters(filter: MaliyyeFilterState): number {
  return Object.values(filter).filter((v) => String(v).trim() !== "").length;
}
