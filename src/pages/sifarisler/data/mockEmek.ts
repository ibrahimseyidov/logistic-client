import type { EmekRow } from "../types/emek.types";

function row(i: number, partial: Partial<EmekRow> & Pick<EmekRow, "orderNumber">): EmekRow {
  const od = String((i % 28) + 1).padStart(2, "0");
  const iso = `2026-04-${od}`;
  const profit = 800 + i * 95 + (i % 4) * 12;
  const amount = 5000 + i * 200;
  const paidAmt = i % 3 === 0 ? amount - 1200 : amount;
  const base: EmekRow = {
    id: `emek-${i}`,
    kind: i % 2 === 0 ? "order" : "voyage",
    orderNumber: partial.orderNumber,
    orderDate: `${od}.04.2026`,
    orderDateIso: iso,
    orderStatus: i % 3 === 0 ? "Tamamlandı" : "Davam edir",
    customer: partial.customer ?? (i % 2 === 0 ? "Karat MMC" : "Ziya Freight"),
    employee: partial.employee ?? (i % 2 === 0 ? "Ulvi Adilzadə" : "Nərgiz K."),
    employeeRequired: partial.employeeRequired ?? i % 5 === 0,
    freight: partial.freight ?? `${900 + i * 10} EUR`,
    expensesAzn: partial.expensesAzn ?? 400 + i * 20,
    profitAzn: partial.profitAzn ?? profit,
    revenuePct: partial.revenuePct ?? 0,
    totalBonusAzn: partial.totalBonusAzn ?? 0,
    bonusPct: partial.bonusPct ?? (i % 4 === 0 ? 20 : 0),
    rewardAmount: partial.rewardAmount ?? 0,
    paidLabel: partial.paidLabel ?? "Xeyr",
    paymentDate: partial.paymentDate ?? "",
    route: partial.route ?? "Bakı — İstanbul",
    carrier: partial.carrier ?? "China-Base",
    incompleteLoad: partial.incompleteLoad ?? (i % 7 === 0 ? "Bəli" : "Xeyr"),
    tripNumber: partial.tripNumber ?? `R-${410 + i}`,
    voyagePrice: partial.voyagePrice ?? `${1100 + i} USD`,
    accounts: partial.accounts ?? `HES-${7000 + i}`,
    amountAzn: partial.amountAzn ?? amount,
    paidAmountAzn: partial.paidAmountAzn ?? paidAmt,
    amountRed: partial.amountRed ?? i % 6 === 0,
    paidAmountRed: partial.paidAmountRed ?? i % 6 === 0,
    company: partial.company ?? "Ziyafreight",
  };
  return { ...base, ...partial };
}

export const MOCK_EMEK: EmekRow[] = [
  row(1, { orderNumber: "ZF26062", employeeRequired: true, amountRed: true, paidAmountRed: true }),
  row(2, { orderNumber: "ZF26063" }),
  row(3, { orderNumber: "ZF26064", orderStatus: "Tamamlandı" }),
  row(4, { orderNumber: "ZF26065" }),
  row(5, { orderNumber: "ZF26066", company: "Elmry ERP" }),
  row(6, { orderNumber: "ZF26067" }),
  row(7, { orderNumber: "ZF26068" }),
  row(8, { orderNumber: "ZF26069" }),
  row(9, { orderNumber: "ZF26070" }),
  row(10, { orderNumber: "ZF26071" }),
  row(11, { orderNumber: "ZF26072" }),
  row(12, { orderNumber: "ZF26073" }),
  row(13, { orderNumber: "ZF26074" }),
  row(14, { orderNumber: "ZF26075" }),
  row(15, { orderNumber: "ZF26076" }),
  row(16, { orderNumber: "ZF26077" }),
];
