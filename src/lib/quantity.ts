import type { Asset, Assignment } from "./types";

/** Total quantity currently held by employees, per asset id. */
export function assignedQtyMap(assignments: Assignment[] | undefined) {
  const map = new Map<string, number>();
  for (const a of assignments ?? []) {
    if (a.returned_date) continue;
    const qty = (a as Assignment & { quantity?: number }).quantity ?? 1;
    map.set(a.asset_id, (map.get(a.asset_id) ?? 0) + qty);
  }
  return map;
}

export function totalQty(asset: Pick<Asset, "quantity">) {
  return asset.quantity ?? 1;
}

export function availableQty(
  asset: Pick<Asset, "id" | "quantity">,
  assigned: Map<string, number>,
) {
  return Math.max(0, totalQty(asset) - (assigned.get(asset.id) ?? 0));
}
