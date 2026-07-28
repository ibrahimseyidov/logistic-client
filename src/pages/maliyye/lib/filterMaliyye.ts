import {
  SYSTEM_PARTNER_LABEL,
  isIncomeTx,
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
  const raw = tx?.date || tx?.costDate;
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

function partnerLabel(tx: any): string {
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

export function applyMaliyyeFilters(
  txs: any[],
  filter: MaliyyeFilterState,
): any[] {
  const search = filter.search.trim().toLowerCase();
  const category = filter.category.trim().toLowerCase();
  const partner = filter.partner.trim().toLowerCase();
  const orderId = filter.orderId.trim().replace(/^#/, "");
  const createdBy = filter.createdBy.trim().toLowerCase();
  const amountMin = Number.parseFloat(String(filter.amountMin).replace(",", "."));
  const amountMax = Number.parseFloat(String(filter.amountMax).replace(",", "."));
  const hasMin = Number.isFinite(amountMin);
  const hasMax = Number.isFinite(amountMax);
  const walletFilter = filter.paymentMethod
    ? (normalizeWallet(filter.paymentMethod) as CashWallet | null)
    : null;

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
      if (!cat.includes(category)) return false;
    }

    if (partner) {
      const p = partnerLabel(tx).toLowerCase();
      if (!p.includes(partner)) return false;
    }

    if (orderId) {
      const oid = String(tx.orderId ?? "");
      if (!oid.includes(orderId)) return false;
    }

    if (createdBy) {
      const by = String(tx.createdByName || tx.user || "").toLowerCase();
      if (!by.includes(createdBy)) return false;
    }

    if (hasMin || hasMax) {
      const azn = resolveTxCashAzn(tx);
      if (hasMin && azn < amountMin) return false;
      if (hasMax && azn > amountMax) return false;
    }

    if (search) {
      const hay = [
        tx.id,
        tx.name,
        tx.category,
        partnerLabel(tx),
        tx.orderId ? `#${tx.orderId}` : "",
        tx.paymentMethod,
        tx.createdByName,
        tx.user,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(search)) return false;
    }

    return true;
  });
}

export function countActiveMaliyyeFilters(filter: MaliyyeFilterState): number {
  return Object.values(filter).filter((v) => String(v).trim() !== "").length;
}
