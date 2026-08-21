import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Pencil, UserPlus, Undo2, Wrench, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusBadge } from "@/components/app/StatusBadge";
import { AssetQrPanel } from "@/components/app/QrCode";
import { AssetForm } from "@/components/app/AssetForm";
import { AssignDialog, returnAsset } from "@/components/app/AssignDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  useAsset,
  useAssetHistory,
  useAssignments,
  useBuildings,
  useCategories,
  useEmployees,
  useFloors,
  useIncidents,
  useMaintenance,
  useRefresh,
  useRooms,
} from "@/lib/queries";
import { dash, formatCurrency, formatDate, formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/assets/$id")({
  head: () => ({
    meta: [
      { title: "Asset details — AssetVault" },
      {
        name: "description",
        content:
          "Full asset profile: specifications, purchase data, location, assignment history, maintenance and QR label.",
      },
      { property: "og:title", content: "Asset details — AssetVault" },
      { property: "og:description", content: "Complete profile and history for a single asset." },
    ],
  }),
  component: AssetDetail,
  errorComponent: ({ error }) => (
    <p role="alert" className="p-6 text-sm text-destructive">
      {error.message}
    </p>
  ),
  notFoundComponent: () => <p className="p-6 text-sm text-muted-foreground">Asset not found.</p>,
});

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b py-2.5 last:border-0">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  );
}

function AssetDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const asset = useAsset(id);
  const history = useAssetHistory(id);
  const assignments = useAssignments();
  const maintenance = useMaintenance();
  const incidents = useIncidents();
  const categories = useCategories();
  const buildings = useBuildings();
  const floors = useFloors();
  const rooms = useRooms();
  const employees = useEmployees();
  const refresh = useRefresh();
  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  if (asset.isLoading) return <p className="text-sm text-muted-foreground">Loading asset…</p>;
  const a = asset.data;
  if (!a) return <p className="text-sm text-muted-foreground">This asset no longer exists.</p>;

  const empName = (eid: string | null) => employees.data?.find((e) => e.id === eid)?.name ?? "—";
  const assetAssignments = (assignments.data ?? []).filter((x) => x.asset_id === id);
  const assetMaintenance = (maintenance.data ?? []).filter((x) => x.asset_id === id);
  const assetIncidents = (incidents.data ?? []).filter((x) => x.asset_id === id);

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
        <Link to="/assets">
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to assets
        </Link>
      </Button>

      <PageHeader
        title={a.name}
        description={`${a.asset_code} · ${dash(a.asset_type)}`}
        actions={
          <>
            {a.assigned_employee_id ? (
              <Button
                variant="outline"
                onClick={async () => {
                  await returnAsset(a);
                  refresh();
                  toast.success("Asset returned to stock");
                }}
              >
                <Undo2 className="mr-1.5 h-4 w-4" /> Mark returned
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setAssignOpen(true)}>
                <UserPlus className="mr-1.5 h-4 w-4" /> Assign
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate({ to: "/maintenance" })}>
              <Wrench className="mr-1.5 h-4 w-4" /> Maintenance
            </Button>
            <Button onClick={() => setEditOpen(true)}>
              <Pencil className="mr-1.5 h-4 w-4" /> Edit
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
              <CardTitle className="text-base">Overview</CardTitle>
              <div className="flex gap-2">
                <StatusBadge value={a.status} />
                <StatusBadge value={a.condition} kind="condition" />
              </div>
            </CardHeader>
            <CardContent className="grid gap-x-8 sm:grid-cols-2">
              <div>
                <Row label="Asset ID" value={<span className="font-mono">{a.asset_code}</span>} />
                <Row
                  label="Category"
                  value={categories.data?.find((c) => c.id === a.category_id)?.name ?? "—"}
                />
                <Row label="Brand" value={dash(a.brand)} />
                <Row label="Model" value={dash(a.model)} />
                <Row label="Serial number" value={dash(a.serial_number)} />
                <Row label="Quantity" value={a.quantity ?? 1} />
                <Row label="Ownership" value={dash(a.ownership)} />
              </div>
              <div>
                <Row label="Purchase date" value={formatDate(a.purchase_date)} />
                <Row label="Purchase price" value={formatCurrency(a.purchase_price)} />
                <Row label="Vendor" value={dash(a.vendor)} />
                <Row label="Invoice" value={dash(a.invoice_number)} />
                <Row label="Warranty" value={`${formatDate(a.warranty_start)} → ${formatDate(a.warranty_end)}`} />
                <Row
                  label="Location"
                  value={
                    [
                      buildings.data?.find((b) => b.id === a.building_id)?.name,
                      floors.data?.find((f) => f.id === a.floor_id)?.name,
                      rooms.data?.find((r) => r.id === a.room_id)?.name,
                      a.specific_location,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "—"
                  }
                />
                <Row label="Assigned to" value={empName(a.assigned_employee_id)} />
              </div>
              {a.description ? (
                <p className="mt-3 text-sm text-muted-foreground sm:col-span-2">{a.description}</p>
              ) : null}
            </CardContent>
          </Card>

          <Tabs defaultValue="history">
            <TabsList>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="assignments">Assignments</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
              <TabsTrigger value="incidents">Incidents</TabsTrigger>
            </TabsList>

            <TabsContent value="history">
              <Card>
                <CardContent className="space-y-3 pt-6">
                  {(history.data ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
                  ) : (
                    (history.data ?? []).map((h) => (
                      <div key={h.id} className="border-l-2 border-primary/40 pl-3">
                        <p className="text-sm font-semibold">{h.action}</p>
                        <p className="text-sm text-muted-foreground">{dash(h.details)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(h.created_at)} · {dash(h.actor_name)}
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assignments">
              <Card>
                <CardContent className="space-y-2 pt-6">
                  {assetAssignments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Never assigned.</p>
                  ) : (
                    assetAssignments.map((x) => (
                      <div key={x.id} className="rounded-lg border p-3 text-sm">
                        <span className="font-semibold">{empName(x.employee_id)}</span> ·{" "}
                        {formatDate(x.assigned_date)} →{" "}
                        {x.returned_date ? formatDate(x.returned_date) : "Currently held"}
                        {x.notes ? (
                          <p className="mt-1 text-xs text-muted-foreground">{x.notes}</p>
                        ) : null}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="maintenance">
              <Card>
                <CardContent className="space-y-2 pt-6">
                  {assetMaintenance.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No maintenance recorded.</p>
                  ) : (
                    assetMaintenance.map((m) => (
                      <div key={m.id} className="rounded-lg border p-3 text-sm">
                        <div className="flex justify-between gap-3">
                          <span className="font-semibold">{dash(m.problem)}</span>
                          <span>{formatCurrency(m.cost)}</span>
                        </div>
                        <p className="text-muted-foreground">{dash(m.description)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(m.maintenance_date)} · {dash(m.service_provider)}
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="incidents">
              <Card>
                <CardContent className="space-y-2 pt-6">
                  {assetIncidents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No incidents reported.</p>
                  ) : (
                    assetIncidents.map((i) => (
                      <div key={i.id} className="rounded-lg border p-3 text-sm">
                        <p className="flex items-center gap-2 font-semibold">
                          <AlertTriangle className="h-4 w-4 text-destructive" /> {i.type}
                        </p>
                        <p className="text-muted-foreground">{dash(i.description)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(i.reported_date)} · {dash(i.resolution_status)}
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">QR label</CardTitle>
          </CardHeader>
          <CardContent>
            <AssetQrPanel
              assetId={a.id}
              code={a.asset_code}
              name={a.name}
              extra={[a.brand, a.model].filter(Boolean).join(" ")}
            />
          </CardContent>
        </Card>
      </div>

      <AssetForm open={editOpen} onOpenChange={setEditOpen} asset={a} />
      <AssignDialog open={assignOpen} onOpenChange={setAssignOpen} asset={a} />
    </div>
  );
}
