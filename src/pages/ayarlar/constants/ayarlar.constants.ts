export type AyarlarTab = "users" | "cargo-specs" | "incoterms";

export const AYARLAR_TABS: { id: AyarlarTab; label: string }[] = [
  { id: "users", label: "İstifadəçilər" },
  { id: "cargo-specs", label: "Cargo specifications" },
  { id: "incoterms", label: "Incoterms" },
];

export function parseAyarlarTab(tab: string | null): AyarlarTab {
  if (tab === "cargo-specs" || tab === "incoterms") return tab;
  return "users";
}
