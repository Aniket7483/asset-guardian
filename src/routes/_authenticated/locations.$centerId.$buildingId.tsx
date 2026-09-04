import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Layers, DoorClosed, Trash2, ArrowLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { NativeSelect } from "@/components/app/NativeSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useAssets, useBuildings, useCenters, useCrud, useFloors, useRooms } from "@/lib/queries";
import { useAuth } from "@/hooks/useAuth";
import { StatTile } from "@/components/app/StatTile";

export const Route = createFileRoute("/_authenticated/locations/$centerId/$buildingId")({
  head: () => ({
    meta: [
      { title: "Building Dashboard — AssetVault" },
      {
        name: "description",
        content: "Floors, rooms and asset counts for a single building inside one center.",
      },
      { property: "og:title", content: "Building Dashboard — AssetVault" },
      { property: "og:description", content: "Drill into floors and rooms of one building." },
    ],
  }),
  component: BuildingPage,
});

function BuildingPage() {
  const { centerId, buildingId } = Route.useParams();
  const centers = useCenters();
  const buildings = useBuildings();
  const floors = useFloors();
  const rooms = useRooms();
  const assets = useAssets();
  const { isAdmin } = useAuth();
  const floorCrud = useCrud("floors");
  const roomCrud = useCrud("rooms");

  const [fName, setFName] = useState("");
  const [rName, setRName] = useState("");
  const [rArea, setRArea] = useState("");
  const [rFloor, setRFloor] = useState("");

  const center = centers.data?.find((c) => c.id === centerId);
  const building = buildings.data?.find((b) => b.id === buildingId);

  const buildingFloors = useMemo(
    () => (floors.data ?? []).filter((f) => f.building_id === buildingId),
    [floors.data, buildingId],
  );
  const floorIds = useMemo(() => new Set(buildingFloors.map((f) => f.id)), [buildingFloors]);
  const buildingRooms = useMemo(
    () => (rooms.data ?? []).filter((r) => floorIds.has(r.floor_id)),
    [rooms.data, floorIds],
  );
  const buildingAssets = useMemo(
    () => (assets.data ?? []).filter((a) => !a.archived && a.building_id === buildingId),
    [assets.data, buildingId],
  );

  const totals = {
    total: buildingAssets.length,
    assigned: buildingAssets.filter((a) => a.status === "Assigned" || a.assigned_employee_id).length,
    available: buildingAssets.filter((a) => a.status === "Available").length,
    maintenance: buildingAssets.filter((a) => a.status === "Under Maintenance").length,
  };

  const fail = (e: unknown) => toast.error((e as Error).message);

  return (
    <div>
      <nav className="mb-3 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/locations" className="hover:text-foreground">
          Locations
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link to="/locations/$centerId" params={{ centerId }} className="hover:text-foreground">
          {center?.name ?? "Center"}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-foreground">{building?.name ?? "Building"}</span>
      </nav>

      <PageHeader
        title={building?.name ?? "Building"}
        description="Floors, rooms and assets belonging to this building only."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/locations/$centerId" params={{ centerId }}>
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to center
              </Link>
            </Button>
            <Button asChild>
              <Link to="/assets" search={{ q: "", status: "all", category: "all", building: buildingId }}>
                View assets
              </Link>
            </Button>
          </>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Total assets" value={totals.total} />
        <StatTile label="Assigned" value={totals.assigned} />
        <StatTile label="Available" value={totals.available} />
        <StatTile label="Maintenance" value={totals.maintenance} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-3">
          {buildingFloors.map((f) => {
            const fRooms = buildingRooms.filter((r) => r.floor_id === f.id);
            return (
              <Card key={f.id} className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <Layers className="h-4 w-4 text-muted-foreground" /> {f.name}
                    <span className="text-xs font-normal text-muted-foreground">
                      · {buildingAssets.filter((a) => a.floor_id === f.id).length} assets · {fRooms.length}{" "}
                      rooms
                    </span>
                  </h3>
                  {isAdmin ? (
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Delete ${f.name}`}
                      onClick={() =>
                        confirm(`Delete ${f.name}?`) &&
                        floorCrud.remove.mutate(f.id, {
                          onSuccess: () => toast.success("Floor deleted"),
                          onError: fail,
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  ) : null}
                </div>
                <ul className="mt-3 space-y-1.5 border-l pl-4">
                  {fRooms.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-2">
                      <Link
                        to="/assets"
                        search={{ q: r.name, status: "all", category: "all", building: buildingId }}
                        className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent/50"
                      >
                        <DoorClosed className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="truncate">{r.name}</span>
                        <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                          {buildingAssets.filter((a) => a.room_id === r.id).length} assets
                        </span>
                      </Link>
                      {isAdmin ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Delete ${r.name}`}
                          onClick={() =>
                            confirm(`Delete ${r.name}?`) &&
                            roomCrud.remove.mutate(r.id, {
                              onSuccess: () => toast.success("Room deleted"),
                              onError: fail,
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      ) : null}
                    </li>
                  ))}
                  {fRooms.length === 0 ? (
                    <li className="px-2 py-1.5 text-xs text-muted-foreground">No rooms on this floor.</li>
                  ) : null}
                </ul>
              </Card>
            );
          })}
          {buildingFloors.length === 0 ? (
            <Card className="p-6 text-sm text-muted-foreground">No floors in this building yet.</Card>
          ) : null}
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Layers className="h-4 w-4 text-muted-foreground" /> Add floor
            </h2>
            <div className="space-y-2">
              <Input placeholder="Floor name" value={fName} onChange={(e) => setFName(e.target.value)} />
              <Button
                className="w-full"
                disabled={!fName.trim() || floorCrud.create.isPending}
                onClick={() =>
                  floorCrud.create.mutate(
                    { name: fName.trim(), building_id: buildingId },
                    {
                      onSuccess: () => {
                        setFName("");
                        toast.success("Floor added");
                      },
                      onError: fail,
                    },
                  )
                }
              >
                <Plus className="mr-1.5 h-4 w-4" /> Add floor
              </Button>
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <DoorClosed className="h-4 w-4 text-muted-foreground" /> Add room / desk
            </h2>
            <div className="space-y-2">
              <NativeSelect aria-label="Floor" value={rFloor} onChange={setRFloor}>
                <option value="">Select floor…</option>
                {buildingFloors.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </NativeSelect>
              <Input placeholder="Room name" value={rName} onChange={(e) => setRName(e.target.value)} />
              <Input
                placeholder="Area / zone (optional)"
                value={rArea}
                onChange={(e) => setRArea(e.target.value)}
              />
              <Button
                className="w-full"
                disabled={!rName.trim() || !rFloor || roomCrud.create.isPending}
                onClick={() =>
                  roomCrud.create.mutate(
                    { name: rName.trim(), floor_id: rFloor, area: rArea.trim() || null },
                    {
                      onSuccess: () => {
                        setRName("");
                        setRArea("");
                        toast.success("Room added");
                      },
                      onError: fail,
                    },
                  )
                }
              >
                <Plus className="mr-1.5 h-4 w-4" /> Add room
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
