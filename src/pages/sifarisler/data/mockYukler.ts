import type { YukLoadRow } from "../types/yuk.types";

function row(
  i: number,
  partial: Partial<YukLoadRow> & Pick<YukLoadRow, "orderRef" | "cargoNumber">,
): YukLoadRow {
  const base: YukLoadRow = {
    id: `yuk-${i}`,
    orderRef: partial.orderRef,
    company: partial.company ?? "Ziyafreight",
    customer: partial.customer ?? "ACME Logistics MMC",
    loadDate: partial.loadDate ?? "",
    unloadDate: partial.unloadDate ?? "",
    sender: partial.sender ?? "",
    loadPlace:
      partial.loadPlace ??
      "CN, Foshan, 4-cü mərtəbə, Anbang logistika anbarı, Nanhai rayonu",
    recipient: partial.recipient ?? "AZ, Bakı",
    unloadPlace:
      partial.unloadPlace ??
      "AZ, Bakı, Xəzər rayonu, Zəngəzur küçəsi 12, anbar №3",
    cargoStatus: partial.cargoStatus ?? "Yüklənmədə",
    place: partial.place ?? "",
    entryDate: partial.entryDate ?? "2025-01-15",
    entryTime: partial.entryTime ?? "14:32",
    comments: partial.comments ?? "",
    cargoNumber: partial.cargoNumber,
    cargoName: partial.cargoName ?? "Dental malları",
    cargoParams:
      partial.cargoParams ??
      "Ad: General cargo\nLDM: 13.6\nHəcm: 68 m³\nÇəki: 12 450 kq\nSay: 120\nQabarit: 120×80×180 sm",
    attributes: partial.attributes ?? "",
    carrier: partial.carrier ?? "Silk Road Transport",
    tripId: partial.tripId ?? `R-${400 + i}`,
    ldm: partial.ldm ?? 13.6 + (i % 5) * 0.2,
    weightKg: partial.weightKg ?? 12000 + i * 120,
    volumeM3: partial.volumeM3 ?? 60 + i * 0.4,
    userLabel: partial.userLabel ?? "Ulvi Adilzadə",
  };
  return { ...base, ...partial };
}

export const MOCK_YUKLER: YukLoadRow[] = [
  row(1, {
    orderRef: "ZF26065",
    cargoNumber: "ZF26065-1",
    cargoName: "Dental malları",
    tripId: "R-412",
  }),
  row(2, {
    orderRef: "ZF26066",
    cargoNumber: "ZF26066-1",
    cargoName: "General Cargo",
    cargoStatus: "Yolda",
    userLabel: "Nərgiz K.",
  }),
  row(3, {
    orderRef: "ZF26067",
    cargoNumber: "ZF26067-2",
    carrier: "Euro Line",
  }),
  row(4, { orderRef: "ZF26068", cargoNumber: "ZF26068-1" }),
  row(5, { orderRef: "ZF26069", cargoNumber: "ZF26069-1", company: "Elmry ERP" }),
  row(6, { orderRef: "ZF26070", cargoNumber: "ZF26070-1" }),
  row(7, { orderRef: "ZF26071", cargoNumber: "ZF26071-1" }),
  row(8, { orderRef: "ZF26072", cargoNumber: "ZF26072-1" }),
  row(9, { orderRef: "ZF26073", cargoNumber: "ZF26073-1" }),
  row(10, { orderRef: "ZF26074", cargoNumber: "ZF26074-1" }),
  row(11, { orderRef: "ZF26075", cargoNumber: "ZF26075-1" }),
  row(12, { orderRef: "ZF26076", cargoNumber: "ZF26076-1" }),
  row(13, { orderRef: "ZF26077", cargoNumber: "ZF26077-1" }),
  row(14, { orderRef: "ZF26078", cargoNumber: "ZF26078-1" }),
  row(15, { orderRef: "ZF26079", cargoNumber: "ZF26079-1" }),
  row(16, { orderRef: "ZF26080", cargoNumber: "ZF26080-1" }),
];
