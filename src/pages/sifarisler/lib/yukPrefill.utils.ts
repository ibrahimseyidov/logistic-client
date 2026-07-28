import { resolveCargoItemsFromInitialValues } from "../../sorgular/lib/cargoForm.utils";
import { COUNTRY_OPTIONS } from "../../sorgular/constants/options.constants";

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
  cn: "Çin",
  china: "Çin",
  çin: "Çin",
  chine: "Çin",
  ru: "Rusiya",
  russia: "Rusiya",
  rusiya: "Rusiya",
};

for (const opt of COUNTRY_OPTIONS) {
  COUNTRY_ALIASES[opt.value.toLowerCase()] = opt.label;
  COUNTRY_ALIASES[opt.label.toLowerCase()] = opt.label;
}

export function normalizeCountry(value: unknown): string {
  const raw = toText(value);
  if (!raw || raw === "Dəyəri seçin") return "";
  return COUNTRY_ALIASES[raw.toLowerCase()] || raw;
}

function isCountryToken(value: string): boolean {
  const raw = toText(value);
  if (!raw) return false;
  if (COUNTRY_ALIASES[raw.toLowerCase()]) return true;
  if (/^[A-Za-z]{2}$/.test(raw)) return true;
  return false;
}

function isPostalToken(value: string): boolean {
  const raw = toText(value);
  if (!raw) return false;
  if (/^\d{4,6}$/.test(raw)) return true;
  if (/^[A-Z0-9]{3,10}$/i.test(raw) && /\d/.test(raw) && raw.length <= 10) {
    return true;
  }
  return false;
}

/**
 * Parses composite place strings like:
 * "XX, Pekin, CN, asdgaS UYAD 856"
 * "divi, bAKU, AZ, aihdhs tg c75858"
 */
export function parseCompositePlace(value: unknown): {
  company: string;
  city: string;
  country: string;
  postal: string;
  address: string;
} {
  const raw = toText(value);
  if (!raw) {
    return { company: "", city: "", country: "", postal: "", address: "" };
  }

  const parts = raw
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length === 1) {
    return { company: "", city: "", country: "", postal: "", address: parts[0] };
  }

  let company = "";
  let city = "";
  let country = "";
  let postal = "";
  const addressParts: string[] = [];

  if (parts.length >= 3 && isCountryToken(parts[2])) {
    company = parts[0];
    city = parts[1];
    country = normalizeCountry(parts[2]);
    let idx = 3;
    if (parts[idx] && isPostalToken(parts[idx])) {
      postal = parts[idx];
      idx += 1;
    }
    addressParts.push(...parts.slice(idx));
  } else if (parts.length >= 2 && isCountryToken(parts[1])) {
    city = parts[0];
    country = normalizeCountry(parts[1]);
    let idx = 2;
    if (parts[idx] && isPostalToken(parts[idx])) {
      postal = parts[idx];
      idx += 1;
    }
    addressParts.push(...parts.slice(idx));
  } else if (parts.length >= 2 && isCountryToken(parts[0])) {
    country = normalizeCountry(parts[0]);
    city = parts[1];
    addressParts.push(...parts.slice(2));
  } else {
    company = parts[0];
    const last = parts[parts.length - 1];
    if (isCountryToken(last)) {
      country = normalizeCountry(last);
      if (parts.length >= 3) {
        city = parts[1];
        addressParts.push(...parts.slice(2, -1));
      } else {
        addressParts.push(...parts.slice(1, -1));
      }
    } else {
      city = parts[1] || "";
      addressParts.push(...parts.slice(2));
    }
  }

  return {
    company,
    city,
    country,
    postal,
    address: addressParts.join(", ").trim(),
  };
}

function pickFirst(...values: unknown[]): string {
  for (const value of values) {
    const text = toText(value);
    if (text && text !== "—" && text !== "Dəyəri seçin") return text;
  }
  return "";
}

export function enrichPlaceFields(
  place: Record<string, any>,
  source?: {
    company?: unknown;
    city?: unknown;
    country?: unknown;
    postal?: unknown;
    address?: unknown;
    contact?: unknown;
    coords?: unknown;
    sender?: unknown;
    receiver?: unknown;
    composite?: unknown;
  },
) {
  const parsed = parseCompositePlace(
    source?.composite || place.address || place.company || "",
  );

  const company = pickFirst(place.company, source?.company, parsed.company);
  const city = pickFirst(place.city, source?.city, parsed.city);
  let country =
    normalizeCountry(pickFirst(place.country, source?.country, parsed.country)) ||
    "Dəyəri seçin";
  const postal = pickFirst(place.postal, source?.postal, parsed.postal);

  let address = pickFirst(source?.address, place.address, parsed.address);
  const compositeBlob = toText(source?.composite);
  if (address && compositeBlob && address === compositeBlob) {
    address = parsed.address || "";
  }
  // Ölkə kodu/adı ünvan sahəsinə düşübsə təmizlə
  if (address && isCountryToken(address)) {
    if (!country || country === "Dəyəri seçin") {
      country = normalizeCountry(address) || country;
    }
    address = "";
  }
  if (address) {
    const cleaned = address
      .split(",")
      .map((p) => p.trim())
      .filter((p) => {
        if (!p) return false;
        if (isCountryToken(p)) return false;
        if (company && p.toLowerCase() === company.toLowerCase()) return false;
        if (city && p.toLowerCase() === city.toLowerCase()) return false;
        if (country && country !== "Dəyəri seçin") {
          const n = normalizeCountry(p);
          if (n && n.toLowerCase() === country.toLowerCase()) return false;
          if (p.toLowerCase() === country.toLowerCase()) return false;
        }
        return true;
      })
      .join(", ");
    address = cleaned || parsed.address || address;
    if (address && isCountryToken(address)) address = "";
  }

  return {
    ...place,
    company,
    city,
    country,
    postal,
    address,
    contact: pickFirst(place.contact, source?.contact),
    coords: pickFirst(place.coords, source?.coords),
    ...(source?.sender !== undefined
      ? {
          sender:
            pickFirst(place.sender, source.sender, company) || "Dəyəri seçin",
        }
      : {}),
    ...(source?.receiver !== undefined
      ? {
          receiver:
            pickFirst(place.receiver, source.receiver, company) ||
            "Dəyəri seçin",
        }
      : {}),
  };
}

