import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useBuildings, useCenters, useFloors, useRooms } from "@/lib/queries";
import type { Building, Floor, Room } from "@/lib/types";

export type LocationScope = {
  centerId: string;
  buildingId: string;
  floorId: string;
  roomId: string;
};

const EMPTY_SCOPE: LocationScope = { centerId: "", buildingId: "", floorId: "", roomId: "" };
const STORAGE_KEY = "assetvault:scope";

type Located = {
  building_id?: string | null;
  floor_id?: string | null;
  room_id?: string | null;
};

type ScopeContextValue = {
  scope: LocationScope;
  setCenter: (id: string) => void;
  setBuilding: (id: string) => void;
  setFloor: (id: string) => void;
  setRoom: (id: string) => void;
  reset: () => void;
  /** Buildings belonging to the selected center (all buildings when no center is selected). */
  buildingOptions: Building[];
  /** Floors of the selected building (empty until a building is chosen). */
  floorOptions: Floor[];
  /** Rooms of the selected floor (all rooms of the selected building when no floor is chosen). */
  roomOptions: Room[];
  /** Ids of the buildings currently in scope. */
  scopedBuildingIds: string[];
  /** True when a record's building/floor/room satisfies the current scope. */
  inScope: (record: Located | null | undefined) => boolean;
  /** Convenience filter for arrays of located records. */
  filterByScope: <T extends Located>(rows: T[] | undefined) => T[];
  /** True when any level of the hierarchy is selected. */
  isScoped: boolean;
  scopeLabel: string;
  /** Helpers to resolve names/relationships by id. */
  buildingsById: Map<string, Building>;
  floorsById: Map<string, Floor>;
  roomsById: Map<string, Room>;
};

const ScopeContext = createContext<ScopeContextValue | null>(null);

function readStored(): LocationScope {
  if (typeof window === "undefined") return EMPTY_SCOPE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_SCOPE;
    return { ...EMPTY_SCOPE, ...(JSON.parse(raw) as Partial<LocationScope>) };
  } catch {
    return EMPTY_SCOPE;
  }
}

