import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  Asset,
  AssetCondition,
  AssetHistory,
  AssetStatus,
  Assignment,
  Building,
  Category,
  Center,
  Employee,
  Floor,
  Incident,
  Maintenance,
  Room,
} from "./types";

async function selectAll<R>(table: string, order = "created_at", asc = true): Promise<R[]> {
  const { data, error } = await supabase
    .from(table as never)
    .select("*")
    .order(order as never, { ascending: asc });
  if (error) throw error;
  return (data ?? []) as R[];
}

export const qk = {
  assets: ["assets"] as const,
  centers: ["centers"] as const,
  categories: ["categories"] as const,
  statuses: ["asset_statuses"] as const,
  conditions: ["asset_conditions"] as const,
  buildings: ["buildings"] as const,
  floors: ["floors"] as const,
  rooms: ["rooms"] as const,
  employees: ["employees"] as const,
  assignments: ["assignments"] as const,
  maintenance: ["maintenance"] as const,
  incidents: ["incidents"] as const,
  history: ["asset_history"] as const,
  verifications: ["verifications"] as const,
};

export function useAssets() {
  return useQuery({
    queryKey: qk.assets,
    queryFn: () => selectAll<Asset>("assets", "created_at", false),
  });
}
export function useCategories() {
  return useQuery({ queryKey: qk.categories, queryFn: () => selectAll<Category>("categories", "name") });
}
export function useStatuses() {
  return useQuery({
    queryKey: qk.statuses,
    queryFn: () => selectAll<AssetStatus>("asset_statuses", "sort_order"),
  });
}
export function useConditions() {
  return useQuery({
    queryKey: qk.conditions,
    queryFn: () => selectAll<AssetCondition>("asset_conditions", "sort_order"),
  });
}
export function useCenters() {
  return useQuery({ queryKey: qk.centers, queryFn: () => selectAll<Center>("centers", "name") });
}
export function useBuildings() {
  return useQuery({ queryKey: qk.buildings, queryFn: () => selectAll<Building>("buildings", "name") });
}
export function useFloors() {
  return useQuery({ queryKey: qk.floors, queryFn: () => selectAll<Floor>("floors", "sort_order") });
}
export function useRooms() {
  return useQuery({ queryKey: qk.rooms, queryFn: () => selectAll<Room>("rooms", "name") });
}
export function useEmployees() {
  return useQuery({ queryKey: qk.employees, queryFn: () => selectAll<Employee>("employees", "name") });
}
export function useAssignments() {
  return useQuery({
    queryKey: qk.assignments,
    queryFn: () => selectAll<Assignment>("assignments", "created_at", false),
  });
}
export function useMaintenance() {
  return useQuery({
    queryKey: qk.maintenance,
    queryFn: () => selectAll<Maintenance>("maintenance", "maintenance_date", false),
  });
}
export function useIncidents() {
  return useQuery({
    queryKey: qk.incidents,
    queryFn: () => selectAll<Incident>("incidents", "reported_date", false),
  });
}

export function useAsset(id: string) {
  return useQuery({
    queryKey: ["asset", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("assets").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as Asset | null;
    },
    enabled: !!id,
  });
}

export function useAssetHistory(assetId: string) {
  return useQuery({
    queryKey: ["asset_history", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asset_history")
        .select("*")
        .eq("asset_id", assetId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AssetHistory[];
    },
    enabled: !!assetId,
  });
}

export async function logHistory(assetId: string, action: string, details?: string) {
  const { data: userData } = await supabase.auth.getUser();
  await supabase.from("asset_history").insert({
    asset_id: assetId,
    action,
    details: details ?? null,
    actor_id: userData.user?.id ?? null,
    actor_name: userData.user?.email ?? "System",
  });
}

/** Generic invalidation for every asset-related cache. */
export function useRefresh() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries();
  };
}

export function useCrud(table: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries();

  const create = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from(table as never)
        .insert(values as never)
        .select()
        .single();
      if (error) throw error;
      return data as Record<string, unknown>;
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Record<string, unknown> }) => {
      const { data, error } = await supabase
        .from(table as never)
        .update(values as never)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Record<string, unknown>;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from(table as never)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
