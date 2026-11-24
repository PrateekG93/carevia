import { createFileRoute, Link } from "@tanstack/react-router";
import { Accessibility, Heart, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DemoBadge, PageShell, SectionHeader } from "@/components/qm/bits";
import { pageHead } from "@/lib/metadata";

export const Route = createFileRoute("/about")({
  head: () =>
    pageHead(
      "About CAREVIA — Healthcare, Connected. Care, Delivered.",
      "CAREVIA is an integrated healthcare ecosystem connecting patients, doctors, and pharmacies.",
    ),
  component: () => (
    <PageShell>
      <SectionHeader
        eyebrow="About CAREVIA"
        title="Healthcare, Connected. Care, Delivered."
        subtitle="Connecting patients, doctors, and pharmacies in one trustworthy healthcare ecosystem."
      >
        <DemoBadge>Integrated healthcare ecosystem</DemoBadge>
      </SectionHeader>
      <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground">
        CAREVIA is an integrated healthcare ecosystem connecting patients, doctors, and pharmacies
        through accessible, reliable, and technology-enabled healthcare services.
      </p>
      <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground">
        From fast local medicine delivery within a 5 km pharmacy radius and medication adherence
        reminders to verified doctor consultations, Doctor Chat, and transparent partner operations,
        CAREVIA brings everyday healthcare together without complexity.
      </p>
      <div className="mt-10 grid gap-8 md:grid-cols-3">
        {[
          {
            i: Heart,
            t: "Patient-First Continuity",
            d: "Order medicines, track doses with reminders, and keep consultation records unified.",
          },
          {
            i: Accessibility,
            t: "Accessible Discovery",
            d: "Location detection, manual address entry, 5 km local delivery and Search Further radius expansion.",
          },
          {
            i: ShieldCheck,
            t: "Clinical & Regulatory Integrity",
            d: "Prescription review, transparent partner verification status, and honest API status notices.",
          },
        ].map((v) => (
          <section key={v.t} className="border-t pt-5">
            <v.i className="h-8 w-8 text-teal" />
            <h2 className="mt-4 text-xl font-bold">{v.t}</h2>
            <p className="mt-3 text-muted-foreground">{v.d}</p>
          </section>
        ))}
      </div>
      <div className="mt-10 border-t pt-6">
        <h2 className="text-xl font-bold">Transparent integration status</h2>
        <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
          External payment gateways, Medical Council Registry verification, licensed pharmacy POS
          feeds, push/SMS notifications, and WebRTC video rooms require configured external APIs.
          Until connected, partner data and transactions remain clearly labelled demonstrations.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link to="/how-it-works">How CAREVIA Works</Link>
          </Button>
          <Button asChild>
            <Link to="/account">Explore Partner Dashboards</Link>
          </Button>
        </div>
      </div>
    </PageShell>
  ),
});
