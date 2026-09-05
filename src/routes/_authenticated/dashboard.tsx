import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Boxes,
  CheckCircle2,
  UserCheck,
  Wrench,
  AlertTriangle,
  IndianRupee,
  ShieldAlert,
  CalendarClock,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAssets, useAssignments, useCategories, useEmployees, useMaintenance } from "@/lib/queries";
import { assignedQtyMap, availableQty } from "@/lib/quantity";
import { formatCurrency, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Asset Dashboard — AssetVault" },
      {
        name: "description",
        content:
          "Live overview of office assets: totals, value, assignments, maintenance and warranty alerts.",
      },
      { property: "og:title", content: "Asset Dashboard — AssetVault" },
      {
        property: "og:description",
        content: "Live overview of every physical asset in your office.",
      },
    ],
  }),
  component: DashboardPage,
});

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

function Stat({
  label,
  value,
  icon: Icon,
  tone = "default",
  hint,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  tone?: "default" | "success" | "info" | "warning" | "danger";
  hint?: string;
}) {
  const toneClass = {
    default: "bg-secondary text-secondary-foreground",
    success: "bg-success/12 text-success",
    info: "bg-info/12 text-info",
    warning: "bg-warning/20 text-warning-foreground",
    danger: "bg-destructive/12 text-destructive",
  }[tone];
  return (
    <Card>
      <CardContent className="flex items-start gap-4 p-5">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 truncate font-display text-2xl font-bold">{value}</p>
          {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardPage() {
  const assets = useAssets();
  const assignments = useAssignments();
  const categories = useCategories();
  const employees = useEmployees();
  const maintenance = useMaintenance();

  const rows = useMemo(() => (assets.data ?? []).filter((a) => !a.archived), [assets.data]);

  const assignedMap = useMemo(() => assignedQtyMap(assignments.data), [assignments.data]);

  const stats = useMemo(() => {
    const total = rows.reduce((n, a) => n + (a.quantity ?? 1), 0);
    const assignedUnits = rows.reduce((n, a) => n + (assignedMap.get(a.id) ?? 0), 0);
    const availableUnits = rows.reduce((n, a) => n + availableQty(a, assignedMap), 0);
    const value = rows.reduce((n, a) => n + Number(a.purchase_price ?? 0) * (a.quantity ?? 1), 0);
    const by = (s: string) => rows.filter((a) => a.status === s).length;
    const soon = new Date();
    soon.setDate(soon.getDate() + 30);
    const expiring = rows.filter(
      (a) => a.warranty_end && new Date(a.warranty_end) <= soon && new Date(a.warranty_end) >= new Date(),
    );
    return {
      total,
      records: rows.length,
      value,
      available: availableUnits,
      assigned: assignedUnits,
      maintenance: by("Under Maintenance"),
      issues: by("Damaged") + by("Lost"),
      expiring,
    };
  }, [rows, assignedMap]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of rows) {
      const name = (categories.data ?? []).find((c) => c.id === a.category_id)?.name ?? "Uncategorised";
      map.set(name, (map.get(name) ?? 0) + (a.quantity ?? 1));
    }
    return [...map.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [rows, categories.data]);

  const byStatus = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of rows) map.set(a.status ?? "Unknown", (map.get(a.status ?? "Unknown") ?? 0) + 1);
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [rows]);

  const recent = rows.slice(0, 6);
  const openService = (maintenance.data ?? []).filter((m) => m.status !== "Completed").slice(0, 5);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="A live snapshot of every physical item recorded in the office."
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/reports">View reports</Link>
            </Button>
            <Button asChild>
              <Link to="/assets">Manage assets</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Total items"
          value={stats.total}
          icon={Boxes}
          hint={`${stats.records} asset records`}
        />
        <Stat
          label="Available"
          value={stats.available}
          icon={CheckCircle2}
          tone="success"
          hint="Units in stock"
        />
        <Stat
          label="Assigned"
          value={stats.assigned}
          icon={UserCheck}
          tone="info"
          hint="Units with employees"
        />
        <Stat
          label="Total value"
          value={formatCurrency(stats.value)}
          icon={IndianRupee}
          hint="Purchase value"
        />
        <Stat
          label="Under maintenance"
          value={stats.maintenance}
          icon={Wrench}
          tone="warning"
        />
        <Stat label="Damaged / lost" value={stats.issues} icon={ShieldAlert} tone="danger" />
        <Stat
          label="Warranty expiring"
          value={stats.expiring.length}
          icon={CalendarClock}
          tone="warning"
          hint="Next 30 days"
        />
        <Stat label="Employees" value={(employees.data ?? []).length} icon={UserCheck} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Items by category</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCategory} margin={{ left: -18, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-18} height={54} dy={10} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip cursor={{ opacity: 0.1 }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="var(--color-chart-1)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={52} outerRadius={88}>
                  {byStatus.map((entry, i) => (
                    <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {byStatus.map((s) => (
                <StatusBadge key={s.name} value={`${s.name} · ${s.value}`} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recently added assets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recent.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No assets recorded yet.</p>
            ) : (
              recent.map((a) => (
                <Link
                  key={a.id}
                  to="/assets/$id"
                  params={{ id: a.id }}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{a.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{a.asset_code}</p>
                  </div>
                  <StatusBadge value={a.status} />
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-warning-foreground" /> Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.expiring.length === 0 && openService.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nothing needs attention right now.
              </p>
            ) : null}
            {stats.expiring.slice(0, 5).map((a) => (
              <div key={a.id} className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
                Warranty for <span className="font-semibold">{a.name}</span> ends{" "}
                {formatDate(a.warranty_end)}
              </div>
            ))}
            {openService.map((m) => (
              <div key={m.id} className="rounded-lg border p-3 text-sm">
                Open maintenance since {formatDate(m.maintenance_date)} — {m.problem ?? m.description ?? "Service request"}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
