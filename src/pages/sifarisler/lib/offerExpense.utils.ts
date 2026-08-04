import {
  convertToAznWithRates,
  getAznRate,
  parseStoredAzn,
  resolveFinanceExpenseAzn,
  resolveFinanceRevenueAzn,
  resolveVoyageExpenseAzn,
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

/**
 * Verilmiş valyuta üçün AZN məzənnəsi.
 * Prioritet: CBAR rates → tx/reys-dən öyrənilən (1:1 deyil) → fallback.
 */
function resolveAznRate(
  currency: string,
  rates?: Record<string, number> | null,
  financeTransactions: any[] = [],
  voyages: any[] = [],
  order?: any,
): number {
  const curr = (currency || "AZN").toUpperCase();
  if (curr === "AZN") return 1;

  // 1) CBAR / API rates
  const fromApi = rates?.[curr];
  if (typeof fromApi === "number" && fromApi > 0) return fromApi;

  // 2) Finance tx-dən öyrən (1:1 rədd et)
  for (const tx of financeTransactions || []) {
    const txCurr = String(
      tx.tarifCurrency || tx.mesarifCurrency || tx.edvliTarifCurrency || "",
    )
      .trim()
      .toUpperCase();
    if (txCurr && txCurr !== curr) continue;
    const price = toNumber(
      tx.tarifPrice || tx.edvliTarifPrice || tx.mesarifPrice,
    );
    const azn =
      parseStoredAzn(tx.tarifAzn) ??
      parseStoredAzn(tx.edvliTarifAzn) ??
      parseStoredAzn(tx.mesarifAzn);
    if (price > 0 && azn != null && azn > 0 && Math.abs(azn - price) > 0.001) {
      return azn / price;
    }
  }

  // 3) Reys qiymətindən
  for (const v of voyages || []) {
    const text = String(v?.price || v?.tripPrice || "");
    const m = text.match(
      /^([0-9]+(?:[.,][0-9]+)?)\s*([A-Za-z]{3}).*?\(([0-9]+(?:[.,][0-9]+)?)\s*AZN/i,
    );
    if (!m) continue;
    const amount = Number.parseFloat(m[1].replace(",", ".")) || 0;
    const vCurr = String(m[2] || "").toUpperCase();
    const azn = Number.parseFloat(m[3].replace(",", ".")) || 0;
    if (vCurr !== curr) continue;
    if (amount > 0 && azn > 0 && Math.abs(azn - amount) > 0.001) {
      return azn / amount;
    }
  }

  // 4) Sifariş fraxtından: "600 USD (1020.00 AZN)"
  const freightText = String(order?.freight || order?.freightWithVat || "");
  const fm = freightText.match(
    /([0-9]+(?:[.,][0-9]+)?)\s*([A-Za-z]{3}).*?\(([0-9]+(?:[.,][0-9]+)?)\s*AZN/i,
  );
  if (fm) {
    const amount = Number.parseFloat(fm[1].replace(",", ".")) || 0;
    const fCurr = String(fm[2] || "").toUpperCase();
    const azn = Number.parseFloat(fm[3].replace(",", ".")) || 0;
    if (
      fCurr === curr &&
      amount > 0 &&
      azn > 0 &&
      Math.abs(azn - amount) > 0.001
    ) {
      return azn / amount;
    }
  }

  // 5) Fallback (USD/EUR/TRY…) — heç vaxt 1:1
  return getAznRate(curr, null);
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
  currencyRates?: Record<string, number> | null;
}): number {
  const {
    order,
    voyages = [],
    financeTransactions = [],
    currencyRates,
  } = params;
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

  return useOffers.reduce((sum, offer) => {
    const purchase = toNumber(offer?.price);
    const expense = toNumber(offer?.expense);
    const total =
      toNumber(offer?.totalPrice) ||
      (purchase > 0 || expense > 0 ? purchase + expense : 0);
    if (!(total > 0)) return sum;
    const currency = String(offer?.currency || "AZN").toUpperCase();
    if (currency === "AZN") return sum + total;
    const rate = resolveAznRate(
      currency,
      currencyRates,
      financeTransactions,
      voyages,
      order,
    );
    return sum + (rate > 0 ? total * rate : 0);
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

/** Reys qiymətlərinin cəmi — Alış qiymətinin mənbəyi. */
export function resolveVoyagePurchaseSummary(params: {
  order?: any;
  voyages?: any[];
  financeTransactions?: any[];
  currencyRates?: Record<string, number> | null;
}): {
  purchase: number;
  purchaseAzn: number;
  currency: string;
} | null {
  const voyages = params.voyages || [];
  if (voyages.length === 0) return null;

  const byCurr: Record<string, number> = {};
  let purchaseAzn = 0;
  let hasAny = false;

  for (const v of voyages) {
    const text = String(v?.price || v?.tripPrice || "");
    const match = text.match(/^([0-9]+(?:[.,][0-9]+)?)\s*([A-Za-z]{3})/);
    let amount = match
      ? Number.parseFloat(match[1].replace(",", ".")) || 0
      : 0;
    let currency = match ? String(match[2] || "AZN").toUpperCase() : "AZN";
    let azn = resolveVoyageExpenseAzn(v);

    if (!(azn > 0) && amount > 0) {
      if (currency === "AZN") {
        azn = amount;
      } else {
        const rate = resolveAznRate(
          currency,
          params.currencyRates,
          params.financeTransactions || [],
          voyages,
          params.order,
        );
        azn = rate > 0 ? amount * rate : 0;
      }
    }

    if (!(amount > 0) && azn > 0) {
      amount = azn;
      currency = "AZN";
    }

    if (!(amount > 0) && !(azn > 0)) continue;
    hasAny = true;
    byCurr[currency] = (byCurr[currency] || 0) + (amount > 0 ? amount : azn);
    purchaseAzn += azn > 0 ? azn : amount;
  }

  if (!hasAny) return null;

  const currencies = Object.keys(byCurr);
  if (currencies.length === 1) {
    return {
      purchase: byCurr[currencies[0]],
      purchaseAzn,
      currency: currencies[0],
    };
  }

  return {
    purchase: purchaseAzn,
    purchaseAzn,
    currency: "AZN",
  };
}

/**
 * Sidebar / Maliyyə: satış təklifdən, alış reys cəmindən (varsa).
 */
export function resolveOfferSalesTotalSummary(params: {
  order: any;
  voyages?: any[];
  financeTransactions?: any[];
  currencyRates?: Record<string, number> | null;
}): {
  sales: number;
  total: number;
  purchase: number;
  expense: number;
  currency: string;
  purchaseCurrency: string;
  salesAzn: number;
  totalAzn: number;
  purchaseAzn: number;
  expenseAzn: number;
  profitAzn: number;
  labelSales: string;
  labelTotal: string;
  labelPurchase: string;
  labelExpense: string;
  carrierName: string;
  purchaseFromVoyages: boolean;
} | null {
  const offer = resolveSelectedPriceOffer(params);
  const voyagePurchase = resolveVoyagePurchaseSummary(params);
  if (!offer && !voyagePurchase) return null;

  const sales = toNumber(offer?.salesPrice);
  const expense = toNumber(offer?.expense);
  const offerPurchase = toNumber(offer?.price);
  const purchaseFromVoyages = Boolean(
    voyagePurchase && voyagePurchase.purchase > 0,
  );
  const purchase = purchaseFromVoyages
    ? voyagePurchase!.purchase
    : offerPurchase;
  const purchaseCurrency = purchaseFromVoyages
    ? voyagePurchase!.currency
    : String(offer?.currency || "AZN").trim() || "AZN";

  // Reys alışını üstün tutanda total = alış + xərc (köhnə offer.totalPrice istifadə olunmur)
  const total =
    purchase > 0 || expense > 0
      ? purchase + expense
      : toNumber(offer?.totalPrice);
  if (!(sales > 0) && !(total > 0) && !(purchase > 0)) return null;

  const currency = String(offer?.currency || purchaseCurrency || "AZN")
    .trim() || "AZN";
  const rate = resolveAznRate(
    currency,
    params.currencyRates,
    params.financeTransactions || [],
    params.voyages || [],
    params.order,
  );
  const purchaseRate = resolveAznRate(
    purchaseCurrency,
    params.currencyRates,
    params.financeTransactions || [],
    params.voyages || [],
    params.order,
  );
  const ratesMap = {
    ...(params.currencyRates || {}),
    [currency]: rate,
    [purchaseCurrency]: purchaseRate,
  };
  const toAzn = (amount: number, curr: string = currency) =>
    convertToAznWithRates(amount, curr, ratesMap);

  const salesAzn = toAzn(sales, currency);
  const purchaseAzn = purchaseFromVoyages
    ? voyagePurchase!.purchaseAzn
    : toAzn(purchase, purchaseCurrency);
  const expenseAzn = toAzn(expense, currency);
  const totalAzn = purchaseAzn + expenseAzn;

  const formatLabel = (amount: number, curr: string, azn: number) => {
    if (!(amount > 0)) return "—";
    if (curr.toUpperCase() === "AZN") return `${amount} AZN`;
    if (!(azn > 0)) return `${amount} ${curr}`;
    return `${amount} ${curr} (${azn.toFixed(2)} AZN)`;
  };

  const carrierFromVoyage = String(params.voyages?.[0]?.carrier || "").trim();

  return {
    sales,
    total,
    purchase,
    expense,
    currency,
    purchaseCurrency,
    salesAzn,
    totalAzn,
    purchaseAzn,
    expenseAzn,
    profitAzn: salesAzn - totalAzn,
    labelSales: formatLabel(sales, currency, salesAzn),
    labelTotal: formatLabel(
      total,
      purchaseCurrency === currency ? currency : purchaseCurrency,
      totalAzn,
    ),
    labelPurchase: formatLabel(purchase, purchaseCurrency, purchaseAzn),
    labelExpense: formatLabel(expense, currency, expenseAzn),
    carrierName:
      String(offer?.carrierName || "").trim() || carrierFromVoyage,
    purchaseFromVoyages,
  };
}

export type FinancePreviewRow = {
  id: string;
  name: string;
  partner: string;
  tarifPrice: string;
  tarifCurrency: string;
  tarifAzn: string;
  mesarifPrice: string;
  mesarifCurrency: string;
  mesarifAzn: string;
  profit: string;
  isPreview: true;
  costDate: string;
  user: string;
};

/**
 * Sorğu qiymət təklifindən yalnız görüntü (önbaxış) sətirləri —
 * real maliyyə əməliyyatı / borc yaratmır.
 */
export function buildFinancePreviewRows(params: {
  order: any;
  voyages?: any[];
  financeTransactions?: any[];
  customerName?: string;
  currencyRates?: Record<string, number> | null;
}): FinancePreviewRow[] {
  const summary = resolveOfferSalesTotalSummary(params);
  if (!summary) return [];

  const currency = summary.currency || "AZN";
  const fmtAzn = (n: number) => (n > 0 ? n.toFixed(2) : "");
  const fmtAmt = (n: number) => (n > 0 ? String(n) : "");
  const fmtProfit = (n: number) => `${n.toFixed(2)} AZN`;
  const carrier =
    summary.carrierName ||
    String(params.voyages?.[0]?.carrier || "").trim() ||
    "Daşıyıcı";
  const customer =
    String(params.customerName || "").trim() ||
    String(params.order?.customer || "").trim() ||
    "Müştəri";

  const rows: FinancePreviewRow[] = [];

  if (summary.sales > 0) {
    rows.push({
      id: "preview-sales",
      name: "Satış qiyməti",
      partner: customer,
      tarifPrice: fmtAmt(summary.sales),
      tarifCurrency: currency,
      tarifAzn: fmtAzn(summary.salesAzn),
      mesarifPrice: "",
      mesarifCurrency: "",
      mesarifAzn: "",
      profit: fmtProfit(summary.salesAzn),
      isPreview: true,
      costDate: "",
      user: "Sistem",
    });
  }

  if (summary.purchase > 0) {
    const purchaseCurr = summary.purchaseCurrency || currency;
    rows.push({
      id: "preview-purchase",
      name: "Alış qiyməti",
      partner: carrier,
      tarifPrice: "",
      tarifCurrency: "",
      tarifAzn: "",
      mesarifPrice: fmtAmt(summary.purchase),
      mesarifCurrency: purchaseCurr,
      mesarifAzn: fmtAzn(summary.purchaseAzn),
      profit: fmtProfit(-summary.purchaseAzn),
      isPreview: true,
      costDate: "",
      user: "Sistem",
    });
  }

  if (summary.expense > 0) {
    rows.push({
      id: "preview-expense",
      name: "Xərc",
      partner: carrier,
      tarifPrice: "",
      tarifCurrency: "",
      tarifAzn: "",
      mesarifPrice: fmtAmt(summary.expense),
      mesarifCurrency: currency,
      mesarifAzn: fmtAzn(summary.expenseAzn),
      profit: fmtProfit(-summary.expenseAzn),
      isPreview: true,
      costDate: "",
      user: "Sistem",
    });
  }

  // Alış/xərc yoxdursa, yalnız total varsa — onu göstər
  if (
    !(summary.purchase > 0) &&
    !(summary.expense > 0) &&
    summary.total > 0
  ) {
    rows.push({
      id: "preview-total",
      name: "Total qiymət",
      partner: carrier,
      tarifPrice: "",
      tarifCurrency: "",
      tarifAzn: "",
      mesarifPrice: fmtAmt(summary.total),
      mesarifCurrency: currency,
      mesarifAzn: fmtAzn(summary.totalAzn),
      profit: fmtProfit(-summary.totalAzn),
      isPreview: true,
      costDate: "",
      user: "Sistem",
    });
  }

  if (rows.length > 0) {
    const profit = summary.profitAzn;
    rows.push({
      id: "preview-profit",
      name: "Gözlənilən mənfəət",
      partner: "—",
      tarifPrice: "",
      tarifCurrency: "",
      tarifAzn: "",
      mesarifPrice: "",
      mesarifCurrency: "",
      mesarifAzn: "",
      profit: `${profit.toFixed(2)} AZN`,
      isPreview: true,
      costDate: "",
      user: "Sistem",
    });
  }

  return rows;
}

export function hasFinanceRevenue(financeTransactions: any[]): boolean {
  return (financeTransactions || []).some(
    (tx) => resolveFinanceRevenueAzn(tx) > 0,
  );
}
