import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Building2, ChevronRight, Trash2, MapPin } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useAssets, useBuildings, useCenters, useCrud } from "@/lib/queries";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/locations/")({
  head: () => ({
    meta: [
      { title: "Locations — AssetVault" },
      {
        name: "description",
        content: "Open a center to manage only its buildings, floors, rooms and assets.",
      },
      { property: "og:title", content: "Locations — AssetVault" },
      { property: "og:description", content: "Drill down from centers to buildings, floors and rooms." },
    ],
  }),
  component: CentersPage,
});

function CentersPage() {
  const centers = useCenters();
  const buildings = useBuildings();
  const assets = useAssets();
  const { isAdmin } = useAuth();
  const centerCrud = useCrud("centers");

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [address, setAddress] = useState("");

  const stats = useMemo(() => {
    const byCenter = new Map<string, { buildings: number; assets: number }>();
    const buildingCenter = new Map((buildings.data ?? []).map((b) => [b.id, b.center_id]));
    for (const b of buildings.data ?? []) {
      const s = byCenter.get(b.center_id) ?? { buildings: 0, assets: 0 };
      s.buildings += 1;
      byCenter.set(b.center_id, s);
    }
    for (const a of assets.data ?? []) {
      if (a.archived || !a.building_id) continue;
      const centerId = buildingCenter.get(a.building_id);
      if (!centerId) continue;
      const s = byCenter.get(centerId) ?? { buildings: 0, assets: 0 };
      s.assets += 1;
      byCenter.set(centerId, s);
    }
    return byCenter;
  }, [buildings.data, assets.data]);

  return (
    <div>
      <PageHeader
        title="Locations"
        description="Choose a center to open its own location dashboard. Data never mixes between centers."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {(centers.data ?? []).map((c) => {
            const s = stats.get(c.id) ?? { buildings: 0, assets: 0 };
            return (
              <Card key={c.id} className="group relative p-0">
                <Link
                  to="/locations/$centerId"
                  params={{ centerId: c.id }}
                  className="flex items-start gap-3 p-4 transition-colors hover:bg-accent/50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{c.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.code ? `${c.code} · ` : ""}
                      {c.address || "No address"}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {s.buildings} buildings · {s.assets} assets
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
                {isAdmin ? (
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Delete ${c.name}`}
                    className="absolute bottom-2 right-2 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() =>
                      confirm(`Delete ${c.name}? Buildings must be removed first.`) &&
                      centerCrud.remove.mutate(c.id, {
                        onSuccess: () => toast.success("Center deleted"),
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
          {centers.data && centers.data.length === 0 ? (
            <Card className="p-6 text-sm text-muted-foreground">No centers yet. Add one to begin.</Card>
          ) : null}
        </div>

        <Card className="h-fit p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Building2 className="h-4 w-4 text-muted-foreground" /> Add center
          </h2>
          <div className="space-y-2">
            <Input placeholder="Center name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Code (optional)" value={code} onChange={(e) => setCode(e.target.value)} />
            <Input
              placeholder="Address (optional)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <Button
              className="w-full"
              disabled={!name.trim() || centerCrud.create.isPending}
              onClick={() =>
                centerCrud.create.mutate(
                  { name: name.trim(), code: code.trim() || null, address: address.trim() || null },
                  {
                    onSuccess: () => {
                      setName("");
                      setCode("");
                      setAddress("");
                      toast.success("Center added");
                    },
                    onError: (e) => toast.error((e as Error).message),
                  },
                )
              }
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add center
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
