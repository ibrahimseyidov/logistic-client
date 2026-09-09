/** Shared helpers: match real customers/carriers to orders & finance rows */

import { isSystemBalanceAdjustment } from "./financeWallet.utils";

export function fold(s: unknown) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function entityLabel(entity: any): string {
  if (!entity) return "";
  return String(
    entity.name ||
      entity.company ||
      entity.companyName ||
      entity.fullName ||
      entity.shortName ||
      "",
  ).trim();
}

export function entityAliases(entity: any): string[] {
  return [
    entity?.name,
    entity?.company,
    entity?.companyName,
    entity?.fullName,
    entity?.shortName,
  ]
    .map((x) => fold(x))
    .filter(Boolean);
}

/** Yalnız dəqiq ad uyğunluğu — substring oxşarlığı YOX (afdsafds ≠ afdsafdsafdsafds) */
export function namesMatch(a: unknown, b: unknown): boolean {
  const fa = fold(a);
  const fb = fold(b);
  if (!fa || !fb) return false;
  return fa === fb;
}

export function findCustomerForName(
  customers: any[],
  rawName: unknown,
): any | null {
  const target = fold(rawName);
  if (!target || !Array.isArray(customers)) return null;

  // Dəqiq uyğunluq; bir neçə varsa ən uzun alias-ı olanı seç (daha spesifik kart)
  const exact = customers.filter((c) =>
    entityAliases(c).some((n) => n === target),
  );
  if (exact.length === 0) return null;
  if (exact.length === 1) return exact[0];
  return exact.sort(
    (a, b) => entityLabel(b).length - entityLabel(a).length,
  )[0];
}

export function findCarrierForName(
  carriers: any[],
  rawName: unknown,
): any | null {
  return findCustomerForName(carriers, rawName);
}

export function orderMatchesCustomer(
  order: any,
  customer: any,
  financeTxs: any[] = [],
): boolean {
  if (!order || !customer) return false;
  const cid = String(customer.id);

  // 1) Birbaşa ID
  if (order.customerId != null && String(order.customerId) === cid) {
    return true;
  }

  // 2) Dəqiq ad (şirkət satıcı adı ilə qarışmasın deyə customerName / customer)
  const aliases = entityAliases(customer);
  if (aliases.length > 0) {
    const oc = fold(order.customerName || order.customer || "");
    if (oc && aliases.some((n) => n === oc)) return true;
  }

  // 3) Maliyyə sətirində customerId
  return financeTxs.some((tx) => {
    if (String(tx.orderId) !== String(order.id)) return false;
    if (tx.customerId != null && String(tx.customerId) === cid) return true;
    if (tx.customer?.id != null && String(tx.customer.id) === cid) return true;
    return false;
  });
}

export function orderMatchesCarrier(
  order: any,
  carrier: any,
  financeTxs: any[] = [],
): boolean {
  if (!order || !carrier) return false;
  const rid = String(carrier.id);
  const aliases = entityAliases(carrier);

  const tokenMatches = (raw: unknown) => {
    const t = fold(raw);
    if (!t || t === "dasiyici") return false;
    return aliases.includes(t);
  };

  const carrierTokens = String(order.carriers || "")
    .split(/[,;|/]+/)
    .map((x) => fold(x))
    .filter(Boolean);
  if (carrierTokens.some((t) => aliases.includes(t))) return true;

  const tagRaw = String(order.tags || "");
  const tagMatch = tagRaw.match(/Daşıyıcı:\s*([^,;|]+)/i);
  if (tagMatch && tokenMatches(tagMatch[1])) return true;

  const voyages = Array.isArray(order.voyages) ? order.voyages : [];
  if (voyages.some((v: any) => tokenMatches(v?.carrier))) return true;

  return financeTxs.some((tx) => {
    if (String(tx.orderId) !== String(order.id)) return false;
    if (tx.carrierId != null && String(tx.carrierId) === rid) return true;
    if (tx.carrier?.id != null && String(tx.carrier.id) === rid) return true;
    const p = fold(tx.partner || tx.carrier?.name || entityLabel(tx.carrier));
    if (aliases.length > 0 && aliases.includes(p)) return true;
    return false;
  });
}