function mapPackagingType(value: string): string {
  if (!value) return "Dəyəri seçin";
  const lower = value.toLowerCase();
  if (lower.includes("palet") || lower === "pallet") return "Palet";
  if (lower.includes("box") || lower.includes("qutu")) return "Box";
  return value;
}

export function mapTransportType(value: string): string {
  const v = String(value || "").trim().toLowerCase();
  if (!v) return "truck";
  if (
    v === "plane" ||
    v === "air" ||
    v.includes("hava") ||
    v.includes("avi") ||
    v.includes("plane")
  ) {
    return "plane";
  }
  if (
    v === "ship" ||
    v === "sea" ||
    v.includes("dəniz") ||
    v.includes("deniz") ||
    v.includes("gəmi") ||
    v.includes("ship")
  ) {
    return "ship";
  }
  if (
    v === "train" ||
    v === "rail" ||
    v.includes("dəmir") ||
    v.includes("demir") ||
    v.includes("qatar") ||
    v.includes("train")
  ) {
    return "train";
  }
  if (
    v === "truck" ||
    v === "road" ||
    v.includes("quru") ||
    v.includes("avto") ||
    v.includes("tır") ||
    v.includes("tir") ||
    v.includes("truck")
  ) {
    return "truck";
  }
  return "truck";
}

export function resolveTransportFromOrder(order: any, editLoad?: any): string {
  const query = order?.query || {};
  const cargoItems = resolveCargoItemsFromInitialValues(query);
  const fromCargo = cargoItems.find((item) => item.transportType)?.transportType;
  const raw = [
    editLoad?.rawPayload?.activeTransport,
    editLoad?.activeTransport,
    query.transportType,
    fromCargo,
    order?.transportType,
  ]
    .map((v) => String(v || "").trim())
    .find(Boolean);

  return mapTransportType(raw || "");
}

function pickSender(value: string, fallback: string): string {
  return value || fallback || "Dəyəri seçin";
}

export function buildYukPrefillFromOrder(order: any, voyage?: any) {
  const query = order?.query || {};
  const cargoItems = resolveCargoItemsFromInitialValues(query);
  const firstCargo = cargoItems[0];

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

  const loadCity = toText(query.loadCity);
  const unloadCity = toText(query.unloadCity);

  const loadStreet = toText(query.loadAddress);
  const unloadStreet = toText(query.unloadAddress);

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

  const loadingPlaces = [
    enrichPlaceFields(
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
        address: loadStreet,
        contact,
        saveTerminal: Boolean(query.loadSaveTerminal),
      },
      {
        company: loadCompany,
        city: loadCity,
        country: loadCountry,
        postal: toText(query.loadPostal),
        address: loadStreet,
        contact,
        coords: toText(query.loadCoordinates),
        sender: toText(query.sender),
        composite:
          toText(query.loadPlace) ||
          toText(voyage?.loading) ||
          toText(voyage?.loadPlace),
      },
    ),
  ];

  const unloadingPlaces = [
    enrichPlaceFields(
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
        address: unloadStreet,
        contact,
        saveTerminal: Boolean(query.unloadSaveTerminal),
      },
      {
        company: unloadCompany,
        city: unloadCity,
        country: unloadCountry,
        postal: toText(query.unloadPostal),
        address: unloadStreet,
        contact,
        coords: toText(query.unloadCoordinates),
        receiver: toText(query.recipient),
        composite:
          toText(query.unloadPlace) ||
          toText(voyage?.unloading) ||
          toText(voyage?.unloadPlace),
      },
    ),
  ];

  const countrySet = new Set(
    [
      "Azərbaycan",
      "Almaniya",
      "Türkiyə",
      "Gürcüstan",
      "Çin",
      loadCountry,
      unloadCountry,
      loadingPlaces[0]?.country,
      unloadingPlaces[0]?.country,
    ].filter((c) => c && c !== "Dəyəri seçin"),
  );
  const senderSet = new Set(
    [loadCompany, toText(query.sender), loadingPlaces[0]?.company].filter(
      Boolean,
    ),
  );
  const receiverSet = new Set(
    [
      unloadCompany,
      toText(query.recipient),
      unloadingPlaces[0]?.company,
    ].filter(Boolean),
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
    activeTransport: resolveTransportFromOrder(order),
    loadingPlaces,
    unloadingPlaces,
    loadingCustoms: [] as any[],
    unloadingCustoms: [] as any[],
    parameters,
    countries: Array.from(countrySet),
    senders: Array.from(senderSet),
    receivers: Array.from(receiverSet),
  };
}
