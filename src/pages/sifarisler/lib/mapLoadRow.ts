import { resolveCargoItemsFromInitialValues } from "../../sorgular/lib/cargoForm.utils";
import { parseCompositePlace } from "./yukPrefill.utils";

function parseRawPayload(rawPayloadJson?: string | null): Record<string, any> {
  if (!rawPayloadJson) return {};
  try {
    return JSON.parse(rawPayloadJson);
  } catch {
    return {};
  }
}

function displayValue(value: unknown): string {
  if (value == null) return "";
  const text = String(value).trim();
  if (!text || text === "—" || text === "Dəyəri seçin") return "";
  return text;
}

function toInputDate(value: unknown): string {
  if (!value) return "";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function formatVoyageLabel(voyage: unknown, voyageId?: unknown): string {
  if (voyage && typeof voyage === "object") {
    const v = voyage as { tripRef?: string; id?: number | string };
    if (v.id != null && String(v.id).trim() !== "") return `R-${v.id}`;
    if (v.tripRef) return String(v.tripRef);
  }
  if (typeof voyage === "string") {
    const text = voyage.trim();
    if (text && text !== "—") return text;
  }
  if (voyageId != null && String(voyageId).trim() !== "") {
    return `R-${voyageId}`;
  }
  return "—";
}

function buildParamsText(
  packagingType: string,
  ldm: unknown,
  volumeM3: unknown,
  weightKg: unknown,
): string {
  return `Tip: ${packagingType || "—"}\nLDM: ${ldm ?? "—"}\nHəcm: ${volumeM3 ?? "—"} m³\nÇəki: ${weightKg ?? "—"} kq`;
}

function placeFromQuery(query: any, kind: "load" | "unload"): string {
  if (!query) return "";
  if (kind === "load") {
    return [
      query.loadPlaceCompany || query.sender,
      query.loadCity,
      query.loadCountry,
      query.loadAddress || query.loadPlace,
    ]
      .map((part) => displayValue(part))
      .filter(Boolean)
      .join(", ");
  }
  return [
    query.unloadPlaceCompany || query.recipient,
    query.unloadCity,
    query.unloadCountry,
    query.unloadAddress || query.unloadPlace,
  ]
    .map((part) => displayValue(part))
    .filter(Boolean)
    .join(", ");
}

function packagingFromQuery(query: any): string {
  if (!query) return "";
  const items = resolveCargoItemsFromInitialValues(query);
  const first = items[0];
  const pack = first?.packagingRows?.[0];
  return (
    displayValue(pack?.packagingType) ||
    displayValue((first as any)?.packagingType) ||
    ""
  );
}

export function mapLoadRow(load: any, order?: any) {
  const raw = parseRawPayload(load.rawPayloadJson);
  const query = order?.query;
  const firstLp = Array.isArray(raw.loadingPlaces) ? raw.loadingPlaces[0] : null;
  const firstUp = Array.isArray(raw.unloadingPlaces) ? raw.unloadingPlaces[0] : null;
  const firstParam = Array.isArray(raw.parameters) ? raw.parameters[0] : null;
  const parsedLoad = parseCompositePlace(
    query?.loadPlace || load.loadPlace || raw.loadPlace,
  );
  const parsedUnload = parseCompositePlace(
    query?.unloadPlace || load.unloadPlace || raw.unloadPlace,
  );

  const packagingType =
    displayValue(load.packagingType) ||
    displayValue(raw.packagingType) ||
    displayValue(firstParam?.packagingType) ||
    packagingFromQuery(query);

  const loadPlace =
    displayValue(load.loadPlace) ||
    displayValue(raw.loadPlace) ||
    (firstLp
      ? [firstLp.company, firstLp.city, firstLp.address]
          .filter((part) => displayValue(part))
          .join(", ")
      : "") ||
    placeFromQuery(query, "load") ||
    "—";

  const unloadPlace =
    displayValue(load.unloadPlace) ||
    displayValue(raw.unloadPlace) ||
    (firstUp
      ? [firstUp.company, firstUp.city, firstUp.address]
          .filter((part) => displayValue(part))
          .join(", ")
      : "") ||
    placeFromQuery(query, "unload") ||
    "—";

  const sender =
    displayValue(load.sender) ||
    displayValue(raw.sender) ||
    displayValue(firstLp?.sender) ||
    displayValue(firstLp?.company) ||
    displayValue(query?.sender) ||
    displayValue(query?.loadPlaceCompany) ||
    displayValue(parsedLoad.company) ||
    "—";

  const receiver =
    displayValue(load.receiver) ||
    displayValue(raw.receiver) ||
    displayValue(firstUp?.receiver) ||
    displayValue(firstUp?.company) ||
    displayValue(query?.recipient) ||
    displayValue(query?.unloadPlaceCompany) ||
    displayValue(parsedUnload.company) ||
    "—";

  const loadDate =
    toInputDate(load.loadDate) ||
    toInputDate(raw.loadDate) ||
    toInputDate(firstLp?.startDate) ||
    toInputDate(query?.loadDate) ||
    "";

  const unloadDate =
    toInputDate(load.unloadDate) ||
    toInputDate(raw.unloadDate) ||
    toInputDate(firstUp?.startDate) ||
    toInputDate(query?.unloadDate) ||
    "";

  const containerNumber =
    displayValue(load.containerNumber) ||
    displayValue(load.trackingNumber) ||
    displayValue(raw.containerNumber) ||
    displayValue(raw.trackingNumber) ||
    "—";

  const weightKg = load.weightKg ?? raw.weight ?? firstParam?.weight;
  const volumeM3 = load.volumeM3 ?? raw.volume ?? firstParam?.volume;
  const ldm = load.ldm ?? raw.ldm ?? firstParam?.ldm;

  return {
    ...load,
    number: load.id ? `Y-${load.id}` : "—",
    name:
      displayValue(load.cargoName) ||
      displayValue(raw.name) ||
      displayValue(query?.cargoComposition) ||
      "—",
    containerNumber,
    params: buildParamsText(packagingType, ldm, volumeM3, weightKg),
    packagingType: packagingType || "—",
    voyageId: load.voyageId ?? load.voyage?.id ?? null,
    voyageLabel: formatVoyageLabel(load.voyage, load.voyageId),
    sender,
    receiver,
    loadPlace,
    unloadPlace,
    loadDate,
    unloadDate,
    weightKg,
    volumeM3,
    ldm,
    rawPayload: raw,
  };
}

export function buildLoadApiPayload(payload: any, orderId: number | string) {
  const emptyToNull = (value: unknown) => {
    const text = displayValue(value);
    return text || null;
  };

  const parseDate = (value: unknown) => {
    const text = displayValue(value);
    if (!text) return null;
    const d = new Date(text);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  };

  return {
    orderId: Number(orderId),
    cargoName: displayValue(payload.name) || "General cargo",
    containerNumber: emptyToNull(payload.containerNumber),
    sender: emptyToNull(payload.sender),
    receiver: emptyToNull(payload.receiver),
    loadPlace: emptyToNull(payload.loadPlace),
    unloadPlace: emptyToNull(payload.unloadPlace),
    loadDate: parseDate(payload.loadDate),
    unloadDate: parseDate(payload.unloadDate),
    weightKg: parseFloat(payload.weight) || null,
    volumeM3: parseFloat(payload.volume) || null,
    ldm: parseFloat(payload.ldm) || null,
    packagingType: emptyToNull(payload.packagingType),
    quantity: emptyToNull(payload.quantity),
    loadingNumber: emptyToNull(payload.loadingNumber),
    temperature: emptyToNull(payload.temperature),
    status: payload.status || "Gözləmədə",
    rawPayloadJson: JSON.stringify(payload.rawPayload || payload),
  };
}
