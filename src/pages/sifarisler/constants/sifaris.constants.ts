import type { SifarisFilterSectionId } from "../types/sifaris.types";

export const ITEMS_PER_PAGE = 10;

export const FILTER_SECTIONS: { id: SifarisFilterSectionId; label: string }[] = [
  { id: "id", label: "ID" },
  { id: "dates", label: "Tarixlər" },
  { id: "customers", label: "Müştərilər" },
  { id: "loads", label: "Yüklər" },
  { id: "voyages", label: "Reyslər" },
  { id: "users", label: "İstifadəçilər" },
  { id: "documents", label: "Sənədlər" },
  { id: "transport", label: "Nəqliyyat" },
  { id: "other", label: "Digəri" },
  { id: "sort", label: "Çeşidləmə" },
  { id: "templates", label: "Şablonlar" },
];

export const STATUS_OPTIONS = [
  { value: "", label: "Hamısı" },
  { value: "planned", label: "Planlaşdırılıb" },
  { value: "progress", label: "Davam edir" },
  { value: "completed", label: "Tamamlandı" },
];
