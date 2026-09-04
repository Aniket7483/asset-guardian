import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Boxes,
  Users,
  MapPin,
  ClipboardList,
  Wrench,
  ScanLine,
  FileBarChart,
  ArrowDownUp,
  Settings,
  Menu,
  Search,
  LogOut,
  Bell,
  QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/assets", label: "Assets", icon: Boxes },
  { to: "/employees", label: "Employees", icon: Users },
  { to: "/locations", label: "Locations", icon: MapPin },
  { to: "/assignments", label: "Assignments", icon: ClipboardList },
  { to: "/maintenance", label: "Maintenance", icon: Wrench },
  { to: "/verification", label: "Inventory Verification", icon: ScanLine },
  { to: "/reports", label: "Reports", icon: FileBarChart },
  { to: "/import-export", label: "Import / Export", icon: ArrowDownUp },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-col gap-0.5 px-3">
      {NAV.map((item) => {
        const active = pathname === item.to || pathname.startsWith(item.to + "/");
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="h-[18px] w-[18px] shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-5 py-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
        <Boxes className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <p className="font-display text-[15px] font-bold text-sidebar-accent-foreground">AssetVault</p>
        <p className="text-[11px] text-sidebar-foreground/60">Office Asset Registry</p>
      </div>
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const navigate = useNavigate();
  const { user, role } = useAuth();

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/assets", search: { q: term } });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <Brand />
        <NavList />
        <div className="mt-auto p-4">
          <div className="rounded-lg bg-sidebar-accent p-3">
            <p className="truncate text-xs font-medium text-sidebar-accent-foreground">
              {user?.email ?? "—"}
            </p>
            <p className="mt-0.5 text-[11px] capitalize text-sidebar-foreground/60">
              {role?.replace("_", " ") ?? "member"}
            </p>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="no-print sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-card/90 px-4 backdrop-blur lg:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-sidebar-border bg-sidebar p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <Brand />
              <NavList onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>

          <form onSubmit={submitSearch} className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search asset ID, name, serial, employee…"
              className="pl-9"
              aria-label="Global search"
            />
          </form>

          <div className="ml-auto flex items-center gap-1.5">
            <Button variant="outline" size="sm" asChild>
              <Link to="/scan">
                <QrCode className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Scan QR</span>
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild aria-label="Notifications">
              <Link to="/dashboard" hash="alerts">
                <Bell className="h-[18px] w-[18px]" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Sign out"
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/auth";
              }}
            >
              <LogOut className="h-[18px] w-[18px]" />
            </Button>
          </div>
        </header>

        <main className="min-w-0 flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
