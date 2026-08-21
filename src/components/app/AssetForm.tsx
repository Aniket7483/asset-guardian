import { useEffect, useMemo, useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  useBuildings,
  useCategories,
  useConditions,
  useCrud,
  useEmployees,
  useFloors,
  useRooms,
  useStatuses,
  logHistory,
} from "@/lib/queries";
import type { Asset } from "@/lib/types";
import { NativeSelect } from "./NativeSelect";

type FormState = Record<string, string>;

const EMPTY: FormState = {
  name: "",
  category_id: "",
  asset_type: "",
  description: "",
  ownership: "Company Owned",
  brand: "",
  model: "",
  serial_number: "",
  quantity: "1",
  condition: "Good",
  status: "Available",
  purchase_date: "",
  purchase_price: "",
  vendor: "",
  invoice_number: "",
  warranty_start: "",
  warranty_end: "",
  building_id: "",
  floor_id: "",
  room_id: "",
  specific_location: "",
  photo_url: "",
  notes: "",
  assigned_employee_id: "",
  assigned_at: "",
  expected_return_date: "",
};

function toState(asset: Asset): FormState {
  const s: FormState = { ...EMPTY };
  for (const key of Object.keys(EMPTY)) {
    const v = (asset as unknown as Record<string, unknown>)[key];
    s[key] = v === null || v === undefined ? "" : String(v);
  }
  return s;
}

