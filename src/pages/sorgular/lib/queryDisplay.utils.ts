import { CARGO_TRANSPORT_OPTIONS } from "../constants/options.constants";

function parseCargoItems(query: any): any[] {
  if (Array.isArray(query?.cargoItems) && query.cargoItems.length > 0) {
    return query.cargoItems;
  }
  if (typeof query?.cargoItemsJson === "string" && query.cargoItemsJson.trim()) {
    try {
      const parsed = JSON.parse(query.cargoItemsJson);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function resolveTransportLabel(raw: unknown): string {
  const value = String(raw ?? "").trim();
  if (!value) return "";
  const matched = CARGO_TRANSPORT_OPTIONS.find(
    (opt) =>
      opt.value === value ||
      opt.label === value ||
      String(opt.value).toLowerCase() === value.toLowerCase(),
  );
  return matched ? matched.label : value;
}

function formatQueryLocation(query: any, type: "load" | "unload"): string {
  const prefix = type === "load" ? "load" : "unload";
  const city = String(query?.[`${prefix}City`] ?? "").trim();
  const country = String(query?.[`${prefix}Country`] ?? "").trim();
  const place = String(query?.[`${prefix}Place`] ?? "").trim();
  const address = String(query?.[`${prefix}Address`] ?? "").trim();
  const company = String(
    query?.[`${prefix}PlaceCompany`] ?? (type === "load" ? query?.sender : query?.recipient) ?? "",
  ).trim();

  if (city && country) return `${city}, ${country}`;
  if (city) return city;
  if (country) return country;
  if (place) return place;
  if (address) return address;
  if (company) return company;
  return "";
}

export function getQueryCargoSummary(query: any): string {
  const items = parseCargoItems(query);
  if (items.length > 0) {
    return items
      .map((item) => {
        const parts = [String(item.name || item.cargoName || "Adsız yük").trim()];
        const weight = item.weight ?? item.weightKg;
        if (weight) parts.push(`${weight} kq`);
        const volume = item.volume ?? item.volumeM3;
        if (volume) parts.push(`${volume} m³`);
        if (item.ldm) parts.push(`LDM: ${item.ldm}`);
        if (item.quantity) parts.push(`${item.quantity} əd`);
        return parts.filter(Boolean).join(" · ");
      })
      .join("; ");
  }

  const cargoInfo = String(query?.cargoInfo ?? "").trim();
  if (cargoInfo) return cargoInfo;
  const composition = String(query?.cargoComposition ?? "").trim();
  if (composition) return composition;
  return "—";
}

export function getQueryTransportLabel(query: any): string {
  const top = resolveTransportLabel(query?.transportType);
  const fromItems = parseCargoItems(query)
    .map((item) => resolveTransportLabel(item?.transportType))
    .filter(Boolean);
  const unique = Array.from(new Set([top, ...fromItems].filter(Boolean)));
  return unique.length > 0 ? unique.join(", ") : "—";
}

export function getQueryDirectionLabel(query: any): string {
  const load = formatQueryLocation(query, "load");
  const unload = formatQueryLocation(query, "unload");

  if (load && unload) return `${load} → ${unload}`;
  if (load) return load;
  if (unload) return unload;
  return "—";
}

export function getQueryDetailPath(query: any): string {
  const id = query?.id ?? query?.originalId;
  if (!id) return "/sorgular";
  return `/sorgular/${encodeURIComponent(String(id))}`;
}
