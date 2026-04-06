import type { EmekFilterSectionId } from "../types/emek.types";

export const EMEK_ITEMS_PER_PAGE = 10;

export const EMEK_FILTER_SECTIONS: { id: EmekFilterSectionId; label: string }[] = [
  { id: "id", label: "ID" },
  { id: "dates", label: "Tarixlər" },
  { id: "customers", label: "Müştərilər" },
  { id: "users", label: "İstifadəçilər" },
  { id: "other", label: "Digəri" },
  { id: "templates", label: "Şablonlar" },
];

export const EMEK_TIP_OPTIONS = [
  { value: "", label: "Hamısı" },
  { value: "order", label: "Sifarişə görə" },
  { value: "voyage", label: "Reysə görə" },
];

export const EMEK_STATUS_OPTIONS = [
  { value: "", label: "Hamısı" },
  { value: "progress", label: "Davam edir" },
  { value: "completed", label: "Tamamlandı" },
];

export const EMEK_CUSTOMER_TYPE_OPTIONS = [
  { value: "", label: "Hamısı" },
  { value: "legal", label: "Hüquqi şəxs" },
  { value: "individual", label: "Fiziki şəxs" },
];
