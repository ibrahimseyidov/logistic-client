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
  if (aliases.length === 0) {
    return financeTxs.some((tx) => {
      if (String(tx.orderId) !== String(order.id)) return false;
      return (
        (tx.carrierId != null && String(tx.carrierId) === rid) ||
        (tx.carrier?.id != null && String(tx.carrier.id) === rid)
      );
    });
  }

  // carriers sahəsi: dəqiq tokenlər
  const carrierTokens = String(order.carriers || "")
    .split(/[,;|/]+/)
    .map((x) => fold(x))
    .filter(Boolean);
  if (carrierTokens.some((t) => aliases.includes(t))) return true;

  // Teq: "Daşıyıcı: Name" — dəqiq
  const tagRaw = String(order.tags || "");
  const tagMatch = tagRaw.match(/Daşıyıcı:\s*([^,;|]+)/i);
  if (tagMatch) {
    const tagName = fold(tagMatch[1]);
    if (aliases.some((n) => n === tagName)) return true;
  }

  return financeTxs.some((tx) => {
    if (String(tx.orderId) !== String(order.id)) return false;
    if (tx.carrierId != null && String(tx.carrierId) === rid) return true;
    if (tx.carrier?.id != null && String(tx.carrier.id) === rid) return true;
    if (/^Reys R-/i.test(String(tx.name || ""))) {
      const p = fold(tx.partner || tx.carrier?.name || entityLabel(tx.carrier));
      return aliases.some((n) => n === p);
    }
    return false;
  });
}

export function isCarrierBookkeepingTx(tx: any): boolean {
  if (!tx) return false;
  if (tx.carrierId != null || tx.carrier?.id != null) return true;
  return /^Reys R-\d+/i.test(String(tx.name || "").trim());
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
