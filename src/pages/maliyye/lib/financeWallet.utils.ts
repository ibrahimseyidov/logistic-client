import {
  convertToAznWithRates,
  FALLBACK_AZN_RATES,
} from "../../../common/utils/currency.utils";

/** Sifariş uçotu — kasa/bank balansına toxunmur */
export const ORDER_BOOK_METHOD = "Sifariş";

export type CashWallet = "Kasa" | "Bank";
export type WalletTab = CashWallet | "Umumi";

export function normalizeWallet(method?: string | null): CashWallet | null {
  const raw = String(method || "").trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (lower === "sifariş" || lower === "sifaris" || lower === "order") {
    return null;
  }
  if (
    lower === "kasa" ||
    lower === "nağd" ||
    lower === "nagd" ||
    lower === "cash"
  ) {
    return "Kasa";
  }
  if (lower === "bank" || lower === "kart" || lower === "card") {
    return "Bank";
  }
  return null;
}

/** Sifarişdə yazılan uçot sətirləri (kasa/bank deyil) */
export function isOrderBookkeepingTx(tx: any): boolean {
  if (!tx) return false;
  const method = String(tx.paymentMethod || "").trim().toLowerCase();
  if (method === "sifariş" || method === "sifaris" || method === "order") {
    return true;
  }
  if (String(tx.category || "").toUpperCase() === "ORDER_BOOK") return true;
  if (String(tx.source || "").toUpperCase() === "ORDER") return true;

  const name = String(tx.name || "").trim();
  if (/^Reys R-\d+$/i.test(name) || name === "Başlanğıc tarif") return true;

  // Köhnə sifariş sətirləri: orderId var, real məbləğ yox, tarif/mesarif var
  const amount = Number(tx.amount) || 0;
  if (
    tx.orderId &&
    !(amount > 0) &&
    (tx.tarifPrice || tx.mesarifPrice || tx.edvliTarifPrice || tx.edvliMesarifPrice)
  ) {
    return true;
  }
  return false;
}

/** Kasa/Bank real pul hərəkəti */
export function isCashMovementTx(tx: any): boolean {
  return !isOrderBookkeepingTx(tx);
}

export function txMatchesWallet(tx: any, wallet: CashWallet): boolean {
  if (!isCashMovementTx(tx)) return false;
  const w = normalizeWallet(tx.paymentMethod);
  if (w) return w === wallet;
  // Köhnə əl ilə yazılmış, metodsuz → Bank sayılır
  return wallet === "Bank";
}

/** Kasa, Bank və ya hər ikisi (Ümumi) */
export function txMatchesWalletTab(tx: any, tab: WalletTab): boolean {
  if (!isCashMovementTx(tx)) return false;
  if (tab === "Umumi") return true;
  return txMatchesWallet(tx, tab);
}

export function resolveTxCashAzn(
  tx: any,
  rates?: Record<string, number> | null,
): number {
  const amount = Number(tx.amount);
  if (Number.isFinite(amount) && amount !== 0) {
    const curr = String(tx.currency || "AZN").toUpperCase();
    if (curr === "AZN") return Math.abs(amount);
    const azn = convertToAznWithRates(
      Math.abs(amount),
      curr,
      rates || FALLBACK_AZN_RATES,
    );
    return azn > 0 ? azn : 0;
  }
  const profit = Number.parseFloat(String(tx.profit || "").replace(",", "."));
  if (Number.isFinite(profit) && profit !== 0) return Math.abs(profit);
  return 0;
}

export function isIncomeTx(tx: any): boolean {
  if (tx.type === "INCOME") return true;
  if (tx.type === "EXPENSE") return false;
  const profit = Number.parseFloat(String(tx.profit || "").replace(",", "."));
  return Number.isFinite(profit) ? profit >= 0 : false;
}

/** Birbaşa xərc — müştəri/daşıyıcı/sifariş bağlı deyil */
export function isSimpleExpenseTx(tx: any): boolean {
  if (!tx || isIncomeTx(tx)) return false;
  if (tx.customerId != null && tx.customerId !== "") return false;
  if (tx.carrierId != null && tx.carrierId !== "") return false;
  if (tx.orderId != null && tx.orderId !== "") return false;
  if (tx.customer?.id != null) return false;
  if (tx.carrier?.id != null) return false;
  return true;
}

/** Parametrlərdən balans düzəlişi — real tərəfdaş adı ilə qarışmasın */
export const SYSTEM_PARTNER_MARKER = "__SYSTEM__";
export const SYSTEM_PARTNER_LABEL = "Sistem";

export function isSystemBalanceAdjustment(tx: any): boolean {
  if (!tx) return false;
  const partner = String(tx.partner || "").trim();
  if (partner === SYSTEM_PARTNER_MARKER) return true;
  // Köhnə qeydlər: partner "Sistem" + düzəliş kateqoriyası/adı
  const cat = String(tx.category || "");
  const name = String(tx.name || "");
  const isAdjustment =
    /kassa\s*düzəlişi/i.test(cat) ||
    /kassa\s*duzelisi/i.test(cat) ||
    /balans\s*düzəlişi/i.test(name) ||
    /balans\s*duzelisi/i.test(name);
  return isAdjustment;
}
