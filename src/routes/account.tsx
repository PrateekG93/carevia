import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, LogOut, Stethoscope, User, UserCog } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DemoBadge, PageShell, SectionHeader } from "@/components/qm/bits";
import { PatientDashboard } from "@/components/qm/dashboards/PatientDashboard";
import { DoctorDashboard } from "@/components/qm/dashboards/DoctorDashboard";
import { PharmacyDashboard } from "@/components/qm/dashboards/PharmacyDashboard";
import { AdminDashboard } from "@/components/qm/dashboards/AdminDashboard";
import { useStore, type UserRole } from "@/lib/store";
import { pageHead } from "@/lib/metadata";

export const Route = createFileRoute("/account")({
  head: () =>
    pageHead(
      "CAREVIA Dashboards",
      "Role-based Patient, Doctor, Pharmacy, and Admin dashboards on CAREVIA.",
    ),
  component: Account,
});

const roleButtons: { id: UserRole; label: string; icon: typeof User }[] = [
  { id: "patient", label: "Patient Dashboard", icon: User },
  { id: "doctor", label: "Doctor Dashboard", icon: Stethoscope },
  { id: "pharmacy", label: "Pharmacy Dashboard", icon: Building2 },
  { id: "admin", label: "Admin Dashboard", icon: UserCog },
];

function Account() {
  const store = useStore();
  const activeRole: UserRole = store.user?.role ?? "patient";

  return (
    <PageShell>
      <SectionHeader
        eyebrow="CAREVIA Role Workspaces"
        title={
          activeRole === "patient"
            ? "Patient Dashboard"
            : activeRole === "doctor"
              ? "Doctor Partner Dashboard"
              : activeRole === "pharmacy"
                ? "Pharmacy Partner Dashboard"
                : "Admin Operations Dashboard"
        }
        subtitle={
          store.user
            ? `Signed in as ${store.user.name} (${store.user.role} · ${store.user.authSource})`
            : "Switch between Patient, Doctor, Pharmacy, and Admin portals to explore the CAREVIA ecosystem."
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <DemoBadge>Visit-only session · Cart persists locally</DemoBadge>
          {store.user ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                store.setUser(null);
                toast.success("Signed out");
              }}
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </Button>
          ) : (
            <Button asChild size="sm" variant="outline">
              <Link to="/login">Login / Register</Link>
            </Button>
          )}
        </div>
      </SectionHeader>

      {/* Role Switcher */}
      <nav
        aria-label="Dashboard role switcher"
        className="mb-8 flex flex-wrap gap-2 rounded-2xl border bg-soft p-3"
      >
        {roleButtons.map((r) => (
          <Button
            key={r.id}
            type="button"
            size="sm"
            variant={activeRole === r.id ? "default" : "outline"}
            onClick={() => store.switchDemoRole(r.id)}
            className="rounded-full"
          >
            <r.icon className="h-4 w-4" />
            {r.label}
          </Button>
        ))}
      </nav>

      {activeRole === "patient" && <PatientDashboard />}
      {activeRole === "doctor" && <DoctorDashboard />}
      {activeRole === "pharmacy" && <PharmacyDashboard />}
      {activeRole === "admin" && <AdminDashboard />}
    </PageShell>
  );
}
