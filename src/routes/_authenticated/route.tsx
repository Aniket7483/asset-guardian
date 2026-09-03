import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Shell } from "@/components/app/Shell";
import { LocationScopeProvider } from "@/lib/scope";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: () => (
    <LocationScopeProvider>
      <Shell>
        <Outlet />
      </Shell>
    </LocationScopeProvider>
  ),
});
