import { MapPin, X } from "lucide-react";
import { NativeSelect } from "@/components/app/NativeSelect";
import { Button } from "@/components/ui/button";
import { useCenters } from "@/lib/queries";
import { useLocationScope } from "@/lib/scope";

/**
 * Global Center → Building → Floor → Room selector.
 * Everything downstream (dashboard, assets, assignments, maintenance,
 * verification, reports) reads the same scope, so data never mixes.
 */
export function ScopeBar() {
  const centers = useCenters();
  const {
    scope,
    setCenter,
    setBuilding,
    setFloor,
    setRoom,
    reset,
    buildingOptions,
    floorOptions,
    roomOptions,
    isScoped,
  } = useLocationScope();

  return (
    <div className="no-print flex flex-wrap items-center gap-2 border-b bg-card/60 px-4 py-2.5 lg:px-6">
      <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <MapPin className="h-3.5 w-3.5" /> Scope
      </span>
      <NativeSelect
        aria-label="Center"
        className="w-auto min-w-[9rem]"
        value={scope.centerId}
        onChange={setCenter}
      >
        <option value="">All centers</option>
        {(centers.data ?? []).map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </NativeSelect>
      <NativeSelect
        aria-label="Building"
        className="w-auto min-w-[9rem]"
        value={scope.buildingId}
        onChange={setBuilding}
      >
        <option value="">All buildings</option>
        {buildingOptions.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </NativeSelect>
      <NativeSelect
        aria-label="Floor"
        className="w-auto min-w-[8rem]"
        value={scope.floorId}
        onChange={setFloor}
      >
        <option value="">{scope.buildingId ? "All floors" : "Select building first"}</option>
        {floorOptions.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name}
          </option>
        ))}
      </NativeSelect>
      <NativeSelect
        aria-label="Room"
        className="w-auto min-w-[8rem]"
        value={scope.roomId}
        onChange={setRoom}
      >
        <option value="">{scope.buildingId ? "All rooms" : "Select building first"}</option>
        {roomOptions.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </NativeSelect>
      {isScoped ? (
        <Button variant="ghost" size="sm" onClick={reset}>
          <X className="mr-1 h-3.5 w-3.5" /> Clear
        </Button>
      ) : null}
    </div>
  );
}