function foldAzFinanceName(value: unknown): string {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("az-AZ")
    .replace(/ı/g, "i")
    .replace(/ə/g, "e")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g");
}

/** Daşıyıcı borcu: yalnız alınmış hesab (yoxdursa reys qiyməti). Əlavə xərc borc deyil. */
export function isAlinmisDebtName(name: unknown): boolean {
  return foldAzFinanceName(name).startsWith("alinmis hesab");
}

export function isVoyageDebtName(name: unknown): boolean {
  return /^reys r-\d+/i.test(foldAzFinanceName(name));
}

/** Müştəri borcu: yalnız irəli hesab (yoxdursa başlanğıc tarif). */
export function isIreliDebtName(name: unknown): boolean {
  return foldAzFinanceName(name).startsWith("ireli hesab");
}

export function isEstimateCustomerDebtName(name: unknown): boolean {
  const n = foldAzFinanceName(name);
  return n === "baslangic tarif" || n === "satis qiymeti";
}

export function orderHasAlinmisDebt(txs: any[], orderId: unknown): boolean {
  const oid = String(orderId ?? "");
  return (txs || []).some(
    (tx) => String(tx.orderId) === oid && isAlinmisDebtName(tx.name),
  );
}

export function orderHasIreliDebt(txs: any[], orderId: unknown): boolean {
  const oid = String(orderId ?? "");
  return (txs || []).some(
    (tx) => String(tx.orderId) === oid && isIreliDebtName(tx.name),
  );
}

export function isCarrierBookkeepingTx(
  tx: any,
  opts?: { orderHasAlinmis?: boolean },
): boolean {
  if (!tx) return false;
  if (isAlinmisDebtName(tx.name)) return true;
  if (opts?.orderHasAlinmis) return false;
  return isVoyageDebtName(tx.name);
}

export function isCustomerBookkeepingDebtTx(
  tx: any,
  opts?: { orderHasIreli?: boolean },
): boolean {
  if (!tx) return false;
  if (isIreliDebtName(tx.name)) return true;
  if (opts?.orderHasIreli) return false;
  return isEstimateCustomerDebtName(tx.name);
}

function parseInvoiceRowGross(r: any): number {
  const qty = Number.parseFloat(String(r?.qty ?? 1).replace(",", ".")) || 0;
  const price = Number.parseFloat(String(r?.price ?? 0).replace(",", ".")) || 0;
  const vat =
    Number.parseFloat(
      String(r?.vatRate ?? "0").replace("%", "").replace(",", "."),
    ) || 0;
  return qty * price * (1 + vat / 100);
}

export function parseInvoiceAmountAzn(inv: any): number {
  if (!inv) return 0;
  let fromRows = 0;
  const list = Array.isArray(inv.rows) ? inv.rows : null;
  if (list) {
    fromRows = list.reduce((s: number, r: any) => s + parseInvoiceRowGross(r), 0);
  } else if (inv.rowsJson) {
    try {
      const parsed = JSON.parse(String(inv.rowsJson));
      if (Array.isArray(parsed)) {
        fromRows = parsed.reduce(
          (s: number, r: any) => s + parseInvoiceRowGross(r),
          0,
        );
      }
    } catch {
      fromRows = 0;
    }
  }
  const text = String(inv.amount || "").trim();
  const m = text.match(/([\d]+(?:[.,][\d]+)?)/);
  const fromAmount = m
    ? Number.parseFloat(String(m[1]).replace(",", ".")) || 0
    : 0;
  return fromRows > 0 ? fromRows : fromAmount;
}

export function invoiceTypeOf(inv: any): string {
  const n = foldAzFinanceName(inv?.type);
  if (n.includes("alinmis") || n.includes("received")) return "alinmis";
  if (n.startsWith("ireli") || n.includes("forward")) return "ireli";
  return String(inv?.type || "")
    .trim()
    .toLowerCase();
}

