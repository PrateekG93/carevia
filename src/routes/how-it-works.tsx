import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarCheck, HeartHandshake, Search, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DemoBadge, EmergencyStrip, PageShell, SectionHeader } from "@/components/qm/bits";
import { pageHead } from "@/lib/metadata";

export const Route = createFileRoute("/how-it-works")({
  head: () =>
    pageHead(
      "How CAREVIA Works",
      "Discover how CAREVIA connects patients, doctors, and pharmacies from local search to delivery and follow-up.",
    ),
  component: () => (
    <PageShell>
      <SectionHeader
        eyebrow="Patients ↔ Doctors ↔ Pharmacies"
        title="How CAREVIA Works"
        subtitle="Healthcare, Connected. Care, Delivered."
      >
        <DemoBadge>Ecosystem walkthrough</DemoBadge>
      </SectionHeader>
      <div className="grid gap-8 md:grid-cols-4">
        {[
          {
            i: Search,
            t: "1. Set Location & Need",
            d: "Detect your location or enter an address to check 5 km pharmacies, or browse doctors by specialty and fee.",
          },
          {
            i: Stethoscope,
            t: "2. Connect with Care",
            d: "Request a Doctor Chat, book an online or clinic consultation, or upload a prescription for pharmacist check.",
          },
          {
            i: CalendarCheck,
            t: "3. Honest Fulfilment",
            d: "Orders within 5 km target 30-minute delivery; Search Further transparently shows longer ETAs and fees.",
          },
          {
            i: HeartHandshake,
            t: "4. Stay on Track",
            d: "Manage doses with CAREVIA Medicine Reminders and review history in your role-specific dashboard.",
          },
        ].map((s, i) => (
          <section key={s.t} className="relative border-t-2 border-teal pt-6">
            <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
              STEP {i + 1}
            </span>
            <s.i className="mt-4 h-9 w-9 text-primary" />
            <h2 className="mt-4 text-xl font-bold">{s.t}</h2>
            <p className="mt-3 text-sm text-muted-foreground">{s.d}</p>
            {i < 3 && (
              <ArrowRight className="absolute top-7 right-0 hidden h-5 w-5 text-teal md:block" />
            )}
          </section>
        ))}
      </div>
      <p className="my-8 text-sm text-muted-foreground">
        External payments, live pharmacy stock sync, doctor council registry verification, and push
        notifications require production API configuration and are clearly marked as demo previews
        where unconfigured.
      </p>
      <EmergencyStrip />
      <div className="mt-7 flex flex-wrap gap-3">
        <Button asChild className="rounded-full">
          <Link to="/medicines">Order Medicines</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <Link to="/nearby">Find a Doctor</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <Link to="/reminders">Medicine Reminders</Link>
        </Button>
      </div>
    </PageShell>
  ),
});
