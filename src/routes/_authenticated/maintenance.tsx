import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Download, Wrench, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { NativeSelect } from "@/components/app/NativeSelect";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  useCrud,
  useEmployees,
  useIncidents,
  useMaintenance,
  logHistory,
} from "@/lib/queries";
import { formatCurrency, formatDate, todayISO, dash } from "@/lib/format";
import { exportRows } from "@/lib/excel";

export const Route = createFileRoute("/_authenticated/maintenance")({
  head: () => ({
    meta: [
      { title: "Maintenance & Incidents — AssetVault" },
      {
        name: "description",
        content: "Log repairs, servicing costs, damage and loss incidents for every office asset.",
      },
      { property: "og:title", content: "Maintenance & Incidents — AssetVault" },
      { property: "og:description", content: "Repair logs and incident reports for your assets." },
    ],
  }),
  component: MaintenancePage,
});

const MAINT_STATUS = ["Open", "In Progress", "Completed", "Cancelled"];
const INCIDENT_TYPES = ["Damage", "Loss", "Theft", "Malfunction"];
const INCIDENT_STATUS = ["Open", "Investigating", "Resolved", "Written Off"];

function MaintenancePage() {
  const maintenance = useMaintenance();
  const incidents = useIncidents();
  const assets = useAssets();
  const employees = useEmployees();
  const maintCrud = useCrud("maintenance");
  const incidentCrud = useCrud("incidents");
  const assetCrud = useCrud("assets");

  const [maintOpen, setMaintOpen] = useState(false);
  const [incidentOpen, setIncidentOpen] = useState(false);

  const [m, setM] = useState({
    asset_id: "",
    maintenance_date: todayISO(),
    problem: "",
    description: "",
    service_provider: "",
    cost: "",
    status: "Open",
    expected_completion: "",
  });
  const [i, setI] = useState({
    asset_id: "",
    type: "Damage",
    reported_date: todayISO(),
    reported_by: "",
    description: "",
    location: "",
    employee_id: "",
    resolution_status: "Open",
  });

  const assetOf = (id: string) => assets.data?.find((a) => a.id === id);
  const openCount = useMemo(
    () => (maintenance.data ?? []).filter((x) => x.status !== "Completed" && x.status !== "Cancelled").length,
    [maintenance.data],
  );
  const openIncidents = useMemo(
    () => (incidents.data ?? []).filter((x) => x.resolution_status !== "Resolved").length,
    [incidents.data],
  );

  const submitMaintenance = () => {
    if (!m.asset_id || !m.problem.trim()) return toast.error("Pick an asset and describe the problem");
    maintCrud.create.mutate(
      {
        asset_id: m.asset_id,
        maintenance_date: m.maintenance_date,
        problem: m.problem.trim(),
        description: m.description.trim() || null,
        service_provider: m.service_provider.trim() || null,
        cost: m.cost ? Number(m.cost) : null,
        status: m.status,
        expected_completion: m.expected_completion || null,
      },
      {
        onSuccess: async () => {
          if (m.status !== "Completed") {
            assetCrud.update.mutate({ id: m.asset_id, values: { status: "Under Maintenance" } });
          }
          await logHistory(m.asset_id, "Maintenance logged", m.problem.trim());
          toast.success("Maintenance record added");
          setMaintOpen(false);
          setM({ ...m, problem: "", description: "", cost: "", service_provider: "" });
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  };

  const submitIncident = () => {
    if (!i.asset_id) return toast.error("Pick an asset");
    incidentCrud.create.mutate(
      {
        asset_id: i.asset_id,
        type: i.type,
        reported_date: i.reported_date,
        reported_by: i.reported_by.trim() || null,
        description: i.description.trim() || null,
        location: i.location.trim() || null,
        employee_id: i.employee_id || null,
        resolution_status: i.resolution_status,
      },
      {
        onSuccess: async () => {
          const nextStatus = i.type === "Loss" || i.type === "Theft" ? "Lost" : "Damaged";
          assetCrud.update.mutate({ id: i.asset_id, values: { status: nextStatus } });
          await logHistory(i.asset_id, `${i.type} reported`, i.description.trim() || undefined);
          toast.success("Incident reported");
          setIncidentOpen(false);
          setI({ ...i, description: "", reported_by: "", location: "" });
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  };

  return (
    <div>
      <PageHeader
        title="Maintenance & Incidents"
        description={`${openCount} open service jobs · ${openIncidents} unresolved incidents.`}
        actions={
          <>
            <Button variant="outline" onClick={() => setIncidentOpen(true)}>
              <AlertTriangle className="mr-1.5 h-4 w-4" /> Report incident
            </Button>
            <Button onClick={() => setMaintOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Log maintenance
            </Button>
          </>
        }
      />

      <Tabs defaultValue="maintenance">
        <TabsList>
          <TabsTrigger value="maintenance">
            <Wrench className="mr-1.5 h-4 w-4" /> Maintenance
          </TabsTrigger>
          <TabsTrigger value="incidents">
            <AlertTriangle className="mr-1.5 h-4 w-4" /> Incidents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="maintenance" className="mt-4">
          <Card className="overflow-hidden p-0">
            <div className="flex justify-end border-b p-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  exportRows(
                    (maintenance.data ?? []).map((x) => ({
                      "Asset ID": assetOf(x.asset_id)?.asset_code ?? "",
                      Asset: assetOf(x.asset_id)?.name ?? "",
                      Date: x.maintenance_date,
                      Problem: x.problem ?? "",
                      Provider: x.service_provider ?? "",
                      Cost: x.cost ?? "",
                      Status: x.status,
                      Completed: x.completion_date ?? "",
                    })),
                    "maintenance-export",
                  );
                  toast.success("Export ready");
                }}
              >
                <Download className="mr-1.5 h-4 w-4" /> Export
              </Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Problem</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(maintenance.data ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                        No maintenance records yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (maintenance.data ?? []).map((x) => {
                      const asset = assetOf(x.asset_id);
                      return (
                        <TableRow key={x.id}>
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
                          <TableCell className="text-sm">{formatDate(x.maintenance_date)}</TableCell>
                          <TableCell className="max-w-[260px] text-sm">{dash(x.problem)}</TableCell>
                          <TableCell className="text-sm">{dash(x.service_provider)}</TableCell>
                          <TableCell className="text-right text-sm">{formatCurrency(x.cost)}</TableCell>
                          <TableCell>
                            <NativeSelect
                              aria-label="Maintenance status"
                              className="h-8 w-[150px]"
                              value={x.status}
                              onChange={(v) =>
                                maintCrud.update.mutate(
                                  {
                                    id: x.id,
                                    values: {
                                      status: v,
                                      completion_date: v === "Completed" ? todayISO() : null,
                                    },
                                  },
                                  {
                                    onSuccess: () => {
                                      if (v === "Completed") {
                                        assetCrud.update.mutate({
                                          id: x.asset_id,
                                          values: { status: "Available" },
                                        });
                                      }
                                      toast.success("Status updated");
                                    },
                                    onError: (e) => toast.error((e as Error).message),
                                  },
                                )
                              }
                            >
                              {MAINT_STATUS.map((s) => (
                                <option key={s}>{s}</option>
                              ))}
                            </NativeSelect>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="incidents" className="mt-4">
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Reported</TableHead>
                    <TableHead>By</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Resolution</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(incidents.data ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                        No incidents reported.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (incidents.data ?? []).map((x) => {
                      const asset = assetOf(x.asset_id);
                      return (
                        <TableRow key={x.id}>
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
                          <TableCell>
                            <StatusBadge value={x.type} />
                          </TableCell>
                          <TableCell className="text-sm">{formatDate(x.reported_date)}</TableCell>
                          <TableCell className="text-sm">{dash(x.reported_by)}</TableCell>
                          <TableCell className="max-w-[260px] text-sm">{dash(x.description)}</TableCell>
                          <TableCell>
                            <NativeSelect
                              aria-label="Resolution status"
                              className="h-8 w-[150px]"
                              value={x.resolution_status}
                              onChange={(v) =>
                                incidentCrud.update.mutate(
                                  { id: x.id, values: { resolution_status: v } },
                                  {
                                    onSuccess: () => toast.success("Incident updated"),
                                    onError: (e) => toast.error((e as Error).message),
                                  },
                                )
                              }
                            >
                              {INCIDENT_STATUS.map((s) => (
                                <option key={s}>{s}</option>
                              ))}
                            </NativeSelect>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={maintOpen} onOpenChange={setMaintOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Log maintenance</DialogTitle>
            <DialogDescription>Record a repair or service job against an asset.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label className="mb-1.5 block">Asset</Label>
              <NativeSelect aria-label="Asset" value={m.asset_id} onChange={(v) => setM({ ...m, asset_id: v })}>
                <option value="">Select asset…</option>
                {(assets.data ?? []).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.asset_code} · {a.name}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div>
              <Label className="mb-1.5 block">Date</Label>
              <Input
                type="date"
                value={m.maintenance_date}
                onChange={(e) => setM({ ...m, maintenance_date: e.target.value })}
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Expected completion</Label>
              <Input
                type="date"
                value={m.expected_completion}
                onChange={(e) => setM({ ...m, expected_completion: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1.5 block">Problem</Label>
              <Input value={m.problem} onChange={(e) => setM({ ...m, problem: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1.5 block">Description</Label>
              <Textarea
                rows={3}
                value={m.description}
                onChange={(e) => setM({ ...m, description: e.target.value })}
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Service provider</Label>
              <Input
                value={m.service_provider}
                onChange={(e) => setM({ ...m, service_provider: e.target.value })}
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Cost</Label>
              <Input type="number" value={m.cost} onChange={(e) => setM({ ...m, cost: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1.5 block">Status</Label>
              <NativeSelect aria-label="Status" value={m.status} onChange={(v) => setM({ ...m, status: v })}>
                {MAINT_STATUS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </NativeSelect>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMaintOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitMaintenance} disabled={maintCrud.create.isPending}>
              Save record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={incidentOpen} onOpenChange={setIncidentOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Report incident</DialogTitle>
            <DialogDescription>Damage, loss, theft or malfunction of an asset.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label className="mb-1.5 block">Asset</Label>
              <NativeSelect aria-label="Asset" value={i.asset_id} onChange={(v) => setI({ ...i, asset_id: v })}>
                <option value="">Select asset…</option>
                {(assets.data ?? []).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.asset_code} · {a.name}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div>
              <Label className="mb-1.5 block">Type</Label>
              <NativeSelect aria-label="Type" value={i.type} onChange={(v) => setI({ ...i, type: v })}>
                {INCIDENT_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </NativeSelect>
            </div>
            <div>
              <Label className="mb-1.5 block">Reported date</Label>
              <Input
                type="date"
                value={i.reported_date}
                onChange={(e) => setI({ ...i, reported_date: e.target.value })}
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Reported by</Label>
              <Input value={i.reported_by} onChange={(e) => setI({ ...i, reported_by: e.target.value })} />
            </div>
            <div>
              <Label className="mb-1.5 block">Related employee</Label>
              <NativeSelect
                aria-label="Employee"
                value={i.employee_id}
                onChange={(v) => setI({ ...i, employee_id: v })}
              >
                <option value="">None</option>
                {(employees.data ?? []).map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1.5 block">Location</Label>
              <Input value={i.location} onChange={(e) => setI({ ...i, location: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1.5 block">Description</Label>
              <Textarea
                rows={3}
                value={i.description}
                onChange={(e) => setI({ ...i, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIncidentOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitIncident} disabled={incidentCrud.create.isPending}>
              Report incident
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
