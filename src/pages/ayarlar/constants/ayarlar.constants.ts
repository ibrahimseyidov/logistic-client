export type AyarlarTab =
  | "users"
  | "cargo-specs"
  | "incoterms"
  | "contact-persons"
  | "contact-positions"
  | "transport-types";

export const AYARLAR_TABS: { id: AyarlarTab; label: string }[] = [
  { id: "users", label: "İstifadəçilər" },
  { id: "cargo-specs", label: "Cargo specifications" },
  { id: "incoterms", label: "Incoterms" },
  { id: "contact-persons", label: "Əlaqədar şəxslər" },
  { id: "contact-positions", label: "Vəzifələr" },
  { id: "transport-types", label: "Nəqliyyat tipləri" },
];

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
