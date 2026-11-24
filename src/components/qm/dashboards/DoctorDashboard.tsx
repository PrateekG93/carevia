import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  Calendar,
  Clock,
  IndianRupee,
  MessageSquareHeart,
  ShieldAlert,
  Stethoscope,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DemoBadge } from "@/components/qm/bits";
import { formatINR } from "@/lib/data";
import { useStore } from "@/lib/store";

export function DoctorDashboard() {
  const store = useStore();
  const [selectedDoctorId, setSelectedDoctorId] = useState(store.doctorProfiles[0]?.id ?? "d1");
  const doc =
    store.doctorProfiles.find((d) => d.id === selectedDoctorId) ?? store.doctorProfiles[0];

  const [fee, setFee] = useState(doc?.fee ?? 299);
  const [slotsText, setSlotsText] = useState(doc?.slots.join(", ") ?? "");
  const [regNumber, setRegNumber] = useState(doc?.registrationNumber ?? "");
  const [council, setCouncil] = useState(doc?.medicalCouncil ?? "");
  const [qualification, setQualification] = useState(doc?.qualification ?? "");
  const [clinicName, setClinicName] = useState(doc?.clinicName ?? "");
  const [offersOnline, setOffersOnline] = useState(doc?.offersOnline ?? true);
  const [offersOffline, setOffersOffline] = useState(doc?.offersOffline ?? true);
  const [replyText, setReplyText] = useState<Record<string, string>>({});

  if (!doc) return null;

  const switchDoc = (id: string) => {
    setSelectedDoctorId(id);
    const next = store.doctorProfiles.find((d) => d.id === id);
    if (next) {
      setFee(next.fee);
      setSlotsText(next.slots.join(", "));
      setRegNumber(next.registrationNumber);
      setCouncil(next.medicalCouncil);
      setQualification(next.qualification);
      setClinicName(next.clinicName);
      setOffersOnline(next.offersOnline);
      setOffersOffline(next.offersOffline);
    }
  };

  const docAppointments = store.appointments.filter(
    (a) => a.doctorId === doc.id || a.with === doc.name,
  );
  const docThreads = store.consultThreads.filter((t) => t.doctorId === doc.id);

  const grossConsults =
    docAppointments.filter((a) => a.status !== "Cancelled").reduce((s, a) => s + a.fee, 0) +
    docThreads
      .filter((t) => t.status === "accepted" || t.status === "completed")
      .reduce((s, t) => s + t.fee, 0);
  const commissionPct = store.platformSettings.consultationCommissionPct;
  const platformCut = Math.round((grossConsults * commissionPct) / 100);
  const netEarnings = grossConsults - platformCut;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-soft p-5">
        <div>
          <p className="text-xs font-bold tracking-wider text-teal uppercase">
            CAREVIA Doctor Partner Portal
          </p>
          <h2 className="text-xl font-bold">
            {doc.name} · {doc.specialty}
          </h2>
          <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            {doc.verificationStatus === "Verified (Demo)" ? (
              <BadgeCheck className="h-4 w-4 text-success" />
            ) : (
              <ShieldAlert className="h-4 w-4 text-warning-foreground" />
            )}
            <span>
              Verification: <strong>{doc.verificationStatus}</strong> (Medical Council API not
              connected)
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="doc-switcher" className="text-xs">
            Active Doctor Profile
          </Label>
          <select
            id="doc-switcher"
            value={doc.id}
            onChange={(e) => switchDoc(e.target.value)}
            className="rounded-xl border bg-background px-3 py-2 text-sm"
          >
            {store.doctorProfiles.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.specialty})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Consultation Earnings KPIs */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5">
          <p className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <IndianRupee className="h-4 w-4 text-primary" /> Gross Consultations (Demo)
          </p>
          <p className="mt-2 font-display text-2xl font-bold">{formatINR(grossConsults)}</p>
        </div>
        <div className="rounded-2xl border bg-card p-5">
          <p className="text-xs font-semibold text-muted-foreground">
            CAREVIA Platform Fee ({commissionPct}%)
          </p>
          <p className="mt-2 font-display text-2xl font-bold text-warning-foreground">
            -{formatINR(platformCut)}
          </p>
        </div>
        <div className="rounded-2xl border bg-mint-soft p-5">
          <p className="text-xs font-semibold text-primary">Net Doctor Payout (Demo)</p>
          <p className="mt-2 font-display text-2xl font-bold text-primary">
            {formatINR(netEarnings)}
          </p>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Profile, Verification & Availability Management */}
        <section className="rounded-2xl border bg-card p-6">
          <h3 className="flex items-center gap-2 text-lg font-bold">
            <UserCheck className="h-5 w-5 text-primary" /> Verification, Profile &amp; Availability
          </h3>
          <form
            className="mt-4 space-y-3.5"
            onSubmit={(e) => {
              e.preventDefault();
              const parsedSlots = slotsText
                .split(",")
                .map((s) => s.trim())
                .filter((s) => /^\d{2}:\d{2}$/.test(s));
              store.updateDoctorProfile(doc.id, {
                fee: Math.max(0, Number(fee)),
                slots: parsedSlots.length ? parsedSlots : doc.slots,
                registrationNumber: regNumber.trim(),
                medicalCouncil: council.trim(),
                qualification: qualification.trim(),
                clinicName: clinicName.trim(),
                offersOnline,
                offersOffline,
              });
              toast.success("Doctor profile, fee & availability updated");
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="doc-reg">Medical Registration No.</Label>
                <Input
                  id="doc-reg"
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="doc-council">Medical Council</Label>
                <Input
                  id="doc-council"
                  value={council}
                  onChange={(e) => setCouncil(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="doc-qual">Qualification</Label>
                <Input
                  id="doc-qual"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="doc-fee">Consultation Fee (₹)</Label>
                <Input
                  id="doc-fee"
                  type="number"
                  min={0}
                  value={fee}
                  onChange={(e) => setFee(Number(e.target.value))}
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="doc-clinic">Clinic / Practice Location</Label>
              <Input
                id="doc-clinic"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="doc-slots">Available Slots (HH:MM, comma-separated)</Label>
              <Input
                id="doc-slots"
                value={slotsText}
                onChange={(e) => setSlotsText(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-wrap gap-4 pt-1 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={offersOnline}
                  onChange={(e) => setOffersOnline(e.target.checked)}
                />
                Online consultations
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={offersOffline}
                  onChange={(e) => setOffersOffline(e.target.checked)}
                />
                Offline clinic visits
              </label>
            </div>
            <Button type="submit" className="w-full rounded-full">
              Save Doctor Settings
            </Button>
          </form>
        </section>

        {/* Doctor Chat Requests & Consultations */}
        <section className="space-y-4 rounded-2xl border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-lg font-bold">
              <MessageSquareHeart className="h-5 w-5 text-primary" /> Patient Chat Requests
            </h3>
            <Button asChild size="sm" variant="outline" className="rounded-full">
              <Link to="/doctor-chat">Full Chat View</Link>
            </Button>
          </div>
          {docThreads.length === 0 ? (
            <p className="text-sm text-muted-foreground">No chat requests for {doc.name} yet.</p>
          ) : (
            docThreads.map((t) => (
              <article key={t.id} className="space-y-3 rounded-xl border bg-soft p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <strong>{t.patientName}</strong>
                    <p className="text-xs text-muted-foreground">
                      {t.reason} · Fee: {formatINR(t.fee)}
                    </p>
                  </div>
                  <DemoBadge>{t.status}</DemoBadge>
                </div>

                {t.status === "requested" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        store.respondDoctorChat(t.id, "accepted");
                        toast.success(`Accepted consultation with ${t.patientName}`);
                      }}
                    >
                      Accept Request
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        store.respondDoctorChat(t.id, "rejected");
                        toast.message("Declined request");
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                )}

                {t.status === "accepted" && (
                  <div className="space-y-2">
                    <div className="max-h-36 space-y-1.5 overflow-y-auto rounded-lg bg-background p-2.5 text-xs">
                      {t.messages.map((m) => (
                        <p key={m.id}>
                          <strong>{m.senderName}:</strong> {m.text}{" "}
                          {m.attachment && (
                            <span className="text-primary">[File: {m.attachment.name}]</span>
                          )}
                        </p>
                      ))}
                    </div>
                    <form
                      className="flex gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const txt = (replyText[t.id] ?? "").trim();
                        if (!txt) return;
                        store.sendDoctorChatMessage(t.id, "doctor", doc.name, txt);
                        setReplyText((prev) => ({ ...prev, [t.id]: "" }));
                      }}
                    >
                      <Input
                        value={replyText[t.id] ?? ""}
                        onChange={(e) =>
                          setReplyText((prev) => ({ ...prev, [t.id]: e.target.value }))
                        }
                        placeholder="Reply to patient…"
                        className="h-9 bg-background text-sm"
                      />
                      <Button type="submit" size="sm">
                        Send
                      </Button>
                    </form>
                  </div>
                )}
              </article>
            ))
          )}
        </section>
      </div>

      {/* Appointment Queue */}
      <section className="rounded-2xl border bg-card p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <Calendar className="h-5 w-5 text-primary" /> Scheduled Appointments (
          {docAppointments.length})
        </h3>
        {docAppointments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No appointments booked for {doc.name} in this visit yet.
          </p>
        ) : (
          <div className="space-y-3">
            {docAppointments.map((a) => (
              <div
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-soft p-4 text-sm"
              >
                <div>
                  <strong>{a.patient}</strong> · {a.kind} {a.mode} ·{" "}
                  <Clock className="inline h-3.5 w-3.5" /> {a.date} at {a.time}
                  <p className="text-xs text-muted-foreground">
                    Status: {a.status} · Fee: {formatINR(a.fee)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={a.status === "Completed (demo)" || a.status === "Cancelled"}
                    onClick={() => store.updateAppointmentStatus(a.id, "Completed (demo)")}
                  >
                    <Stethoscope className="h-4 w-4" /> Mark Completed
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={a.status === "Cancelled"}
                    onClick={() => store.cancelAppointment(a.id)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
