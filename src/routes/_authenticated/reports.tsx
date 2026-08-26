import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Printer } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/app/PageHeader";
import { NativeSelect } from "@/components/app/NativeSelect";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { exportRows, type Row } from "@/lib/excel";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  useAssets,
  useAssignments,
  useBuildings,
  useCategories,
  useEmployees,
  useIncidents,
  useMaintenance,
  useRooms,
} from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports — AssetVault" },
      {
        name: "description",
        content: "Asset value, category, location, custody, warranty and maintenance reports with Excel export.",
      },
      { property: "og:title", content: "Reports — AssetVault" },
      { property: "og:description", content: "Analytics and exportable reports across your asset registry." },
    ],
  }),
  component: ReportsPage,
});

const REPORTS = [
  { id: "inventory", label: "Full inventory" },
  { id: "category", label: "By category" },
  { id: "location", label: "By location" },
  { id: "custody", label: "Employee custody" },
  { id: "warranty", label: "Warranty expiry" },
  { id: "maintenance", label: "Maintenance & incidents" },
] as const;

const COLORS = ["#1e3a5f", "#2a9d8f", "#e9c46a", "#e76f51", "#6d78ad", "#4a7c59", "#b56576"];

function ReportsPage() {
  const assets = useAssets();
  const categories = useCategories();
  const buildings = useBuildings();
  const rooms = useRooms();
  const employees = useEmployees();
  const assignments = useAssignments();
  const maintenance = useMaintenance();
  const incidents = useIncidents();

  const [report, setReport] = useState<(typeof REPORTS)[number]["id"]>("inventory");

  const catName = (id: string | null) => categories.data?.find((c) => c.id === id)?.name ?? "Uncategorised";
  const buildingName = (id: string | null) => buildings.data?.find((b) => b.id === id)?.name ?? "Unassigned";
  const roomName = (id: string | null) => rooms.data?.find((r) => r.id === id)?.name ?? "—";
  const empName = (id: string | null) => employees.data?.find((e) => e.id === id)?.name ?? "—";

  const list = (assets.data ?? []).filter((a) => !a.archived);

  const rows: Row[] = useMemo(() => {
    switch (report) {
      case "category": {
        const map = new Map<string, { count: number; value: number }>();
        for (const a of list) {
          const key = catName(a.category_id);
          const cur = map.get(key) ?? { count: 0, value: 0 };
          cur.count += a.quantity ?? 1;
          cur.value += Number(a.purchase_price ?? 0);
          map.set(key, cur);
        }
        return [...map.entries()].map(([Category, v]) => ({
          Category,
          Items: v.count,
          "Total Value": v.value,
        }));
      }
      case "location": {
        const map = new Map<string, number>();
        for (const a of list) {
          const key = `${buildingName(a.building_id)} / ${roomName(a.room_id)}`;
          map.set(key, (map.get(key) ?? 0) + (a.quantity ?? 1));
        }
        return [...map.entries()].map(([Location, Items]) => ({ Location, Items }));
      }
      case "custody":
        return (assignments.data ?? [])
          .filter((r) => !r.returned_date)
          .map((r) => ({
            Employee: empName(r.employee_id),
            Asset: list.find((a) => a.id === r.asset_id)?.name ?? "—",
            "Asset Code": list.find((a) => a.id === r.asset_id)?.asset_code ?? "—",
            "Assigned On": formatDate(r.assigned_date),
            "Expected Return": formatDate(r.expected_return_date),
          }));
      case "warranty":
        return list
          .filter((a) => a.warranty_end)
          .sort((a, b) => String(a.warranty_end).localeCompare(String(b.warranty_end)))
          .map((a) => ({
            "Asset Code": a.asset_code,
            Asset: a.name,
            Vendor: a.vendor ?? "—",
            "Warranty End": formatDate(a.warranty_end),
            Status: a.status,
          }));
      case "maintenance":
        return [
          ...(maintenance.data ?? []).map((m) => ({
            Type: "Maintenance",
            Asset: list.find((a) => a.id === m.asset_id)?.name ?? "—",
            Detail: m.problem ?? m.description ?? "—",
            Date: formatDate(m.maintenance_date),
            Cost: Number(m.cost ?? 0),
            Status: m.status,
          })),
          ...(incidents.data ?? []).map((i) => ({
            Type: `Incident — ${i.type}`,
            Asset: list.find((a) => a.id === i.asset_id)?.name ?? "—",
            Detail: i.description ?? "—",
            Date: formatDate(i.reported_date),
            Cost: 0,
            Status: i.resolution_status,
          })),
        ];
      default:
        return list.map((a) => ({
          "Asset Code": a.asset_code,
          Name: a.name,
          Category: catName(a.category_id),
          Brand: a.brand ?? "—",
          Model: a.model ?? "—",
          Serial: a.serial_number ?? "—",
          Quantity: a.quantity,
          Condition: a.condition,
          Status: a.status,
          Building: buildingName(a.building_id),
          Room: roomName(a.room_id),
          "Assigned To": empName(a.assigned_employee_id),
          "Purchase Date": formatDate(a.purchase_date),
          "Purchase Price": Number(a.purchase_price ?? 0),
        }));
    }
  }, [report, list, assignments.data, maintenance.data, incidents.data, categories.data, buildings.data, rooms.data, employees.data]);

  const categoryChart = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of list) map.set(catName(a.category_id), (map.get(catName(a.category_id)) ?? 0) + (a.quantity ?? 1));
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [list, categories.data]);

  const valueChart = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of list)
      map.set(buildingName(a.building_id), (map.get(buildingName(a.building_id)) ?? 0) + Number(a.purchase_price ?? 0));
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [list, buildings.data]);

  const totalValue = list.reduce((s, a) => s + Number(a.purchase_price ?? 0), 0);
  const headers = rows.length ? Object.keys(rows[0]) : [];

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Slice the registry by category, location, custody, warranty or service history."
        actions={
          <>
            <NativeSelect
              value={report}
              onChange={(v) => setReport(v as typeof report)}
              aria-label="Report type"
              className="w-56"
            >
              {REPORTS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </NativeSelect>
            <Button variant="outline" onClick={() => window.print()} className="no-print">
              <Printer className="mr-1.5 h-4 w-4" /> Print
            </Button>
            <Button onClick={() => exportRows(rows, `assetvault-${report}`)} className="no-print">
              <Download className="mr-1.5 h-4 w-4" /> Export
            </Button>
          </>
        }
      />

      <div className="mb-4 grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Items by category</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryChart} dataKey="value" nameKey="name" outerRadius={80} label>
                  {categoryChart.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-4">
          <h2 className="mb-1 text-sm font-semibold">Asset value by building</h2>
          <p className="mb-2 text-xs text-muted-foreground">Total registry value {formatCurrency(totalValue)}</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={valueChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="value" fill="#2a9d8f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              {headers.map((h) => (
                <th key={h} className="whitespace-nowrap px-4 py-2.5">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t">
                {headers.map((h) => (
                  <td key={h} className="whitespace-nowrap px-4 py-2.5">
                    {typeof r[h] === "number" && /value|price|cost/i.test(h)
                      ? formatCurrency(r[h] as number)
                      : String(r[h] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td className="px-4 py-8 text-center text-muted-foreground">No data for this report.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
