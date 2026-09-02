import ExcelJS from "exceljs";
import type {
  GenericReportRow,
  PartnerOrderLine,
  PartnerRow,
  ReportId,
} from "./hesabatReports";

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

function finishSheet(worksheet: ExcelJS.Worksheet) {
  applyBorders(worksheet);
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: worksheet.columns.length },
  };
  worksheet.views = [
    { state: "frozen", xSplit: 0, ySplit: 1, activeCell: "A2" },
  ];
}

const MONEY_FMT = "#,##0.00";

export async function exportPartnerReportToExcel(opts: {
  title: string;
  partnerLabel: string;
  rows: PartnerRow[];
}) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(opts.title.slice(0, 31));

  worksheet.columns = [
    { header: opts.partnerLabel, key: "name", width: 36 },
    { header: "Görülən iş", key: "orderCount", width: 14 },
    { header: "Borc (AZN)", key: "owedAzn", width: 16 },
    { header: "Ödənilib (AZN)", key: "paidAzn", width: 18 },
    { header: "Qalıq (AZN)", key: "balanceAzn", width: 16 },
  ];

  styleHeader(worksheet.getRow(1));

  opts.rows.forEach((r) => {
    const row = worksheet.addRow({
      name: r.name,
      orderCount: r.orderCount,
      owedAzn: r.owedAzn,
      paidAzn: r.paidAzn,
      balanceAzn: r.balanceAzn,
    });
    (["owedAzn", "paidAzn", "balanceAzn"] as const).forEach((k) => {
      row.getCell(k).numFmt = MONEY_FMT;
    });
  });

  const totals = opts.rows.reduce(
    (acc, r) => ({
      owed: acc.owed + r.owedAzn,
      paid: acc.paid + r.paidAzn,
      balance: acc.balance + r.balanceAzn,
    }),
    { owed: 0, paid: 0, balance: 0 },
  );
  const totalRow = worksheet.addRow({
    name: "Cəmi",
    orderCount: "",
    owedAzn: totals.owed,
    paidAzn: totals.paid,
    balanceAzn: totals.balance,
  });
  totalRow.font = { bold: true };
  totalRow.getCell("owedAzn").numFmt = MONEY_FMT;
  totalRow.getCell("paidAzn").numFmt = MONEY_FMT;
  totalRow.getCell("balanceAzn").numFmt = MONEY_FMT;

  finishSheet(worksheet);
  const stamp = new Date().toISOString().split("T")[0];
  await downloadWorkbook(workbook, `${opts.title}_${stamp}.xlsx`);
}

