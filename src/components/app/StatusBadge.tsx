import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  Available: "bg-success/12 text-success border-success/25",
  Assigned: "bg-info/12 text-info border-info/25",
  "In Use": "bg-info/12 text-info border-info/25",
  "Under Maintenance": "bg-warning/18 text-warning-foreground border-warning/35",
  Damaged: "bg-destructive/12 text-destructive border-destructive/25",
  Lost: "bg-destructive/12 text-destructive border-destructive/25",
  Retired: "bg-muted text-muted-foreground border-border",
  Disposed: "bg-muted text-muted-foreground border-border",
};

const CONDITION_STYLES: Record<string, string> = {
  New: "bg-success/12 text-success border-success/25",
  Excellent: "bg-success/12 text-success border-success/25",
  Good: "bg-info/12 text-info border-info/25",
  Fair: "bg-warning/18 text-warning-foreground border-warning/35",
  Damaged: "bg-destructive/12 text-destructive border-destructive/25",
  "Non-functional": "bg-destructive/12 text-destructive border-destructive/25",
};

export function StatusBadge({
  value,
  kind = "status",
  className,
}: {
  value?: string | null;
  kind?: "status" | "condition";
  className?: string;
}) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  const map = kind === "condition" ? CONDITION_STYLES : STATUS_STYLES;
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        map[value] ?? "bg-secondary text-secondary-foreground border-border",
        className,
      )}
    >
      {value}
    </span>
  );
}
