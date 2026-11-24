import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  Clock,
  Headphones,
  Languages,
  MapPin,
  MessageSquareHeart,
  ShieldAlert,
  Stethoscope,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DemoBadge, EmergencyStrip, PageShell, SectionHeader } from "@/components/qm/bits";
import { BookingForm } from "@/components/qm/BookingForm";
import { formatINR, specialties, type Doctor } from "@/lib/data";
import { useStore } from "@/lib/store";
import { pageHead } from "@/lib/metadata";

export const Route = createFileRoute("/consult")({
  head: () =>
    pageHead(
      "Doctor Discovery & Consultations",
      "Filter doctors by specialty, experience, consultation fee, and online or in-person availability on CAREVIA.",
    ),
  component: Consult,
});

function Consult() {
  const { doctorProfiles } = useStore();
  const [specialtyFilter, setSpecialtyFilter] = useState("All");
  const [minExp, setMinExp] = useState<number>(0);
  const [maxFee, setMaxFee] = useState<number>(9999);
  const [modeFilter, setModeFilter] = useState<"all" | "online" | "offline">("all");
  const [selected, setSelected] = useState<{ doc: Doctor; kind: "Online" | "In-Person" } | null>(
    null,
  );

  const filtered = useMemo(() => {
    return doctorProfiles.filter((d) => {
      if (specialtyFilter !== "All" && d.specialty !== specialtyFilter) return false;
      if (d.experience < minExp) return false;
      if (d.fee > maxFee) return false;
      if (modeFilter === "online" && !d.offersOnline) return false;
      if (modeFilter === "offline" && !d.offersOffline) return false;
      return true;
    });
  }, [doctorProfiles, specialtyFilter, minExp, maxFee, modeFilter]);

  return (
    <PageShell>
      <SectionHeader
        eyebrow="CAREVIA Doctor Network"
        title="Doctor Discovery & Consultations"
        subtitle="Browse doctors by specialization, experience, consultation fee, and online or clinic availability."
      >
        <DemoBadge>Sample doctors · Registry API unconfigured</DemoBadge>
      </SectionHeader>

      <EmergencyStrip />

      <p className="my-5 text-sm text-muted-foreground">
        Doctors display medical registration numbers and council details. Live verification against
        National Medical Commission (NMC) / State Medical Council registries requires external API
        configuration; verification badges reflect demo/admin review states only.
      </p>

      {/* Filters */}
      <section className="mb-7 space-y-4 rounded-2xl border bg-soft p-5">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Specialty filter">
          {["All", ...specialties].map((s) => (
            <Button
              key={s}
              type="button"
              variant={specialtyFilter === s ? "default" : "outline"}
              size="sm"
              aria-pressed={specialtyFilter === s}
              onClick={() => setSpecialtyFilter(s)}
              className="rounded-full"
            >
              {s}
            </Button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="exp-filter">Experience</Label>
            <select
              id="exp-filter"
              value={minExp}
              onChange={(e) => setMinExp(Number(e.target.value))}
              className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
            >
              <option value={0}>Any experience</option>
              <option value={5}>5+ years</option>
              <option value={10}>10+ years</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="fee-filter">Consultation fee</Label>
            <select
              id="fee-filter"
              value={maxFee}
              onChange={(e) => setMaxFee(Number(e.target.value))}
              className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
            >
              <option value={9999}>Any fee</option>
              <option value={350}>Up to {formatINR(350)}</option>
              <option value={500}>Up to {formatINR(500)}</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="mode-filter">Consultation type</Label>
            <select
              id="mode-filter"
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value as typeof modeFilter)}
              className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
            >
              <option value="all">Online &amp; Offline</option>
              <option value="online">Online Consultation</option>
              <option value="offline">Offline / In-Person Clinic</option>
            </select>
          </div>
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((d) => (
          <article key={d.id} className="flex flex-col rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-secondary text-primary">
                  <Stethoscope className="h-6 w-6" />
                </span>
                <div>
                  <h2 className="text-lg font-bold">{d.name}</h2>
                  <p className="text-sm font-medium text-teal">{d.specialty}</p>
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  d.verificationStatus === "Verified (Demo)"
                    ? "bg-success/15 text-success"
                    : "bg-warning/20 text-warning-foreground"
                }`}
              >
                {d.verificationStatus === "Verified (Demo)" ? (
                  <BadgeCheck className="h-3.5 w-3.5" />
                ) : (
                  <ShieldAlert className="h-3.5 w-3.5" />
                )}
                {d.verificationStatus}
              </span>
            </div>

            <p className="mt-4 text-sm font-medium">
              {d.qualification} · {d.experience} years experience
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Reg: {d.registrationNumber} · {d.medicalCouncil}
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Languages className="h-4 w-4 shrink-0" />
              {d.languages.join(", ")}
            </p>
            <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              {d.clinicName}
            </p>
            <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 shrink-0" />
              Slots: {d.slots.join(", ")}
            </p>

            <div className="mt-4 flex items-center justify-between border-t pt-3">
              <div>
                <strong className="text-lg">{formatINR(d.fee)}</strong>{" "}
                <span className="text-xs text-muted-foreground">consultation fee (demo)</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-primary">
                {d.offersOnline && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-soft px-2 py-0.5">
                    <Headphones className="h-3 w-3" />
                    <Video className="h-3 w-3" /> Online
                  </span>
                )}
                {d.offersOffline && (
                  <span className="rounded-full bg-soft px-2 py-0.5">Clinic</span>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {d.offersOnline && (
                <Button
                  className="flex-1 rounded-full"
                  onClick={() => setSelected({ doc: d, kind: "Online" })}
                >
                  Book Online
                </Button>
              )}
              {d.offersOffline && (
                <Button
                  variant="outline"
                  className="flex-1 rounded-full"
                  onClick={() => setSelected({ doc: d, kind: "In-Person" })}
                >
                  Book Clinic Visit
                </Button>
              )}
              <Button asChild variant="secondary" size="sm" className="w-full rounded-full">
                <Link to="/doctor-chat">
                  <MessageSquareHeart className="h-4 w-4" /> Chat with Doctor
                </Link>
              </Button>
            </div>
          </article>
        ))}
      </div>

      <Dialog
        open={!!selected}
        onOpenChange={(o) => {
          if (!o) setSelected(null);
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogTitle>
            {selected?.doc.name} ({selected?.kind})
          </DialogTitle>
          <DialogDescription>
            {selected?.doc.registrationNumber} · {selected?.doc.verificationStatus}
          </DialogDescription>
          {selected && (
            <BookingForm
              key={`${selected.doc.id}-${selected.kind}`}
              doctorId={selected.doc.id}
              name={selected.doc.name}
              specialty={selected.doc.specialty}
              slots={selected.doc.slots}
              fee={selected.doc.fee}
              kind={selected.kind}
              place={selected.kind === "In-Person" ? selected.doc.clinicName : undefined}
            />
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