export async function exportPartnerDetailedReportToExcel(opts: {
  title: string;
  partnerLabel: string;
  partners: PartnerRow[];
  orderLines: PartnerOrderLine[];
}) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(
    `${opts.title.slice(0, 20)} detallı`.slice(0, 31),
  );

  worksheet.columns = [
    { header: opts.partnerLabel, key: "partner", width: 36 },
    { header: "Sifariş", key: "orderNumber", width: 18 },
    { header: "Tarix", key: "orderDate", width: 14 },
    { header: "Status", key: "status", width: 22 },
    { header: "Borc (AZN)", key: "owedAzn", width: 16 },
    { header: "Ödənilib (AZN)", key: "paidAzn", width: 18 },
    { header: "Qalıq (AZN)", key: "balanceAzn", width: 16 },
  ];

  styleHeader(worksheet.getRow(1));

  const moneyKeys = ["owedAzn", "paidAzn", "balanceAzn"] as const;
  const applyMoney = (row: ExcelJS.Row) => {
    moneyKeys.forEach((k) => {
      row.getCell(k).numFmt = MONEY_FMT;
    });
  };

  const linesByPartner = new Map<string, typeof opts.orderLines>();
  opts.orderLines.forEach((line) => {
    const list = linesByPartner.get(line.partnerKey) || [];
    list.push(line);
    linesByPartner.set(line.partnerKey, list);
  });

  opts.partners.forEach((partner) => {
    const header = worksheet.addRow({
      partner: partner.name,
      orderNumber: `${partner.orderCount} sifariş — cəmi`,
      orderDate: "",
      status: "",
      owedAzn: partner.owedAzn,
      paidAzn: partner.paidAzn,
      balanceAzn: partner.balanceAzn,
    });
    header.font = { bold: true, color: { argb: "FF0F172A" } };
    header.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE2E8F0" },
    };
    applyMoney(header);

    const lines = linesByPartner.get(partner.key) || [];
    if (lines.length === 0) {
      const empty = worksheet.addRow({
        partner: "",
        orderNumber: "Sifariş yoxdur",
        orderDate: "—",
        status: "—",
        owedAzn: 0,
        paidAzn: 0,
        balanceAzn: 0,
      });
      empty.font = { italic: true, color: { argb: "FF64748B" } };
      applyMoney(empty);
      return;
    }

    lines.forEach((line) => {
      const row = worksheet.addRow({
        partner: partner.name,
        orderNumber: line.orderNumber,
        orderDate: line.orderDate,
        status: line.status,
        owedAzn: line.owedAzn,
        paidAzn: line.paidAzn,
        balanceAzn: line.balanceAzn,
      });
      applyMoney(row);
    });
  });

  const totals = opts.partners.reduce(
    (acc, r) => ({
      owed: acc.owed + r.owedAzn,
      paid: acc.paid + r.paidAzn,
      balance: acc.balance + r.balanceAzn,
    }),
    { owed: 0, paid: 0, balance: 0 },
  );
  const totalRow = worksheet.addRow({
    partner: "Cəmi",
    orderNumber: "",
    orderDate: "",
    status: "",
    owedAzn: totals.owed,
    paidAzn: totals.paid,
    balanceAzn: totals.balance,
  });
  totalRow.font = { bold: true };
  applyMoney(totalRow);

  finishSheet(worksheet);
  const stamp = new Date().toISOString().split("T")[0];
  await downloadWorkbook(workbook, `${opts.title}_detallı_${stamp}.xlsx`);
}

export async function exportGenericReportToExcel(opts: {
  title: string;
  headers: string[];
  rows: GenericReportRow[];
  totalLabel?: string;
  totalValue?: number;
  totalColumnIndex?: number;
}) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(opts.title.slice(0, 31));

  worksheet.columns = opts.headers.map((header, i) => ({
    header,
    key: `c${i}`,
    width: Math.max(14, Math.min(42, header.length + 8)),
  }));

  styleHeader(worksheet.getRow(1));

  opts.rows.forEach((r) => {
    const values: Record<string, string | number> = {};
    r.cells.forEach((cell, i) => {
      values[`c${i}`] = cell;
    });
    const added = worksheet.addRow(values);
    added.alignment = { vertical: "top", wrapText: true };
  });

  if (
    opts.totalLabel &&
    opts.totalColumnIndex != null &&
    Number.isFinite(opts.totalValue)
  ) {
    const values: Record<string, string | number> = {};
    opts.headers.forEach((_, i) => {
      values[`c${i}`] = "";
    });
    values.c0 = opts.totalLabel;
    values[`c${opts.totalColumnIndex}`] =
      `${Number(opts.totalValue).toLocaleString("az-AZ", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} AZN`;
    const totalRow = worksheet.addRow(values);
    totalRow.font = { bold: true };
  }

  finishSheet(worksheet);
  const stamp = new Date().toISOString().split("T")[0];
  await downloadWorkbook(workbook, `${opts.title}_${stamp}.xlsx`);
}

export function reportExcelFileTitle(id: ReportId | null): string {
  switch (id) {
    case "customers":
      return "Müştəri hesabatı";
    case "carriers":
      return "Daşıyıcı hesabatı";
    case "queries":
      return "Sorğu hesabatı";
    case "orders":
      return "Sifariş hesabatı";
    case "expenses":
      return "Xərc hesabatı";
    default:
      return "Hesabat";
  }
}
