import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Field } from "@/components/app/AssetForm";
import { NativeSelect } from "@/components/app/NativeSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { useAssets, useCrud, useEmployees, useRooms } from "@/lib/queries";
import { dash } from "@/lib/format";
import type { Employee } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/employees")({
  head: () => ({
    meta: [
      { title: "Employees — AssetVault" },
      {
        name: "description",
        content: "Employee directory with departments, desks and the assets currently held by each person.",
      },
      { property: "og:title", content: "Employees — AssetVault" },
      { property: "og:description", content: "Who holds which office asset, at a glance." },
    ],
  }),
  component: EmployeesPage,
});

const EMPTY = {
  employee_code: "",
  name: "",
  department: "",
  designation: "",
  email: "",
  phone: "",
  room_id: "",
};

function EmployeesPage() {
  const employees = useEmployees();
  const rooms = useRooms();
  const assets = useAssets();
  const { create, update, remove } = useCrud("employees");
  const { isAdmin } = useAuth();
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState({ ...EMPTY });

  const filtered = useMemo(() => {
    const t = term.toLowerCase();
    return (employees.data ?? []).filter((e) =>
      !t
        ? true
        : [e.name, e.employee_code, e.department, e.designation, e.email]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(t)),
    );
  }, [employees.data, term]);

  const heldBy = (id: string) => (assets.data ?? []).filter((a) => a.assigned_employee_id === id);

  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY, employee_code: `EMP-${String((employees.data ?? []).length + 1).padStart(3, "0")}` });
    setOpen(true);
  };

  const openEdit = (e: Employee) => {
    setEditing(e);
    setForm({
      employee_code: e.employee_code,
      name: e.name,
      department: e.department ?? "",
      designation: e.designation ?? "",
      email: e.email ?? "",
      phone: e.phone ?? "",
      room_id: e.room_id ?? "",
    });
    setOpen(true);
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const values = { ...form, room_id: form.room_id || null };
    try {
      if (editing) await update.mutateAsync({ id: editing.id, values });
      else await create.mutateAsync(values);
      toast.success(editing ? "Employee updated" : "Employee added");
      setOpen(false);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div>
      <PageHeader
        title="Employees"
        description="Everyone who can hold an office asset."
        actions={
          <Button onClick={openNew}>
            <Plus className="mr-1.5 h-4 w-4" /> Add employee
          </Button>
        }
      />

      <Card className="mb-4 p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search employees…"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Desk / room</TableHead>
                <TableHead>Assets held</TableHead>
                <TableHead className="w-[90px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    No employees yet.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-mono text-xs">{e.employee_code}</TableCell>
                    <TableCell className="font-medium">{e.name}</TableCell>
                    <TableCell>{dash(e.department)}</TableCell>
                    <TableCell>{dash(e.designation)}</TableCell>
                    <TableCell>{rooms.data?.find((r) => r.id === e.room_id)?.name ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {heldBy(e.id).length === 0 ? (
                          <span className="text-sm text-muted-foreground">None</span>
                        ) : (
                          heldBy(e.id)
                            .slice(0, 3)
                            .map((a) => (
                              <Link
                                key={a.id}
                                to="/assets/$id"
                                params={{ id: a.id }}
                                className="rounded-full border px-2 py-0.5 font-mono text-[11px] hover:bg-accent"
                              >
                                {a.asset_code}
                              </Link>
                            ))
                        )}
                        {heldBy(e.id).length > 3 ? (
                          <span className="text-xs text-muted-foreground">
                            +{heldBy(e.id).length - 3}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => openEdit(e)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {isAdmin ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Delete"
                          onClick={() => {
                            if (!confirm(`Remove ${e.name}?`)) return;
                            remove.mutate(e.id, {
                              onSuccess: () => toast.success("Employee removed"),
                              onError: (err) => toast.error((err as Error).message),
                            });
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit employee" : "Add employee"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <Field label="Employee code" required>
              <Input
                value={form.employee_code}
                onChange={(e) => setForm({ ...form, employee_code: e.target.value })}
                required
              />
            </Field>
            <Field label="Full name" required>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </Field>
            <Field label="Department">
              <Input
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
              />
            </Field>
            <Field label="Designation">
              <Input
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="Desk / room" className="sm:col-span-2">
              <NativeSelect value={form.room_id} onChange={(v) => setForm({ ...form, room_id: v })}>
                <option value="">Not assigned</option>
                {(rooms.data ?? []).map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editing ? "Save changes" : "Add employee"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
