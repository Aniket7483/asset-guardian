import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  IMPORT_COLUMNS,
  downloadTemplate,
  exportRows,
  parseSpreadsheet,
  type Row,
} from "@/lib/excel";
import { formatDate } from "@/lib/format";
import {
  useAssets,
  useBuildings,
  useCategories,
  useEmployees,
  useFloors,
  useRefresh,
  useRooms,
} from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/import-export")({
  head: () => ({
    meta: [
      { title: "Import & Export — AssetVault" },
      {
        name: "description",
        content: "Bulk-load assets from Excel or CSV and export the full registry for audits and backups.",
      },
      { property: "og:title", content: "Import & Export — AssetVault" },
      { property: "og:description", content: "Bulk asset import and registry export in Excel or CSV." },
    ],
  }),
  component: ImportExportPage,
});

const str = (v: unknown) => (v === null || v === undefined || v === "" ? null : String(v).trim());

function ImportExportPage() {
  const assets = useAssets();
  const categories = useCategories();
  const buildings = useBuildings();
  const floors = useFloors();
  const rooms = useRooms();
  const employees = useEmployees();
  const refresh = useRefresh();

  const [preview, setPreview] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const handleFile = async (file: File) => {
    try {
      const rows = await parseSpreadsheet(file);
      setPreview(rows);
      setLog([]);
      toast.success(`${rows.length} row(s) loaded — review then import`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const runImport = async () => {
    setBusy(true);
    const errors: string[] = [];
    let ok = 0;
    const findId = (arr: { id: string; name: string }[] | undefined, name: unknown) =>
      arr?.find((x) => x.name.toLowerCase() === String(name ?? "").trim().toLowerCase())?.id ?? null;

    for (const [i, r] of preview.entries()) {
      const name = str(r["Asset Name"]);
      if (!name) {
        errors.push(`Row ${i + 2}: missing Asset Name`);
        continue;
      }
      const buildingId = findId(buildings.data, r["Building"]);
      const floorId =
        (floors.data ?? []).find(
          (f) =>
            f.name.toLowerCase() === String(r["Floor"] ?? "").trim().toLowerCase() &&
            (!buildingId || f.building_id === buildingId),
        )?.id ?? null;
      const roomId =
        (rooms.data ?? []).find(
          (rm) =>
            rm.name.toLowerCase() === String(r["Room"] ?? "").trim().toLowerCase() &&
            (!floorId || rm.floor_id === floorId),
        )?.id ?? null;
      const employeeId =
        (employees.data ?? []).find(
          (e) => e.employee_code.toLowerCase() === String(r["Assigned Employee Code"] ?? "").trim().toLowerCase(),
        )?.id ?? null;

      const { error } = await supabase.from("assets").insert({
        name,
        category_id: findId(categories.data, r["Category"]),
        asset_type: str(r["Asset Type"]),
        brand: str(r["Brand"]),
        model: str(r["Model"]),
        serial_number: str(r["Serial Number"]),
        quantity: Number(r["Quantity"] ?? 1) || 1,
        condition: str(r["Condition"]) ?? "Good",
        status: employeeId ? "Assigned" : (str(r["Status"]) ?? "Available"),
        ownership: str(r["Ownership"]) ?? "Company Owned",
        purchase_date: str(r["Purchase Date"]),
        purchase_price: r["Purchase Price"] ? Number(r["Purchase Price"]) : null,
        vendor: str(r["Vendor"]),
        invoice_number: str(r["Invoice Number"]),
        warranty_start: str(r["Warranty Start"]),
        warranty_end: str(r["Warranty End"]),
        building_id: buildingId,
        floor_id: floorId,
        room_id: roomId,
        specific_location: str(r["Specific Location"]),
        assigned_employee_id: employeeId,
        description: str(r["Description"]),
      });
      if (error) errors.push(`Row ${i + 2}: ${error.message}`);
      else ok += 1;
    }

    setBusy(false);
    setLog([`Imported ${ok} of ${preview.length} row(s).`, ...errors]);
    setPreview([]);
    refresh();
    if (errors.length) toast.warning(`${ok} imported, ${errors.length} failed`);
    else toast.success(`${ok} asset(s) imported`);
  };

  const exportAll = (format: "xlsx" | "csv") => {
    const rows: Row[] = (assets.data ?? []).map((a) => ({
      "Asset Code": a.asset_code,
      "Asset Name": a.name,
      Category: categories.data?.find((c) => c.id === a.category_id)?.name ?? "",
      "Asset Type": a.asset_type ?? "",
      Brand: a.brand ?? "",
      Model: a.model ?? "",
      "Serial Number": a.serial_number ?? "",
      Quantity: a.quantity,
      Condition: a.condition,
      Status: a.status,
      Ownership: a.ownership ?? "",
      "Purchase Date": formatDate(a.purchase_date),
      "Purchase Price": Number(a.purchase_price ?? 0),
      Vendor: a.vendor ?? "",
      "Invoice Number": a.invoice_number ?? "",
      "Warranty Start": formatDate(a.warranty_start),
      "Warranty End": formatDate(a.warranty_end),
      Building: buildings.data?.find((b) => b.id === a.building_id)?.name ?? "",
      Floor: floors.data?.find((f) => f.id === a.floor_id)?.name ?? "",
      Room: rooms.data?.find((r) => r.id === a.room_id)?.name ?? "",
      "Specific Location": a.specific_location ?? "",
      "Assigned Employee Code":
        employees.data?.find((e) => e.id === a.assigned_employee_id)?.employee_code ?? "",
      Description: a.description ?? "",
    }));
    exportRows(rows, "assetvault-registry", format);
  };

  return (
    <div>
      <PageHeader
        title="Import / Export"
        description="Move data in and out of the registry with Excel or CSV files."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Upload className="h-4 w-4 text-muted-foreground" /> Import assets
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Download the template, fill it in, then upload. Categories, locations and employees are matched by name /
            code.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="outline" onClick={downloadTemplate}>
              <FileSpreadsheet className="mr-1.5 h-4 w-4" /> Download template
            </Button>
            <label className="inline-flex">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  e.target.value = "";
                }}
              />
              <span className="inline-flex h-9 cursor-pointer items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                <Upload className="mr-1.5 h-4 w-4" /> Choose file
              </span>
            </label>
          </div>

          <div className="mt-4 rounded-md border bg-muted/30 p-3">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Expected columns</p>
            <p className="mt-1 text-xs text-muted-foreground">{IMPORT_COLUMNS.join(" · ")}</p>
          </div>

          {preview.length ? (
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium">{preview.length} row(s) ready</p>
                <Button size="sm" disabled={busy} onClick={runImport}>
                  {busy ? "Importing…" : "Import now"}
                </Button>
              </div>
              <div className="max-h-64 overflow-auto rounded-md border">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      {Object.keys(preview[0] ?? {}).slice(0, 6).map((h) => (
                        <th key={h} className="whitespace-nowrap px-3 py-2">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 25).map((r, i) => (
                      <tr key={i} className="border-t">
                        {Object.keys(preview[0] ?? {}).slice(0, 6).map((h) => (
                          <td key={h} className="whitespace-nowrap px-3 py-1.5">
                            {String(r[h] ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {log.length ? (
            <div className="mt-4 space-y-1 rounded-md border p-3 text-xs">
              {log.map((l, i) => (
                <p key={i} className={i === 0 ? "font-medium" : "text-destructive"}>
                  {l}
                </p>
              ))}
            </div>
          ) : null}
        </Card>

        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Download className="h-4 w-4 text-muted-foreground" /> Export registry
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Download every asset with its category, location and custody details — {assets.data?.length ?? 0} record(s).
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={() => exportAll("xlsx")}>
              <Download className="mr-1.5 h-4 w-4" /> Excel (.xlsx)
            </Button>
            <Button variant="outline" onClick={() => exportAll("csv")}>
              <Download className="mr-1.5 h-4 w-4" /> CSV
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
