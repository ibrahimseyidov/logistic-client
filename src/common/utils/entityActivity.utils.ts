export interface EntityRef {
  id: string;
  company?: string;
  name?: string;
}

function entityNames(entity: EntityRef): string[] {
  return [entity.company, entity.name]
    .filter(Boolean)
    .map((value) => String(value).trim().toLowerCase());
}

export function parseActivityDate(value: unknown): Date | null {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getLatestActivityDate(dates: Array<Date | null>): Date | null {
  const valid = dates.filter((date): date is Date => date !== null);
  if (!valid.length) return null;
  return new Date(Math.max(...valid.map((date) => date.getTime())));
}

export function formatActivityDate(date: Date | null | undefined): string {
  if (!date) return "-";
  return date.toLocaleDateString("az-AZ");
}

export function daysSinceActivityDate(date: Date | null): number {
  if (!date) return Number.NaN;
  const diffMs = Date.now() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function nameMatches(candidate: unknown, names: string[]): boolean {
  if (!candidate) return false;
  return names.includes(String(candidate).trim().toLowerCase());
}

function parsePriceOffers(query: any): any[] {
  const raw = query?.priceOffersJson ?? query?.priceOffers;
  if (!raw || typeof raw !== "string") return [];
  if (!raw.trim().startsWith("[")) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function matchesCustomerEntity(record: any, entity: EntityRef): boolean {
  const entityId = String(entity.id);
  const names = entityNames(entity);

  const customerRef = record.customer ?? record.customerId;
  const customerId =
    typeof customerRef === "object" && customerRef
      ? customerRef.id
      : customerRef;

  if (customerId != null) {
    return String(customerId) === entityId;
  }

  // Əgər sifarişin birbaşa müştəri adı varsa, dəqiq ona baxırıq
  const directCustomerName =
    record.customerName ||
    (typeof record.customer === "string" ? record.customer : null);

  if (directCustomerName) {
    return nameMatches(directCustomerName, names);
  }

  // Yalnız sifarişdə heç bir müştəri adı yoxdursa, reys və ya yüklərə baxırıq
  const fallbackCandidates = [
    ...(Array.isArray(record.loads)
      ? record.loads.map((item: any) => item?.customer)
      : []),
    ...(Array.isArray(record.voyages)
      ? record.voyages.map((item: any) => item?.customer)
      : []),
  ];

  return fallbackCandidates.some((candidate) => nameMatches(candidate, names));
}

export function queryMatchesCarrier(query: any, entity: EntityRef): boolean {
  const entityId = String(entity.id);
  const names = entityNames(entity);

  const carrierRef = query?.carrier;
  if (carrierRef) {
    const carrierId =
      typeof carrierRef === "object" && carrierRef ? carrierRef.id : carrierRef;
    if (carrierId != null && String(carrierId) === entityId) return true;
  }

  return parsePriceOffers(query).some((offer) =>
    nameMatches(offer?.carrierName, names),
  );
}

export function matchesCarrierEntity(record: any, entity: EntityRef): boolean {
  const entityId = String(entity.id);
  const names = entityNames(entity);

  const carrierRef = record.carrier ?? record.carrierId;
  if (carrierRef) {
    const carrierId =
      typeof carrierRef === "object" && carrierRef ? carrierRef.id : carrierRef;
    if (carrierId != null && String(carrierId) === entityId) return true;
  }

  const carrierNameCandidates = [
    record.carrierName,
    record.carriers,
    ...(Array.isArray(record.voyages)
      ? record.voyages.map((v: any) => v?.carrier)
      : []),
  ];

  if (carrierNameCandidates.some((candidate) => nameMatches(candidate, names))) {
    return true;
  }

  // Yalnız sifarişdə heç bir daşıyıcı təyin olunmayıbsa və sorğu bu daşıyıcıya aiddirsə
  const hasAssignedCarrier = Boolean(
    record.carrier ||
      record.carrierId ||
      record.carrierName ||
      record.carriers ||
      (Array.isArray(record.voyages) &&
        record.voyages.some((v: any) => v?.carrier && v?.carrier !== "—")),
  );

  if (
    !hasAssignedCarrier &&
    record.query &&
    queryMatchesCarrier(record.query, entity)
  ) {
    return true;
  }

  return false;
}

export function getLastCustomerActivityDate(
  entity: EntityRef,
  queries: any[],
  orders: any[],
): Date | null {
  const queryDates = queries
    .filter((query) => matchesCustomerEntity(query, entity))
    .map((query) => parseActivityDate(query.createdAt));

  const orderDates = orders
    .filter((order) => matchesCustomerEntity(order, entity))
    .map((order) => parseActivityDate(order.orderDate ?? order.createdAt));

  return getLatestActivityDate([...queryDates, ...orderDates]);
}

export function getLastCarrierActivityDate(
  entity: EntityRef,
  queries: any[],
  orders: any[],
): Date | null {
  const queryDates = queries
    .filter((query) => queryMatchesCarrier(query, entity))
    .map((query) => parseActivityDate(query.createdAt));

  const orderDates = orders
    .filter((order) => matchesCarrierEntity(order, entity))
    .map((order) => parseActivityDate(order.orderDate ?? order.createdAt));

  return getLatestActivityDate([...queryDates, ...orderDates]);
}
