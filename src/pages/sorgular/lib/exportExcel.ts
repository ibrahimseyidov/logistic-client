import ExcelJS from "exceljs";
import type { LogisticQueryRow } from "../types/sorgu.types";

export const exportSorgularToExcel = async (rows: LogisticQueryRow[], customers?: any[]) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Sorğular");

  // 1. Define Columns
  worksheet.columns = [
    { header: "Sorğu No", key: "number", width: 15 },
    { header: "Status", key: "status", width: 15 },
    { header: "Yaradılma Tarixi", key: "createdAt", width: 20 },
    { header: "Yük Haqqında", key: "cargo", width: 45 },
    { header: "Göndərən", key: "sender", width: 25 },
    { header: "Yüklənmə Tarixi", key: "loadDate", width: 18 },
    { header: "Boşaldılma Tarixi", key: "unloadDate", width: 18 },
    { header: "Müştəri", key: "customer", width: 30 },
    { header: "Şirkət", key: "company", width: 20 },
    { header: "Satıcı", key: "seller", width: 20 },
  ];

  // 2. Style Header Row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E293B" }, // Navy color
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.height = 25;

  // 3. Add Data
  rows.forEach((row) => {
    const cargoSummary = (row as any).cargoItems
      ?.map((item: any) => {
        const parts = [item.name || "Adsız yük"];
        if (item.weight) parts.push(`${item.weight}kq`);
        if (item.ldm) parts.push(`LDM:${item.ldm}`);
        if (item.transportType) parts.push(item.transportType);
        return parts.join(" | ");
      })
      .join("\n") || "—";

    const formatDate = (iso?: string) => {
      if (!iso) return "—";
      return new Date(iso).toLocaleDateString("az-AZ");
    };

    const customerText = String((row as any).customer || "");
    const foundCustomer = Array.isArray(customers)
      ? customers.find(c => c.id?.toString() === customerText)
      : null;
    const customerName = foundCustomer
      ? (foundCustomer.name || foundCustomer.companyName || foundCustomer.fullName)
      : ((row as any).customerName || (row as any).customer?.fullName || customerText || "—");

    const addedRow = worksheet.addRow({
      number: row.number || "—",
      status: row.status || "—",
      createdAt: formatDate(row.createdAt),
      cargo: cargoSummary,
      sender: (row as any).loadPlaceCompany || row.sender || "—",
      loadDate: formatDate(row.loadDate),
      unloadDate: formatDate(row.unloadDate),
      customer: customerName,
      company: row.company || "—",
      seller: row.seller || "—",
    });

    // Style data row
    addedRow.alignment = { vertical: "top", wrapText: true };
    addedRow.height = Math.max(20, (cargoSummary.split("\n").length * 15));
  });

  // 4. Add Borders to all cells
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
    });
  });

  // 5. Add AutoFilter and Freeze First Row
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: worksheet.columns.length },
  };
  worksheet.views = [
    { state: "frozen", xSplit: 0, ySplit: 1, activeCell: "A2" }
  ];

  // 6. Generate and Download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `Sorğular_İxrac_${new Date().toISOString().split("T")[0]}.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);
};
