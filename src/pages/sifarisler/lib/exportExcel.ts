import ExcelJS from "exceljs";
import type { SifarisOrderRow } from "../types/sifaris.types";
import { formatDateOnly } from "./formatDate";
import { getCargoTransportLabel } from "./orderCargoDisplay";

function dash(value: unknown): string {
  const text = String(value ?? "").trim();
  return text && text !== "—" ? text : "—";
}

function getCustomerLabel(val: string, customers?: any[]): string {
  if (!val) return "—";
  const trimmed = val.trim();
  if (Array.isArray(customers)) {
    const found = customers.find((c) => c.id?.toString() === trimmed);
    if (found) {
      return (
        found.name ||
        found.companyName ||
        found.company ||
        found.fullName ||
        trimmed
      );
    }
  }
  return trimmed;
}

function formatCargo(row: SifarisOrderRow): string {
  if (Array.isArray(row.cargoItems) && row.cargoItems.length > 0) {
    return row.cargoItems
      .map((item) => {
        const parts = [item.name || "Adsız yük"];
        if (item.weight) parts.push(`${item.weight} kq`);
        if (item.ldm) parts.push(`LDM: ${item.ldm}`);
        if (item.volume) parts.push(`${item.volume} m³`);
        if (item.transportType) {
          parts.push(getCargoTransportLabel(String(item.transportType)));
        }
        if (item.cargoValue || item.currency) {
          parts.push(`${item.cargoValue || "0"} ${item.currency || ""}`.trim());
        }
        return parts.join(" | ");
      })
      .join("\n");
  }
  if (row.cargoParams && row.cargoParams !== "—") {
    return row.cargoParams.replace(/\n?Say:\s*\d+/gi, "");
  }
  return "—";
}

function formatDocuments(row: SifarisOrderRow): string {
  const parts: string[] = [];
  if (row.hasSentInvoice) parts.push("Göndərilən HF");
  if (row.hasReceivedInvoice) parts.push("Gələn HF");
  if (row.hasTransportDoc) parts.push("CMR");
  if (row.hasHandoverAct) parts.push("Akt");
  return parts.length > 0 ? parts.join(", ") : "—";
}

export async function exportSifarislerToExcel(
  rows: SifarisOrderRow[],
  customers?: any[],
) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Sifarişlər");

  worksheet.columns = [
    { header: "Sifarişin nömrəsi", key: "orderNumber", width: 18 },
    { header: "Sorğunun nömrəsi", key: "queryNumber", width: 18 },
    { header: "Konteynerin nömrəsi", key: "containerNumber", width: 22 },
    { header: "Sorğunun tarixi", key: "queryDate", width: 16 },
    { header: "Sifarişin tarixi", key: "orderDate", width: 16 },
    { header: "Sifarişin statusu", key: "status", width: 22 },
    { header: "Müştəri", key: "customer", width: 28 },
    { header: "Daşıyıcılar", key: "carriers", width: 28 },
    { header: "Marşrutlar", key: "route", width: 40 },
    { header: "Yükün parametrləri", key: "cargo", width: 45 },
    { header: "Fraxt", key: "freight", width: 18 },
    { header: "Əlavə xərclər", key: "extraCosts", width: 18 },
    { header: "Mənfəət", key: "profit", width: 16 },
    { header: "Sənədlər", key: "documents", width: 28 },
    { header: "Şirkət", key: "company", width: 18 },
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E293B" },
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.height = 25;

  rows.forEach((row) => {
    const cargo = formatCargo(row);
    const addedRow = worksheet.addRow({
      orderNumber: dash(row.orderNumber),
      queryNumber: dash(row.queryNumber),
      containerNumber: dash(row.voyageNumber),
      queryDate: dash(row.queryDate),
      orderDate: formatDateOnly(row.orderDateIso || row.orderDate),
      status: dash(row.statusLabel),
      customer: getCustomerLabel(row.customer, customers),
      carriers: dash(row.carriers),
      route: dash(row.route),
      cargo,
      freight: dash(row.freight),
      extraCosts: dash(row.extraCosts),
      profit: dash(row.profit),
      documents: formatDocuments(row),
      company: dash(row.company),
    });
    addedRow.alignment = { vertical: "top", wrapText: true };
    addedRow.height = Math.max(20, cargo.split("\n").length * 15);
  });

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

  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: worksheet.columns.length },
  };
  worksheet.views = [
    { state: "frozen", xSplit: 0, ySplit: 1, activeCell: "A2" },
  ];

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `Sifarişlər_İxrac_${new Date().toISOString().split("T")[0]}.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);
}
