import type { OrderStatusKind, SifarisFilterSectionId } from "../types/sifaris.types";

export const ITEMS_PER_PAGE = 10;

export const FILTER_SECTIONS: { id: SifarisFilterSectionId; label: string }[] = [
  { id: "id", label: "ID" },
  { id: "dates", label: "Tarixlər" },
  { id: "customers", label: "Müştərilər" },
  { id: "loads", label: "Yüklər" },
  { id: "users", label: "İstifadəçilər" },
  { id: "documents", label: "Sənədlər" },
  { id: "transport", label: "Nəqliyyat" },
  { id: "sort", label: "Çeşidləmə" },
  { id: "templates", label: "Şablonlar" },
];

export const STATUS_OPTIONS = [
  { value: "", label: "Hamısı" },
  { value: "planned", label: "Planlaşdırılıb" },
  { value: "progress", label: "Davam edir" },
  { value: "completed", label: "Tamamlandı" },
  { value: "finance_closed", label: "Maliyyə bağlanıb" },
  { value: "cancelled", label: "Ləğv edilib" },
];

export const SIFARIS_STATUS_PILLS: Array<{
  value: OrderStatusKind;
  label: string;
  tone: "sky" | "amber" | "emerald" | "violet" | "rose";
}> = [
  { value: "planned", label: "Planlaşdırılıb", tone: "sky" },
  { value: "progress", label: "Davam edir", tone: "amber" },
  { value: "completed", label: "Tamamlandı", tone: "emerald" },
  { value: "finance_closed", label: "Maliyyə bağlanıb", tone: "violet" },
  { value: "cancelled", label: "Ləğv edilib", tone: "rose" },
];
