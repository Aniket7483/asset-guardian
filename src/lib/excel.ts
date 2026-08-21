import * as XLSX from "xlsx";

export type Row = Record<string, string | number | null | undefined>;

export function exportRows(rows: Row[], fileName: string, format: "xlsx" | "csv" = "xlsx") {
  const ws = XLSX.utils.json_to_sheet(rows);
  if (format === "csv") {
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    triggerDownload(blob, `${fileName}.csv`);
    return;
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  triggerDownload(new Blob([out], { type: "application/octet-stream" }), `${fileName}.xlsx`);
}

function triggerDownload(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export async function parseSpreadsheet(file: File): Promise<Row[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json<Row>(ws, { defval: "" });
}

export const IMPORT_COLUMNS = [
  "Asset Name",
  "Category",
  "Asset Type",
  "Brand",
  "Model",
  "Serial Number",
  "Quantity",
  "Condition",
  "Status",
  "Ownership",
  "Purchase Date",
  "Purchase Price",
  "Vendor",
  "Invoice Number",
  "Warranty Start",
  "Warranty End",
  "Building",
  "Floor",
  "Room",
  "Specific Location",
  "Assigned Employee Code",
  "Description",
] as const;

export function downloadTemplate() {
  const sample: Row = {
    "Asset Name": "Dell Latitude 5440",
    Category: "Laptops",
    "Asset Type": "IT Equipment",
    Brand: "Dell",
    Model: "Latitude 5440",
    "Serial Number": "SN-EXAMPLE-001",
    Quantity: 1,
    Condition: "New",
    Status: "Available",
    Ownership: "Company Owned",
    "Purchase Date": "2026-01-15",
    "Purchase Price": 82000,
    Vendor: "Tech Traders",
    "Invoice Number": "INV-2001",
    "Warranty Start": "2026-01-15",
    "Warranty End": "2028-01-15",
    Building: "Main Office",
    Floor: "Ground Floor",
    Room: "IT Room",
    "Specific Location": "Rack 2",
    "Assigned Employee Code": "",
    Description: "Company laptop",
  };
  exportRows([sample], "asset-import-template", "xlsx");
}
