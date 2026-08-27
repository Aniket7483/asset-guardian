import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2, Tags, Activity, Gauge, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useCategories, useConditions, useCrud, useStatuses } from "@/lib/queries";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — AssetVault" },
      {
        name: "description",
        content:
          "Configure asset categories, statuses and condition grades used across your office asset registry.",
      },
      { property: "og:title", content: "Settings — AssetVault" },
      {
        property: "og:description",
        content: "Manage categories, statuses, conditions and your account role.",
      },
    ],
  }),
  component: SettingsPage,
});

function ListCard({
  title,
  icon,
  placeholder,
  items,
  onAdd,
  onDelete,
  canDelete,
  meta,
}: {
  title: string;
  icon: React.ReactNode;
  placeholder: string;
  items: { id: string; name: string }[];
  onAdd: (name: string) => void;
  onDelete: (id: string) => void;
  canDelete: boolean;
  meta?: (id: string) => string | undefined;
}) {
  const [value, setValue] = useState("");
  return (
    <Card className="p-4">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        {icon} {title}
      </h2>
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && value.trim()) {
              onAdd(value.trim());
              setValue("");
            }
          }}
        />
        <Button
          disabled={!value.trim()}
          onClick={() => {
            onAdd(value.trim());
            setValue("");
          }}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{item.name}</p>
              {meta?.(item.id) ? (
                <p className="text-xs text-muted-foreground">{meta(item.id)}</p>
              ) : null}
            </div>
            {canDelete ? (
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete ${item.name}`}
                onClick={() => onDelete(item.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            ) : null}
          </li>
        ))}
        {items.length === 0 ? (
          <li className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
            Nothing here yet.
          </li>
        ) : null}
      </ul>
    </Card>
  );
}

function SettingsPage() {
  const categories = useCategories();
  const statuses = useStatuses();
  const conditions = useConditions();
  const { user, role, isAdmin } = useAuth();

  const categoryCrud = useCrud("categories");
  const statusCrud = useCrud("asset_statuses");
  const conditionCrud = useCrud("asset_conditions");

  const fail = (e: unknown) => toast.error((e as Error).message);
  const done = (msg: string) => () => toast.success(msg);

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Master data that powers dropdowns across the registry, plus your account details."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <ListCard
          title="Categories"
          icon={<Tags className="h-4 w-4 text-muted-foreground" />}
          placeholder="e.g. Furniture"
          items={categories.data ?? []}
          canDelete={isAdmin}
          onAdd={(name) =>
            categoryCrud.create.mutate({ name }, { onSuccess: done("Category added"), onError: fail })
          }
          onDelete={(id) =>
            categoryCrud.remove.mutate(id, { onSuccess: done("Category removed"), onError: fail })
          }
        />

        <ListCard
          title="Statuses"
          icon={<Activity className="h-4 w-4 text-muted-foreground" />}
          placeholder="e.g. In Transit"
          items={statuses.data ?? []}
          canDelete={isAdmin}
          onAdd={(name) =>
            statusCrud.create.mutate(
              { name, sort_order: (statuses.data?.length ?? 0) + 1 },
              { onSuccess: done("Status added"), onError: fail },
            )
          }
          onDelete={(id) =>
            statusCrud.remove.mutate(id, { onSuccess: done("Status removed"), onError: fail })
          }
        />

        <ListCard
          title="Conditions"
          icon={<Gauge className="h-4 w-4 text-muted-foreground" />}
          placeholder="e.g. Refurbished"
          items={conditions.data ?? []}
          canDelete={isAdmin}
          onAdd={(name) =>
            conditionCrud.create.mutate(
              { name, sort_order: (conditions.data?.length ?? 0) + 1 },
              { onSuccess: done("Condition added"), onError: fail },
            )
          }
          onDelete={(id) =>
            conditionCrud.remove.mutate(id, { onSuccess: done("Condition removed"), onError: fail })
          }
        />
      </div>

      <Card className="mt-4 p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" /> Account &amp; access
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border px-3 py-2">
            <p className="text-xs text-muted-foreground">Signed in as</p>
            <p className="truncate text-sm font-medium">{user?.email ?? "—"}</p>
          </div>
          <div className="rounded-lg border px-3 py-2">
            <p className="text-xs text-muted-foreground">Role</p>
            <Badge variant="secondary" className="mt-1 capitalize">
              {role?.replace("_", " ") ?? "staff"}
            </Badge>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Roles are managed by administrators in the backend. Admins and super admins can delete master
          data and asset records; staff can create and update.
        </p>
      </Card>
    </div>
  );
}
