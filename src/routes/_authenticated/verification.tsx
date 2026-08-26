import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Play, Square } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { NativeSelect } from "@/components/app/NativeSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Scanner, parseScan } from "@/components/app/Scanner";
import { StatusBadge } from "@/components/app/StatusBadge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAssets, useBuildings, useFloors, useRooms, logHistory } from "@/lib/queries";
import { formatDateTime } from "@/lib/format";
import type { Verification, VerificationItem } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/verification")({
  head: () => ({
    meta: [
      { title: "Inventory Verification — AssetVault" },
      {
        name: "description",
        content: "Run physical stock audits: scan assets room by room and flag anything missing.",
      },
      { property: "og:title", content: "Inventory Verification — AssetVault" },
      { property: "og:description", content: "Scan-based physical stock audits for your office assets." },
    ],
  }),
  component: VerificationPage,
});

function VerificationPage() {
  const qc = useQueryClient();
  const assets = useAssets();
  const buildings = useBuildings();
  const floors = useFloors();
  const rooms = useRooms();

  const [name, setName] = useState("");
  const [buildingId, setBuildingId] = useState("");
  const [floorId, setFloorId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  const sessions = useQuery({
    queryKey: ["verifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("verifications")
        .select("*")
        .order("started_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Verification[];
    },
  });

  const items = useQuery({
    queryKey: ["verification_items", activeId],
    enabled: !!activeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("verification_items")
        .select("*")
        .eq("verification_id", activeId!);
      if (error) throw error;
      return (data ?? []) as VerificationItem[];
    },
  });

  const active = (sessions.data ?? []).find((s) => s.id === activeId) ?? null;

  const expected = useMemo(() => {
    const list = (assets.data ?? []).filter((a) => !a.archived);
    if (!active) return [];
    return list.filter(
      (a) =>
        (!active.building_id || a.building_id === active.building_id) &&
        (!active.floor_id || a.floor_id === active.floor_id) &&
        (!active.room_id || a.room_id === active.room_id),
    );
  }, [assets.data, active]);

  const scannedIds = new Set((items.data ?? []).map((i) => i.asset_id));

  const startSession = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("verifications")
      .insert({
        name: name.trim() || `Audit ${new Date().toLocaleDateString("en-GB")}`,
        building_id: buildingId || null,
        floor_id: floorId || null,
        room_id: roomId || null,
        created_by: userData.user?.id ?? null,
      })
      .select()
      .single();
    if (error) return toast.error(error.message);
    setName("");
    setActiveId((data as Verification).id);
    qc.invalidateQueries({ queryKey: ["verifications"] });
    toast.success("Verification session started");
  };

  const recordScan = async (text: string) => {
    const id = parseScan(text);
    if (!id || !activeId) return toast.error("Unrecognised code");
    if (scannedIds.has(id)) return toast.info("Already verified in this session");
    const asset = (assets.data ?? []).find((a) => a.id === id);
    if (!asset) return toast.error("Asset not found");
    const { error } = await supabase
      .from("verification_items")
      .insert({ verification_id: activeId, asset_id: id, result: "Verified" });
    if (error) return toast.error(error.message);
    await logHistory(id, "Verified", `Physical verification: ${active?.name ?? "session"}`);
    qc.invalidateQueries({ queryKey: ["verification_items", activeId] });
    toast.success(`Verified ${asset.asset_code} — ${asset.name}`);
  };

  const completeSession = async () => {
    if (!activeId) return;
    const missing = expected.filter((a) => !scannedIds.has(a.id));
    if (missing.length) {
      await supabase.from("verification_items").insert(
        missing.map((a) => ({ verification_id: activeId, asset_id: a.id, result: "Missing" })),
      );
    }
    const { error } = await supabase
      .from("verifications")
      .update({ status: "Completed", completed_at: new Date().toISOString() })
      .eq("id", activeId);
    if (error) return toast.error(error.message);
    qc.invalidateQueries();
    toast.success(`Session closed — ${missing.length} asset(s) marked missing`);
    setActiveId(null);
  };

  return (
    <div>
      <PageHeader
        title="Inventory Verification"
        description="Scan assets in a room to confirm they are physically present; anything unscanned is flagged missing."
      />

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold">New session</h2>
            <div className="space-y-2">
              <Input placeholder="Session name" value={name} onChange={(e) => setName(e.target.value)} />
              <NativeSelect value={buildingId} onChange={setBuildingId} aria-label="Building">
                <option value="">All buildings</option>
                {(buildings.data ?? []).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </NativeSelect>
              <NativeSelect value={floorId} onChange={setFloorId} aria-label="Floor">
                <option value="">All floors</option>
                {(floors.data ?? [])
                  .filter((f) => !buildingId || f.building_id === buildingId)
                  .map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
              </NativeSelect>
              <NativeSelect value={roomId} onChange={setRoomId} aria-label="Room">
                <option value="">All rooms</option>
                {(rooms.data ?? [])
                  .filter((r) => !floorId || r.floor_id === floorId)
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
              </NativeSelect>
              <Button className="w-full" onClick={startSession}>
                <Play className="mr-1.5 h-4 w-4" /> Start verification
              </Button>
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold">Sessions</h2>
            <div className="space-y-1.5">
              {(sessions.data ?? []).map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveId(s.id)}
                  className={`w-full rounded-md border p-2.5 text-left text-sm transition-colors hover:bg-accent ${
                    s.id === activeId ? "border-primary bg-accent" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">{s.name}</span>
                    <StatusBadge value={s.status === "Completed" ? "Retired" : "Available"} />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{formatDateTime(s.started_at)}</p>
                </button>
              ))}
              {!sessions.data?.length ? (
                <p className="text-sm text-muted-foreground">No sessions yet.</p>
              ) : null}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          {active ? (
            <>
              <Card className="p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-semibold">{active.name}</h2>
                    <p className="text-xs text-muted-foreground">
                      {scannedIds.size} of {expected.length} expected assets verified
                    </p>
                  </div>
                  {active.status !== "Completed" ? (
                    <Button variant="outline" size="sm" onClick={completeSession}>
                      <Square className="mr-1.5 h-4 w-4" /> Complete session
                    </Button>
                  ) : null}
                </div>
                {active.status !== "Completed" ? <Scanner onResult={recordScan} /> : null}
              </Card>

              <Card className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2.5">Asset</th>
                      <th className="px-4 py-2.5">Code</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expected.map((a) => {
                      const found = scannedIds.has(a.id);
                      return (
                        <tr key={a.id} className="border-t">
                          <td className="px-4 py-2.5 font-medium">{a.name}</td>
                          <td className="px-4 py-2.5 font-mono text-xs">{a.asset_code}</td>
                          <td className="px-4 py-2.5">
                            <StatusBadge value={a.status} />
                          </td>
                          <td className="px-4 py-2.5">
                            {found ? (
                              <span className="inline-flex items-center gap-1.5 text-success">
                                <CheckCircle2 className="h-4 w-4" /> Verified
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Pending</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {!expected.length ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                          No assets match this scope.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </Card>
            </>
          ) : (
            <Card className="p-10 text-center text-sm text-muted-foreground">
              Start or select a session to begin verifying assets.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
