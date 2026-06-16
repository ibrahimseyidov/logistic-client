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
  const cargoInfo = String(query?.cargoInfo ?? "").trim();
  if (cargoInfo) return cargoInfo;

  const items = parseCargoItems(query);
  if (items.length === 0) return "—";

  return items
    .map((item) => {
      const parts = [item.name || "Adsız yük"];
      if (item.weight) parts.push(`${item.weight} kq`);
      if (item.ldm) parts.push(`LDM: ${item.ldm}`);
      return parts.join(" | ");
    })
    .join("; ");
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