export function LocationScopeProvider({ children }: { children: ReactNode }) {
  const centers = useCenters();
  const buildings = useBuildings();
  const floors = useFloors();
  const rooms = useRooms();

  const [scope, setScope] = useState<LocationScope>(EMPTY_SCOPE);

  useEffect(() => {
    setScope(readStored());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scope));
  }, [scope]);

  const buildingsById = useMemo(
    () => new Map((buildings.data ?? []).map((b) => [b.id, b])),
    [buildings.data],
  );
  const floorsById = useMemo(() => new Map((floors.data ?? []).map((f) => [f.id, f])), [floors.data]);
  const roomsById = useMemo(() => new Map((rooms.data ?? []).map((r) => [r.id, r])), [rooms.data]);

  // Drop selections whose parent disappeared or no longer matches (e.g. deleted rows).
  useEffect(() => {
    if (!centers.data || !buildings.data || !floors.data || !rooms.data) return;
    setScope((s) => {
      const next = { ...s };
      if (next.centerId && !centers.data.some((c) => c.id === next.centerId)) next.centerId = "";
      const building = next.buildingId ? buildingsById.get(next.buildingId) : undefined;
      if (next.buildingId && (!building || (next.centerId && building.center_id !== next.centerId))) {
        next.buildingId = "";
      }
      const floor = next.floorId ? floorsById.get(next.floorId) : undefined;
      if (next.floorId && (!floor || (next.buildingId && floor.building_id !== next.buildingId))) {
        next.floorId = "";
      }
      const room = next.roomId ? roomsById.get(next.roomId) : undefined;
      if (next.roomId && (!room || (next.floorId && room.floor_id !== next.floorId))) next.roomId = "";
      return next.centerId === s.centerId &&
        next.buildingId === s.buildingId &&
        next.floorId === s.floorId &&
        next.roomId === s.roomId
        ? s
        : next;
    });
  }, [centers.data, buildings.data, floors.data, rooms.data, buildingsById, floorsById, roomsById]);

  const setCenter = useCallback(
    (centerId: string) => setScope({ centerId, buildingId: "", floorId: "", roomId: "" }),
    [],
  );
  const setBuilding = useCallback(
    (buildingId: string) =>
      setScope((s) => ({
        centerId: buildingId ? (buildingsById.get(buildingId)?.center_id ?? s.centerId) : s.centerId,
        buildingId,
        floorId: "",
        roomId: "",
      })),
    [buildingsById],
  );
  const setFloor = useCallback(
    (floorId: string) =>
      setScope((s) => ({
        ...s,
        buildingId: floorId ? (floorsById.get(floorId)?.building_id ?? s.buildingId) : s.buildingId,
        floorId,
        roomId: "",
      })),
    [floorsById],
  );
  const setRoom = useCallback(
    (roomId: string) =>
      setScope((s) => ({
        ...s,
        floorId: roomId ? (roomsById.get(roomId)?.floor_id ?? s.floorId) : s.floorId,
        roomId,
      })),
    [roomsById],
  );
  const reset = useCallback(() => setScope(EMPTY_SCOPE), []);

  const buildingOptions = useMemo(
    () => (buildings.data ?? []).filter((b) => !scope.centerId || b.center_id === scope.centerId),
    [buildings.data, scope.centerId],
  );

  const floorOptions = useMemo(
    () => (scope.buildingId ? (floors.data ?? []).filter((f) => f.building_id === scope.buildingId) : []),
    [floors.data, scope.buildingId],
  );

  const roomOptions = useMemo(() => {
    if (scope.floorId) return (rooms.data ?? []).filter((r) => r.floor_id === scope.floorId);
    if (scope.buildingId) {
      const ids = new Set(floorOptions.map((f) => f.id));
      return (rooms.data ?? []).filter((r) => ids.has(r.floor_id));
    }
    return [];
  }, [rooms.data, scope.floorId, scope.buildingId, floorOptions]);

  const scopedBuildingIds = useMemo(() => {
    if (scope.buildingId) return [scope.buildingId];
    return buildingOptions.map((b) => b.id);
  }, [scope.buildingId, buildingOptions]);

  const inScope = useCallback(
    (record: Located | null | undefined) => {
      if (!record) return false;
      if (scope.roomId) return record.room_id === scope.roomId;
      if (scope.floorId) return record.floor_id === scope.floorId;
      if (scope.buildingId) return record.building_id === scope.buildingId;
      if (scope.centerId) {
        if (!record.building_id) return false;
        const building = buildingsById.get(record.building_id);
        return building?.center_id === scope.centerId;
      }
      return true;
    },
    [scope, buildingsById],
  );

  const filterByScope = useCallback(
    <T extends Located>(rows: T[] | undefined) => (rows ?? []).filter((r) => inScope(r)),
    [inScope],
  );

  const scopeLabel = useMemo(() => {
    const parts: string[] = [];
    if (scope.centerId) parts.push(centers.data?.find((c) => c.id === scope.centerId)?.name ?? "Center");
    if (scope.buildingId) parts.push(buildingsById.get(scope.buildingId)?.name ?? "Building");
    if (scope.floorId) parts.push(floorsById.get(scope.floorId)?.name ?? "Floor");
    if (scope.roomId) parts.push(roomsById.get(scope.roomId)?.name ?? "Room");
    return parts.length ? parts.join(" › ") : "All locations";
  }, [scope, centers.data, buildingsById, floorsById, roomsById]);

  const value: ScopeContextValue = {
    scope,
    setCenter,
    setBuilding,
    setFloor,
    setRoom,
    reset,
    buildingOptions,
    floorOptions,
    roomOptions,
    scopedBuildingIds,
    inScope,
    filterByScope,
    isScoped: !!(scope.centerId || scope.buildingId || scope.floorId || scope.roomId),
    scopeLabel,
    buildingsById,
    floorsById,
    roomsById,
  };

  return <ScopeContext.Provider value={value}>{children}</ScopeContext.Provider>;
}

export function useLocationScope(): ScopeContextValue {
  const ctx = useContext(ScopeContext);
  if (!ctx) throw new Error("useLocationScope must be used inside LocationScopeProvider");
  return ctx;
}
