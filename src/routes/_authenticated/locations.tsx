import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2, Building2, Layers, DoorClosed } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { NativeSelect } from "@/components/app/NativeSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useAssets, useBuildings, useCrud, useFloors, useRooms } from "@/lib/queries";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/locations")({
  head: () => ({
    meta: [
      { title: "Locations — AssetVault" },
      {
        name: "description",
        content: "Manage buildings, floors and rooms so every asset has a precise physical home.",
      },
      { property: "og:title", content: "Locations — AssetVault" },
      { property: "og:description", content: "Buildings, floors and rooms for your asset registry." },
    ],
  }),
  component: LocationsPage,
});

function LocationsPage() {
  const buildings = useBuildings();
  const floors = useFloors();
  const rooms = useRooms();
  const assets = useAssets();
  const { isAdmin } = useAuth();

  const buildingCrud = useCrud("buildings");
  const floorCrud = useCrud("floors");
  const roomCrud = useCrud("rooms");

  const [bName, setBName] = useState("");
  const [bAddress, setBAddress] = useState("");
  const [fName, setFName] = useState("");
  const [fBuilding, setFBuilding] = useState("");
  const [rName, setRName] = useState("");
  const [rArea, setRArea] = useState("");
  const [rFloor, setRFloor] = useState("");

  const countAssets = (predicate: (a: { building_id: string | null; floor_id: string | null; room_id: string | null }) => boolean) =>
    (assets.data ?? []).filter(predicate).length;

  const ok = (msg: string) => () => toast.success(msg);
  const fail = (e: unknown) => toast.error((e as Error).message);

  return (
    <div>
      <PageHeader
        title="Locations"
        description="Buildings → floors → rooms. Every asset can be pinned to an exact place."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Building2 className="h-4 w-4 text-muted-foreground" /> Buildings
          </h2>
          <div className="space-y-2">
            <Input placeholder="Building name" value={bName} onChange={(e) => setBName(e.target.value)} />
            <Input placeholder="Address (optional)" value={bAddress} onChange={(e) => setBAddress(e.target.value)} />
            <Button
              className="w-full"
              disabled={!bName.trim() || buildingCrud.create.isPending}
              onClick={() =>
                buildingCrud.create.mutate(
                  { name: bName.trim(), address: bAddress.trim() || null },
                  {
                    onSuccess: () => {
                      setBName("");
                      setBAddress("");
                      toast.success("Building added");
                    },
                    onError: fail,
                  },
                )
              }
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add building
            </Button>
          </div>
          <ul className="mt-4 space-y-2">
            {(buildings.data ?? []).map((b) => (
              <li key={b.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{b.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {countAssets((a) => a.building_id === b.id)} assets
                    {b.address ? ` · ${b.address}` : ""}
                  </p>
                </div>
                {isAdmin ? (
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Delete building"
                    onClick={() =>
                      confirm(`Delete ${b.name}?`) &&
                      buildingCrud.remove.mutate(b.id, { onSuccess: ok("Building deleted"), onError: fail })
                    }
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Layers className="h-4 w-4 text-muted-foreground" /> Floors
          </h2>
          <div className="space-y-2">
            <NativeSelect aria-label="Building" value={fBuilding} onChange={setFBuilding}>
              <option value="">Select building…</option>
              {(buildings.data ?? []).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </NativeSelect>
            <Input placeholder="Floor name" value={fName} onChange={(e) => setFName(e.target.value)} />
            <Button
              className="w-full"
              disabled={!fName.trim() || !fBuilding}
              onClick={() =>
                floorCrud.create.mutate(
                  { name: fName.trim(), building_id: fBuilding },
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
          <ul className="mt-4 space-y-2">
            {(floors.data ?? []).map((f) => (
              <li key={f.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{f.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {buildings.data?.find((b) => b.id === f.building_id)?.name ?? "—"} ·{" "}
                    {countAssets((a) => a.floor_id === f.id)} assets
                  </p>
                </div>
                {isAdmin ? (
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Delete floor"
                    onClick={() =>
                      confirm(`Delete ${f.name}?`) &&
                      floorCrud.remove.mutate(f.id, { onSuccess: ok("Floor deleted"), onError: fail })
                    }
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <DoorClosed className="h-4 w-4 text-muted-foreground" /> Rooms & desks
          </h2>
          <div className="space-y-2">
            <NativeSelect aria-label="Floor" value={rFloor} onChange={setRFloor}>
              <option value="">Select floor…</option>
              {(floors.data ?? []).map((f) => (
                <option key={f.id} value={f.id}>
                  {buildings.data?.find((b) => b.id === f.building_id)?.name ?? "?"} · {f.name}
                </option>
              ))}
            </NativeSelect>
            <Input placeholder="Room name" value={rName} onChange={(e) => setRName(e.target.value)} />
            <Input placeholder="Area / zone (optional)" value={rArea} onChange={(e) => setRArea(e.target.value)} />
            <Button
              className="w-full"
              disabled={!rName.trim() || !rFloor}
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
          <ul className="mt-4 space-y-2">
            {(rooms.data ?? []).map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{r.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {floors.data?.find((f) => f.id === r.floor_id)?.name ?? "—"} ·{" "}
                    {countAssets((a) => a.room_id === r.id)} assets
                  </p>
                </div>
                {isAdmin ? (
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Delete room"
                    onClick={() =>
                      confirm(`Delete ${r.name}?`) &&
                      roomCrud.remove.mutate(r.id, { onSuccess: ok("Room deleted"), onError: fail })
                    }
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
