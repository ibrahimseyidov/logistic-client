import type { YukFilterSectionId } from "../types/yuk.types";

export const YUK_ITEMS_PER_PAGE = 10;

export const YUK_FILTER_SECTIONS: { id: YukFilterSectionId; label: string }[] = [
  { id: "id", label: "ID" },
  { id: "counterparties", label: "Kontragentlər" },
  { id: "loading", label: "Yükləmə" },
  { id: "reload", label: "Təkrar yükləmə" },
  { id: "unloading", label: "Boşaltma" },
  { id: "cargo_statuses", label: "Yüklərin statusları" },
  { id: "loads", label: "Yüklər" },
  { id: "orders", label: "Sifarişlər" },
  { id: "sort", label: "Çeşidləmə" },
  { id: "templates", label: "Şablonlar" },
];

export const YUK_USER_OPTIONS = [
  { value: "", label: "Hamısı" },
  { value: "ulvi", label: "Ulvi Adilzadə" },
  { value: "nargiz", label: "Nərgiz K." },
  { value: "elchin", label: "Elçin Məmmədov" },
];

export const YUK_CARGO_STATUS_OPTIONS = [
  "Yüklənmədə",
  "Yolda",
  "Gömrükdə",
  "Boşaltmada",
  "Tamamlandı",
];
