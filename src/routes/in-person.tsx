import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Hospital, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell, SectionHeader, EmergencyStrip } from "@/components/qm/bits";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/in-person")({
  head: () =>
    pageHead(
      "In-Person Doctor Appointments",
      "Find clinics for physical examinations and contact facilities directly to arrange real visits.",
    ),
  component: () => (
    <PageShell>
      <SectionHeader
        title="Prefer to See a Doctor in Person?"
        subtitle="Find a nearby clinic or hospital and arrange an in-person consultation when you need a physical examination."
      />
      <EmergencyStrip />
      <div className="mt-8 grid gap-8 md:grid-cols-3">
        {[
          {
            icon: MapPin,
            t: "Choose your location",
            d: "Search by city, area or PIN code, or use your current location.",
          },
          {
            icon: Hospital,
            t: "Find appropriate care",
            d: "Explore specialties, map locations and listed clinic information.",
          },
          {
            icon: Phone,
            t: "Confirm your visit",
            d: "Call a listed clinic to confirm its hours, fee and availability. Real appointments need confirmation from the clinic.",
          },
        ].map((x) => (
          <section key={x.t}>
            <x.icon className="h-8 w-8 text-teal" />
            <h2 className="mt-3 text-lg font-bold">{x.t}</h2>
            <p className="mt-3 text-sm text-muted-foreground">{x.d}</p>
          </section>
        ))}
      </div>
      <Button asChild size="lg" className="mt-8">
        <Link to="/nearby">Find Clinics and Hospitals</Link>
      </Button>
      <p className="mt-4 text-sm text-muted-foreground">
        Live clinic booking is not integrated. Demo visit booking is available only for fictional
        sample facilities in the finder.
      </p>
    </PageShell>
  ),
});
