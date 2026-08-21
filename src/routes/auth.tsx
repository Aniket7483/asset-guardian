import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { lovableSignInWithGoogle } from "@/lib/google-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Boxes } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — AssetVault Office Asset Management" },
      {
        name: "description",
        content:
          "Sign in to AssetVault to manage office assets, locations, employees, assignments and QR asset labels.",
      },
      { property: "og:title", content: "Sign in — AssetVault Office Asset Management" },
      {
        property: "og:description",
        content: "Secure access to your organisation's centralised office asset registry.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        toast.success("Account created. You can sign in now.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      toast.error((err as { message?: string }).message ?? "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Boxes className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-bold text-sidebar-accent-foreground">
            AssetVault
          </span>
        </div>
        <div className="max-w-md">
          <h2 className="font-display text-3xl font-bold text-sidebar-accent-foreground">
            One registry for every physical item in your office.
          </h2>
          <p className="mt-4 text-sm text-sidebar-foreground/70">
            Track laptops, furniture, electrical equipment and consumables across buildings, floors
            and rooms. Assign to employees, scan QR labels and verify inventory in minutes.
          </p>
        </div>
        <p className="text-xs text-sidebar-foreground/50">
          Assets · Locations · Employees · QR Labels · Reports
        </p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold">
            {mode === "signin" ? "Sign in" : "Create your account"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Access the office asset dashboard."
              : "The first account created becomes Super Admin."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "signup" ? (
              <div>
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            ) : null}
            <div>
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={async () => {
              const result = await lovableSignInWithGoogle();
              if (result?.error) toast.error("Google sign-in failed");
            }}
          >
            Continue with Google
          </Button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "No account yet?" : "Already registered?"}{" "}
            <button
              type="button"
              className="font-semibold text-primary underline-offset-4 hover:underline"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            >
              {mode === "signin" ? "Create one" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