export function AssetForm({
  open,
  onOpenChange,
  asset,
  defaults,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  asset?: Asset | null;
  defaults?: Partial<FormState>;
}) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const categories = useCategories();
  const statuses = useStatuses();
  const conditions = useConditions();
  const buildings = useBuildings();
  const floors = useFloors();
  const rooms = useRooms();
  const employees = useEmployees();
  const { create, update } = useCrud("assets");

  useEffect(() => {
    if (open) setForm(asset ? toState(asset) : { ...EMPTY, ...defaults });
  }, [open, asset, defaults]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const floorOptions = useMemo(
    () => (floors.data ?? []).filter((f) => !form.building_id || f.building_id === form.building_id),
    [floors.data, form.building_id],
  );
  const roomOptions = useMemo(
    () => (rooms.data ?? []).filter((r) => !form.floor_id || r.floor_id === form.floor_id),
    [rooms.data, form.floor_id],
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Asset name is required");
      return;
    }
    setSaving(true);
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      category_id: form.category_id || null,
      asset_type: form.asset_type || null,
      description: form.description || null,
      ownership: form.ownership || null,
      brand: form.brand || null,
      model: form.model || null,
      serial_number: form.serial_number.trim() || null,
      quantity: Number(form.quantity) || 1,
      condition: form.condition || "Good",
      status: form.status || "Available",
      purchase_date: form.purchase_date || null,
      purchase_price: form.purchase_price === "" ? null : Number(form.purchase_price),
      vendor: form.vendor || null,
      invoice_number: form.invoice_number || null,
      warranty_start: form.warranty_start || null,
      warranty_end: form.warranty_end || null,
      building_id: form.building_id || null,
      floor_id: form.floor_id || null,
      room_id: form.room_id || null,
      specific_location: form.specific_location || null,
      photo_url: form.photo_url || null,
      notes: form.notes || null,
      assigned_employee_id: form.assigned_employee_id || null,
      assigned_at: form.assigned_at || null,
      expected_return_date: form.expected_return_date || null,
    };

    try {
      if (asset) {
        await update.mutateAsync({ id: asset.id, values: payload });
        await logHistory(asset.id, "Asset Updated", `${asset.asset_code} details updated`);
        toast.success("Asset updated");
      } else {
        const created = (await create.mutateAsync(payload)) as unknown as Asset;
        await logHistory(created.id, "Asset Created", `${created.asset_code} added to the registry`);
        if (created.assigned_employee_id) {
          await logHistory(created.id, "Asset Assigned", "Assigned at creation");
        }
        toast.success(`Asset created — ${created.asset_code}`);
      }
      onOpenChange(false);
    } catch (err) {
      const msg = (err as { message?: string }).message ?? "Could not save asset";
      toast.error(msg.includes("assets_serial_unique") ? "That serial number already exists" : msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{asset ? `Edit ${asset.asset_code}` : "Add asset"}</DialogTitle>
          <DialogDescription>
            {asset
              ? "Update the asset record. Changes are recorded in the asset history."
              : "A unique Asset ID and QR code are generated automatically."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <Tabs defaultValue="basic">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="purchase">Purchase</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
              <TabsTrigger value="assignment">Assignment</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="grid gap-4 pt-4 sm:grid-cols-2">
              <Field label="Asset name" required>
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} required />
              </Field>
              <Field label="Category">
                <NativeSelect value={form.category_id} onChange={(v) => set("category_id", v)}>
                  <option value="">Select category</option>
                  {(categories.data ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field label="Asset type">
                <Input value={form.asset_type} onChange={(e) => set("asset_type", e.target.value)} />
              </Field>
              <Field label="Company ownership">
                <NativeSelect value={form.ownership} onChange={(v) => set("ownership", v)}>
                  <option>Company Owned</option>
                  <option>Leased</option>
                  <option>Rented</option>
                  <option>Employee Owned</option>
                </NativeSelect>
              </Field>
              <Field label="Brand">
                <Input value={form.brand} onChange={(e) => set("brand", e.target.value)} />
              </Field>
              <Field label="Model">
                <Input value={form.model} onChange={(e) => set("model", e.target.value)} />
              </Field>
              <Field label="Serial number">
                <Input
                  value={form.serial_number}
                  onChange={(e) => set("serial_number", e.target.value)}
                />
              </Field>
              <Field label="Quantity">
                <Input
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(e) => set("quantity", e.target.value)}
                />
              </Field>
              <Field label="Condition">
                <NativeSelect value={form.condition} onChange={(v) => set("condition", v)}>
                  {(conditions.data ?? []).map((c) => (
                    <option key={c.id}>{c.name}</option>
                  ))}
                </NativeSelect>
              </Field>
              <Field label="Status">
                <NativeSelect value={form.status} onChange={(v) => set("status", v)}>
                  {(statuses.data ?? []).map((s) => (
                    <option key={s.id}>{s.name}</option>
                  ))}
                </NativeSelect>
              </Field>
              <Field label="Photo URL" className="sm:col-span-2">
                <Input
                  value={form.photo_url}
                  onChange={(e) => set("photo_url", e.target.value)}
                  placeholder="https://…"
                />
              </Field>
              <Field label="Description" className="sm:col-span-2">
                <Textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                />
              </Field>
            </TabsContent>

            <TabsContent value="purchase" className="grid gap-4 pt-4 sm:grid-cols-2">
              <Field label="Purchase date">
                <Input
                  type="date"
                  value={form.purchase_date}
                  onChange={(e) => set("purchase_date", e.target.value)}
                />
              </Field>
              <Field label="Purchase price">
                <Input
                  type="number"
                  step="0.01"
                  value={form.purchase_price}
                  onChange={(e) => set("purchase_price", e.target.value)}
                />
              </Field>
              <Field label="Vendor / supplier">
                <Input value={form.vendor} onChange={(e) => set("vendor", e.target.value)} />
              </Field>
              <Field label="Invoice number">
                <Input
                  value={form.invoice_number}
                  onChange={(e) => set("invoice_number", e.target.value)}
                />
              </Field>
              <Field label="Warranty start">
                <Input
                  type="date"
                  value={form.warranty_start}
                  onChange={(e) => set("warranty_start", e.target.value)}
                />
              </Field>
              <Field label="Warranty end">
                <Input
                  type="date"
                  value={form.warranty_end}
                  onChange={(e) => set("warranty_end", e.target.value)}
                />
              </Field>
            </TabsContent>

            <TabsContent value="location" className="grid gap-4 pt-4 sm:grid-cols-2">
              <Field label="Building">
                <NativeSelect
                  value={form.building_id}
                  onChange={(v) => {
                    set("building_id", v);
                    set("floor_id", "");
                    set("room_id", "");
                  }}
                >
                  <option value="">Select building</option>
                  {(buildings.data ?? []).map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field label="Floor">
                <NativeSelect
                  value={form.floor_id}
                  onChange={(v) => {
                    set("floor_id", v);
                    set("room_id", "");
                  }}
                >
                  <option value="">Select floor</option>
                  {floorOptions.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field label="Room">
                <NativeSelect value={form.room_id} onChange={(v) => set("room_id", v)}>
                  <option value="">Select room</option>
                  {roomOptions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field label="Desk / specific location">
                <Input
                  value={form.specific_location}
                  onChange={(e) => set("specific_location", e.target.value)}
                  placeholder="e.g. Director Desk"
                />
              </Field>
            </TabsContent>

            <TabsContent value="assignment" className="grid gap-4 pt-4 sm:grid-cols-2">
              <Field label="Assigned to">
                <NativeSelect
                  value={form.assigned_employee_id}
                  onChange={(v) => {
                    set("assigned_employee_id", v);
                    if (v && !form.assigned_at) set("assigned_at", new Date().toISOString().slice(0, 10));
                    if (v && form.status === "Available") set("status", "Assigned");
                  }}
                >
                  <option value="">Unassigned</option>
                  {(employees.data ?? []).map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.employee_code})
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field label="Assignment date">
                <Input
                  type="date"
                  value={form.assigned_at}
                  onChange={(e) => set("assigned_at", e.target.value)}
                />
              </Field>
              <Field label="Expected return date">
                <Input
                  type="date"
                  value={form.expected_return_date}
                  onChange={(e) => set("expected_return_date", e.target.value)}
                />
              </Field>
              <Field label="Notes" className="sm:col-span-2">
                <Textarea rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
              </Field>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : asset ? "Save changes" : "Create asset"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function Field({
  label,
  children,
  required,
  className,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      {children}
    </div>
  );
}
