export type AyarlarTab = "users" | "cargo-specs" | "incoterms" | "contact-persons";

export const AYARLAR_TABS: { id: AyarlarTab; label: string }[] = [
  { id: "users", label: "İstifadəçilər" },
  { id: "cargo-specs", label: "Cargo specifications" },
  { id: "incoterms", label: "Incoterms" },
  { id: "contact-persons", label: "Əlaqədar şəxslər" },
];

export function parseAyarlarTab(tab: string | null): AyarlarTab {
  if (tab === "cargo-specs" || tab === "incoterms" || tab === "contact-persons") return tab;
  return "users";
}
