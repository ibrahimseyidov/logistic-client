import type { LogisticQueryRow } from "../types/sorgu.types";

export type SorguDetailTabId =
  | "main"
  | "comments"
  | "offers"
  | "documents"
  | "tasks";

export interface SorguDetailViewModel {
  row: LogisticQueryRow;
  seller: string;
  direction: string;
  summaryAddress: string;
  contacts: string;
  quantityTotal: number;
  ldmTotal: number;
  weightTotal: number;
  volumeLabel: string;
  incoterms: string;
  cargoSpecs: string;
  source: string;
  fromCountry: string;
  fromCity: string;
  fromAddress: string;
  toCountry: string;
  toCity: string;
  toAddress: string;
  cargoTitle: string;
  cargoBoxLines: string[];
  inquiryDateLabel: string;
  commentsCount: number;
  offersCount: number;
  documentsCount: number;
  tasksCount: number;
}

function parsePlace(place: string): { country: string; city: string } {
  const parts = place
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    return { country: parts[0], city: parts.slice(1).join(", ") };
  }
  return { country: place || "—", city: "" };
}

const OVERRIDES: Partial<
  Record<string, Partial<Omit<SorguDetailViewModel, "row">>>
> = {
  ZFR260236: {
    seller: "Təhminə Aslanlı",
    direction: "China - Azerbaijan",
    summaryAddress: "Azerbaijan, Baku",
    contacts: "Nijat Shabanly, Nikolaus Kohler",
    quantityTotal: 7,
    ldmTotal: 100,
    weightTotal: 100,
    volumeLabel: "0.26 m³",
    incoterms: "EXW",
    cargoSpecs: "stackable / non dangerous",
    source: "Email",
    fromCountry: "China",
    fromCity: "Hong Kong",
    fromAddress:
      "Unit 89, 3/F, Yau Lee Center, 45 Hoi Yuen Road, Kwun Tong, Hong Kong",
    toCountry: "Azerbaijan",
    toCity: "Baku",
    toAddress: "—",
    cargoTitle: "General Cargo",
    cargoBoxLines: [
      "41*34*25cm 1 box",
      "50*34*24cm 1 box",
      "60*40*30cm 2 box",
      "45*45*40cm 1 box",
      "38*38*32cm 2 box",
    ],
    commentsCount: 0,
    offersCount: 1,
    documentsCount: 2,
    tasksCount: 0,
  },
};

export function buildSorguDetailView(
  row: LogisticQueryRow,
): SorguDetailViewModel {
  // Eğer loadCountry, loadCity, loadAddress gibi alanlar varsa doğrudan kullan
  const load = {
    country: row.loadCountry || parsePlace(row.loadPlace).country,
    city: row.loadCity || parsePlace(row.loadPlace).city,
    address: row.loadAddress || row.sender || "—",
  };
  const unload = {
    country: row.unloadCountry || parsePlace(row.unloadPlace).country,
    city: row.unloadCity || parsePlace(row.unloadPlace).city,
    address: row.unloadAddress || row.recipient || "—",
  };
  const o = OVERRIDES[row.number];

  const inquiryDate = new Date(row.createdAt);
  const inquiryDateLabel = Number.isNaN(inquiryDate.getTime())
    ? "—"
    : inquiryDate.toLocaleDateString("az-AZ", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

  const base: SorguDetailViewModel = {
    row,
    seller: row.seller && row.seller !== "—" ? row.seller : "—",
    direction:
      load.country && unload.country
        ? `${load.country} - ${unload.country}`
        : "—",
    summaryAddress:
      [unload.country, unload.city].filter(Boolean).join(", ") || "—",
    contacts: "—",
    quantityTotal: 1,
    ldmTotal: 0,
    weightTotal: 0,
    volumeLabel: "—",
    incoterms: "—",
    cargoSpecs: "—",
    source: "Sistem",
    fromCountry: load.country,
    fromCity: load.city || "—",
    fromAddress: load.address,
    toCountry: unload.country,
    toCity: unload.city || "—",
    toAddress: unload.address,
    cargoTitle: "Yük",
    cargoBoxLines: row.cargoInfo
      ? row.cargoInfo.split("\n").filter(Boolean)
      : [],
    inquiryDateLabel,
    commentsCount: 0,
    offersCount: row.priceOffers && row.priceOffers !== "—" ? 1 : 0,
    documentsCount: 0,
    tasksCount: 0,
  };

  if (!o) return base;

  return {
    ...base,
    ...o,
    row,
    cargoBoxLines: o.cargoBoxLines ?? base.cargoBoxLines,
  };
}
