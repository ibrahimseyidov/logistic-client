import type { SifarisOrderRow } from "../types/sifaris.types";

const mk = (
  i: number,
  partial: Partial<SifarisOrderRow> & Pick<SifarisOrderRow, "statusKind" | "statusLabel">,
): SifarisOrderRow => {
  const day = String((i % 28) + 1).padStart(2, "0");
  const base: SifarisOrderRow = {
    id: `ord-${i}`,
    orderNumber: `ZF${26000 + i}`,
    orderDate: `2025-01-${day}`,
    actCreatedAt: `2025-01-${day}`,
    actDate: `2025-01-${String(Math.min(28, (i % 28) + 2)).padStart(2, "0")}`,
    cmrUnloadDate: `2025-02-${day}`,
    invoicedDate: `2025-02-${String(Math.min(28, (i % 28) + 3)).padStart(2, "0")}`,
    statusKind: partial.statusKind,
    statusLabel: partial.statusLabel,
    customer: partial.customer ?? "ACME Logistics",
    customerRefs: partial.customerRefs ?? `REF-${1000 + i}`,
    customerOrderRef: partial.customerOrderRef ?? `CUST-ORD-${i}`,
    carriers: partial.carriers ?? "Carrier X — 1200 EUR",
    voyageNumber: partial.voyageNumber ?? `V-${400 + i}`,
    route: partial.route ?? "Bakı — İstanbul",
    cargoParams:
      partial.cargoParams ??
      "Tip: Palet\nLDM: 13.6\nHəcm: 68 m³\nÇəki: 12 t\nSay: 12",
    freight: partial.freight ?? "1200 EUR",
    extraCosts: partial.extraCosts ?? "150 AZN",
    profit: partial.profit ?? "420 AZN",
    documents: partial.documents ?? "✓ CMR  ✓ Akt",
    company: partial.company ?? "Ziyafreight",
    weightKg: partial.weightKg ?? 12000 + i * 10,
    volumeM3: partial.volumeM3 ?? 60 + i * 0.5,
    ldm: partial.ldm ?? 13.6,
    freightAzn: partial.freightAzn ?? 2000 + i * 5,
    profitAzn: partial.profitAzn ?? 400 + i * 3,
  };
  return { ...base, ...partial };
};

export const MOCK_SIFARISLER: SifarisOrderRow[] = [
  mk(1, {
    statusKind: "planned",
    statusLabel: "Planlaşdırılıb",
    orderNumber: "ZF26065",
    route: "Gəncə — Berlin",
  }),
  mk(2, {
    statusKind: "progress",
    statusLabel: "Davam edir",
    customer: "Elmry MMC",
  }),
  mk(3, {
    statusKind: "completed",
    statusLabel: "Tamamlandı",
    route: "Sumqayıt — Varşava",
  }),
  mk(4, { statusKind: "planned", statusLabel: "Planlaşdırılıb" }),
  mk(5, { statusKind: "progress", statusLabel: "Davam edir", company: "Elmry ERP" }),
  mk(6, { statusKind: "completed", statusLabel: "Tamamlandı" }),
  mk(7, { statusKind: "planned", statusLabel: "Planlaşdırılıb" }),
  mk(8, { statusKind: "progress", statusLabel: "Davam edir" }),
  mk(9, { statusKind: "completed", statusLabel: "Tamamlandı" }),
  mk(10, { statusKind: "planned", statusLabel: "Planlaşdırılıb" }),
  mk(11, { statusKind: "progress", statusLabel: "Davam edir" }),
  mk(12, { statusKind: "completed", statusLabel: "Tamamlandı" }),
  mk(13, { statusKind: "planned", statusLabel: "Planlaşdırılıb" }),
  mk(14, { statusKind: "progress", statusLabel: "Davam edir" }),
  mk(15, { statusKind: "completed", statusLabel: "Tamamlandı" }),
  mk(16, { statusKind: "planned", statusLabel: "Planlaşdırılıb" }),
  mk(17, { statusKind: "progress", statusLabel: "Davam edir" }),
  mk(18, { statusKind: "completed", statusLabel: "Tamamlandı" }),
  mk(19, { statusKind: "planned", statusLabel: "Planlaşdırılıb" }),
  mk(20, { statusKind: "progress", statusLabel: "Davam edir" }),
  mk(21, { statusKind: "completed", statusLabel: "Tamamlandı" }),
  mk(22, { statusKind: "planned", statusLabel: "Planlaşdırılıb" }),
];