export function orderInvoicesOfType(
  invoices: any[] | undefined,
  orderId: unknown,
  type: "alinmis" | "ireli",
): any[] {
  const oid = String(orderId ?? "");
  const seen = new Set<string>();
  return (invoices || []).filter((inv) => {
    const invOrder = inv.orderId != null ? String(inv.orderId) : oid;
    if (invOrder !== oid) return false;
    if (invoiceTypeOf(inv) !== type) return false;
    const key =
      inv.id != null ? `id:${inv.id}` : `n:${inv.number}:${inv.amount}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function sumPartnerInvoicesAzn(
  invoices: any[] | undefined,
  orderId: unknown,
  type: "alinmis" | "ireli",
  partnerName?: string | null,
): number {
  const rows = orderInvoicesOfType(invoices, orderId, type);
  if (rows.length === 0) return 0;
  const pname = String(partnerName || "").trim();
  const matched = pname
    ? rows.filter(
        (inv) =>
          namesMatch(inv.payer, pname) ||
          namesMatch(inv.customerName, pname) ||
          namesMatch(inv.partner, pname),
      )
    : rows;
  const use = matched.length > 0 ? matched : rows;
  return use.reduce((s, inv) => s + parseInvoiceAmountAzn(inv), 0);
}

export function resolveCustomerGroup(
  tx: any,
  customers: any[],
  orders: any[],
): { key: string; name: string } | null {
  if (isSystemBalanceAdjustment(tx)) return null;
  if (tx.customerId != null) {
    const c =
      customers.find((x) => String(x.id) === String(tx.customerId)) ||
      tx.customer;
    return {
      key: `c:${tx.customerId}`,
      name: entityLabel(c) || tx.partner || `Müştəri #${tx.customerId}`,
    };
  }
  if (tx.customer?.id != null) {
    return {
      key: `c:${tx.customer.id}`,
      name: entityLabel(tx.customer) || tx.partner || `Müştəri #${tx.customer.id}`,
    };
  }

  const byPartner = findCustomerForName(customers, tx.partner);
  if (byPartner) {
    return { key: `c:${byPartner.id}`, name: entityLabel(byPartner) };
  }

  if (tx.orderId) {
    const ord = orders.find((o) => String(o.id) === String(tx.orderId));
    if (ord?.customerId != null) {
      const byId = customers.find(
        (x) => String(x.id) === String(ord.customerId),
      );
      if (byId) {
        return { key: `c:${byId.id}`, name: entityLabel(byId) };
      }
    }
    const byOrder = findCustomerForName(
      customers,
      ord?.customerName || ord?.customer,
    );
    if (byOrder) {
      return { key: `c:${byOrder.id}`, name: entityLabel(byOrder) };
    }
  }

  const fallback = String(tx.partner || "").trim();
  if (!fallback || fold(fallback) === "musteri" || fold(fallback) === "müştəri") {
    return null;
  }
  return { key: `n:${fold(fallback)}`, name: fallback };
}

export function resolveCarrierGroup(
  tx: any,
  carriers: any[],
  opts: { allowNameFallback?: boolean } = {},
): { key: string; name: string } | null {
  if (isSystemBalanceAdjustment(tx)) return null;
  if (tx.carrierId != null) {
    const c =
      carriers.find((x) => String(x.id) === String(tx.carrierId)) || tx.carrier;
    return {
      key: `r:${tx.carrierId}`,
      name: entityLabel(c) || tx.partner || `Daşıyıcı #${tx.carrierId}`,
    };
  }
  if (tx.carrier?.id != null) {
    return {
      key: `r:${tx.carrier.id}`,
      name: entityLabel(tx.carrier) || tx.partner || `Daşıyıcı #${tx.carrier.id}`,
    };
  }

  const byPartner = findCarrierForName(carriers, tx.partner);
  if (byPartner) {
    return { key: `r:${byPartner.id}`, name: entityLabel(byPartner) };
  }

  const allowFallback =
    opts.allowNameFallback || /^Reys R-/i.test(String(tx.name || ""));
  if (!allowFallback) return null;

  const fallback = String(tx.partner || "").trim();
  if (
    !fallback ||
    fold(fallback) === "dasiyici" ||
    fold(fallback) === "daşıyıcı"
  ) {
    return null;
  }
  return { key: `n:${fold(fallback)}`, name: fallback };
}
