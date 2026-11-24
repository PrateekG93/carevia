import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  BellRing,
  Building2,
  Calendar,
  Camera,
  Clock,
  Compass,
  HeartPulse,
  MapPin,
  MessageSquareHeart,
  Pill,
  Search,
  ShieldCheck,
  Stethoscope,
  Truck,
  Upload,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import hero from "@/assets/carevia-hero.jpg";
import { DemoBadge, EmergencyStrip } from "@/components/qm/bits";
import { LocationPicker } from "@/components/qm/LocationPicker";
import { SymptomGuidance } from "@/components/qm/SymptomGuidance";
import { formatINR, PHARMACY_PLANS, products } from "@/lib/data";
import { DEFAULT_USER_COORDS } from "@/lib/delivery";
import { useStore } from "@/lib/store";
import { pageHead } from "@/lib/metadata";

export const Route = createFileRoute("/")({
  head: () =>
    pageHead(
      "Healthcare, Connected. Care, Delivered.",
      "CAREVIA connects patients, doctors, and nearby pharmacies for 30-minute target medicine delivery, medicine reminders, doctor consultations, and Doctor Chat.",
    ),
  component: Home,
});

function Home() {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const { location, partnerPharmacies, switchDemoRole } = useStore();
  const firstAidPreview = products.filter((p) => p.firstAidEssential).slice(0, 5);
  const localPharmacies = partnerPharmacies.slice(0, 2);
  const activeArea = location?.label ?? DEFAULT_USER_COORDS.label;

  return (
    <div>
      {/* HERO SECTION */}
      <section className="home-hero relative overflow-hidden bg-hero">
        <img
          src={hero}
          alt="CAREVIA doctor with stethoscope, sealed medicine delivery box, and modern clinical essentials"
          width={1152}
          height={648}
          className="home-hero-image absolute inset-0 h-full w-full object-cover"
        />
        <div className="home-hero-shade absolute inset-0" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
          <div className="max-w-xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/85 px-3 py-1 text-xs font-bold tracking-wider text-primary uppercase backdrop-blur-sm">
              <Zap className="h-3.5 w-3.5 text-teal" /> CAREVIA · 30-Minute Target Delivery (within
              5 km)
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
              Healthcare, Connected. <span className="text-primary">Care, Delivered.</span>
            </h1>
            <p className="mt-4 max-w-lg text-lg text-muted-foreground">
              From essential medicines to trusted medical consultations, everything you need for
              better healthcare is now connected in one place.
            </p>

            {/* Location-based medicine search */}
            <search>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (/fever|headache|cough|cold|stomach|symptom|breath|chest pain/i.test(q)) {
                    navigate({ to: "/symptoms", state: { symptomDraft: q } });
                  } else {
                    navigate({ to: "/medicines", search: { q: q.trim() || undefined } });
                  }
                }}
                className="mt-6 flex gap-2"
              >
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    className="h-12 rounded-xl bg-background pl-9 shadow-sm"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search medicines, first aid, or symptoms…"
                    aria-label="Search medicines, first aid, or symptoms"
                  />
                </div>
                <Button type="submit" className="h-12 rounded-xl px-5">
                  Search
                </Button>
                <Button
                  asChild
                  size="icon"
                  variant="outline"
                  className="h-12 w-12 shrink-0 rounded-xl bg-background"
                  title="Upload prescription"
                >
                  <Link to="/upload" aria-label="Upload prescription">
                    <Camera className="h-5 w-5" />
                  </Link>
                </Button>
              </form>
            </search>

            {/* Primary & Secondary CTAs */}
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full shadow-soft">
                <Link to="/medicines">
                  Order Medicines <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full bg-background">
                <Link to="/nearby">
                  <Stethoscope className="h-4 w-4 text-primary" /> Find a Doctor
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className="rounded-full">
                <Link to="/upload">
                  <Upload className="h-4 w-4" /> Upload Rx
                </Link>
              </Button>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <LocationPicker compact />
              <DemoBadge>Sample marketplace · External APIs labelled</DemoBadge>
            </div>
          </div>
        </div>
      </section>

      {/* PATIENTS ↔ DOCTORS ↔ PHARMACIES ECOSYSTEM STRIP */}
      <section className="border-y bg-card">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-5 md:flex-row md:px-6">
          <div className="flex items-center gap-2 text-sm font-bold tracking-wide text-primary">
            <HeartPulse className="h-5 w-5" />
            <span>CAREVIA CONNECTED ECOSYSTEM:</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-semibold">
            <span className="rounded-full bg-soft px-4 py-1.5 text-foreground">Patients</span>
            <span className="text-teal" aria-hidden="true">
              ↔
            </span>
            <span className="rounded-full bg-secondary px-4 py-1.5 text-primary">Doctors</span>
            <span className="text-teal" aria-hidden="true">
              ↔
            </span>
            <span className="rounded-full bg-soft px-4 py-1.5 text-foreground">Pharmacies</span>
          </div>
          <Link to="/account" className="text-sm font-semibold text-primary underline">
            Open Role Dashboards →
          </Link>
        </div>
      </section>

      {/* CORE CARE PILLARS */}
      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-10 md:grid-cols-4 md:px-6">
        {[
          {
            icon: Truck,
            t: "30-Min Medicine Delivery",
            d: "Get your medicines delivered in as little as 30 minutes from stocked pharmacies within 5 km, or Search Further with clear ETAs.",
            b: "Order Medicines",
            to: "/medicines" as const,
          },
          {
            icon: BellRing,
            t: "Medicine Reminders",
            d: "Track today's doses, before/after-food timings, snooze/skip actions, and refill estimates.",
            b: "Open Reminders",
            to: "/reminders" as const,
          },
          {
            icon: Calendar,
            t: "Doctor Appointments",
            d: "Filter doctors by specialty, experience, fee, and verification status for online or clinic visits.",
            b: "Find a Doctor",
            to: "/nearby" as const,
          },
          {
            icon: MessageSquareHeart,
            t: "Chat with Doctor",
            d: "Request consultations with verified doctors, share lab reports or PDFs, and view consultation history.",
            b: "Start Doctor Chat",
            to: "/doctor-chat" as const,
          },
        ].map((c) => (
          <article key={c.t} className="flex flex-col rounded-2xl border bg-card p-6 shadow-soft">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-secondary text-primary">
              <c.icon className="h-6 w-6" />
            </span>
            <h2 className="mt-4 text-lg font-bold">{c.t}</h2>
            <p className="mt-2 flex-1 text-sm text-muted-foreground">{c.d}</p>
            <Button asChild variant="outline" className="mt-5 w-full rounded-full">
              <Link to={c.to}>
                {c.b} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </article>
        ))}
      </section>

      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <EmergencyStrip />
      </div>

      {/* NEARBY PHARMACY DISCOVERY (5 KM + SEARCH FURTHER) */}
      <section className="mt-12 bg-soft">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-wider text-teal uppercase">
                5 KM PHARMACY DISCOVERY · {activeArea}
              </p>
              <h2 className="mt-1 text-2xl font-bold md:text-3xl">
                Get your medicines delivered in as little as 30 minutes
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                CAREVIA searches stocked partner pharmacies within 5 km first. When an item is
                unavailable nearby, use <strong>Search Further</strong> to view farther pharmacies
                with honest longer delivery estimates and distance fees.
              </p>
            </div>
            <Button asChild className="rounded-full">
              <Link to="/medicines">
                <Compass className="h-4 w-4" /> Check Live Radius Inventory
              </Link>
            </Button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {localPharmacies.map((pharm, idx) => (
              <article key={pharm.id} className="rounded-2xl border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold">{pharm.name}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      License: {pharm.licenseNumber} · {pharm.openHours}
                    </p>
                  </div>
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-primary">
                    {idx === 0 ? "1.5 km · ~25–35 mins" : "3.4 km · ~28–38 mins"}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-teal" /> Stocked local hub (sample data)
                  </span>
                  <Link to="/medicines" className="font-semibold text-primary underline">
                    Browse pharmacy stock →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* FIRST AID ESSENTIALS REDESIGN SHOWCASE */}
      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-wider text-teal uppercase">
              FIRST AID ESSENTIALS
            </p>
            <h2 className="mt-1 text-2xl font-bold md:text-3xl">
              Redesigned First Aid &amp; Wound Care Catalog
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              10 dedicated first-aid essentials — bandages, antiseptics, cotton rolls, thermometers,
              gloves, gauze, tape, scissors, burn dressings, and masks — each with unique product
              photography.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/medicines" search={{ cat: "first-aid" }}>
              View All 10 First Aid Items <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {firstAidPreview.map((item) => (
            <Link
              key={item.id}
              to="/medicines/$id"
              params={{ id: item.id }}
              className="group overflow-hidden rounded-2xl border bg-card transition hover:-translate-y-0.5 hover:shadow-soft"
            >
              <div className="aspect-square overflow-hidden bg-soft">
                <img
                  src={item.image}
                  alt={item.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
              </div>
              <div className="p-3">
                <p className="line-clamp-1 text-sm font-semibold">{item.name}</p>
                <p className="mt-1 text-sm font-bold text-primary">{formatINR(item.price)}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* GENERAL HEALTH GUIDANCE + IN-PERSON CARE */}
      <section className="mx-auto grid max-w-7xl gap-12 border-t px-4 py-12 md:px-6 lg:grid-cols-[1.3fr_1fr]">
        <SymptomGuidance />
        <div className="border-t pt-8 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
          <p className="text-xs font-bold tracking-wider text-teal uppercase">CARE CLOSE TO HOME</p>
          <h2 className="mt-2 text-2xl font-bold">Need a Doctor Consultation or Clinic Visit?</h2>
          <p className="mt-4 text-muted-foreground">
            Compare verified doctor profiles by specialization, experience, and fee, request a
            direct Doctor Chat to share reports, or locate nearby hospitals and clinics on the map.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild className="rounded-full">
              <Link to="/consult">
                <Stethoscope className="h-4 w-4" /> Browse Doctors
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/doctor-chat">
                <MessageSquareHeart className="h-4 w-4" /> Chat with Doctor
              </Link>
            </Button>
            <Button asChild variant="ghost" className="rounded-full">
              <Link to="/in-person">
                <MapPin className="h-4 w-4" /> In-Person Visits
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* PHARMACY PARTNERSHIP & DOCTOR REGISTRATION SECTIONS */}
      <section className="bg-mint-soft py-12">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 md:grid-cols-2 md:px-6">
          <article className="rounded-3xl border bg-card p-8 shadow-soft">
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-primary">
              <Building2 className="h-3.5 w-3.5" /> PHARMACY PARTNERSHIP
            </div>
            <h2 className="mt-4 text-2xl font-bold">Grow Your Pharmacy with CAREVIA</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Connect your licensed pharmacy to local 5 km demand and extended-radius orders. Manage
              inventory, pricing, Rx approvals, and earnings from one Pharmacy Dashboard.
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {PHARMACY_PLANS.map((pl) => (
                <li
                  key={pl.name}
                  className="flex items-center justify-between rounded-xl bg-soft px-3 py-2"
                >
                  <span className="font-semibold">{pl.name} Plan</span>
                  <span className="font-bold text-primary">{formatINR(pl.monthlyInr)} / month</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                className="rounded-full"
                onClick={() => {
                  switchDemoRole("pharmacy");
                  navigate({ to: "/account" });
                }}
              >
                Open Pharmacy Dashboard
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link to="/login">Register Pharmacy</Link>
              </Button>
            </div>
          </article>

          <article className="rounded-3xl border bg-card p-8 shadow-soft">
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-primary">
              <ShieldCheck className="h-3.5 w-3.5" /> DOCTOR REGISTRATION
            </div>
            <h2 className="mt-4 text-2xl font-bold">Practice &amp; Earn on CAREVIA</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Build your verified medical profile, set consultation fees and availability slots,
              accept patient chat requests, review uploaded reports, and track net payouts.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Pill className="h-4 w-4 text-teal" /> Patient discovery across online &amp; clinic
                visits
              </li>
              <li className="flex items-center gap-2">
                <MessageSquareHeart className="h-4 w-4 text-teal" /> Accept or decline Doctor Chat
                requests on your schedule
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-teal" /> Medical registration verification
                &amp; transparent earnings
              </li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                className="rounded-full"
                onClick={() => {
                  switchDemoRole("doctor");
                  navigate({ to: "/account" });
                }}
              >
                Open Doctor Dashboard
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link to="/login">Register as Doctor</Link>
              </Button>
            </div>
          </article>
        </div>
      </section>

      {/* ABOUT CAREVIA */}
      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <p className="text-xs font-bold tracking-wider text-teal uppercase">ABOUT CAREVIA</p>
        <h2 className="mt-2 text-3xl font-bold">Healthcare, Connected. Care, Delivered.</h2>
        <p className="mt-4 max-w-3xl text-muted-foreground">
          CAREVIA is an integrated healthcare ecosystem connecting patients, doctors, and pharmacies
          through accessible, reliable, and technology-enabled healthcare services.
        </p>
        <Button asChild variant="outline" className="mt-5 rounded-full">
          <Link to="/about">
            Learn More About CAREVIA <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </section>
    </div>
  );
}
