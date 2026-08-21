import type { Database } from "@/integrations/supabase/types";

type T = Database["public"]["Tables"];

export type Asset = T["assets"]["Row"];
export type AssetInsert = T["assets"]["Insert"];
export type Category = T["categories"]["Row"];
export type AssetStatus = T["asset_statuses"]["Row"];
export type AssetCondition = T["asset_conditions"]["Row"];
export type Building = T["buildings"]["Row"];
export type Floor = T["floors"]["Row"];
export type Room = T["rooms"]["Row"];
export type Employee = T["employees"]["Row"];
export type Assignment = T["assignments"]["Row"];
export type Maintenance = T["maintenance"]["Row"];
export type Incident = T["incidents"]["Row"];
export type AssetHistory = T["asset_history"]["Row"];
export type Verification = T["verifications"]["Row"];
export type VerificationItem = T["verification_items"]["Row"];
export type AppRole = Database["public"]["Enums"]["app_role"];
