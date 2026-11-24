import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  BellRing,
  Calendar,
  CreditCard,
  FileText,
  MapPin,
  MessageSquareHeart,
  Package,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DemoBadge, EmptyState } from "@/components/qm/bits";
import { formatINR } from "@/lib/data";
import { buildDoseScheduleForDate } from "@/lib/reminders";
import { localDate } from "@/lib/safety";
import { useStore, type Address } from "@/lib/store";

const tabs = [
  { t: "Orders", i: Package },
  { t: "Reminders", i: BellRing },
  { t: "Appointments", i: Calendar },
  { t: "Doctor Chat", i: MessageSquareHeart },
  { t: "Profile & Addresses", i: MapPin },
  { t: "Payments", i: CreditCard },
  { t: "Prescriptions", i: FileText },
] as const;

export function PatientDashboard() {
  const store = useStore();
  const [tab, setTab] = useState<(typeof tabs)[number]["t"]>("Orders");
  const [profile, setProfile] = useState(
    store.user ?? {
      id: "DEMO-PATIENT",
      name: "",
      email: "",
      mobile: "",
      role: "patient" as const,
      authSource: "demo" as const,
    },
  );
  const [addr, setAddr] = useState<Address>({ name: "", phone: "", line1: "", city: "", pin: "" });
  const [showAddress, setShowAddress] = useState(false);
  const [error, setError] = useState("");
  const [reschedId, setReschedId] = useState<string | null>(null);
  const [reschedDate, setReschedDate] = useState(localDate());
  const [reschedTime, setReschedTime] = useState("10:00");
  const [complaintSubject, setComplaintSubject] = useState("");
  const [complaintDetails, setComplaintDetails] = useState("");

  const today = localDate();
  const todayDoses = buildDoseScheduleForDate(store.reminders, today, store.doseOverrides);

  return (
    <div className="space-y-6">
      <div
        className="flex flex-wrap gap-2 border-b pb-3"
        role="tablist"
        aria-label="Patient dashboard sections"
      >
        {tabs.map((x) => (
          <Button
            key={x.t}
            type="button"
            role="tab"
            size="sm"
            aria-selected={tab === x.t}
            variant={tab === x.t ? "default" : "outline"}
            onClick={() => setTab(x.t)}
          >
            <x.i className="h-4 w-4" />
            {x.t}
          </Button>
        ))}
      </div>

      <div role="tabpanel">
        {tab === "Orders" && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-bold">Medicine Orders</h2>
              <Button asChild size="sm" className="rounded-full">
                <Link to="/medicines">Order Medicines</Link>
              </Button>
            </div>
            {store.orders.length ? (
              store.orders.map((o) => (
                <Link
                  key={o.id}
                  to="/orders/$id"
                  params={{ id: o.id }}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4 hover:shadow-soft"
                >
                  <div>
                    <strong>
                      {o.id} · {o.pharmacyName}
                    </strong>
                    <p className="text-sm text-muted-foreground">
                      {o.lines.length} items · {o.stages[o.stage]} · {o.etaLabel}
                    </p>
                  </div>
                  <strong className="text-primary">{formatINR(o.total)}</strong>
                </Link>
              ))
            ) : (
              <EmptyState icon={<Package />} title="No medicine orders yet">
                <Button asChild>
                  <Link to="/medicines">Order Medicines</Link>
                </Button>
              </EmptyState>
            )}
          </section>
        )}

        {tab === "Reminders" && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-bold">Today&apos;s Medication Schedule</h2>
              <Button asChild size="sm" className="rounded-full">
                <Link to="/reminders">Manage All Reminders</Link>
              </Button>
            </div>
            <div className="space-y-2">
              {todayDoses.map((d) => (
                <div
                  key={d.key}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4 text-sm"
                >
                  <div>
                    <strong>{d.medicineName}</strong> · {d.dosage}
                    <p className="text-xs text-muted-foreground">
                      {d.time} · {d.mealInstruction} · Status: {d.status}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={d.status === "taken" ? "secondary" : "default"}
                    onClick={() => store.markDose(d.key, "taken")}
                  >
                    {d.status === "taken" ? "Taken" : "Mark as Taken"}
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === "Appointments" && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-bold">Doctor Appointments</h2>
              <Button asChild size="sm" className="rounded-full">
                <Link to="/consult">Book Appointment</Link>
              </Button>
            </div>
            {store.appointments.length ? (
              store.appointments.map((a) => (
                <article key={a.id} className="space-y-3 rounded-2xl border bg-card p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <strong>{a.with}</strong>
                      <p className="text-sm text-muted-foreground">
                        {a.kind} {a.mode} · {a.specialty} · {a.date} at {a.time} ·{" "}
                        {formatINR(a.fee)}
                      </p>
                    </div>
                    <DemoBadge>{a.status}</DemoBadge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {a.kind === "Online" && a.status !== "Cancelled" && (
                      <Button asChild size="sm" variant="outline">
                        <Link to="/consult/room" search={{ appointment: a.id }}>
                          Open Demo Consultation
                        </Link>
                      </Button>
                    )}
                    {a.status !== "Cancelled" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setReschedId(a.id);
                            setReschedDate(a.date);
                            setReschedTime(a.time);
                          }}
                        >
                          Reschedule
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            store.cancelAppointment(a.id);
                            toast.message(`Appointment ${a.id} cancelled`);
                          }}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                  {reschedId === a.id && (
                    <form
                      className="flex flex-wrap items-end gap-2 rounded-xl bg-soft p-3"
                      onSubmit={(e) => {
                        e.preventDefault();
                        store.rescheduleAppointment(a.id, reschedDate, reschedTime);
                        setReschedId(null);
                        toast.success("Appointment rescheduled (demo)");
                      }}
                    >
                      <div>
                        <Label htmlFor={`rs-d-${a.id}`} className="text-xs">
                          New date
                        </Label>
                        <Input
                          id={`rs-d-${a.id}`}
                          type="date"
                          min={localDate()}
                          value={reschedDate}
                          onChange={(e) => setReschedDate(e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`rs-t-${a.id}`} className="text-xs">
                          New time
                        </Label>
                        <Input
                          id={`rs-t-${a.id}`}
                          type="time"
                          value={reschedTime}
                          onChange={(e) => setReschedTime(e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <Button type="submit" size="sm">
                        Save Slot
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setReschedId(null)}
                      >
                        Close
                      </Button>
                    </form>
                  )}
                </article>
              ))
            ) : (
              <EmptyState icon={<Calendar />} title="No appointments booked">
                <Button asChild>
                  <Link to="/consult">Find Doctors</Link>
                </Button>
              </EmptyState>
            )}
          </section>
        )}

        {tab === "Doctor Chat" && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-bold">Doctor Consultations &amp; Chat</h2>
              <Button asChild size="sm" className="rounded-full">
                <Link to="/doctor-chat">Open Doctor Chat</Link>
              </Button>
            </div>
            {store.consultThreads.map((t) => (
              <article key={t.id} className="rounded-2xl border bg-card p-4">
                <div className="flex flex-wrap justify-between gap-2">
                  <strong>
                    {t.doctorName} · {t.specialty}
                  </strong>
                  <DemoBadge>{t.status}</DemoBadge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{t.reason}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t.messages.length} message(s)</p>
              </article>
            ))}
          </section>
        )}

        {tab === "Profile & Addresses" && (
          <div className="grid gap-8 lg:grid-cols-2">
            <section className="space-y-4">
              <h2 className="text-xl font-bold">Patient Profile</h2>
              {store.user ? (
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (profile.name.trim().length < 2 || !/^[6-9]\d{9}$/.test(profile.mobile)) {
                      setError("Enter a full name and valid 10-digit mobile number.");
                      return;
                    }
                    setError("");
                    store.setUser({ ...store.user!, ...profile });
                    toast.success("Profile updated for this visit");
                  }}
                >
                  {(["name", "email", "mobile"] as const).map((k) => (
                    <div key={k} className="space-y-1.5">
                      <Label htmlFor={`profile-${k}`}>
                        {k === "name" ? "Full name" : k === "email" ? "Email" : "Mobile number"}
                      </Label>
                      <Input
                        id={`profile-${k}`}
                        type={k === "email" ? "email" : "text"}
                        value={profile[k]}
                        onChange={(e) => setProfile({ ...profile, [k]: e.target.value })}
                        required
                      />
                    </div>
                  ))}
                  {error && (
                    <p role="alert" className="text-sm text-destructive">
                      {error}
                    </p>
                  )}
                  <Button type="submit">Save Profile</Button>
                </form>
              ) : (
                <EmptyState icon={<User />} title="Not signed in">
                  <Button asChild>
                    <Link to="/login">Login / Sign Up</Link>
                  </Button>
                </EmptyState>
              )}

              <section className="rounded-2xl border bg-soft p-5">
                <h3 className="font-bold">Submit Support Ticket / Complaint</h3>
                <form
                  className="mt-3 space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (complaintSubject.trim().length < 4) return;
                    store.addComplaint({
                      reporterName: store.user?.name || "Patient",
                      role: "patient",
                      subject: complaintSubject.trim(),
                      category: "App",
                      details: complaintDetails.trim() || "Submitted from Patient Dashboard",
                    });
                    setComplaintSubject("");
                    setComplaintDetails("");
                    toast.success("Complaint logged for Admin review (visit-only)");
                  }}
                >
                  <Input
                    value={complaintSubject}
                    onChange={(e) => setComplaintSubject(e.target.value)}
                    placeholder="Issue subject"
                    required
                  />
                  <Textarea
                    value={complaintDetails}
                    onChange={(e) => setComplaintDetails(e.target.value)}
                    placeholder="Details…"
                    rows={2}
                  />
                  <Button type="submit" size="sm" variant="outline">
                    Send to CAREVIA Support
                  </Button>
                </form>
              </section>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold">Saved Addresses</h2>
              {store.addresses.map((a, i) => (
                <article key={i} className="rounded-2xl border bg-card p-4">
                  <strong>{a.name}</strong>
                  <p className="text-sm text-muted-foreground">
                    {a.line1}, {a.city} {a.pin}
                  </p>
                  <p className="text-sm">{a.phone}</p>
                </article>
              ))}
              {!store.addresses.length && (
                <p className="text-sm text-muted-foreground">
                  No saved addresses yet for this visit.
                </p>
              )}
              <Button variant="outline" onClick={() => setShowAddress(!showAddress)}>
                {showAddress ? "Cancel" : "Add Address"}
              </Button>
              {showAddress && (
                <form
                  className="grid gap-3 sm:grid-cols-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (
                      addr.name.trim().length < 2 ||
                      addr.line1.trim().length < 5 ||
                      addr.city.trim().length < 2 ||
                      !/^\d{6}$/.test(addr.pin) ||
                      !/^[6-9]\d{9}$/.test(addr.phone)
                    ) {
                      setError(
                        "Enter a complete address, 6-digit PIN and valid 10-digit mobile number.",
                      );
                      return;
                    }
                    store.addAddress(addr);
                    setShowAddress(false);
                    setError("");
                    setAddr({ name: "", phone: "", line1: "", city: "", pin: "" });
                  }}
                >
                  {(["name", "phone", "line1", "city", "pin"] as const).map((k) => (
                    <div key={k} className="space-y-1">
                      <Label htmlFor={`address-${k}`}>{k}</Label>
                      <Input
                        id={`address-${k}`}
                        value={addr[k]}
                        onChange={(e) => setAddr({ ...addr, [k]: e.target.value })}
                        required
                      />
                    </div>
                  ))}
                  <Button type="submit" className="sm:col-span-2">
                    Save Address
                  </Button>
                </form>
              )}
            </section>
          </div>
        )}

        {tab === "Payments" && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-bold">Payment History</h2>
              <DemoBadge>Payment gateway unconfigured — no real charges</DemoBadge>
            </div>
            <div className="table-wrapper rounded-2xl border bg-card">
              <table className="carevia-table responsive-stack text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                    <th className="p-3">Reference</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {store.orders.map((o) => (
                    <tr key={o.id} className="border-b">
                      <td className="p-3 font-semibold" data-label="Reference">
                        {o.id}
                      </td>
                      <td className="p-3" data-label="Type">
                        Medicine Order ({o.pharmacyName})
                      </td>
                      <td className="p-3 font-bold" data-label="Amount">
                        {formatINR(o.total)}
                      </td>
                      <td className="p-3 text-muted-foreground" data-label="Status">
                        {o.paymentStatus}
                      </td>
                    </tr>
                  ))}
                  {store.appointments.map((a) => (
                    <tr key={a.id} className="border-b">
                      <td className="p-3 font-semibold" data-label="Reference">
                        {a.id}
                      </td>
                      <td className="p-3" data-label="Type">
                        Consultation ({a.with})
                      </td>
                      <td className="p-3 font-bold" data-label="Amount">
                        {formatINR(a.fee)}
                      </td>
                      <td className="p-3 text-muted-foreground" data-label="Status">
                        Demo — no charge
                      </td>
                    </tr>
                  ))}
                  {store.orders.length === 0 && store.appointments.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-muted-foreground">
                        No order or consultation transactions in this session yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === "Prescriptions" && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold">Prescription Upload History</h2>
            {store.rxUploads.length ? (
              store.rxUploads.map((r) => (
                <article key={r.id} className="rounded-2xl border bg-card p-4">
                  <strong className="break-all">{r.fileName}</strong>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {r.status} · {new Date(r.at).toLocaleString()}
                  </p>
                </article>
              ))
            ) : (
              <EmptyState icon={<FileText />} title="No prescriptions attached">
                <Button asChild>
                  <Link to="/upload">Upload Prescription</Link>
                </Button>
              </EmptyState>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
