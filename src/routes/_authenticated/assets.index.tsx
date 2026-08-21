import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { Plus, Search, Download, ScanLine, Trash2, Pencil, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusBadge } from "@/components/app/StatusBadge";
import { AssetForm } from "@/components/app/AssetForm";
import { AssignDialog } from "@/components/app/AssignDialog";
import { NativeSelect } from "@/components/app/NativeSelect";
import { Scanner, parseScan } from "@/components/app/Scanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  useAssets,
  useBuildings,
  useCategories,
  useCrud,
  useEmployees,
  useRooms,
  useStatuses,
} from "@/lib/queries";
import { formatCurrency, formatDate, dash } from "@/lib/format";
import { exportRows } from "@/lib/excel";
import type { Asset } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  status: fallback(z.string(), "all").default("all"),
  category: fallback(z.string(), "all").default("all"),
  building: fallback(z.string(), "all").default("all"),
});

export const Route = createFileRoute("/_authenticated/assets/")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Asset Registry — AssetVault" },
      {
        name: "description",
        content:
          "Search, filter, assign and export every office asset with codes, locations and QR labels.",
      },
      { property: "og:title", content: "Asset Registry — AssetVault" },
      { property: "og:description", content: "The complete registry of office assets." },
    ],
  }),
  component: AssetsPage,
});

function AssetsPage() {
  const navigate = useNavigate({ from: "/assets" });
  const { q, status, category, building } = Route.useSearch();
  const assets = useAssets();
  const categories = useCategories();
  const statuses = useStatuses();
  const buildings = useBuildings();
  const rooms = useRooms();
  const employees = useEmployees();
  const { remove } = useCrud("assets");
  const { isAdmin } = useAuth();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [assignFor, setAssignFor] = useState<Asset | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);

  const setSearch = (patch: Record<string, string>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }) });

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (assets.data ?? [])
      .filter((a) => !a.archived)
      .filter((a) => (status === "all" ? true : a.status === status))
      .filter((a) => (category === "all" ? true : a.category_id === category))
      .filter((a) => (building === "all" ? true : a.building_id === building))
      .filter((a) =>
        !term
          ? true
          : [a.name, a.asset_code, a.serial_number, a.brand, a.model, a.asset_type]
              .filter(Boolean)
              .some((v) => String(v).toLowerCase().includes(term)),
      );
  }, [assets.data, q, status, category, building]);

  const nameOf = (list: { id: string; name: string }[] | undefined, id: string | null) =>
    list?.find((x) => x.id === id)?.name ?? "—";

  const exportCurrent = () => {
    exportRows(
      filtered.map((a) => ({
        "Asset ID": a.asset_code,
        Name: a.name,
        Category: nameOf(categories.data, a.category_id),
        Type: dash(a.asset_type),
        Brand: dash(a.brand),
        Model: dash(a.model),
        Serial: dash(a.serial_number),
        Quantity: a.quantity ?? 1,
        Status: a.status,
        Condition: a.condition,
        Building: nameOf(buildings.data, a.building_id),
        Room: nameOf(rooms.data, a.room_id),
        "Specific Location": dash(a.specific_location),
        "Assigned To": employees.data?.find((e) => e.id === a.assigned_employee_id)?.name ?? "",
        "Purchase Date": dash(a.purchase_date),
        "Purchase Price": a.purchase_price ?? "",
        Vendor: dash(a.vendor),
        "Warranty End": dash(a.warranty_end),
      })),
      "assets-export",
    );
    toast.success("Export ready");
  };

  return (
    <div>
      <PageHeader
        title="Assets"
        description={`${filtered.length} of ${(assets.data ?? []).length} records shown.`}
        actions={
          <>
            <Button variant="outline" onClick={() => setScanOpen(true)}>
              <ScanLine className="mr-1.5 h-4 w-4" /> Scan
            </Button>
            <Button variant="outline" onClick={exportCurrent}>
              <Download className="mr-1.5 h-4 w-4" /> Export
            </Button>
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add asset
            </Button>
          </>
        }
      />

      <Card className="mb-4 p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search name, asset ID, serial, brand…"
              value={q}
              onChange={(e) => setSearch({ q: e.target.value })}
            />
          </div>
          <NativeSelect aria-label="Status" value={status} onChange={(v) => setSearch({ status: v })}>
            <option value="all">All statuses</option>
            {(statuses.data ?? []).map((s) => (
              <option key={s.id}>{s.name}</option>
            ))}
          </NativeSelect>
          <NativeSelect
            aria-label="Category"
            value={category}
            onChange={(v) => setSearch({ category: v })}
          >
            <option value="all">All categories</option>
            {(categories.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </NativeSelect>
          <NativeSelect
            aria-label="Building"
            value={building}
            onChange={(v) => setSearch({ building: v })}
          >
            <option value="all">All buildings</option>
            {(buildings.data ?? []).map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </NativeSelect>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Assigned to</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="w-[120px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                    Loading assets…
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                    No assets match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-xs font-semibold">
                      <Link to="/assets/$id" params={{ id: a.id }} className="hover:underline">
                        {a.asset_code}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link to="/assets/$id" params={{ id: a.id }} className="font-medium hover:underline">
                        {a.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {[a.brand, a.model].filter(Boolean).join(" ") || "—"}
                        {a.quantity && a.quantity > 1 ? ` · Qty ${a.quantity}` : ""}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm">{nameOf(categories.data, a.category_id)}</TableCell>
                    <TableCell className="text-sm">
                      {nameOf(rooms.data, a.room_id)}
                      <span className="block text-xs text-muted-foreground">
                        {dash(a.specific_location)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {employees.data?.find((e) => e.id === a.assigned_employee_id)?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={a.status} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={a.condition} kind="condition" />
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatCurrency(a.purchase_price)}
                      <span className="block text-xs text-muted-foreground">
                        {formatDate(a.purchase_date)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Assign"
                          onClick={() => {
                            setAssignFor(a);
                            setAssignOpen(true);
                          }}
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Edit"
                          onClick={() => {
                            setEditing(a);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {isAdmin ? (
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label="Delete"
                            onClick={() => {
                              if (!confirm(`Delete ${a.asset_code}? This cannot be undone.`)) return;
                              remove.mutate(a.id, {
                                onSuccess: () => toast.success("Asset deleted"),
                                onError: (e) => toast.error((e as Error).message),
                              });
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <AssetForm open={formOpen} onOpenChange={setFormOpen} asset={editing} />
      <AssignDialog open={assignOpen} onOpenChange={setAssignOpen} asset={assignFor} />

      <Dialog open={scanOpen} onOpenChange={setScanOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Scan asset QR</DialogTitle>
            <DialogDescription>Open an asset instantly by scanning its label.</DialogDescription>
          </DialogHeader>
          <Scanner
            onResult={(text) => {
              const id = parseScan(text);
              if (!id) return toast.error("Unrecognised code");
              setScanOpen(false);
              navigate({ to: "/assets/$id", params: { id } });
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
