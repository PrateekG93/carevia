import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Building2, ShieldCheck, Stethoscope, User, UserCog } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CareviaMark, DemoBadge, PageShell } from "@/components/qm/bits";
import { supabase } from "@/integrations/supabase/client";
import { useStore, type UserRole } from "@/lib/store";
import { pageHead } from "@/lib/metadata";

export const Route = createFileRoute("/login")({
  head: () =>
    pageHead(
      "Login or Register",
      "Sign in to CAREVIA or preview Patient, Doctor, Pharmacy, and Admin role dashboards.",
    ),
  component: Login,
});

const roles: { id: UserRole; label: string; desc: string; icon: typeof User }[] = [
  {
    id: "patient",
    label: "Patient",
    desc: "Orders, reminders, appointments, Doctor Chat",
    icon: User,
  },
  {
    id: "doctor",
    label: "Doctor",
    desc: "Verification, slots, consultations & earnings",
    icon: Stethoscope,
  },
  {
    id: "pharmacy",
    label: "Pharmacy",
    desc: "License, inventory, pricing & order fulfilment",
    icon: Building2,
  },
  {
    id: "admin",
    label: "Admin",
    desc: "Partner approvals, commissions & revenue analytics",
    icon: UserCog,
  },
];

function Login() {
  const { setUser, user, switchDemoRole } = useStore();
  const navigate = useNavigate();
  const [signup, setSignup] = useState(false);
  const [role, setRole] = useState<UserRole>("patient");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleCloudOrDemoAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (signup && name.trim().length < 2) {
      setError("Enter your full name or partner business name.");
      return;
    }
    if (signup && !/^[6-9]\d{9}$/.test(mobile)) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setBusy(true);
    try {
      if (signup) {
        const { data, error: authErr } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name.trim(), requested_role: role } },
        });
        if (!authErr && data.user) {
          setUser({
            id: data.user.id,
            name: name.trim(),
            email,
            mobile,
            role,
            authSource: "cloud",
          });
          toast.success("Registered via Lovable Cloud Auth");
          navigate({ to: "/account" });
          return;
        }
      } else {
        const { data, error: authErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (!authErr && data.user) {
          setUser({
            id: data.user.id,
            name:
              (data.user.user_metadata?.["full_name"] as string) ||
              email.split("@")[0] ||
              "CAREVIA User",
            email,
            mobile: "",
            role,
            authSource: "cloud",
          });
          toast.success("Signed in via Lovable Cloud Auth");
          navigate({ to: "/account" });
          return;
        }
      }
    } catch {
      // Fallback cleanly to explicit visit-only demo session when remote auth isn't active
    } finally {
      setBusy(false);
    }

    setUser({
      id: `DEMO-${role.toUpperCase()}`,
      name: signup ? name.trim() : email.split("@")[0] || `CAREVIA ${role}`,
      email,
      mobile: signup ? mobile : "",
      role,
      authSource: "demo",
    });
    setPassword("");
    toast.message(`Entered CAREVIA ${role} demo session (visit-only)`);
    navigate({ to: "/account" });
  };

  return (
    <PageShell className="max-w-2xl">
      <div className="flex items-center gap-3">
        <CareviaMark className="h-11 w-11" />
        <div>
          <h1 className="text-3xl font-bold">
            {signup ? "Register with CAREVIA" : "Welcome to CAREVIA"}
          </h1>
          <p className="text-sm text-muted-foreground">Healthcare, Connected. Care, Delivered.</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <DemoBadge>Role-based access · Demo preview supported</DemoBadge>
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        CAREVIA supports Lovable Cloud authentication when configured, and falls back to an explicit
        visit-only demo session if backend credentials or database migrations are not yet applied.
        Never store sensitive personal records in browser storage.
      </p>

      {user ? (
        <div className="mt-6 rounded-2xl border bg-soft p-6">
          <p className="font-semibold">
            Signed in as {user.name} ({user.role} · {user.authSource})
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/account">Open {user.role} Dashboard</Link>
            </Button>
            <Button variant="outline" onClick={() => setUser(null)}>
              Sign Out
            </Button>
          </div>
        </div>
      ) : (
        <>
          <section className="mt-6 rounded-2xl border bg-soft p-5">
            <p className="mb-3 text-xs font-bold tracking-wider text-primary uppercase">
              Quick Demo Role Preview (1-Click)
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {roles.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    switchDemoRole(r.id);
                    navigate({ to: "/account" });
                  }}
                  className="flex items-start gap-3 rounded-xl border bg-card p-3 text-left transition hover:border-primary hover:bg-accent"
                >
                  <r.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-bold">{r.label} Portal</p>
                    <p className="text-xs text-muted-foreground">{r.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <div className="my-6 flex gap-2">
            <Button
              type="button"
              variant={!signup ? "default" : "outline"}
              onClick={() => setSignup(false)}
            >
              Login
            </Button>
            <Button
              type="button"
              variant={signup ? "default" : "outline"}
              onClick={() => setSignup(true)}
            >
              Sign Up / Partner Registration
            </Button>
          </div>

          <form
            className="space-y-4 rounded-2xl border bg-card p-6"
            onSubmit={handleCloudOrDemoAuth}
          >
            <div className="space-y-2">
              <Label>Account role</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {roles.map((r) => (
                  <Button
                    key={r.id}
                    type="button"
                    size="sm"
                    variant={role === r.id ? "default" : "outline"}
                    onClick={() => setRole(r.id)}
                  >
                    {r.label}
                  </Button>
                ))}
              </div>
            </div>

            {signup && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="full-name">
                    {role === "pharmacy"
                      ? "Pharmacy / Store Name"
                      : role === "doctor"
                        ? "Doctor Full Name"
                        : "Full Name"}
                  </Label>
                  <Input
                    id="full-name"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="mobile">Mobile number</Label>
                  <Input
                    id="mobile"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    maxLength={10}
                    required
                  />
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete={signup ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}

            <Button className="w-full rounded-full" type="submit" disabled={busy}>
              <ShieldCheck className="h-4 w-4" />
              {signup ? `Create CAREVIA ${role} Account` : `Sign In to CAREVIA (${role})`}
            </Button>
          </form>
        </>
      )}
    </PageShell>
  );
}
