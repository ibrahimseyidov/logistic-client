import type { FilterSectionId } from "../types/sorgu.types";

export const ITEMS_PER_PAGE = 10;

export const FILTER_SECTIONS: { id: FilterSectionId; label: string }[] = [
  { id: "id", label: "ID" },
  { id: "dates", label: "Tarixlər" },
  { id: "customers", label: "Müştərilər" },
  { id: "directions", label: "İstiqamətlər" },
  { id: "transport", label: "Nəqliyyat" },
  { id: "loads", label: "Yüklər" },
  { id: "users", label: "İstifadəçilər" },
  { id: "other", label: "Digəri" },
  { id: "sort", label: "Çeşidləmə" },
  { id: "templates", label: "Şablonlar" },
];
