import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { AppRole } from "@/lib/types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!active) return;
      setUser(data.user ?? null);
      if (data.user) {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id);
        const list = (roles ?? []).map((r) => r.role as AppRole);
        setRole(
          list.includes("super_admin") ? "super_admin" : list.includes("admin") ? "admin" : "staff",
        );
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const isAdmin = role === "admin" || role === "super_admin";
  return { user, role, isAdmin, loading };
}
