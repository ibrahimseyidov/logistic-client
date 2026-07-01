import { resolveCargoItemsFromInitialValues } from "../../sorgular/lib/cargoForm.utils";

function toText(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

function toInputDate(value: unknown): string {
  if (!value) return "";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

const COUNTRY_ALIASES: Record<string, string> = {
  az: "Azərbaycan",
  azerbaijan: "Azərbaycan",
  azərbaycan: "Azərbaycan",
  de: "Almaniya",
  germany: "Almaniya",
  almaniya: "Almaniya",
  tr: "Türkiyə",
  turkey: "Türkiyə",
  türkiyə: "Türkiyə",
  ge: "Gürcüstan",
  georgia: "Gürcüstan",
  gürcüstan: "Gürcüstan",
};

function normalizeCountry(value: unknown): string {
  const raw = toText(value);
  if (!raw) return "";
  return COUNTRY_ALIASES[raw.toLowerCase()] || raw;
}

function mapPackagingType(value: string): string {
  if (!value) return "Dəyəri seçin";
  const lower = value.toLowerCase();
  if (lower.includes("palet") || lower === "pallet") return "Palet";
  if (lower.includes("box") || lower.includes("qutu")) return "Box";
  return value;
}

export function mapTransportType(value: string): string {
  const v = value.toLowerCase();
  if (v.includes("air") || v.includes("hava")) return "plane";
  if (v.includes("sea") || v.includes("dəniz")) return "ship";
  if (v.includes("rail") || v.includes("dəmir")) return "train";
  return "truck";
}

function pickSender(value: string, fallback: string): string {
  return value || fallback || "Dəyəri seçin";
}

export function buildYukPrefillFromOrder(order: any, voyage?: any) {
  const query = order?.query || {};
  const cargoItems = resolveCargoItemsFromInitialValues(query);
  const firstCargo = cargoItems[0];
  const firstPackaging = firstCargo?.packagingRows?.[0];

  const loadCompany =
    toText(query.loadPlaceCompany) ||
    toText(query.sender) ||
    toText(voyage?.sender);
  const unloadCompany =
    toText(query.unloadPlaceCompany) ||
    toText(query.recipient) ||
    toText(voyage?.receiver);

  const loadCountry = normalizeCountry(query.loadCountry);
  const unloadCountry = normalizeCountry(query.unloadCountry);

  const loadDate =
    toInputDate(query.loadDate) || toInputDate(voyage?.loadDate);
  const unloadDate =
    toInputDate(query.unloadDate) || toInputDate(voyage?.unloadDate);

  const loadAddress =
    toText(query.loadAddress) ||
    toText(query.loadPlace) ||
    toText(voyage?.loading);
  const unloadAddress =
    toText(query.unloadAddress) ||
    toText(query.unloadPlace) ||
    toText(voyage?.unloading);

  const loadCity = toText(query.loadCity);
  const unloadCity = toText(query.unloadCity);

  const contact =
    toText(query.contactPerson) || toText(order?.contactPerson);

  const parameters =
    cargoItems.length > 0
      ? cargoItems.map((item, idx) => {
          const pack = item.packagingRows?.[0];
          return {
            id: `param-${idx + 1}`,
            weight: toText(item.weight),
            packagingType: mapPackagingType(toText(pack?.packagingType)),
            quantity: toText(pack?.packagingCount) || "1",
            ldm: toText(item.ldm),
            volume: toText(item.volumeM3),
            length: toText(pack?.lengthM),
            width: toText(pack?.widthM),
            height: toText(pack?.heightM),
          };
        })
      : [
          {
            id: "param-1",
            weight: toText(order?.weightKg),
            packagingType: "Dəyəri seçin",
            quantity: "1",
            ldm: toText(order?.ldm),
            volume: toText(order?.volumeM3),
            length: "",
            width: "",
            height: "",
          },
        ];

  const countrySet = new Set(
    ["Azərbaycan", "Almaniya", "Türkiyə", "Gürcüstan", loadCountry, unloadCountry].filter(
      Boolean,
    ),
  );
  const senderSet = new Set(
    [loadCompany, toText(query.sender)].filter(Boolean),
  );
  const receiverSet = new Set(
    [unloadCompany, toText(query.recipient)].filter(Boolean),
  );

  return {
    name:
      toText(firstCargo?.name) ||
      toText(query.cargoComposition) ||
      toText(query.cargoInfo) ||
      toText(order?.cargoParams) ||
      "",
    containerNumber: "",
    loadingNumber:
      toText(query.customerOrderRef) || toText(order?.customerOrderRef) || "",
    temperature: "",
    isIncomplete: Boolean(firstCargo?.incompleteLoad),
    activeTransport: mapTransportType(
      toText(query.transportType) || toText(firstCargo?.transportType),
    ),
    loadingPlaces: [
      {
        id: "lp-1",
        startDate: loadDate,
        endDate: loadDate,
        startTime: "",
        endTime: "",
        coords: toText(query.loadCoordinates),
        company: loadCompany,
        country: loadCountry || "Dəyəri seçin",
        sender: pickSender(toText(query.sender), loadCompany),
        city: loadCity,
        postal: toText(query.loadPostal),
        address: loadAddress,
        contact,
        saveTerminal: Boolean(query.loadSaveTerminal),
      },
    ],
    unloadingPlaces: [
      {
        id: "up-1",
        startDate: unloadDate,
        endDate: unloadDate,
        startTime: "",
        endTime: "",
        coords: toText(query.unloadCoordinates),
        company: unloadCompany,
        country: unloadCountry || "Dəyəri seçin",
        receiver: pickSender(toText(query.recipient), unloadCompany),
        city: unloadCity,
        postal: toText(query.unloadPostal),
        address: unloadAddress,
        contact,
        saveTerminal: Boolean(query.unloadSaveTerminal),
      },
    ],
    loadingCustoms: [] as any[],
    unloadingCustoms: [] as any[],
    parameters,
    countries: Array.from(countrySet),
    senders: Array.from(senderSet),
    receivers: Array.from(receiverSet),
  };
}
