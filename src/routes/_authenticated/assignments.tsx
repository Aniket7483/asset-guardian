import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, Search, Undo2 } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { NativeSelect } from "@/components/app/NativeSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { useAssets, useAssignments, useCrud, useEmployees, logHistory } from "@/lib/queries";
import { formatDate, todayISO } from "@/lib/format";
import { exportRows } from "@/lib/excel";

export const Route = createFileRoute("/_authenticated/assignments")({
  head: () => ({
    meta: [
      { title: "Assignments — AssetVault" },
      {
        name: "description",
        content: "Track which employee holds which asset, expected return dates and full handover history.",
      },
      { property: "og:title", content: "Assignments — AssetVault" },
      { property: "og:description", content: "Asset custody and handover tracking." },
    ],
  }),
  component: AssignmentsPage,
});

function AssignmentsPage() {
  const assignments = useAssignments();
  const assets = useAssets();
  const employees = useEmployees();
  const assignmentCrud = useCrud("assignments");
  const assetCrud = useCrud("assets");

  const [q, setQ] = useState("");
  const [state, setState] = useState("active");

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (assignments.data ?? [])
      .filter((a) =>
        state === "all" ? true : state === "active" ? !a.returned_date : !!a.returned_date,
      )
      .map((a) => ({
        row: a,
        asset: assets.data?.find((x) => x.id === a.asset_id),
        employee: employees.data?.find((e) => e.id === a.employee_id),
      }))
      .filter(({ asset, employee }) =>
        !term
          ? true
          : [asset?.name, asset?.asset_code, employee?.name, employee?.employee_code]
              .filter(Boolean)
              .some((v) => String(v).toLowerCase().includes(term)),
      );
  }, [assignments.data, assets.data, employees.data, q, state]);

  const overdue = (date: string | null, returned: string | null) =>
    !!date && !returned && new Date(date) < new Date(todayISO());

  const handleReturn = async (id: string, assetId: string, code?: string) => {
    assignmentCrud.update.mutate(
      { id, values: { returned_date: todayISO() } },
      {
        onSuccess: async () => {
          // Stock is free again for this record; recompute the asset's holder state.
          const stillOut = (assignments.data ?? []).some(
            (x) => x.asset_id === assetId && !x.returned_date && x.id !== id,
          );
          assetCrud.update.mutate({
            id: assetId,
            values: stillOut
              ? { status: "Available", assigned_employee_id: null, assigned_at: null, expected_return_date: null }
              : { status: "Available", assigned_employee_id: null, assigned_at: null, expected_return_date: null },
          });
          await logHistory(assetId, "Returned", `${code ?? "Asset"} returned to stock`);
          toast.success("Asset returned to stock");
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  };

  return (
    <div>
      <PageHeader
        title="Assignments"
        description={`${rows.length} assignment records shown.`}
        actions={
          <Button
            variant="outline"
            onClick={() => {
              exportRows(
                rows.map(({ row, asset, employee }) => ({
                  "Asset ID": asset?.asset_code ?? "",
                  Asset: asset?.name ?? "",
                  Employee: employee?.name ?? "",
                  "Employee Code": employee?.employee_code ?? "",
                  Quantity: row.quantity ?? 1,
                  Assigned: row.assigned_date,
                  "Expected Return": row.expected_return_date ?? "",
                  Returned: row.returned_date ?? "",
                  Notes: row.notes ?? "",
                })),
                "assignments-export",
              );
              toast.success("Export ready");
            }}
          >
            <Download className="mr-1.5 h-4 w-4" /> Export
          </Button>
        }
      />

      <Card className="mb-4 p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search asset or employee…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <NativeSelect aria-label="State" value={state} onChange={setState}>
            <option value="active">Currently assigned</option>
            <option value="returned">Returned</option>
            <option value="all">All records</option>
          </NativeSelect>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead>Expected return</TableHead>
                <TableHead>Returned</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    No assignment records.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map(({ row, asset, employee }) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      {asset ? (
                        <Link to="/assets/$id" params={{ id: asset.id }} className="font-medium hover:underline">
                          {asset.name}
                        </Link>
                      ) : (
                        "—"
                      )}
                      <span className="block font-mono text-xs text-muted-foreground">
                        {asset?.asset_code ?? ""}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {employee?.name ?? "—"}
                      <span className="block text-xs text-muted-foreground">
                        {employee?.department ?? ""}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {row.quantity ?? 1}
                      {asset ? (
                        <span className="block text-xs font-normal text-muted-foreground">
                          of {asset.quantity ?? 1}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(row.assigned_date)}</TableCell>
                    <TableCell className="text-sm">
                      <span
                        className={
                          overdue(row.expected_return_date, row.returned_date)
                            ? "font-semibold text-destructive"
                            : ""
                        }
                      >
                        {formatDate(row.expected_return_date)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(row.returned_date)}</TableCell>
                    <TableCell className="text-right">
                      {row.returned_date ? (
                        <span className="text-xs text-muted-foreground">Closed</span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReturn(row.id, row.asset_id, asset?.asset_code)}
                        >
                          <Undo2 className="mr-1.5 h-4 w-4" /> Return
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
