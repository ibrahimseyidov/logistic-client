import type { ReysRow, ReysTransportMode } from "../types/reys.types";

const modes: ReysTransportMode[] = ["auto", "rail", "sea", "air", "own", "auto"];

export function buildMockReysler(): ReysRow[] {
  const rows: ReysRow[] = [];
  for (let i = 1; i <= 22; i++) {
    const od = String((i % 28) + 1).padStart(2, "0");
    const orderDateIso = `2026-04-${od}`;
    const tripDateIso = `2026-04-${String(Math.min(28, (i % 28) + 1)).padStart(2, "0")}`;
    const mode = modes[i % modes.length];
    rows.push({
      id: `reys-${i}`,
      orderRef: "ZF26065",
      orderDate: `${od}.04.2026`,
      orderDateIso,
      tripDateIso,
      tripRef: `ZF260 65-${i}`,
      tripStatus: "Planlaşdırılıb",
      tripStatusKind: i % 3 === 0 ? "completed" : i % 3 === 1 ? "progress" : "planned",
      customer: i % 2 === 0 ? "Karat MMC" : "ACME Logistics",
      tripPrice: `${500 + i} USD ƏDV ilə`,
      carrier: "China-Base",
      vehicleInfo: `90-XX-001 | Qoşqu 12 | Sürücü: A.${String.fromCharCode(65 + (i % 26))}.`,
      cargoInfo:
        i % 2 === 0
          ? "Dental malları"
          : `General Cargo / Kont: MSKU${7000000 + i}`,
      loadDate: "",
      sender: "",
      loading: "",
      unloadDate: "",
      receiver: "",
      unloading: "",
      tags:
        i % 4 === 0
          ? `Qeyd: Gömrük\n15.04.2026`
          : i % 4 === 1
            ? "Prioritet"
            : "",
      company: i % 3 === 0 ? "Elmry ERP" : "Ziyafreight",
      transportMode: mode,
      valueAzn: 2800 + i * 120 + (i % 7) * 50,
    });
  }
  return rows;
}

export const MOCK_REYSLER: ReysRow[] = buildMockReysler();
