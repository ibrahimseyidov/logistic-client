import {
  parseStoredAzn,
  resolveFinanceExpenseAzn,
  resolveFinanceRevenueAzn,
} from "../../../common/utils/currency.utils";

function toNumber(value: unknown): number {
  const n = Number.parseFloat(String(value ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function parsePriceOffers(query: any): any[] {
  if (!query) return [];
  if (Array.isArray(query.priceOfferItems) && query.priceOfferItems.length > 0) {
    return query.priceOfferItems;
  }
  if (typeof query.priceOffersJson === "string" && query.priceOffersJson.trim()) {
    try {
      const parsed = JSON.parse(query.priceOffersJson);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function inferAznRate(financeTransactions: any[]): number {
  for (const tx of financeTransactions || []) {
    const price = toNumber(tx.tarifPrice || tx.edvliTarifPrice);
    const azn = parseStoredAzn(tx.tarifAzn) ?? parseStoredAzn(tx.edvliTarifAzn);
    if (price > 0 && azn != null && azn > 0) {
      return azn / price;
    }
  }
  return 1;
}

function collectCarrierNames(order: any, voyages: any[]): Set<string> {
  const names = new Set<string>();
  for (const v of voyages || []) {
    const carrier = String(v?.carrier || "").trim();
    if (carrier && carrier !== "—") names.add(carrier);
  }
  const tags = String(order?.tags || "");
  const tagMatch = tags.match(/Daşıyıcı:\s*(.+)/i);
  if (tagMatch?.[1]) names.add(tagMatch[1].trim());
  return names;
}

/**
 * When finance rows have no mesarif yet, fall back to the linked query's
 * price-offer total cost (alış + xərc) for the selected carrier(s).
 */
export function resolveOfferExpenseFallbackAzn(params: {
  order: any;
  voyages?: any[];
  financeTransactions?: any[];
}): number {
  const { order, voyages = [], financeTransactions = [] } = params;
  const already =
    (financeTransactions || []).reduce(
      (sum, tx) => sum + resolveFinanceExpenseAzn(tx),
      0,
    ) || 0;
  if (already > 0) return 0;

  const extraFromOrder = parseStoredAzn(
    String(order?.extraCosts || "").match(
      /\(([0-9][0-9.,]*)\s*AZN/i,
    )?.[1] ??
      (String(order?.extraCosts || "").match(
        /^([0-9][0-9.,]*)\s*AZN$/i,
      )?.[1] || null),
  );
  if (extraFromOrder != null && extraFromOrder > 0) return extraFromOrder;

  const offers = parsePriceOffers(order?.query);
  if (offers.length === 0) return 0;

  const carriers = collectCarrierNames(order, voyages);
  const matched = offers.filter((o) => {
    const name = String(o?.carrierName || "").trim();
    if (!name) return false;
    if (carriers.size === 0) return true;
    return carriers.has(name);
  });
  const useOffers = matched.length > 0 ? matched : [offers[0]];

  const rate = inferAznRate(financeTransactions);
  return useOffers.reduce((sum, offer) => {
    const purchase = toNumber(offer?.price);
    const expense = toNumber(offer?.expense);
    const total =
      toNumber(offer?.totalPrice) ||
      (purchase > 0 || expense > 0 ? purchase + expense : 0);
    if (!(total > 0)) return sum;
    const currency = String(offer?.currency || "AZN").toUpperCase();
    if (currency === "AZN") return sum + total;
    return sum + total * rate;
  }, 0);
}

/** Selected carrier offer for the order (by voyage/tag carrier, else first). */
export function resolveSelectedPriceOffer(params: {
  order: any;
  voyages?: any[];
}): any | null {
  const { order, voyages = [] } = params;
  const offers = parsePriceOffers(order?.query);
  if (offers.length === 0) return null;
  const carriers = collectCarrierNames(order, voyages);
  const matched = offers.filter((o) => {
    const name = String(o?.carrierName || "").trim();
    if (!name) return false;
    if (carriers.size === 0) return true;
    return carriers.has(name);
  });
  return (matched.length > 0 ? matched[0] : offers[0]) || null;
}

/**
 * Sidebar finance: revenue from satış qiyməti, costs from total qiymət.
 */
export function resolveOfferSalesTotalSummary(params: {
  order: any;
  voyages?: any[];
  financeTransactions?: any[];
}): {
  sales: number;
  total: number;
  purchase: number;
  expense: number;
  currency: string;
  salesAzn: number;
  totalAzn: number;
  purchaseAzn: number;
  expenseAzn: number;
  profitAzn: number;
  labelSales: string;
  labelTotal: string;
  labelPurchase: string;
  labelExpense: string;
} | null {
  const offer = resolveSelectedPriceOffer(params);
  if (!offer) return null;

  const sales = toNumber(offer.salesPrice);
  const purchase = toNumber(offer.price);
  const expense = toNumber(offer.expense);
  const total =
    toNumber(offer.totalPrice) ||
    (purchase > 0 || expense > 0 ? purchase + expense : 0);
  if (!(sales > 0) && !(total > 0)) return null;

  const currency = String(offer.currency || "AZN").trim() || "AZN";
  const rate = inferAznRate(params.financeTransactions || []);
  const toAzn = (amount: number) => {
    if (!(amount > 0)) return 0;
    if (currency.toUpperCase() === "AZN") return amount;
    return amount * (rate > 0 ? rate : 1);
  };
  const salesAzn = toAzn(sales);
  const totalAzn = toAzn(total);
  const formatLabel = (amount: number) => {
    if (!(amount > 0)) return "—";
    if (currency.toUpperCase() === "AZN") return `${amount} AZN`;
    const azn = toAzn(amount);
    return `${amount} ${currency} (${azn.toFixed(2)} AZN)`;
  };

  return {
    sales,
    total,
    purchase,
    expense,
    currency,
    salesAzn,
    totalAzn,
    purchaseAzn: toAzn(purchase),
    expenseAzn: toAzn(expense),
    profitAzn: salesAzn - totalAzn,
    labelSales: formatLabel(sales),
    labelTotal: formatLabel(total),
    labelPurchase: formatLabel(purchase),
    labelExpense: formatLabel(expense),
  };
}

export function hasFinanceRevenue(financeTransactions: any[]): boolean {
  return (financeTransactions || []).some(
    (tx) => resolveFinanceRevenueAzn(tx) > 0,
  );
}
