import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAssets, useEmployees, useRefresh, logHistory } from "@/lib/queries";
import { todayISO } from "@/lib/format";
import { NativeSelect } from "./NativeSelect";
import { Field } from "./AssetForm";
import type { Asset } from "@/lib/types";

/** Sum of quantities currently held out of stock for one asset. */
async function fetchAssignedQty(assetId: string) {
  const { data } = await supabase
    .from("assignments")
    .select("quantity")
    .eq("asset_id", assetId)
    .is("returned_date", null);
  return (data ?? []).reduce((n, r) => n + ((r as { quantity?: number }).quantity ?? 1), 0);
}

export async function assignAsset(params: {
  asset: Asset;
  employeeId: string;
  date: string;
  quantity?: number;
  expectedReturn?: string;
  notes?: string;
  employeeName?: string;
}) {
  const { asset, employeeId, date, expectedReturn, notes, employeeName } = params;
  const total = asset.quantity ?? 1;
  const alreadyOut = await fetchAssignedQty(asset.id);
  const available = Math.max(0, total - alreadyOut);
  const qty = Math.max(1, Math.floor(params.quantity ?? 1));
  if (qty > available) {
    throw new Error(`Only ${available} of ${total} available to assign`);
  }

  await supabase.from("assignments").insert({
    asset_id: asset.id,
    employee_id: employeeId,
    assigned_date: date,
    quantity: qty,
    expected_return_date: expectedReturn || null,
    notes: notes || null,
  });

  const nowOut = alreadyOut + qty;
  const fullyOut = nowOut >= total;
  await supabase
    .from("assets")
    .update({
      // Only pin a single holder when the whole stock is with one person.
      assigned_employee_id: fullyOut && nowOut === qty ? employeeId : fullyOut ? asset.assigned_employee_id ?? employeeId : null,
      assigned_at: fullyOut ? date : null,
      expected_return_date: fullyOut ? expectedReturn || null : null,
      status: fullyOut ? "Assigned" : "Available",
    })
    .eq("id", asset.id);

  await logHistory(
    asset.id,
    "Asset Assigned",
    `${qty} of ${total} assigned to ${employeeName ?? "employee"} on ${date} · ${total - nowOut} left available`,
  );
}

export async function returnAsset(asset: Asset) {
  const date = todayISO();
  await supabase
    .from("assignments")
    .update({ returned_date: date })
    .eq("asset_id", asset.id)
    .is("returned_date", null);
  await supabase
    .from("assets")
    .update({
      assigned_employee_id: null,
      assigned_at: null,
      expected_return_date: null,
      status: "Available",
    })
    .eq("id", asset.id);
  await logHistory(asset.id, "Asset Returned", `Returned to stock on ${date}`);
}

export function AssignDialog({
  open,
  onOpenChange,
  asset,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  asset?: Asset | null;
}) {
  const employees = useEmployees();
  const assets = useAssets();
  const assignments = useAssignments();
  const refresh = useRefresh();
  const [assetId, setAssetId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [expected, setExpected] = useState("");
  const [notes, setNotes] = useState("");
  const [qty, setQty] = useState("1");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setAssetId(asset?.id ?? "");
      setEmployeeId("");
      setDate(todayISO());
      setExpected("");
      setNotes("");
      setQty("1");
    }
  }, [open, asset]);

  const assignedMap = assignedQtyMap(assignments.data);
  const target = asset ?? (assets.data ?? []).find((a) => a.id === assetId) ?? null;
  const total = target ? target.quantity ?? 1 : 0;
  const available = target ? availableQty(target, assignedMap) : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = asset ?? (assets.data ?? []).find((a) => a.id === assetId);
    if (!target) { toast.error("Select an asset"); return; }
    if (!employeeId) { toast.error("Select an employee"); return; }
    setSaving(true);
    try {
      const emp = (employees.data ?? []).find((x) => x.id === employeeId);
      await assignAsset({
        asset: target,
        employeeId,
        date,
        expectedReturn: expected,
        notes,
        ...(emp?.name ? { employeeName: emp.name } : {}),
      });
      refresh();
      toast.success(`${target.asset_code} assigned to ${emp?.name}`);
      onOpenChange(false);
    } catch (err) {
      toast.error((err as { message?: string }).message ?? "Assignment failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign asset</DialogTitle>
          <DialogDescription>
            Select an asset and employee. The previous assignment is kept in history.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {!asset ? (
            <Field label="Asset" required>
              <NativeSelect value={assetId} onChange={setAssetId}>
                <option value="">Select asset</option>
                {(assets.data ?? [])
                  .filter((a) => !a.archived)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.asset_code} — {a.name}
                    </option>
                  ))}
              </NativeSelect>
            </Field>
          ) : (
            <p className="rounded-lg bg-muted px-3 py-2 text-sm">
              <span className="font-mono font-semibold">{asset.asset_code}</span> — {asset.name}
            </p>
          )}
          <Field label="Employee" required>
            <NativeSelect value={employeeId} onChange={setEmployeeId}>
              <option value="">Select employee</option>
              {(employees.data ?? [])
                .filter((e) => e.active)
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} — {e.department ?? "—"} ({e.employee_code})
                  </option>
                ))}
            </NativeSelect>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Assignment date">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label="Expected return">
              <Input type="date" value={expected} onChange={(e) => setExpected(e.target.value)} />
            </Field>
          </div>
          <Field label="Notes">
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Assigning…" : "Confirm assignment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
