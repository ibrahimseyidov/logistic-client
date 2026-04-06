import type { ReysFilterSectionId, ReysTransportMode } from "../types/reys.types";

export const REYS_ITEMS_PER_PAGE = 10;

export const REYS_FILTER_SECTIONS: { id: ReysFilterSectionId; label: string }[] = [
  { id: "id", label: "ID" },
  { id: "dates", label: "Tarixlər" },
  { id: "orders", label: "Sifarişlər" },
  { id: "carriers", label: "Daşıyıcılar" },
  { id: "route", label: "Marşrut" },
  { id: "other", label: "Digəri" },
  { id: "sort", label: "Çeşidləmə" },
  { id: "statuses", label: "Statuslar" },
  { id: "templates", label: "Şablonlar" },
];

export const REYS_TRANSPORT_TABS: { id: ReysTransportMode; label: string }[] = [
  { id: "auto", label: "Avto reys" },
  { id: "rail", label: "Dəmir yolu reysləri" },
  { id: "sea", label: "Dəniz reysləri" },
  { id: "air", label: "Uçuş reysləri" },
  { id: "own", label: "Öz nəqliyyatım" },
  { id: "all", label: "Hamısı" },
];
