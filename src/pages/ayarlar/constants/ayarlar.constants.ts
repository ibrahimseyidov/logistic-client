export type AyarlarTab =
  | "users"
  | "cargo-specs"
  | "incoterms"
  | "contact-persons"
  | "contact-positions"
  | "transport-types";

export const AYARLAR_TITLE = "Parametrlər";

export const AYARLAR_TABS: { id: AyarlarTab; label: string }[] = [
  { id: "users", label: "İstifadəçilər" },
  { id: "cargo-specs", label: "Yükün parametrləri" },
  { id: "incoterms", label: "İnkoterms" },
  { id: "contact-persons", label: "Əlaqədar şəxslər" },
  { id: "contact-positions", label: "Vəzifələr" },
  { id: "transport-types", label: "Nəqliyyat tipləri" },
];

export function getAyarlarTabLabel(id: AyarlarTab): string {
  return AYARLAR_TABS.find((tab) => tab.id === id)?.label ?? AYARLAR_TITLE;
}

export function parseAyarlarTab(tab: string | null): AyarlarTab {
  if (
    tab === "cargo-specs" ||
    tab === "incoterms" ||
    tab === "contact-persons" ||
    tab === "contact-positions" ||
    tab === "transport-types"
  ) {
    return tab;
  }
  return "users";
}
