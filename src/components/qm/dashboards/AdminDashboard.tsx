import { useState } from "react";
import {
  BarChart3,
  Building2,
  CheckCircle2,
  MessageSquareWarning,
  Settings2,
  ShieldAlert,
  Stethoscope,
  Users,
  XCircle,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DemoBadge } from "@/components/qm/bits";
import { formatINR } from "@/lib/data";
import { externalApiIntegrations } from "@/lib/external-apis";
import { useStore } from "@/lib/store";

export function AdminDashboard() {
  const store = useStore();
  const [tab, setTab] = useState<
    | "Revenue & Stats"
    | "Verifications"
    | "Users & Complaints"
    | "Orders & Appointments"
    | "APIs & Commissions"
  >("Revenue & Stats");

  const [pharmPct, setPharmPct] = useState(store.platformSettings.pharmacyCommissionPct);
  const [consultPct, setConsultPct] = useState(store.platformSettings.consultationCommissionPct);
  const [premiumInr, setPremiumInr] = useState(store.platformSettings.premiumListingInr);

  // 4 Marketplace Revenue Streams (transparently computed from store + demo baselines)
  const pharmacyOrderCommissions = store.orders.reduce((s, o) => s + o.commissionAmount, 0);
  const consultationCommissions =
    store.appointments
      .filter((a) => a.status !== "Cancelled")
      .reduce((s, a) => s + a.commissionAmount, 0) +
    store.consultThreads
      .filter((t) => t.status === "accepted" || t.status === "completed")
      .reduce(
        (s, t) => s + Math.round((t.fee * store.platformSettings.consultationCommissionPct) / 100),
        0,
      );
  const subscriptionRevenue = store.partnerPharmacies.reduce((s, p) => {
    if (p.subscriptionPlan === "Enterprise") return s + store.platformSettings.enterprisePlanInr;
    if (p.subscriptionPlan === "Growth") return s + store.platformSettings.growthPlanInr;
    return s + store.platformSettings.starterPlanInr;
  }, 0);
  const premiumVisibilityRevenue = store.partnerPharmacies.reduce(
    (s, p) => s + (p.premiumListing ? store.platformSettings.premiumListingInr : 0),
    0,
  );
  const totalPlatformRevenue =
    pharmacyOrderCommissions +
    consultationCommissions +
    subscriptionRevenue +
    premiumVisibilityRevenue;

  const revenueChartData = [
    { stream: "Order Comm.", amount: pharmacyOrderCommissions },
    { stream: "Consult Comm.", amount: consultationCommissions },
    { stream: "Pharmacy Plans", amount: subscriptionRevenue },
    { stream: "Featured Ads", amount: premiumVisibilityRevenue },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-soft p-5">
        <div>
          <p className="text-xs font-bold tracking-wider text-teal uppercase">
            CAREVIA Operations Console
          </p>
          <h2 className="text-xl font-bold">Admin Governance &amp; Marketplace Analytics</h2>
        </div>
        <DemoBadge>Admin demo console · External APIs unconfigured</DemoBadge>
      </div>

      <div
        className="flex flex-wrap gap-2 border-b pb-3"
        role="tablist"
        aria-label="Admin sections"
      >
        {(
          [
            "Revenue & Stats",
            "Verifications",
            "Users & Complaints",
            "Orders & Appointments",
            "APIs & Commissions",
          ] as const
        ).map((t) => (
          <Button
            key={t}
            type="button"
            role="tab"
            size="sm"
            aria-selected={tab === t}
            variant={tab === t ? "default" : "outline"}
            onClick={() => setTab(t)}
          >
            {t}
          </Button>
        ))}
      </div>

      {tab === "Revenue & Stats" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Marketplace Revenue (Demo)"
              value={formatINR(totalPlatformRevenue)}
              highlight
            />
            <StatCard
              label="Registered Users (Demo)"
              value={String(store.registeredUsers.length)}
            />
            <StatCard
              label="Verified Doctors / Total"
              value={`${store.doctorProfiles.filter((d) => d.verificationStatus === "Verified (Demo)").length} / ${store.doctorProfiles.length}`}
            />
            <StatCard
              label="Verified Pharmacies / Total"
              value={`${store.partnerPharmacies.filter((p) => p.verified).length} / ${store.partnerPharmacies.length}`}
            />
          </div>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border bg-card p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
                <BarChart3 className="h-5 w-5 text-primary" /> CAREVIA 4-Stream Revenue Breakdown
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="stream" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip formatter={(val: number) => formatINR(val)} />
                    <Bar dataKey="amount" fill="oklch(0.43 0.105 190)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border bg-card p-6">
              <h3 className="text-lg font-bold">Marketplace Revenue Streams</h3>
              {[
                {
                  name: "1. Commission on Pharmacy Medicine Orders",
                  rate: `${store.platformSettings.pharmacyCommissionPct}% of order subtotal`,
                  amount: pharmacyOrderCommissions,
                },
                {
                  name: "2. Commission on Paid Doctor Consultations",
                  rate: `${store.platformSettings.consultationCommissionPct}% of consultation fee`,
                  amount: consultationCommissions,
                },
                {
                  name: "3. Pharmacy Partner Subscription Plans",
                  rate: "Starter / Growth / Enterprise monthly plans",
                  amount: subscriptionRevenue,
                },
                {
                  name: "4. Premium Visibility for Healthcare Partners",
                  rate: `${formatINR(store.platformSettings.premiumListingInr)}/mo featured placement`,
                  amount: premiumVisibilityRevenue,
                },
              ].map((s) => (
                <div
                  key={s.name}
                  className="flex items-center justify-between rounded-xl bg-soft p-3.5 text-sm"
                >
                  <div>
                    <p className="font-semibold">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.rate}</p>
                  </div>
                  <strong className="text-primary">{formatINR(s.amount)}</strong>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {tab === "Verifications" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="space-y-3 rounded-2xl border bg-card p-6">
            <h3 className="flex items-center gap-2 text-lg font-bold">
              <Stethoscope className="h-5 w-5 text-primary" /> Doctor Verification Queue
            </h3>
            <p className="text-xs text-muted-foreground">
              Demo approval toggles — production deployment requires Medical Council Registry API
              validation.
            </p>
            {store.doctorProfiles.map((d) => (
              <div key={d.id} className="rounded-xl border bg-soft p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <strong>{d.name}</strong> · {d.specialty}
                    <p className="text-xs text-muted-foreground">
                      Reg: {d.registrationNumber} ({d.medicalCouncil})
                    </p>
                  </div>
                  <DemoBadge>{d.verificationStatus}</DemoBadge>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      store.setDoctorVerification(d.id, "Verified (Demo)");
                      toast.success(`${d.name} marked Verified (Demo)`);
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      store.setDoctorVerification(d.id, "Pending Council API Verification")
                    }
                  >
                    <ShieldAlert className="h-4 w-4" /> Mark Pending
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => store.setDoctorVerification(d.id, "Rejected")}
                  >
                    <XCircle className="h-4 w-4" /> Reject
                  </Button>
                </div>
              </div>
            ))}
          </section>

          <section className="space-y-3 rounded-2xl border bg-card p-6">
            <h3 className="flex items-center gap-2 text-lg font-bold">
              <Building2 className="h-5 w-5 text-primary" /> Pharmacy Verification Queue
            </h3>
            {store.partnerPharmacies.map((p) => (
              <div key={p.id} className="rounded-xl border bg-soft p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <strong>{p.name}</strong>
                    <p className="text-xs text-muted-foreground">
                      License: {p.licenseNumber} · Plan: {p.subscriptionPlan}
                    </p>
                  </div>
                  <DemoBadge>{p.verified ? "Verified (Demo)" : "Pending Review"}</DemoBadge>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      store.setPharmacyVerification(p.id, true);
                      toast.success(`${p.name} verified (demo)`);
                    }}
                  >
                    Approve License
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => store.setPharmacyVerification(p.id, false)}
                  >
                    Revoke / Hold
                  </Button>
                </div>
              </div>
            ))}
          </section>
        </div>
      )}

      {tab === "Users & Complaints" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="space-y-3 rounded-2xl border bg-card p-6">
            <h3 className="flex items-center gap-2 text-lg font-bold">
              <Users className="h-5 w-5 text-primary" /> User Management
            </h3>
            {store.registeredUsers.map((u) => (
              <div
                key={u.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-soft p-3.5 text-sm"
              >
                <div>
                  <strong>{u.name}</strong> ({u.role})
                  <p className="text-xs text-muted-foreground">
                    {u.email} · {u.status}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => store.toggleUserStatus(u.id)}>
                  {u.status === "Active (Demo)" ? "Suspend" : "Activate"}
                </Button>
              </div>
            ))}
          </section>

          <section className="space-y-3 rounded-2xl border bg-card p-6">
            <h3 className="flex items-center gap-2 text-lg font-bold">
              <MessageSquareWarning className="h-5 w-5 text-primary" /> Complaints (
              {store.complaints.length})
            </h3>
            {store.complaints.map((c) => (
              <div key={c.id} className="rounded-xl border bg-soft p-4 text-sm">
                <div className="flex justify-between gap-2">
                  <strong>{c.subject}</strong>
                  <DemoBadge>{c.status}</DemoBadge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {c.reporterName} ({c.role}) · {c.category}
                </p>
                <p className="mt-2 text-xs">{c.details}</p>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => store.updateComplaintStatus(c.id, "in_review")}
                  >
                    In Review
                  </Button>
                  <Button size="sm" onClick={() => store.updateComplaintStatus(c.id, "resolved")}>
                    Resolve
                  </Button>
                </div>
              </div>
            ))}
          </section>
        </div>
      )}

      {tab === "Orders & Appointments" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border bg-card p-6">
            <h3 className="mb-3 text-lg font-bold">Platform Orders ({store.orders.length})</h3>
            {store.orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders placed in this session yet.</p>
            ) : (
              <div className="space-y-2 text-sm">
                {store.orders.map((o) => (
                  <div key={o.id} className="flex justify-between rounded-xl bg-soft p-3">
                    <span>
                      <strong>{o.id}</strong> · {o.pharmacyName} ({o.stages[o.stage]})
                    </span>
                    <strong>{formatINR(o.total)}</strong>
                  </div>
                ))}
              </div>
            )}
          </section>
          <section className="rounded-2xl border bg-card p-6">
            <h3 className="mb-3 text-lg font-bold">
              Platform Appointments ({store.appointments.length})
            </h3>
            {store.appointments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No appointments booked in this session yet.
              </p>
            ) : (
              <div className="space-y-2 text-sm">
                {store.appointments.map((a) => (
                  <div key={a.id} className="flex justify-between rounded-xl bg-soft p-3">
                    <span>
                      <strong>{a.with}</strong> · {a.patient} ({a.status})
                    </span>
                    <strong>{formatINR(a.fee)}</strong>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {tab === "APIs & Commissions" && (
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <section className="rounded-2xl border bg-card p-6">
            <h3 className="flex items-center gap-2 text-lg font-bold">
              <Settings2 className="h-5 w-5 text-primary" /> Commission Management
            </h3>
            <form
              className="mt-4 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                store.updatePlatformSettings({
                  pharmacyCommissionPct: pharmPct,
                  consultationCommissionPct: consultPct,
                  premiumListingInr: premiumInr,
                });
                toast.success("Platform commission & fee rates updated");
              }}
            >
              <div className="space-y-1">
                <Label htmlFor="comm-ph">Pharmacy Order Commission (%)</Label>
                <Input
                  id="comm-ph"
                  type="number"
                  min={0}
                  max={40}
                  value={pharmPct}
                  onChange={(e) => setPharmPct(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="comm-doc">Doctor Consultation Commission (%)</Label>
                <Input
                  id="comm-doc"
                  type="number"
                  min={0}
                  max={40}
                  value={consultPct}
                  onChange={(e) => setConsultPct(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="comm-prem">Premium Partner Visibility (₹/mo)</Label>
                <Input
                  id="comm-prem"
                  type="number"
                  min={0}
                  value={premiumInr}
                  onChange={(e) => setPremiumInr(Number(e.target.value))}
                />
              </div>
              <Button type="submit" className="w-full rounded-full">
                Update Commission Rules
              </Button>
            </form>
          </section>

          <section className="rounded-2xl border bg-card p-6">
            <h3 className="mb-3 text-lg font-bold">External API Configuration Requirements</h3>
            <div className="space-y-2.5 text-sm">
              {externalApiIntegrations.map((api) => (
                <div key={api.id} className="rounded-xl border bg-soft p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong>{api.capability}</strong>
                    <DemoBadge>{api.currentState}</DemoBadge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{api.notes}</p>
                  {api.requiredEnvVars.length > 0 && (
                    <p className="mt-1 font-mono text-[11px] text-primary">
                      Env vars: {api.requiredEnvVars.join(", ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-5 ${highlight ? "bg-mint-soft" : "bg-card"}`}>
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className={`mt-2 font-display text-2xl font-bold ${highlight ? "text-primary" : ""}`}>
        {value}
      </p>
    </div>
  );
}
