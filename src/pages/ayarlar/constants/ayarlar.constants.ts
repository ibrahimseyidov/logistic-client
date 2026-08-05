export type AyarlarTab =
  | "users"
  | "cash"
  | "cargo-specs"
  | "incoterms"
  | "transport-types"
  | "documents"
  | "notifications"
  | "logs";

export const AYARLAR_TITLE = "Parametrlər";

export const AYARLAR_TABS: { id: AyarlarTab; label: string }[] = [
  { id: "users", label: "İstifadəçilər" },
  { id: "cash", label: "Kassa / Bank" },
  { id: "cargo-specs", label: "Yükün parametrləri" },
  { id: "incoterms", label: "İnkoterms" },
  { id: "transport-types", label: "Nəqliyyat tipləri" },
  { id: "documents", label: "Sənədlər" },
  { id: "notifications", label: "Bildiriş ayarları" },
  { id: "logs", label: "Loglar" },
];

export function getAyarlarTabLabel(id: AyarlarTab): string {
  return AYARLAR_TABS.find((tab) => tab.id === id)?.label ?? AYARLAR_TITLE;
}

export function parseAyarlarTab(tab: string | null): AyarlarTab {
  if (
    tab === "cash" ||
    tab === "cargo-specs" ||
    tab === "incoterms" ||
    tab === "transport-types" ||
    tab === "documents" ||
    tab === "notifications" ||
    tab === "logs"
  ) {
    return tab;
  }
  return "users";
}
