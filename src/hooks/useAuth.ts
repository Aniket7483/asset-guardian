import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/types";

/** Shared across the app via React Query, so the session/role is fetched once. */
export function useAuth() {
  const { data, isLoading } = useQuery({
    queryKey: ["auth-session"],
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user ?? null;
      if (!user) return { user: null, role: null as AppRole | null };
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      const list = (roles ?? []).map((r) => r.role as AppRole);
      const role: AppRole = list.includes("super_admin")
        ? "super_admin"
        : list.includes("admin")
          ? "admin"
          : "staff";
      return { user, role };
    },
  });

  const role = data?.role ?? null;
  return {
    user: data?.user ?? null,
    role,
    isAdmin: role === "admin" || role === "super_admin",
    loading: isLoading,
  };
}
