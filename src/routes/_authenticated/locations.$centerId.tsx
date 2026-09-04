import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Building2, ChevronRight, Trash2, ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useAssets, useBuildings, useCenters, useCrud, useFloors, useRooms } from "@/lib/queries";
import { useAuth } from "@/hooks/useAuth";
import { StatTile } from "@/components/app/StatTile";

export const Route = createFileRoute("/_authenticated/locations/$centerId")({
  head: () => ({
    meta: [
      { title: "Center Dashboard — AssetVault" },
      {
        name: "description",
        content: "Location dashboard for a single center: its buildings, floors, rooms and assets only.",
      },
      { property: "og:title", content: "Center Dashboard — AssetVault" },
      { property: "og:description", content: "Buildings and asset statistics for one center." },
    ],
  }),
  component: CenterPage,
});

function CenterPage() {
  const { centerId } = Route.useParams();
  const centers = useCenters();
  const buildings = useBuildings();
  const floors = useFloors();
  const rooms = useRooms();
  const assets = useAssets();
  const { isAdmin } = useAuth();
  const buildingCrud = useCrud("buildings");

  const [bName, setBName] = useState("");
  const [bAddress, setBAddress] = useState("");

  const center = centers.data?.find((c) => c.id === centerId);
  const centerBuildings = useMemo(
    () => (buildings.data ?? []).filter((b) => b.center_id === centerId),
    [buildings.data, centerId],
  );
  const buildingIds = useMemo(() => new Set(centerBuildings.map((b) => b.id)), [centerBuildings]);

  const centerAssets = useMemo(
    () => (assets.data ?? []).filter((a) => !a.archived && a.building_id && buildingIds.has(a.building_id)),
    [assets.data, buildingIds],
  );

  const totals = useMemo(
    () => ({
      total: centerAssets.length,
      assigned: centerAssets.filter((a) => a.status === "Assigned" || a.assigned_employee_id).length,
      available: centerAssets.filter((a) => a.status === "Available").length,
      maintenance: centerAssets.filter((a) => a.status === "Under Maintenance").length,
    }),
    [centerAssets],
  );

  return (
    <div>
      <nav className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/locations" className="hover:text-foreground">
          Locations
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-foreground">{center?.name ?? "Center"}</span>
      </nav>

      <PageHeader
        title={center?.name ?? "Center"}
        description="Location dashboard — only this center's data is shown."
        actions={
          <Button variant="outline" asChild>
            <Link to="/locations">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> All centers
            </Link>
          </Button>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Total assets" value={totals.total} />
        <StatTile label="Assigned" value={totals.assigned} />
        <StatTile label="Available" value={totals.available} />
        <StatTile label="Maintenance" value={totals.maintenance} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div>
          <h2 className="mb-3 text-sm font-semibold">Buildings in this center</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {centerBuildings.map((b) => {
              const bFloors = (floors.data ?? []).filter((f) => f.building_id === b.id);
              const floorIds = new Set(bFloors.map((f) => f.id));
              const bRooms = (rooms.data ?? []).filter((r) => floorIds.has(r.floor_id));
              const count = centerAssets.filter((a) => a.building_id === b.id).length;
              return (
                <Card key={b.id} className="group relative p-0">
                  <Link
                    to="/locations/$centerId/$buildingId"
                    params={{ centerId, buildingId: b.id }}
                    className="flex items-start gap-3 p-4 transition-colors hover:bg-accent/50"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{b.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{b.address || "No address"}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {count} assets · {bFloors.length} floors · {bRooms.length} rooms
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                  {isAdmin ? (
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Delete ${b.name}`}
                      className="absolute bottom-2 right-2 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() =>
                        confirm(`Delete ${b.name}?`) &&
                        buildingCrud.remove.mutate(b.id, {
                          onSuccess: () => toast.success("Building deleted"),
                          onError: (e) => toast.error((e as Error).message),
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  ) : null}
                </Card>
              );
            })}
            {centerBuildings.length === 0 ? (
              <Card className="p-6 text-sm text-muted-foreground">No buildings in this center yet.</Card>
            ) : null}
          </div>
        </div>

        <Card className="h-fit p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Building2 className="h-4 w-4 text-muted-foreground" /> Add building
          </h2>
          <div className="space-y-2">
            <Input placeholder="Building name" value={bName} onChange={(e) => setBName(e.target.value)} />
            <Input
              placeholder="Address (optional)"
              value={bAddress}
              onChange={(e) => setBAddress(e.target.value)}
            />
            <Button
              className="w-full"
              disabled={!bName.trim() || buildingCrud.create.isPending}
              onClick={() =>
                buildingCrud.create.mutate(
                  { name: bName.trim(), address: bAddress.trim() || null, center_id: centerId },
                  {
                    onSuccess: () => {
                      setBName("");
                      setBAddress("");
                      toast.success("Building added");
                    },
                    onError: (e) => toast.error((e as Error).message),
                  },
                )
              }
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add building
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
