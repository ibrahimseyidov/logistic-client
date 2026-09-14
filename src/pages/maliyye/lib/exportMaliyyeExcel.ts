import ExcelJS from "exceljs";
import {
  isIncomeTx,
  isSystemBalanceAdjustment,
  resolveTxCashAzn,
  type WalletTab,
} from "./financeWallet.utils";
import { partnerLabel, resolveDocType } from "./filterMaliyye";

function downloadWorkbook(workbook: ExcelJS.Workbook, fileName: string) {
  return workbook.xlsx.writeBuffer().then((buffer) => {
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    window.URL.revokeObjectURL(url);
  });
}

function styleHeader(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
  row.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E293B" },
  };
  row.alignment = { vertical: "middle", horizontal: "center" };
  row.height = 25;
}

function applyBorders(worksheet: ExcelJS.Worksheet) {
  worksheet.eachRow((excelRow) => {
    excelRow.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
    });
  });
}

function formatDateOnly(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("az-AZ");
}

function formatDateTime(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("az-AZ", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function maliyyeWalletTitle(tab: WalletTab): string {
  if (tab === "Kasa") return "Kassam";
  if (tab === "Bank") return "Bank hesabı";
  return "Ümumi";
}

const MONEY_FMT = "#,##0.00";

export async function exportMaliyyeToExcel(opts: {
  tab: WalletTab;
  rows: any[];
  stats: { totalIn: number; totalOut: number; balance: number };
  rates?: Record<string, number> | null;
}) {
  const title = maliyyeWalletTitle(opts.tab);
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(title.slice(0, 31));

  worksheet.mergeCells("A1:D1");
  const titleCell = worksheet.getCell("A1");
  titleCell.value = `Maliyyə — ${title}`;
  titleCell.font = { bold: true, size: 14 };
  titleCell.alignment = { vertical: "middle" };

  worksheet.getCell("A2").value = "Ümumi mədaxil (AZN)";
  worksheet.getCell("B2").value = opts.stats.totalIn;
  worksheet.getCell("B2").numFmt = MONEY_FMT;
  worksheet.getCell("C2").value = "Ümumi məxaric (AZN)";
  worksheet.getCell("D2").value = opts.stats.totalOut;
  worksheet.getCell("D2").numFmt = MONEY_FMT;

  worksheet.getCell("A3").value = "Cari qalıq (AZN)";
  worksheet.getCell("B3").value = opts.stats.balance;
  worksheet.getCell("B3").numFmt = MONEY_FMT;
  worksheet.getCell("C3").value = "Sətir sayı";
  worksheet.getCell("D3").value = opts.rows.length;

  const headerRow = 5;
  worksheet.getRow(headerRow).values = [
    "ID",
    "Tip",
    "Metod",
    "Məbləğ (AZN)",
    "Valyuta",
    "Orijinal məbləğ",
    "Ad",
    "Sənəd tipi",
    "Tərəfdaş",
    "Sifariş",
    "Əməliyyat tarixi",
    "Yaradan",
    "Yaradılma vaxtı",
    "Redaktə edən",
    "Redaktə vaxtı",
  ];
  styleHeader(worksheet.getRow(headerRow));

  worksheet.columns = [
    { width: 8 },
    { width: 10 },
    { width: 12 },
    { width: 14 },
    { width: 10 },
    { width: 14 },
    { width: 28 },
    { width: 18 },
    { width: 24 },
    { width: 10 },
    { width: 14 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
  ];

  opts.rows.forEach((tx) => {
    const income = isIncomeTx(tx);
    const azn = resolveTxCashAzn(tx, opts.rates);
    const signedAzn = income ? azn : -azn;
    const currency = String(tx.currency || "AZN").toUpperCase();
    const rawAmount = Number(tx.amount) || 0;
    const edited =
      tx.updatedAt &&
      tx.createdAt &&
      new Date(tx.updatedAt).getTime() - new Date(tx.createdAt).getTime() > 2000;

    const row = worksheet.addRow([
      tx.id,
      income ? "Gəlir" : "Xərc",
      tx.paymentMethod || "",
      signedAzn,
      currency,
      rawAmount !== 0 ? rawAmount : "",
      tx.name || "",
      resolveDocType(tx),
      isSystemBalanceAdjustment(tx) ? "Sistem" : partnerLabel(tx) || "",
      tx.orderId ? `#${tx.orderId}` : "",
      formatDateOnly(tx.date || tx.costDate),
      tx.createdByName || tx.user || "",
      formatDateTime(tx.createdAt),
      edited ? tx.updatedByName || "" : "",
      edited ? formatDateTime(tx.updatedAt) : "",
    ]);

    const amountCell = row.getCell(4);
    amountCell.numFmt = MONEY_FMT;
    if (signedAzn > 0) {
      amountCell.font = { color: { argb: "FF047857" } };
    } else if (signedAzn < 0) {
      amountCell.font = { color: { argb: "FFB91C1C" } };
    }
  });

  applyBorders(worksheet);
  worksheet.views = [
    { state: "frozen", xSplit: 0, ySplit: headerRow, activeCell: `A${headerRow + 1}` },
  ];
  worksheet.autoFilter = {
    from: { row: headerRow, column: 1 },
    to: { row: headerRow, column: 15 },
  };

  const stamp = new Date().toISOString().split("T")[0];
  await downloadWorkbook(workbook, `Maliyyə_${title}_${stamp}.xlsx`);
}
