import { CARGO_TRANSPORT_OPTIONS } from "../../sorgular/constants/options.constants";

export type OrderCargoDisplayItem = {
  id?: string | number;
  name: string;
  weight?: string | number | null;
  ldm?: string | number | null;
  volume?: string | number | null;
  transportType?: string | null;
  cargoValue?: string | number | null;
  currency?: string | null;
};

function toText(value: unknown): string {
  if (value == null) return "";
  const text = String(value).trim();
  return text && text !== "—" ? text : "";
}

function parseJsonArray(value: unknown): any[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function getCargoTransportLabel(value: string) {
  const matched = CARGO_TRANSPORT_OPTIONS.find((opt) => opt.value === value);
  return matched ? matched.label : value;
}

function mapQueryCargoItems(query: any): OrderCargoDisplayItem[] {
  const items = parseJsonArray(query?.cargoItems).length
    ? parseJsonArray(query?.cargoItems)
    : parseJsonArray(query?.cargoItemsJson);

  return items
    .map((item: any, idx: number) => ({
      id: item.id ?? `q-${idx}`,
      name: toText(item.name) || "Adsız yük",
      weight: item.weight ?? null,
      ldm: item.ldm ?? null,
      volume: item.volumeM3 ?? item.volume ?? null,
      transportType: toText(item.transportType) || null,
      cargoValue: item.cargoValue ?? null,
      currency: toText(item.currency) || null,
    }))
    .filter((item) => item.name);
}

function mapLoadCargoItems(loads: any[]): OrderCargoDisplayItem[] {
  return loads
    .map((load: any, idx: number) => {
      let raw: Record<string, any> = {};
      if (typeof load?.rawPayloadJson === "string" && load.rawPayloadJson.trim()) {
        try {
          raw = JSON.parse(load.rawPayloadJson);
        } catch {
          raw = {};
        }
      } else if (load?.rawPayload && typeof load.rawPayload === "object") {
        raw = load.rawPayload;
      }

      const firstParam = Array.isArray(raw.parameters) ? raw.parameters[0] : null;
      const weight = load.weightKg ?? raw.weight ?? firstParam?.weight ?? null;
      const ldm = load.ldm ?? raw.ldm ?? firstParam?.ldm ?? null;
      const volume =
        load.volumeM3 ?? raw.volume ?? raw.volumeM3 ?? firstParam?.volume ?? null;
      const transportType =
        toText(raw.transportType) ||
        toText(firstParam?.transportType) ||
        null;

      return {
        id: load.id ?? `l-${idx}`,
        name:
          toText(load.cargoName) ||
          toText(raw.name) ||
          toText(load.name) ||
          "Adsız yük",
        weight,
        ldm,
        volume,
        transportType,
        cargoValue: raw.cargoValue ?? firstParam?.cargoValue ?? null,
        currency: toText(raw.currency) || toText(firstParam?.currency) || null,
      };
    })
    .filter((item) => item.name);
}

/** Prefer order loads (order-specific), enrich missing fields from query cargo items. */
export function resolveOrderCargoItems(order: any): OrderCargoDisplayItem[] {
  const fromLoads = mapLoadCargoItems(
    Array.isArray(order?.loads) ? order.loads : [],
  );
  const fromQuery = mapQueryCargoItems(order?.query);

  if (fromLoads.length > 0) {
    return fromLoads.map((loadItem, idx) => {
      const match =
        fromQuery.find(
          (q) => q.name.toLowerCase() === loadItem.name.toLowerCase(),
        ) || fromQuery[idx];

      return {
        ...loadItem,
        weight: loadItem.weight ?? match?.weight ?? null,
        ldm: loadItem.ldm ?? match?.ldm ?? null,
        volume: loadItem.volume ?? match?.volume ?? null,
        transportType: loadItem.transportType ?? match?.transportType ?? null,
        cargoValue: loadItem.cargoValue ?? match?.cargoValue ?? null,
        currency: loadItem.currency ?? match?.currency ?? null,
      };
    });
  }

  return fromQuery;
}

export function formatCargoParamsText(items: OrderCargoDisplayItem[]): string {
  if (items.length === 0) return "—";
  return items
    .map((item) => {
      const parts = [item.name];
      if (item.weight) parts.push(`${item.weight} kq`);
      if (item.ldm) parts.push(`LDM: ${item.ldm}`);
      if (item.volume) parts.push(`${item.volume} m³`);
      if (item.transportType) {
        parts.push(getCargoTransportLabel(String(item.transportType)));
      }
      if (item.cargoValue || item.currency) {
        parts.push(`${item.cargoValue || "0"} ${item.currency || ""}`.trim());
      }
      return parts.join(" | ");
    })
    .join("\n");
}

function toNumber(value: unknown): number {
  const n = Number.parseFloat(String(value ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export function sumOrderCargoTotals(order: any): {
  weightKg: number;
  volumeM3: number;
  ldm: number;
} {
  const items = resolveOrderCargoItems(order);
  if (items.length > 0) {
    return {
      weightKg: items.reduce((s, i) => s + toNumber(i.weight), 0),
      volumeM3: items.reduce((s, i) => s + toNumber(i.volume), 0),
      ldm: items.reduce((s, i) => s + toNumber(i.ldm), 0),
    };
  }

  const loads = Array.isArray(order?.loads) ? order.loads : [];
  if (loads.length > 0) {
    return {
      weightKg: loads.reduce((s: number, l: any) => s + toNumber(l.weightKg), 0),
      volumeM3: loads.reduce((s: number, l: any) => s + toNumber(l.volumeM3), 0),
      ldm: loads.reduce((s: number, l: any) => s + toNumber(l.ldm), 0),
    };
  }

  return {
    weightKg: toNumber(order?.weightKg),
    volumeM3: toNumber(order?.volumeM3),
    ldm: toNumber(order?.ldm),
  };
}

export function formatVolumeLabel(volumeM3: number): string {
  if (!(volumeM3 > 0)) return "—";
  const text = volumeM3.toFixed(3).replace(/\.?0+$/, "");
  return `${text} m³`;
}
